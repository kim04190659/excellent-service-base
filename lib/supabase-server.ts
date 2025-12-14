import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// サーバーサイドでのみ実行されるSupabaseクライアント（Service Role Keyを使用）
// ⚠️ このキーは非常に強力な権限を持つため、クライアントサイドでは絶対に公開・利用してはいけません。
export const createServerSupabaseClient = () => {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Supabase URL or Service Role Key is missing in environment variables.');
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey);
};
