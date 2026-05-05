import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CreationScene from './components/creation/CreationScene';
import CreationPanel from './components/creation/CreationPanel';
import PlayScene from './components/Scene';
import GameUI from './components/GameUI';
import { useGameStore } from './store/gameStore';
import { useCourseStore } from './store/courseStore';
import './components/creation.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-ball" />
      <div className="loading-text">LOADING...</div>
    </div>
  );
}

/** 物体ホバー時に表示されるフローティングコンテキストメニュー */
function ObjectContextMenu() {
  const hoveredId       = useGameStore(s => s.hoveredId);
  const hoveredScreenPos= useGameStore(s => s.hoveredScreenPos);
  const transformMode   = useGameStore(s => s.transformMode);
  const setTransformMode= useGameStore(s => s.setTransformMode);
  const selectedId      = useCourseStore(s => s.selectedId);
  const select          = useCourseStore(s => s.select);
  const holeMode        = useGameStore(s => s.holeMode);

  if (!hoveredId || !hoveredScreenPos || holeMode) return null;

  const { x, y } = hoveredScreenPos;
  const menuW = 160;
  const menuH = 44;
  // キャンバス外に出ないよう補正
  const left = Math.max(8, Math.min(x - menuW / 2, window.innerWidth - menuW - 8));
  const top  = y - menuH - 14;

  const handleClick = (mode, e) => {
    e.stopPropagation();
    setTransformMode(mode);
    if (hoveredId !== selectedId) select(hoveredId);
  };

  const btnBase = {
    flex: 1,
    padding: '7px 0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
    transition: 'background 0.15s',
  };

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: menuW,
        height: menuH,
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(99,102,241,0.6)',
        borderRadius: '8px',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
      // メニュー上では clearHovered しない
      onPointerLeave={e => e.stopPropagation()}
    >
      <button
        style={{
          ...btnBase,
          background: transformMode === 'translate' ? 'rgba(99,102,241,0.35)' : 'transparent',
          color: transformMode === 'translate' ? '#a5b4fc' : '#9ca3af',
          borderRight: '1px solid rgba(99,102,241,0.3)',
        }}
        onClick={(e) => handleClick('translate', e)}
      >
        ✥ 移動
      </button>
      <button
        style={{
          ...btnBase,
          background: transformMode === 'rotate' ? 'rgba(99,102,241,0.35)' : 'transparent',
          color: transformMode === 'rotate' ? '#a5b4fc' : '#9ca3af',
        }}
        onClick={(e) => handleClick('rotate', e)}
      >
        ↻ 回転
      </button>
    </div>
  );
}

/** カメラ操作のヒント（左下に常時表示） */
function CameraHint() {
  const dragMode    = useGameStore(s => s.dragMode);
  const setDragMode = useGameStore(s => s.setDragMode);
  const holeMode    = useGameStore(s => s.holeMode);

  if (holeMode) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      background: 'rgba(15,23,42,0.75)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '20px',
      padding: '6px 14px',
      backdropFilter: 'blur(6px)',
      fontSize: '0.78rem',
      color: '#9ca3af',
      pointerEvents: 'auto',
      userSelect: 'none',
      zIndex: 10,
    }}>
      <span>カメラ:</span>
      <button
        onClick={() => setDragMode('rotate')}
        style={{
          background: dragMode === 'rotate' ? 'rgba(99,102,241,0.5)' : 'transparent',
          color: dragMode === 'rotate' ? '#c7d2fe' : '#6b7280',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: '12px',
          padding: '3px 10px',
          cursor: 'pointer',
          fontSize: '0.78rem',
        }}
      >🔄 回転</button>
      <button
        onClick={() => setDragMode('pan')}
        style={{
          background: dragMode === 'pan' ? 'rgba(99,102,241,0.5)' : 'transparent',
          color: dragMode === 'pan' ? '#c7d2fe' : '#6b7280',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: '12px',
          padding: '3px 10px',
          cursor: 'pointer',
          fontSize: '0.78rem',
        }}
      >✋ 平行移動</button>
      <span style={{ marginLeft: '4px', color: '#4b5563' }}>|</span>
      <span>スクロール: ズーム</span>
      <span style={{ color: '#4b5563' }}>|</span>
      <span>物体にカーソルを合わせると移動/回転を選択できます</span>
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
        <div className="create-canvas-wrap" style={{ position: 'relative' }}>
          <Canvas
            camera={{ fov: 50, position: [8, 10, -4], near: 0.1, far: 500 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            shadows
          >
            <Suspense fallback={null}>
              <CreationScene />
            </Suspense>
          </Canvas>

          {/* フローティングコンテキストメニュー（Canvas外のHTMLオーバーレイ） */}
          <ObjectContextMenu />

          {/* カメラ操作ヒント */}
          <CameraHint />
        </div>
      </div>
    );
  }

  // ─── プレイモード ───
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Suspense fallback={<LoadingScreen />}>
        <PlayScene />
      </Suspense>
      <GameUI />
    </div>
  );
}
