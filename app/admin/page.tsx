'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Card from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// プロンプトテンプレートの型定義
interface PromptTemplate {
  function_id: string;
  template_text: string;
  description: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // 認証チェックとデータ読み込み
  useEffect(() => {
    const checkAuthAndLoadPrompts = async () => {
      // ユーザー情報の取得
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // プロンプトデータの読み込み
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('function_id', { ascending: true });

      if (error) {
        console.error('プロンプトデータのロードエラー:', error);
        setMessage('プロンプトデータの読み込みに失敗しました。');
      } else {
        setPrompts(data || []);
      }
      setLoading(false);
    };

    checkAuthAndLoadPrompts();
  }, []);

  // 編集内容の変更をハンドル
  const handleChange = (id: string, field: keyof PromptTemplate, value: string) => {
    setPrompts(prev => 
      prev.map(p => p.function_id === id ? { ...p, [field]: value } : p)
    );
  };

  // プロンプトの保存
  const handleSave = async (prompt: PromptTemplate) => {
    setMessage(`[${prompt.function_id}] 保存中...`);
    const { error } = await supabase
      .from('ai_prompts')
      .update({ 
          template_text: prompt.template_text, 
          description: prompt.description 
      })
      .eq('function_id', prompt.function_id);

    if (error) {
      console.error('保存エラー:', error);
      setMessage(`[${prompt.function_id}] 保存に失敗しました: ${error.message}`);
    } else {
      setMessage(`[${prompt.function_id}] が正常に保存されました！`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>管理画面をロード中...</div>;
  }
  
  if (!user) {
    return (
        <Card title="アクセス拒否" style={{ margin: '50px auto', maxWidth: '600px', textAlign: 'center' }}>
            <p>このページにアクセスするにはログインが必要です。</p>
            <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#0070f3' }}>
                ログインページへ
            </button>
        </Card>
    );
  }

  return (
    <>
      <Header user={user} />
      <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: 'auto' }}>
        <h1 style={{ color: '#1976d2' }}>サービス管理者ダッシュボード</h1>
        <p style={{ color: '#555' }}>AIエージェントのプロンプトテンプレートを編集します。変更は利用者に即時反映されます。</p>
        
        {message && (
          <Card style={{ 
              marginBottom: '20px', 
              backgroundColor: message.includes('保存に失敗しました') ? '#ffebee' : '#e8f5e9',
              color: message.includes('保存に失敗しました') ? '#d32f2f' : '#388e3c'
          }}>
            {message}
          </Card>
        )}

        {prompts.length === 0 ? (
          <Card>プロンプトテンプレートが見つかりません。</Card>
        ) : (
          prompts.map((prompt) => (
            <Card key={prompt.function_id} title={`エージェントID: ${prompt.function_id}`} style={{ marginBottom: '30px' }}>
              <div style={{ marginBottom: '15px' }}>
                <h4>説明 (管理用)</h4>
                <textarea
                  value={prompt.description}
                  onChange={(e) => handleChange(prompt.function_id, 'description', e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '10px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <h4>プロンプトテンプレート ({'{preference}'} を利用可能)</h4>
                <textarea
                  value={prompt.template_text}
                  onChange={(e) => handleChange(prompt.function_id, 'template_text', e.target.value)}
                  rows={8}
                  style={{ 
                      width: '100%', 
                      padding: '10px', 
                      fontFamily: 'monospace', 
                      backgroundColor: '#f7f7f7'
                  }}
                />
              </div>
              
              <button 
                onClick={() => handleSave(prompt)}
                style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#1976d2', 
                    color: 'white',
                    float: 'right'
                }}
              >
                このプロンプトを保存
              </button>
              <div style={{ clear: 'both' }}></div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
