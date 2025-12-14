import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}

// 汎用的なUIコンポーネント (Card)
export default function Card({ children, title, style }: CardProps) {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      ...style
    }}>
      {title && <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{title}</h3>}
      {children}
    </div>
  );
}
