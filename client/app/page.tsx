'use client';

import { GameProvider } from '@/components/GameProvider';
import { HomeScreen } from '@/components/screens/HomeScreen';

export default function Home() {
  return (
    <GameProvider>
      <main className="min-h-dvh flex flex-col items-center justify-center p-4 pb-24">
        <HomeScreen />
      </main>
    </GameProvider>
  );
}
