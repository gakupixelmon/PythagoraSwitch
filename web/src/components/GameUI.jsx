import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ALL_COURSES } from '../utils/courseData';

/**
 * ゲームのUI（HUD）
 * - ヘッダー（タイトル + タイマー）
 * - コントロールパネル（スタート/リセット/カメラ）
 * - コースセレクター
 * - ゴールオーバーレイ
 */
export default function GameUI() {
  const {
    state, elapsedTime, bestTime,
    cameraMode, activeCourse,
    startGame, resetGame,
    setCameraMode, setActiveCourse,
  } = useGameStore();

  // キーボードショートカット
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (state === 'ready') startGame();
        else resetGame();
      }
      if (e.code === 'KeyR') resetGame();
      if (e.code === 'KeyC') {
        const modes = ['follow', 'overview', 'orbit'];
        const next = modes[(modes.indexOf(cameraMode) + 1) % modes.length];
        setCameraMode(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, cameraMode]);

  const statusMap = {
    ready:   { label: '待機中', cls: 'status-ready' },
    running: { label: '転がり中！', cls: 'status-running' },
    goal:    { label: '🎉 ゴール！', cls: 'status-goal' },
    fell:    { label: '💧 落下...', cls: 'status-fell' },
  };
  const { label, cls } = statusMap[state];

  const cameraModeLabel = {
    follow: '📷 追従',
    overview: '🌐 俯瞰',
    orbit: '🖱 フリー',
  };

  return (
    <>
      {/* ─── ヘッダー ─── */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon" />
          <div>
            <div className="logo-title">Pitagora Switch 3D</div>
            <div className="logo-subtitle">ピタゴラスイッチ シミュレーター</div>
          </div>
        </div>
        <div className="header-timer">
          ⏱ {elapsedTime.toFixed(1)}s
          {bestTime !== null && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
              Best: {bestTime.toFixed(1)}s
            </span>
          )}
        </div>
      </header>

      {/* ─── コースセレクター ─── */}
      <div className="course-panel">
        {ALL_COURSES.map(c => (
          <button
            key={c.id}
            className={`course-btn ${activeCourse === c.id ? 'active' : ''}`}
            onClick={() => setActiveCourse(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ─── キーボードヒント ─── */}
      <div className="hint">
        <div>Space — スタート / リセット</div>
        <div>R — リセット</div>
        <div>C — カメラ切替</div>
      </div>

      {/* ─── コントロールパネル ─── */}
      <div className="control-panel">
        <span className={`status-badge ${cls}`}>{label}</span>

        {state === 'ready' ? (
          <button className="btn btn-start" onClick={startGame}>
            ▶ スタート
          </button>
        ) : (
          <button className="btn btn-reset" onClick={resetGame}>
            ↺ リセット
          </button>
        )}

        <button
          className="btn btn-camera"
          onClick={() => {
            const modes = ['follow', 'overview', 'orbit'];
            const next = modes[(modes.indexOf(cameraMode) + 1) % modes.length];
            setCameraMode(next);
          }}
        >
          {cameraModeLabel[cameraMode]}
        </button>
      </div>

      {/* ─── ゴールオーバーレイ ─── */}
      {state === 'goal' && (
        <div className="overlay">
          <div className="goal-card">
            <span className="goal-emoji">🎉</span>
            <div className="goal-title">GOAL!</div>
            <div className="goal-time">
              タイム: <span>{elapsedTime.toFixed(2)}秒</span>
            </div>
            {bestTime !== null && bestTime === elapsedTime && (
              <div style={{ color: '#fbbf24', fontSize: '0.9rem', marginTop: 4 }}>
                🏆 ベストタイム更新！
              </div>
            )}
            <button
              className="btn btn-reset"
              style={{ marginTop: 20, pointerEvents: 'all' }}
              onClick={resetGame}
            >
              ↺ もう一度
            </button>
          </div>
        </div>
      )}

      {/* ─── 落下通知 ─── */}
      {state === 'fell' && (
        <div className="overlay">
          <div className="goal-card" style={{ borderColor: 'rgba(248,113,113,0.4)', boxShadow: '0 0 60px rgba(248,113,113,0.2)' }}>
            <span className="goal-emoji" style={{ animationDelay: '0s' }}>💧</span>
            <div className="goal-title" style={{ color: 'var(--danger)' }}>落ちた！</div>
            <div className="goal-time">2秒後に自動リセット...</div>
          </div>
        </div>
      )}
    </>
  );
}
