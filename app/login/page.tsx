'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header'; // <-- パスを @/components/Header に修正

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      if (isLogin) {
        // ログイン処理
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard'); // 成功したらダッシュボードへ
      } else {
        // 登録処理
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        setMessage('登録成功！すぐにログインできます。');
        setIsLogin(true);
      }
    } catch (error: any) {
      setMessage(`認証エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header user={null} />
      <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h2 style={{ textAlign: 'center' }}>
          {isLogin ? 'ログイン' : '新規登録'}
        </h2>
        
        {message && <p style={{ color: message.startsWith('認証エラー') ? 'red' : 'green' }}>{message}</p>}

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%' }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%' }}
        />
        <button
          onClick={handleAuth}
          disabled={loading}
          style={{ width: '100%', marginBottom: '20px' }}
        >
          {loading ? '処理中...' : (isLogin ? 'ログイン' : '登録')}
        </button>

        <p style={{ textAlign: 'center', cursor: 'pointer', color: '#0070f3' }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'アカウントをお持ちではありませんか？新規登録' : 'すでにアカウントをお持ちですか？ログイン'}
        </p>
      </div>
    </>
  );
}
