'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* 🚨 修正ポイント: 管理画面へのリンクを追加 */}
          <a href="/admin" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
            管理
          </a>

          <button 
            onClick={handleLogout} 
            style={{ 
              padding: '8px 15px', 
              backgroundColor: '#f44336',
              borderRadius: '5px' 
            }}
          >
            ログアウト ({user.email})
          </button>
        </div>
      ) : (
        <div style={{ color: '#555' }}>AI駆動型MVP</div>
      )}
    </header>
  );
}
