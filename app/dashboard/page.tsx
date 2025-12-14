'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Card from '@/components/Card'; // <-- Cardコンポーネントをインポート

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [preference, setPreference] = useState('');
  const [headline, setHeadline] = useState('ようこそ！');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 起動時の処理: 認証チェックと設定の読み込み
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
      const payload = { 
          userPreference: preference, 
          userId: user.id,
          functionId: 'generate_headline'
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
      <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: 'auto' }}>
        
        {/* 🚨 修正ポイント: Headlineを囲むUIを洗練 */}
        <Card style={{ marginBottom: '40px', backgroundColor: '#e3f2fd' }}>
            <h1 style={{ color: '#0070f3', fontSize: '2em', textAlign: 'center', margin: 0 }}>
                {headline}
            </h1>
            <p style={{ textAlign: 'center', color: '#555', marginTop: '10px' }}>
                この見出しはあなたの目的に合わせてパーソナライズされています。
            </p>
        </Card>
        
        {/* 🚨 修正ポイント: 入力フォームをCardで囲む */}
        <Card title="🚀 あなたのデライト体験をカスタマイズ" style={{ marginTop: '30px' }}>
          <p>このサービスで何を達成したいですか？ あなたの希望をAIに伝えてください。</p>
          <textarea
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            placeholder="例：中小企業のマーケティング効率を上げるために使いたい"
            rows={4}
            style={{ 
                width: '100%', 
                padding: '12px', 
                margin: '15px 0',
                border: '2px solid #ccc',
                borderRadius: '6px',
                resize: 'vertical'
            }}
          />
          <button 
            onClick={generateCustomHeadline} 
            disabled={loading}
            style={{ 
                padding: '12px 25px', 
                background: loading ? '#90caf9' : '#1976d2', 
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
            }}
          >
            {loading ? 'AIが思考中...' : 'AIにダッシュボードをパーソナライズしてもらう'}
          </button>
        </Card>

        <div style={{ marginTop: '50px', color: '#888', textAlign: 'center' }}>
            <p>エクセレントサービス基盤 v0.1 | AI by Gemini</p>
        </div>
      </div>
    </>
  );
}
