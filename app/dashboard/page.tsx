'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Card from '@/components/Card';

// 選択肢の型定義 (API Routeと一致させる)
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

// 最初の選択肢 (これは固定で提供します)
const INITIAL_CHOICES: Choice[] = [
  { text: '地元のお店を予約・注文したい', icon: '📍' },
  { text: '公的サービスについて知りたい', icon: '📝' },
  { text: '新しい趣味や学習を始めたい', icon: '🎨' },
  { text: '健康や医療に関する情報を探したい', icon: '❤️' },
];

const MAX_STEPS = 3; // AIによる選択肢生成を行う最大ステップ数

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [headline, setHeadline] = useState('ようこそ！');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  
  // 起動時の処理: 認証チェックと設定の読み込み
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

    // 最初のステップを設定 (固定)
    if (stepHistory.length === 0) {
        setStepHistory([
            { question: 'まず、あなたがしたいことは何ですか？', choices: INITIAL_CHOICES, selected: null }
        ]);
    }
  }, [router]);


  // 🚨 修正ポイント: 選択肢をクリックした際の処理 (AI呼び出しロジックの追加)
  const handleChoiceClick = async (stepIndex: number, choiceText: string) => {
    if (loading) return;
    
    setLoading(true);
    const newHistory = [...stepHistory];
    newHistory[stepIndex].selected = choiceText; // 選択を記録
    setStepHistory(newHistory);

    // 最終ステップ（MAX_STEPS）に達したら、AI実行プロンプトの生成ステップへ
    if (currentStep >= MAX_STEPS) {
        // Step 4で実装するAIエージェント実行ロジックをここに呼び出す
        setLoading(false);
        alert('最終ステップ到達！次にAI実行プロンプトを作成します。');
        return;
    }

    // AIエージェントを呼び出して次の選択肢を生成する
    try {
        const payload = {
            userId: user?.id,
            functionId: 'choice_generator', // 選択肢生成エージェント
            // 履歴は、選択済みのステップのみを渡す
            history: newHistory.filter(h => h.selected !== null) 
        };

        const response = await fetch('/api/customize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (response.ok && data.choices) {
            // 次のステップのデータを履歴に追加
            newHistory.push({
                question: `「${choiceText}」を選びました。次に詳しく教えてください。`, 
                choices: data.choices, 
                selected: null 
            });
            
            setStepHistory(newHistory);
            setCurrentStep(currentStep + 1);
        } else {
            alert(`選択肢生成に失敗しました: ${data.error}`);
            // 失敗時は前の状態に戻す
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
        
        {/* メインのマルチステップ UI */}
        <Card title={`ステップ ${currentStep} / ${MAX_STEPS}: ${currentStepData?.question || '目標を選択してください'}`} style={{ minHeight: '350px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {currentStepData?.choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => handleChoiceClick(currentStep - 1, choice.text)}
                        // ロード中、または既に選択済みであればボタンを無効化
                        disabled={loading || currentStepData.selected !== null}
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
                            opacity: loading || (currentStepData.selected !== null && currentStepData.selected !== choice.text) ? 0.6 : 1
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

            {/* 選択履歴の表示 */}
            <div style={{ marginTop: '30px', borderTop: '1px dashed #eee', paddingTop: '20px' }}>
                <h4 style={{ color: '#555' }}>あなたの選択履歴:</h4>
                {stepHistory.map((step, index) => (
                    // 最後のステップ以外、または既に選択されている場合は表示
                    (index < currentStep - 1 || step.selected) && (
                        <p key={index} style={{ margin: '5px 0', paddingLeft: '10px', color: step.selected ? '#333' : '#888' }}>
                            {index + 1}. {step.question} → **{step.selected || 'AI生成待ち...'}**
                        </p>
                    )
                ))}
                
                {/* 戻るボタン */}
                {currentStep > 1 && (
                    <button 
                        onClick={() => {
                            // 履歴を一つ前の状態に戻す
                            setStepHistory(stepHistory.slice(0, currentStep - 1));
                            setCurrentStep(currentStep - 1);
                        }}
                        disabled={loading}
                        style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#ff9800', color: 'white' }}
                    >
                        前のステップに戻る
                    </button>
                )}
            </div>
        </Card>

        <div style={{ marginTop: '50px', color: '#888', textAlign: 'center' }}>
            <p>エクセレントサービス基盤 v0.2 | AI by Gemini</p>
        </div>
      </div>
    </>
  );
}
