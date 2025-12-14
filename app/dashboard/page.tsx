'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Card from '@/components/Card';

// 選択肢の型定義
interface Choice {
    text: string;
    icon: string;
}
// 選択履歴の型定義
interface Step {
    question: string;
    choices: Choice[];
    selected: string | null;
}

const INITIAL_CHOICES: Choice[] = [
  { text: '地元のお店を予約・注文したい', icon: '📍' },
  { text: '公的サービスについて知りたい', icon: '📝' },
  { text: '新しい趣味や学習を始めたい', icon: '🎨' },
  { text: '健康や医療に関する情報を探したい', icon: '❤️' },
];

const MAX_STEPS = 3;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [headline, setHeadline] = useState('ようこそ！');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  
  // 郵便番号と最終確認モーダルの状態
  const [postalCode, setPostalCode] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  // 🚨 修正ポイント: 実行結果を保持する状態
  const [finalPrompt, setFinalPrompt] = useState(''); 
  const [executionResult, setExecutionResult] = useState<string | null>(null); // 実行結果

  // 起動時の処理... (省略)
  useEffect(() => {
    const checkUserAndLoadSettings = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);
        
        // 見出しの読み込み... (省略)
    };
    checkUserAndLoadSettings();

    if (stepHistory.length === 0) {
        setStepHistory([
            { question: 'まず、あなたがしたいことは何ですか？', choices: INITIAL_CHOICES, selected: null }
        ]);
    }
  }, [router]);


  const handleChoiceClick = async (stepIndex: number, choiceText: string) => {
    if (loading || executionResult) return; // 実行結果が出たら操作不可
    
    setLoading(true);
    const newHistory = [...stepHistory];
    newHistory[stepIndex].selected = choiceText;
    setStepHistory(newHistory);

    if (currentStep >= MAX_STEPS) {
        setLoading(false);
        setIsFinalizing(true);
        return;
    }

    try {
        const payload = {
            userId: user?.id,
            functionId: 'choice_generator',
            history: newHistory.filter(h => h.selected !== null) 
        };

        const response = await fetch('/api/customize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (response.ok && data.choices) {
            newHistory.push({
                question: `「${choiceText}」を選びました。次に詳しく教えてください。`, 
                choices: data.choices, 
                selected: null 
            });
            
            setStepHistory(newHistory);
            setCurrentStep(currentStep + 1);
        } else {
            alert(`選択肢生成に失敗しました: ${data.error}`);
            newHistory[stepIndex].selected = null;
            setStepHistory(newHistory);
        }
    } catch (error) {
        alert('通信エラーが発生しました。');
        console.error(error);
    } finally {
        setLoading(false);
    }
  };
  
  // 🚨 修正ポイント: 郵便番号入力後の処理 (最終プロンプト生成)
  const handleFinalize = () => {
      if (!postalCode || postalCode.length !== 7) {
          alert('7桁の郵便番号を正しく入力してください。');
          return;
      }
      
      const finalGoal = stepHistory.map(s => s.selected).filter(s => s !== null).join(' > ');
      const generatedPrompt = `【最終目標】${finalGoal}\n【地域情報】郵便番号: ${postalCode} の周辺で実行せよ。`;
      
      setFinalPrompt(generatedPrompt);
      setIsFinalizing(false); 
      // 実行準備完了状態へ
  };
  
  // 🚨 新規実装: 実行エージェントの呼び出し
  const handleExecuteAgent = async () => {
    if (loading || !finalPrompt) return;
    
    setLoading(true);
    setExecutionResult(null); // 結果をリセット
    
    try {
        const payload = {
            userId: user?.id,
            functionId: 'executor',
            finalPrompt: finalPrompt // 実行エージェントに最終プロンプトを渡す
        };

        const response = await fetch('/api/customize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (response.ok && data.result) {
            setExecutionResult(data.result);
            // 実行後はステップ履歴をリセットし、最初の状態に戻す
            setCurrentStep(1);
            setStepHistory([
                { question: 'まず、あなたがしたいことは何ですか？', choices: INITIAL_CHOICES, selected: null }
            ]);
            setPostalCode('');
            setFinalPrompt('');
        } else {
            alert(`エージェント実行に失敗しました: ${data.error}`);
        }
    } catch (error) {
        alert('通信エラーが発生しました。');
        console.error(error);
    } finally {
        setLoading(false);
    }
  };


  const currentStepData = stepHistory[currentStep - 1];

  if (!user) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>サービスを起動中...</div>;
  }
  
  return (
    <>
      <Header user={user} />
      <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: 'auto' }}>
        
        <Card style={{ marginBottom: '40px', backgroundColor: '#e3f2fd' }}>
            <h1 style={{ color: '#0070f3', fontSize: '2em', textAlign: 'center', margin: 0 }}>
                {headline}
            </h1>
            <p style={{ textAlign: 'center', color: '#555', marginTop: '10px' }}>
                あなたが達成したいことをAIがサポートします。
            </p>
        </Card>
        
        {/* 🚨 実行結果の表示エリア */}
        {executionResult && (
            <Card title="🤖 AIエージェント実行結果" style={{ marginBottom: '40px', backgroundColor: '#fff3e0', border: '2px solid #ff9800' }}>
                <p style={{ fontWeight: 'bold' }}>AIがあなたの目標を達成するために以下のプロセスを実行しました。</p>
                <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '15px', border: '1px dashed #ccc', marginTop: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                    {executionResult}
                </div>
                <button 
                    onClick={() => setExecutionResult(null)}
                    style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', marginTop: '15px' }}
                >
                    新しい目標を設定する
                </button>
            </Card>
        )}
        
        {/* メインのマルチステップ UI (実行結果が出たら非表示/無効化) */}
        {!executionResult && (
          <Card title={`ステップ ${currentStep} / ${MAX_STEPS}: ${currentStepData?.question || '目標を選択してください'}`} style={{ minHeight: '350px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  {currentStepData?.choices.map((choice, index) => (
                      <button
                          key={index}
                          onClick={() => handleChoiceClick(currentStep - 1, choice.text)}
                          disabled={loading || currentStepData.selected !== null || isFinalizing}
                          style={{
                              padding: '20px',
                              backgroundColor: currentStepData.selected === choice.text ? '#e3f2fd' : '#f5f5f5',
                              border: `2px solid ${currentStepData.selected === choice.text ? '#0070f3' : '#ddd'}`,
                              borderRadius: '10px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '1.1em',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                              transition: 'all 0.3s',
                              opacity: loading || isFinalizing || (currentStepData.selected !== null && currentStepData.selected !== choice.text) ? 0.6 : 1
                          }}
                      >
                          <span style={{ fontSize: '1.5em', marginRight: '10px' }}>{choice.icon}</span>
                          {choice.text}
                      </button>
                  ))}
              </div>
              
              {loading && (
                  <div style={{ textAlign: 'center', marginTop: '20px', color: '#0070f3' }}>
                      AIが次の選択肢を生成中...しばらくお待ちください。
                  </div>
              )}
              
              {/* 実行準備完了表示と実行ボタン */}
              {finalPrompt && !isFinalizing && (
                  <Card title="✅ 実行準備完了" style={{ marginTop: '30px', backgroundColor: '#e8f5e9' }}>
                      <p>AIエージェントに渡す最終目標が確定しました。この情報を基に、実行システムがタスクを完了させます。</p>
                      <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '10px', border: '1px dashed #ccc' }}>
                          {finalPrompt}
                      </pre>
                      <button 
                          onClick={handleExecuteAgent}
                          disabled={loading}
                          style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', marginTop: '10px' }}
                      >
                          {loading ? 'エージェント実行中...' : 'エージェントを実行する'}
                      </button>
                  </Card>
              )}


              {/* 選択履歴の表示 */}
              <div style={{ marginTop: '30px', borderTop: '1px dashed #eee', paddingTop: '20px' }}>
                  <h4 style={{ color: '#555' }}>あなたの選択履歴:</h4>
                  {stepHistory.map((step, index) => (
                      (index < currentStep - 1 || step.selected) && (
                          <p key={index} style={{ margin: '5px 0', paddingLeft: '10px', color: step.selected ? '#333' : '#888' }}>
                              {index + 1}. {step.question} → **{step.selected || 'AI生成待ち...'}**
                          </p>
                      )
                  ))}
                  
                  {/* 戻るボタン */}
                  {currentStep > 1 && !isFinalizing && (
                      <button 
                          onClick={() => {
                              setStepHistory(stepHistory.slice(0, currentStep - 1));
                              setCurrentStep(currentStep - 1);
                              setFinalPrompt(''); // 戻る場合は最終プロンプトもリセット
                          }}
                          disabled={loading}
                          style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#ff9800', color: 'white' }}
                      >
                          前のステップに戻る
                      </button>
                  )}
              </div>
          </Card>
        )}

        {/* 郵便番号入力モーダル風UI */}
        {isFinalizing && (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <Card title="📍 実行する地域を教えてください" style={{ maxWidth: '400px', width: '90%' }}>
                    <p>この情報は、AIがあなたに最も近いお店やサービスを探すために使われます。</p>
                    <input
                        type="number"
                        placeholder="例: 1234567 (7桁)"
                        value={postalCode}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 7) {
                                setPostalCode(value);
                            }
                        }}
                        style={{ width: '100%', padding: '10px', margin: '15px 0', fontSize: '1.2em' }}
                    />
                    
                    <button 
                        onClick={handleFinalize} 
                        style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', marginRight: '10px' }}
                        disabled={postalCode.length !== 7}
                    >
                        最終目標を確定する
                    </button>
                    <button 
                        onClick={() => {
                            setIsFinalizing(false);
                            // キャンセルの場合、前のステップに戻る処理を実装する（今回は簡略化のためステップ3のままUIを戻す）
                        }}
                        style={{ padding: '10px 20px', backgroundColor: '#ccc', color: '#333' }}
                    >
                        キャンセル
                    </button>
                </Card>
            </div>
        )}

        <div style={{ marginTop: '50px', color: '#888', textAlign: 'center' }}>
            <p>エクセレントサービス基盤 v0.2 | AI by Gemini</p>
        </div>
      </div>
    </>
  );
}
