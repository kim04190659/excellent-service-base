import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
// 🚨 修正ポイント：サーバーサイドで利用するSupabaseクライアントをインポート
import { createServerSupabaseClient } from '@/lib/supabase-server'; 

// POSTリクエストを処理する関数（ユーザーの入力を受け取る）
export async function POST(request: Request) {
  // 1. APIキーのチェックを最初に厳密に行う
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return NextResponse.json({ error: "Server configuration error: Gemini API Key is missing." }, { status: 500 });
  }

  try {
    // 2. APIクライアントの初期化
    const ai = new GoogleGenAI({ apiKey });
    
    // ユーザーの希望とIDをリクエストボディから取得
    const { userPreference, userId } = await request.json(); // 🚨 修正ポイント：userIdを取得

    if (!userPreference || !userId) {
      return NextResponse.json({ error: "User preference and ID are required." }, { status: 400 });
    }

    // 3. Geminiへのプロンプト設定と呼び出し（前回と同じ）
    const prompt = `あなたは、優れたサービス基盤のパーソナライズAIです。
    ユーザーは「${userPreference}」という目的でサービスを利用します。
    このユーザーにデライトを与える、魅力的なダッシュボードの新しい見出し案を1つ提案してください。
    提案は、日本語の短文のみで、それ以外の説明文は不要です。`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    if (!response.text) {
        console.error('Gemini returned an empty response:', response);
        return NextResponse.json({ error: 'AIが応答を生成できませんでした。' }, { status: 500 });
    }

    const customizedHeadline = response.text.trim();
    
    // 🚨 修正ポイント：Supabaseへの書き込み処理
    const supabaseServer = createServerSupabaseClient();
    
    // 既存の設定があるかチェック
    const { data: existingSetting } = await supabaseServer
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (existingSetting) {
        // 既存設定があればUPDATE
        await supabaseServer
            .from('user_settings')
            .update({ custom_headline: customizedHeadline })
            .eq('user_id', userId);
    } else {
        // なければINSERT
        await supabaseServer
            .from('user_settings')
            .insert([{ user_id: userId, custom_headline: customizedHeadline }]);
    }
    
    // 4. 結果をクライアントに返す
    return NextResponse.json({ headline: customizedHeadline });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '処理中に予期せぬエラーが発生しました' }, { status: 500 });
  }
}
