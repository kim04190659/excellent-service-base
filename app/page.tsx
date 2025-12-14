'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // lib/supabase.ts を使用

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 認証状態のチェック
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // ログイン済みの場合: ダッシュボードへリダイレクト
        router.push('/dashboard');
      } else {
        // 未ログインの場合: ログインページへリダイレクト
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // リダイレクトが完了するまでのロード表示
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>認証状態を確認中...</h1>
      <p>少々お待ちください。</p>
    </div>
  );
}
