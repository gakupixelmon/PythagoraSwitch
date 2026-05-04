import { Suspense } from 'react';
import Scene from './components/Scene';
import GameUI from './components/GameUI';
import './index.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-ball" />
      <div className="loading-text">LOADING PHYSICS ENGINE...</div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Suspense fallback={<LoadingScreen />}>
        {/* 3D シーン（背景） */}
        <Scene />
      </Suspense>

      {/* UI オーバーレイ */}
      <GameUI />
    </div>
  );
}
