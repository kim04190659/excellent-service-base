import { createClient } from '@supabase/supabase-js';

// .env.local または Vercelの環境変数からキーを取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // 環境変数が設定されていない場合のエラーハンドリング
  throw new Error('Supabase environment variables are missing. Please check .env.local and Vercel settings.');
}

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
