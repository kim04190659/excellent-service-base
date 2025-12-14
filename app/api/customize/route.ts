import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server'; 

// 選択肢の型定義 (クライアントと共有)
interface Choice {
    text: string;
    icon: string;
}

// POSTリクエストを処理する関数
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return NextResponse.json({ error: "Server configuration error: Gemini API Key is missing." }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // userPreference は不要。代わりに history と functionId を使う
    const { history, userId, functionId } = await request.json(); 

    if (!history || !userId || !functionId) {
      return NextResponse.json({ error: "History, ID, and Function ID are required." }, { status: 400 });
    }

    const supabaseServer = createServerSupabaseClient();
    
    // 1. DBから functionId に基づいてプロンプトテンプレートを読み込む
    const { data: promptData, error: promptError } = await supabaseServer
        .from('ai_prompts')
        .select('template_text')
        .eq('function_id', functionId)
        .single();
        
    // 🚨 ここが修正箇所です
    if (promptError || !promptData || !promptData.template_text) {
        console.error('Failed to load prompt template:', promptError);
        return NextResponse.json({ error: 'AIプロンプトのロードに失敗しました。ID: ' + functionId }, { status: 500 });
    }

    // 2. テンプレート変数 ({history}) を利用者の選択履歴で置換
    // 履歴を整形: 例: "Step 1: 地元のお店を予約・注文したい"
    const formattedHistory = history.map((h: any, index: number) => `Step ${index + 1}: ${h.selected}`).join('\n');
    let prompt = promptData.template_text.replace('{history}', formattedHistory);

    // 3. Geminiへのプロンプト設定と呼び出し
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    if (!response.text) {
        return NextResponse.json({ error: 'AIが応答を生成できませんでした。' }, { status: 500 });
    }

    const aiResponseText = response.text.trim();
    
    // 複数の応答タイプに対応
    if (functionId === 'choice_generator') {
        try {
            // JSON応答からJSONブロックを抽出し、パースする
            const jsonMatch = aiResponseText.match(/```json\n([\s\S]*?)\n```/);
            const jsonString = jsonMatch ? jsonMatch[1].trim() : aiResponseText.trim();
            
            const choices: Choice[] = JSON.parse(jsonString);
            if (!Array.isArray(choices) || choices.length !== 4) {
                 throw new Error("AI output was not a valid 4-choice array.");
            }
            return NextResponse.json({ choices: choices });
            
        } catch (e) {
            console.error('JSON parsing failed:', e);
            return NextResponse.json({ error: 'AIの応答形式が正しくありません。', debug: aiResponseText }, { status: 500 });
        }
    } else if (functionId === 'generate_headline') {
        // 既存の見出し生成ロジック
        const customizedHeadline = aiResponseText;

        // DBへの見出し書き込み (省略せずに残します)
        const { data: existingSetting } = await supabaseServer
            .from('user_settings')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingSetting) {
            await supabaseServer
                .from('user_settings')
                .update({ custom_headline: customizedHeadline })
                .eq('user_id', userId);
        } else {
            await supabaseServer
                .from('user_settings')
                .insert([{ user_id: userId, custom_headline: customizedHeadline }]);
        }
        
        return NextResponse.json({ headline: customizedHeadline });
    }
    
    return NextResponse.json({ error: '指定された機能IDは存在しません' }, { status: 400 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '処理中に予期せぬエラーが発生しました' }, { status: 500 });
  }
}
