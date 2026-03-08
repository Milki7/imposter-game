'use client';

import { GameProvider } from '@/components/GameProvider';
import { HomeScreen } from '@/components/screens/HomeScreen';

export default function Home() {
  return (
    <GameProvider>
      <main className="h-dvh w-full flex flex-col items-center justify-center px-3 sm:px-4 pt-16 sm:pt-20 pb-3 sm:pb-4 overflow-hidden relative">
        <HomeScreen />
      </main>
    </GameProvider>
  );
}
