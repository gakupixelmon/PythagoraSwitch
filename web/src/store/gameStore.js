import { create } from 'zustand';

/**
 * ゲーム状態の管理 (Zustand store)
 * states: 'ready' | 'running' | 'goal' | 'fell'
 */
export const useGameStore = create((set, get) => ({
  state: 'ready',
  elapsedTime: 0,
  bestTime: null,
  cameraMode: 'follow',   // 'follow' | 'overview' | 'orbit'
  activeCourse: 'classic',

  // タイマー
  _timerInterval: null,

  startGame: () => {
    const interval = setInterval(() => {
      set(s => ({ elapsedTime: s.elapsedTime + 0.1 }));
    }, 100);
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
    // 2秒後に自動リセット
    setTimeout(() => {
      if (get().state === 'fell') get().resetGame();
    }, 2000);
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveCourse: (id) => {
    get().resetGame();
    set({ activeCourse: id });
  },
}));
