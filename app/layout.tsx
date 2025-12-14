import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'エクセレントサービス基盤',
  description: 'SupabaseとGeminiを活用したAI駆動型サービス基盤',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
