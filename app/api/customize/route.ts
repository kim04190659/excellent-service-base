import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createServerSupabaseClient } from '@/lib/supabase-server'; 

// 選択肢の型定義
interface Choice {
    text: string;
    icon: string;
}

// 選択履歴の型定義 (UI側と合わせる)
interface Step {
    question: string;
    choices: Choice[];
    selected: string | null;
}

// 🚨 新しいAI応答の型定義
interface ChoiceGeneratorResponse {
    nextQuestion: string;
    needsPostalCode: boolean;
    choices: Choice[];
}

// API ルートのハンドラ関数
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return NextResponse.json({ error: "Server configuration error: Gemini API Key is missing." }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { userId, functionId, history, finalPrompt } = await req.json();

    if (!userId || !functionId) {
        return NextResponse.json({ error: 'Missing required parameters: userId or functionId' }, { status: 400 });
    }

    // 1. DBから functionId に基づいてプロンプトテンプレートを読み込む (executor のシミュレーションでは不要だが、choice_generatorでは必要)
    const supabaseServer = createServerSupabaseClient();
    const { data: promptData, error: promptError } = await supabaseServer
        .from('ai_prompts')
        .select('template_text')
        .eq('function_id', functionId)
        .single();
        
    if (promptError || !promptData || !promptData.template_text) {
        // executor のシミュレーション（Step 4）はプロンプト不要のため、choice_generator以外はエラーを出さない
        if (functionId !== 'executor') {
            console.error('Failed to load prompt template:', promptError);
            return NextResponse.json({ error: 'AIプロンプトのロードに失敗しました。ID: ' + functionId }, { status: 500 });
        }
    }

    switch (functionId) {
        case 'choice_generator':
            if (!history) {
                return NextResponse.json({ error: 'Missing history for choice_generator' }, { status: 400 });
            }
            
            // テンプレート変数 ({history}) を利用者の選択履歴で置換
            const formattedHistory = history.map((h: Step, index: number) => `Step ${index + 1}: ${h.selected}`).join(' > ');
            let prompt = promptData!.template_text.replace('{history}', formattedHistory);

            // 3. Geminiへのプロンプト設定と呼び出し
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            if (!response.text) {
                return NextResponse.json({ error: 'AIが応答を生成できませんでした。' }, { status: 500 });
            }
            
            const aiResponseText = response.text.trim();

            try {
                // 🚨 修正ポイント: JSON全体をパースする
                const jsonMatch = aiResponseText.match(/```json\n([\s\S]*?)\n```/);
                const jsonString = jsonMatch ? jsonMatch[1].trim() : aiResponseText.trim();
                
                const result: ChoiceGeneratorResponse = JSON.parse(jsonString);
                
                if (!result.choices || result.choices.length !== 4 || typeof result.nextQuestion !== 'string') {
                    throw new Error("AI output format is invalid (missing choices or question).");
                }
                
                // 質問文、地域情報フラグ、選択肢をすべてクライアントに返す
                return NextResponse.json(result); 
                
            } catch (e) {
                console.error('JSON parsing failed:', e);
                return NextResponse.json({ error: 'AIの応答形式が正しくありません。', debug: aiResponseText }, { status: 500 });
            }

        case 'executor':
            // Phase V, Step 4 のロジック (シミュレーションのためダミーを維持)
            if (!finalPrompt) {
                return NextResponse.json({ error: 'Missing finalPrompt for executor' }, { status: 400 });
            }
            
            // --- 実行エージェントのシミュレーションロジック（簡略化）---
            const goalMatch = finalPrompt.match(/【最終目標】(.+?)\n/);
            const areaMatch = finalPrompt.match(/【地域情報】郵便番号: (\d+?) の周辺で実行せよ。/);
            
            const goal = goalMatch ? goalMatch[1].trim() : "不明な目標";
            const postalCode = areaMatch ? areaMatch[1] : "不明";

            let areaName = '特定の地域';
            if (postalCode.startsWith('1')) {
                areaName = '東京都内';
            } else if (postalCode.startsWith('5')) {
                areaName = '大阪府内';
            } else {
                areaName = '日本国内の特定の地域';
            }

            const result = `
## 実行計画
1. **目標分析**: ユーザーは「${goal}」を達成したいと考えています。
2. **地域分析**: 
    * **入力された郵便番号**: ${postalCode}
    * **特定された地域**: ${areaName}（推定）
3. **実行アクション**:
    * **Tool**: Google Search
    * **Query**: 「${goal.split(' > ').slice(-1)[0]} ${areaName} 予約」
    * **Result**: AIは検索結果を基に、予約リンクや電話番号を提示するアクションを実行しました。
シミュレーションが完了しました。
`;
            return NextResponse.json({ result });
            // --- シミュレーションロジックここまで ---

        default:
            return NextResponse.json({ error: 'Invalid functionId' }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
