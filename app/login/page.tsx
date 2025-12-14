'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ログイン状態のチェックとリダイレクト
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard'); 
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.push('/dashboard');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignIn = async (isSignUp: boolean) => {
    setLoading(true);
    let error = null;
    
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) alert('登録メールをご確認ください。');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    }

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h1>エクセレントサービス基盤 - ログイン</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        style={{ width: '100%', padding: '10px', margin: '10px 0' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        style={{ width: '100%', padding: '10px', margin: '10px 0' }}
      />
      <button 
        onClick={() => handleSignIn(false)} 
        disabled={loading}
        style={{ padding: '10px 20px', marginRight: '10px' }}
      >
        {loading ? '処理中...' : 'ログイン'}
      </button>
      <button 
        onClick={() => handleSignIn(true)} 
        disabled={loading}
        style={{ padding: '10px 20px' }}
      >
        新規登録
      </button>
    </div>
  );
}
