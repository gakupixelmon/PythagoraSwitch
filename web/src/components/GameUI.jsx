import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function GameUI() {
  const {
    state, elapsedTime, bestTime,
    cameraMode, appMode,
    startGame, resetGame,
    setCameraMode, setAppMode,
  } = useGameStore();

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
        setCameraMode(modes[(modes.indexOf(cameraMode) + 1) % modes.length]);
      }
      if (e.code === 'KeyE') setAppMode('create');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, cameraMode]);

  const camLabel = { follow:'📷 追従', overview:'🌐 俯瞰', orbit:'🖱 フリー' };
  const statusMap = {
    ready:   { l: '待機中',      c: 'status-ready'   },
    running: { l: '転がり中！', c: 'status-running' },
    goal:    { l: '🎉 ゴール！', c: 'status-goal'    },
    fell:    { l: '💧 落下...',  c: 'status-fell'    },
  };
  const { l, c } = statusMap[state];

  return (
    <>
      {/* ─── ヘッダー ─── */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon" />
          <div>
            <div className="logo-title">Pythagora Switch 3D</div>
            <div className="logo-subtitle">プレイモード</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div className="header-timer">
            ⏱ {elapsedTime.toFixed(1)}s
            {bestTime !== null && (
              <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)', marginLeft:8 }}>
                Best: {bestTime.toFixed(1)}s
              </span>
            )}
          </div>
          <button className="btn btn-edit" onClick={() => setAppMode('create')}>
            ✏️ 編集
          </button>
        </div>
      </header>

      {/* ─── ヒント ─── */}
      <div className="hint">
        <div>Space — スタート / リセット</div>
        <div>R — リセット &nbsp; C — カメラ</div>
        <div>E — エディターへ</div>
      </div>

      {/* ─── コントロール ─── */}
      <div className="control-panel">
        <span className={`status-badge ${c}`}>{l}</span>
        {state === 'ready'
          ? <button className="btn btn-start" onClick={startGame}>▶ スタート</button>
          : <button className="btn btn-reset" onClick={resetGame}>↺ リセット</button>
        }
        <button className="btn btn-camera" onClick={() => {
          const modes = ['follow','overview','orbit'];
          setCameraMode(modes[(modes.indexOf(cameraMode)+1)%modes.length]);
        }}>
          {camLabel[cameraMode]}
        </button>
      </div>

      {/* ─── ゴールオーバーレイ ─── */}
      {state === 'goal' && (
        <div className="overlay">
          <div className="goal-card">
            <span className="goal-emoji">🎉</span>
            <div className="goal-title">GOAL!</div>
            <div className="goal-time">タイム: <span>{elapsedTime.toFixed(2)}秒</span></div>
            {bestTime === elapsedTime && (
              <div style={{ color:'#fbbf24', fontSize:'0.9rem', marginTop:4 }}>🏆 ベストタイム！</div>
            )}
            <button className="btn btn-reset" style={{ marginTop:20, pointerEvents:'all' }} onClick={resetGame}>
              ↺ もう一度
            </button>
          </div>
        </div>
      )}

      {state === 'fell' && (
        <div className="overlay">
          <div className="goal-card" style={{ borderColor:'rgba(248,113,113,0.4)', boxShadow:'0 0 60px rgba(248,113,113,0.2)' }}>
            <span className="goal-emoji">💧</span>
            <div className="goal-title" style={{ color:'var(--danger)' }}>落ちた！</div>
            <div className="goal-time">自動リセット中...</div>
          </div>
        </div>
      )}
    </>
  );
}
