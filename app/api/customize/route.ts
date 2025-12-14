import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// POSTリクエストを処理する関数（ユーザーの入力を受け取る）
export async function POST(request: Request) {
  // 1. APIキーのチェックを最初に厳密に行う
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    // キーがない場合はクライアントにエラーを返す
    return NextResponse.json({ error: "Server configuration error: Gemini API Key is missing." }, { status: 500 });
  }

  try {
    // 2. APIクライアントの初期化
    const ai = new GoogleGenAI({ apiKey });
    
    // ユーザーの希望をリクエストボディから取得
    const { userPreference } = await request.json(); 

    if (!userPreference) {
      return NextResponse.json({ error: "User preference is required." }, { status: 400 });
    }

    // 3. Geminiへのプロンプト設定と呼び出し
    const prompt = `あなたは、優れたサービス基盤のパーソナライズAIです。
    ユーザーは「${userPreference}」という目的でサービスを利用します。
    このユーザーにデライトを与える、魅力的なダッシュボードの新しい見出し案を1つ提案してください。
    提案は、日本語の短文のみで、それ以外の説明文は不要です。`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    // ⚠️ 修正ポイント: response.text の存在チェックを追加
    if (!response.text) {
        console.error('Gemini returned an empty response:', response);
        return NextResponse.json({ error: 'AIが応答を生成できませんでした。' }, { status: 500 });
    }

    const customizedHeadline = response.text.trim();
    
    // 4. 結果をクライアントに返す
    return NextResponse.json({ headline: customizedHeadline });
  } catch (error) {
    console.error('Gemini API Call Error:', error);
    // 予期せぬエラーとして500を返す
    return NextResponse.json({ error: 'AIによるカスタマイズ処理中に予期せぬエラーが発生しました' }, { status: 500 });
  }
}
