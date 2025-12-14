'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [preference, setPreference] = useState('');
  const [headline, setHeadline] = useState('ようこそ！');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndLoadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser);
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('custom_headline')
        .eq('user_id', currentUser.id)
        .single();
        
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('設定の読み込みに失敗:', settingsError);
      } else if (settingsData) {
        setHeadline(settingsData.custom_headline);
      }
    };
    checkUserAndLoadSettings();
  }, [router]);

  const generateCustomHeadline = async () => {
    if (!preference) return alert('カスタマイズの希望を入力してください。');
    if (!user) return alert('ユーザー情報がありません。');
    
    setLoading(true);
    setHeadline('AIがあなたのための見出しを生成中です...');

    try {
      // 🚨 修正ポイント： functionId を追加
      const payload = { 
          userPreference: preference, 
          userId: user.id,
          functionId: 'generate_headline' // <-- AIエージェントのIDを渡す
      };

      const response = await fetch('/api/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    return <div style={{ padding: '40px', textAlign: 'center' }}>サービスを起動中...</div>;
  }

  return (
    <>
      <Header user={user} />
      <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
        
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
    </>
  );
}
