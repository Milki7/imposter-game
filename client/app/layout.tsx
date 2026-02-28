import type { Metadata } from 'next';
import { Orbitron, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

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
    <html lang="en" className={`dark ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased h-screen w-screen overflow-hidden bg-[#0f172a] text-white font-mono">
        {children}
      </body>
    </html>
  );
}
