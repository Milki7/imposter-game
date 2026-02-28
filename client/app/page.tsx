'use client';

import { GameProvider } from '@/components/GameProvider';
import { HomeScreen } from '@/components/screens/HomeScreen';

export default function Home() {
  return (
    <GameProvider>
      <main className="h-screen w-screen flex flex-col items-center justify-center p-4 pt-20 pb-4 overflow-hidden relative">
        <HomeScreen />
      </main>
    </GameProvider>
  );
}
