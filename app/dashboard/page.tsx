'use client';

// 修正ポイント: SupabaseからUser型をインポート
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js'; // <-- ここを追加

export default function DashboardPage() {
  // 修正ポイント: useStateの型を User | null に変更
  const [user, setUser] = useState<User | null>(null);
  const [preference, setPreference] = useState('');
  const [headline, setHeadline] = useState('ようこそ！');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 認証状態の確認
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // 未ログインならログインページへ
      } else {
        // session.user は User 型なので問題なし
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generateCustomHeadline = async () => {
    if (!preference) return alert('カスタマイズの希望を入力してください。');
    
    setLoading(true);
    setHeadline('AIがあなたのための見出しを生成中です...');

    try {
      // サーバー側のAPI Routeを呼び出し、Geminiに処理を依頼
      const response = await fetch('/api/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userPreference: preference }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setHeadline(data.headline);
      } else {
        setHeadline(`カスタマイズ失敗: ${data.error}`);
      }
    } catch (error) {
      setHeadline('通信エラーが発生しました。');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ padding: '20px' }}>認証中...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h1>エクセレントサービス基盤 - ダッシュボード</h1>
        <button onClick={handleLogout} style={{ padding: '8px 15px' }}>ログアウト ({user.email})</button>
      </div>

      <h2 style={{ color: '#0070f3', marginTop: '20px' }}>{headline}</h2>
      
      <div style={{ border: '1px solid #eee', padding: '15px', marginTop: '30px' }}>
        <h3>あなたのデライト体験をカスタマイズ</h3>
        <p>サービスをどのように利用したいか、あなたの希望をAIに伝えてください。</p>
        <textarea
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          placeholder="例：中小企業のマーケティング効率を上げるために使いたい"
          rows={3}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <button 
          onClick={generateCustomHeadline} 
          disabled={loading}
          style={{ padding: '10px 20px', background: '#0070f3', color: 'white' }}
        >
          {loading ? 'AIが生成中...' : 'AIにダッシュボードをパーソナライズしてもらう'}
        </button>
      </div>
    </div>
  );
}
