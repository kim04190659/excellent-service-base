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
    icon: string; // 将来的に視覚的なアイコンを使うためのプレースホルダー
}

// 選択履歴の型定義
interface Step {
    question: string;
    choices: Choice[];
    selected: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [headline, setHeadline] = useState('ようこそ！');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🚨 修正ポイント: マルチステップの状態管理
  const [currentStep, setCurrentStep] = useState(1);
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  
  // 🚨 開発用ダミーデータ：実際のデータはStep 3でAIが生成します
  const DUMMY_CHOICES_STEP1: Choice[] = [
    { text: '地元のお店を予約・注文したい', icon: '📍' },
    { text: '公的サービスについて知りたい', icon: '📝' },
    { text: '新しい趣味や学習を始めたい', icon: '🎨' },
    { text: '健康や医療に関する情報を探したい', icon: '❤️' },
  ];
  const DUMMY_CHOICES_STEP2: Choice[] = [
    { text: '美味しいレストランを予約する', icon: '🍽️' },
    { text: 'クリーニング店に集荷を依頼する', icon: '🧺' },
    { text: '花屋でアレンジメントを注文する', icon: '💐' },
    { text: '美容院の空き時間を調べる', icon: '💇' },
  ];
  const DUMMY_CHOICES_STEP3: Choice[] = [
    { text: '今日19:00に予約を入れる', icon: '🕒' },
    { text: '今週末の土曜日に予約を入れる', icon: '🗓️' },
    { text: '来週平日の夜に予約を入れる', icon: '🌃' },
    { text: '特定の日時を自分で指定する', icon: '✏️' },
  ];

  // 🚨 修正ポイント: 最初のステップをセット
  useEffect(() => {
    // 既存の認証・見出し読み込みロジックは省略
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

    // 最初のステップを設定
    if (stepHistory.length === 0) {
        setStepHistory([
            { question: 'まず、あなたがしたいことは何ですか？', choices: DUMMY_CHOICES_STEP1, selected: null }
        ]);
    }
  }, [router]);


  // 🚨 修正ポイント: 選択肢をクリックした際の処理
  const handleChoiceClick = (stepIndex: number, choiceText: string) => {
    const newHistory = [...stepHistory];
    newHistory[stepIndex].selected = choiceText; // 選択を記録

    // 最終ステップ（3ステップ目）に達したら、AI実行プロンプトを表示する
    if (currentStep === 3) {
        // Step 4で実装するAIエージェント実行ロジックをここに呼び出す
        alert('最終ステップ到達！実行プロンプトを作成します。');
        setStepHistory(newHistory);
        return;
    }

    // 次のステップのデータをセット（ダミーデータ使用）
    const nextChoices = currentStep === 1 ? DUMMY_CHOICES_STEP2 : DUMMY_CHOICES_STEP3;
    
    // 履歴に追加
    newHistory.push({
        question: `「${choiceText}」を選びました。次に詳しく教えてください。`, 
        choices: nextChoices, 
        selected: null 
    });
    
    setStepHistory(newHistory);
    setCurrentStep(currentStep + 1);
  };
  
  const currentStepData = stepHistory[currentStep - 1];

  // 以前の headline 生成ロジックは、このMVPでは一旦削除またはコメントアウトします
  /*
  const generateCustomHeadline = async () => { ... }
  */
  
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
        
        {/* 🚨 メインのマルチステップ UI */}
        <Card title={`ステップ ${currentStep} / 3: ${currentStepData?.question || '目標を選択してください'}`} style={{ minHeight: '350px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {currentStepData?.choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => handleChoiceClick(currentStep - 1, choice.text)}
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
                            transition: 'all 0.3s'
                        }}
                    >
                        <span style={{ fontSize: '1.5em', marginRight: '10px' }}>{choice.icon}</span>
                        {choice.text}
                    </button>
                ))}
            </div>
            
            {/* 選択履歴の表示 (デバッグ用) */}
            <div style={{ marginTop: '30px', borderTop: '1px dashed #eee', paddingTop: '20px' }}>
                <h4 style={{ color: '#555' }}>あなたの選択履歴:</h4>
                {stepHistory.map((step, index) => (
                    <p key={index} style={{ margin: '5px 0', paddingLeft: '10px' }}>
                        {index + 1}. {step.question} → **{step.selected || '未選択'}**
                    </p>
                ))}
                {currentStep > 1 && (
                    <button 
                        onClick={() => {
                            setStepHistory(stepHistory.slice(0, currentStep - 1));
                            setCurrentStep(currentStep - 1);
                        }}
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
