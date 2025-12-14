'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // 認証セッションの取得
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // ログイン済み: ダッシュボードへ
        router.push('/dashboard');
      } else {
        // 未ログイン: ログインページへ
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // リダイレクト完了までの表示
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>サービスを起動中...</h1>
    </div>
  );
}
