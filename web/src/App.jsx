import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CreationScene from './components/creation/CreationScene';
import CreationPanel from './components/creation/CreationPanel';
import PlayScene from './components/Scene';
import GameUI from './components/GameUI';
import { useGameStore } from './store/gameStore';
import './components/creation.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-ball" />
      <div className="loading-text">LOADING...</div>
    </div>
  );
}

export default function App() {
  const appMode = useGameStore(s => s.appMode);

  if (appMode === 'create') {
    return (
      <div className="app-create">
        {/* 左パネル */}
        <CreationPanel />

        {/* 3Dキャンバス */}
        <div className="create-canvas-wrap">
          <Canvas
            camera={{ fov: 50, position: [8, 10, -4], near: 0.1, far: 500 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            shadows
          >
            <Suspense fallback={null}>
              <CreationScene />
            </Suspense>
          </Canvas>
          <div className="create-tips">
            🖱 クリック: ノード追加 &nbsp;|&nbsp; ドラッグ: 移動 &nbsp;|&nbsp; 右クリックドラッグ/スクロール: カメラ
          </div>
        </div>
      </div>
    );
  }

  // ─── プレイモード ───
  return (
    <div style={{ width:'100vw', height:'100vh', position:'relative' }}>
      <Suspense fallback={<LoadingScreen />}>
        <PlayScene />
      </Suspense>
      <GameUI />
    </div>
  );
}
