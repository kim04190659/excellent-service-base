'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// Headerコンポーネントはユーザー情報を受け取り、認証状態に応じて表示を切り替えます
export default function Header({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header style={{ 
      padding: '15px 30px', 
      borderBottom: '1px solid #ddd', 
      backgroundColor: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
        エクセレントサービス基盤
      </div>
      
      {user ? (
        <button 
          onClick={handleLogout} 
          style={{ 
            padding: '8px 15px', 
            backgroundColor: '#f44336', // ログアウトボタンの色を変更
            borderRadius: '5px' 
          }}
        >
          ログアウト ({user.email})
        </button>
      ) : (
        // 未ログイン時はuser=nullが渡される
        <div style={{ color: '#555' }}>AI駆動型MVP</div>
      )}
    </header>
  );
}
