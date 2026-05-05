import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // 'create' | 'play'
  appMode: 'create',

  // play状態 'ready' | 'running' | 'goal' | 'fell'
  state: 'ready',
  elapsedTime: 0,
  bestTime: null,
  cameraMode: 'follow', // 'follow' | 'overview' | 'orbit'
  dragMode: 'rotate',   // 'rotate' | 'pan'  (カメラ操作)
  transformMode: 'translate', // 'translate' | 'rotate'  (ギズモモード)
  hoveredId: null,      // ホバー中のオブジェクトID
  hoveredScreenPos: null, // { x, y } 画面座標
  holeMode: false,
  holeConfig: { shape: 'circle', radius: 0.25 },

  _timerInterval: null,

  // ─── モード切替 ──────────────────────────────────────
  setAppMode: (mode) => {
    get().resetGame();
    set({ appMode: mode, cameraMode: mode === 'play' ? 'follow' : 'orbit' });
  },

  // ─── Play操作 ────────────────────────────────────────
  startGame: () => {
    const interval = setInterval(
      () => set(s => ({ elapsedTime: +(s.elapsedTime + 0.1).toFixed(1) })),
      100
    );
    set({ state: 'running', elapsedTime: 0, _timerInterval: interval });
  },

  resetGame: () => {
    const { _timerInterval } = get();
    if (_timerInterval) clearInterval(_timerInterval);
    set({ state: 'ready', elapsedTime: 0, _timerInterval: null });
  },

  onGoal: () => {
    const { _timerInterval, elapsedTime, bestTime } = get();
    if (_timerInterval) clearInterval(_timerInterval);
    const newBest = bestTime === null || elapsedTime < bestTime ? elapsedTime : bestTime;
    set({ state: 'goal', _timerInterval: null, bestTime: newBest });
  },

  onFell: () => {
    const { _timerInterval } = get();
    if (_timerInterval) clearInterval(_timerInterval);
    set({ state: 'fell', _timerInterval: null });
    setTimeout(() => { if (get().state === 'fell') get().resetGame(); }, 1800);
  },

  setCameraMode: (m) => set({ cameraMode: m }),
  setDragMode: (m) => set({ dragMode: m }),
  setTransformMode: (m) => set({ transformMode: m }),
  setHoveredInfo: (id, pos) => set({ hoveredId: id, hoveredScreenPos: pos }),
  clearHovered: () => set({ hoveredId: null, hoveredScreenPos: null }),
  setHoleMode: (v) => set({ holeMode: v }),
  setHoleConfig: (cfg) => set(s => ({ holeConfig: { ...s.holeConfig, ...cfg } })),
}));
