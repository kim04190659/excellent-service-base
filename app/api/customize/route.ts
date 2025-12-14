import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server'; 

// POSTリクエストを処理する関数
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return NextResponse.json({ error: "Server configuration error: Gemini API Key is missing." }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { userPreference, userId } = await request.json();

    if (!userPreference || !userId) {
      return NextResponse.json({ error: "User preference and ID are required." }, { status: 400 });
    }

    const supabaseServer = createServerSupabaseClient();
    
    // 1. 🚨 修正ポイント: DBからプロンプトテンプレートを読み込む
    const { data: promptData, error: promptError } = await supabaseServer
        .from('ai_prompts')
        .select('template_text')
        .eq('id', 'headline_generator') // 作成したIDでテンプレートを取得
        .single();
        
    if (promptError || !promptData || !promptData.template_text) {
        console.error('Failed to load prompt template:', promptError);
        return NextResponse.json({ error: 'AIプロンプトのロードに失敗しました' }, { status: 500 });
    }

    // 2. 🚨 修正ポイント: テンプレート変数 ({preference}) をユーザー入力で置換
    let prompt = promptData.template_text.replace('{preference}', userPreference);

    // 3. Geminiへのプロンプト設定と呼び出し
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    if (!response.text) {
        console.error('Gemini returned an empty response:', response);
        return NextResponse.json({ error: 'AIが応答を生成できませんでした。' }, { status: 500 });
    }

    const customizedHeadline = response.text.trim();
    
    // 4. Supabaseへの書き込み処理（前回と同じロジック）
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
    
    // 5. 結果をクライアントに返す
    return NextResponse.json({ headline: customizedHeadline });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '処理中に予期せぬエラーが発生しました' }, { status: 500 });
  }
}
