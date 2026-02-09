import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guess the Imposter',
  description: 'Real-time multiplayer social deduction game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-dvh">{children}</body>
    </html>
  );
}
