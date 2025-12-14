import { NextRequest, NextResponse } from 'next/server';

// 選択肢の型定義
interface Choice {
    text: string;
    icon: string;
}

// 選択履歴の型定義
interface Step {
    question: string;
    choices: Choice[];
    selected: string | null;
}

// 選択肢生成エージェント (Phase V, Step 2 で実装済み)
async function choiceGenerator(history: Step[]): Promise<Choice[]> {
    const prompt = `あなたはユーザーの目標を具体化するために、次の4つの質問の選択肢を生成するAIです。
    
    これまでのユーザーの選択履歴（goal path）は以下の通りです。
    ${history.map(step => step.selected).join(' > ')}
    
    上記の履歴に基づき、ユーザーの目標をさらに具体的な行動レベルに絞り込むための、4つの新しい選択肢（アイコンとテキスト）をJSON形式で提案してください。
    
    例:
    [
        {"text":"飲食店の予約・注文をしたい","icon":"🍽️"},
        {"text":"美容院・サロンの予約をしたい","icon":"💇‍♀️"},
        {"text":"商品のテイクアウト・デリバリーを注文したい","icon":"🛍️"},
        {"text":"その他のサービスの予約をしたい","icon":"🗓️"}
    ]
    
    回答はJSON形式のみとし、前後の説明は一切不要です。`;

    // 実際にはGemini APIを呼び出すが、ここではダミーレスポンスを使用
    // Gemini APIの呼び出しロジックは省略し、以前のダミー処理を維持
    if (history.length === 1) {
        return [
            {"text":"飲食店の予約・注文をしたい","icon":"🍽️"},
            {"text":"美容院・サロンの予約をしたい","icon":"💇‍♀️"},
            {"text":"商品のテイクアウト・デリバリーを注文したい","icon":"🛍️"},
            {"text":"その他のサービスの予約をしたい","icon":"🗓️"}
        ];
    } else if (history.length === 2) {
        return [
            {"text":"ランチを予約したい","icon":"🥪"},
            {"text":"ディナーを注文したい","icon":"🥩"},
            {"text":"テイクアウト可能なカフェを探したい","icon":"☕"},
            {"text":"特別な日のためのケーキを注文したい","icon":"🎂"}
        ];
    }
    
    return []; // 最終ステップでは空を返す
}


// 🚨 新規実装: 実行エージェント
async function executor(finalPrompt: string): Promise<string> {
    const prompt = `あなたは、ユーザーの最終的な目標（Final Goal）と地域情報（Area Info）を受け取り、そのタスクを完了させるために最も適切な行動（アクション）を実行するAIです。
    
    最終目標のプロンプト:
    ${finalPrompt}
    
    この目標に基づき、適切なAPI（Google Search, Calendar, Notes & Lists, YouTube Music）を組み合わせ、ユーザーの目標を達成してください。
    
    **【重要】**
    今回はシミュレーションのため、実際のAPI呼び出しは行わず、**AIが実行するはずだったプロセス**を以下の形式で出力してください。
    
    \`\`\`markdown
    ## 実行計画
    1. **目標分析**: ...
    2. **地域分析**: 郵便番号から地域を特定（例: 1234567 → 東京都千代田区）
    3. **実行アクション**: 
        * **Tool**: Google Search
        * **Query**: 「〇〇（目標） 〇〇区（地域） 予約」
        * **Result**: 検索結果を基に、予約リンクや電話番号を提示する。
    \`\`\`
    
    `;

    // 実際にはGemini APIを呼び出すが、ここではダミーレスポンスを使用
    // 最終プロンプトから目標と地域情報を抽出
    const goalMatch = finalPrompt.match(/【最終目標】(.+?)\n/);
    const areaMatch = finalPrompt.match(/【地域情報】郵便番号: (\d+?) の周辺で実行せよ。/);
    
    const goal = goalMatch ? goalMatch[1].trim() : "不明な目標";
    const postalCode = areaMatch ? areaMatch[1] : "不明";

    // ダミーの地域特定処理（本来はAPIが必要）
    let areaName = '特定の地域';
    if (postalCode.startsWith('1')) {
        areaName = '東京都内';
    } else if (postalCode.startsWith('5')) {
        areaName = '大阪府内';
    } else {
        areaName = '日本国内の特定の地域';
    }

    const dummyPlan = `
## 実行計画
1. **目標分析**: ユーザーは「${goal}」を達成したいと考えています。これは主に地域サービス（予約/注文）に関する目標です。
2. **地域分析**: 
    * **入力された郵便番号**: ${postalCode}
    * **特定された地域**: ${areaName}（例として、郵便番号の先頭桁から大まかに地域を推定）
3. **実行アクション**:
    * **Tool**: Google Search
    * **Query**: 「${goal.split(' > ').slice(-1)[0]} ${areaName} 検索」
    * **Reasoning**: ユーザーの最終選択（例: 「ランチを予約したい」）と地域名を組み合わせ、Google Search APIを使用して最も関連性の高いローカルな情報（予約リンク、店舗情報など）を取得します。
    * **Result**: 
        * *「${areaName}」周辺の「${goal.split(' > ').slice(-1)[0]}」の検索結果に基づき、上位3件の店舗情報と予約リンクをご案内します。*
        * （ここではシミュレーションのため具体的な情報は省略）
\`\`\`
シミュレーションが完了しました。ユーザーの目標は達成されました。
\`\`\`
`;

    return dummyPlan;
}


// API ルートのハンドラ関数
export async function POST(req: NextRequest) {
    try {
        const { userId, functionId, history, finalPrompt } = await req.json();

        if (!userId || !functionId) {
            return NextResponse.json({ error: 'Missing required parameters: userId or functionId' }, { status: 400 });
        }

        switch (functionId) {
            case 'choice_generator':
                // Phase V, Step 2 のロジック
                if (!history) {
                    return NextResponse.json({ error: 'Missing history for choice_generator' }, { status: 400 });
                }
                const choices = await choiceGenerator(history);
                return NextResponse.json({ choices });

            case 'executor':
                // 🚨 Phase V, Step 4 のロジック
                if (!finalPrompt) {
                    return NextResponse.json({ error: 'Missing finalPrompt for executor' }, { status: 400 });
                }
                const result = await executor(finalPrompt);
                return NextResponse.json({ result });

            default:
                return NextResponse.json({ error: 'Invalid functionId' }, { status: 400 });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
