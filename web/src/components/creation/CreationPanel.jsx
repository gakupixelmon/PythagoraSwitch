import { useCourseStore } from '../../store/courseStore';
import { useGameStore } from '../../store/gameStore';
import AuthUI from './AuthUI';

/**
 * 作成モードの左サイドパネル
 */
export default function CreationPanel() {
  const { nodes, selectedId, select, setHeight, deleteNode, reset } = useCourseStore();
  const setAppMode = useGameStore(s => s.setAppMode);
  const canPlay = nodes.length >= 2;

  return (
    <aside className="creation-panel">
      {/* ─── タイトル ─── */}
      <div className="panel-title">
        <span className="panel-icon">🛤️</span>
        コースエディター
      </div>

      {/* ─── 説明 ─── */}
      <div className="panel-tip">
        <b>3Dビューをクリック</b>でノードを追加。<br />
        ノードをドラッグで移動。<br />
        高さスライダーで傾斜を調整。
      </div>

      {/* ─── プレイボタン ─── */}
      <button
        className={`btn-play-mode ${canPlay ? '' : 'disabled'}`}
        onClick={() => canPlay && setAppMode('play')}
        disabled={!canPlay}
      >
        ▶ プレイモードへ
      </button>
      {!canPlay && (
        <p className="panel-warn">ノードを2つ以上追加してください</p>
      )}

      {/* ─── ノードリスト ─── */}
      <div className="node-list-header">
        <span>ノード ({nodes.length})</span>
        <button className="btn-icon" onClick={reset} title="リセット">↺</button>
      </div>

      <ul className="node-list">
        {nodes.map((node, i) => {
          const isStart = i === 0;
          const isEnd   = i === nodes.length - 1;
          const isSel   = selectedId === node.id;
          return (
            <li
              key={node.id}
              className={`node-item ${isSel ? 'selected' : ''}`}
              onClick={() => select(node.id)}
            >
              <div className="node-item-row">
                <span className="node-badge" style={{
                  background: isStart ? '#a78bfa44' : isEnd ? '#4ade8044' : '#f9731620',
                  borderColor: isStart ? '#a78bfa' : isEnd ? '#4ade80' : '#f97316',
                  color:       isStart ? '#a78bfa' : isEnd ? '#4ade80' : '#f97316',
                }}>
                  {isStart ? 'S' : isEnd ? 'G' : i + 1}
                </span>
                <span className="node-coords">
                  ({node.x.toFixed(1)}, {node.z.toFixed(1)})
                </span>
                <button
                  className="btn-del"
                  onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                  disabled={nodes.length <= 2}
                >✕</button>
              </div>
              {/* 高さスライダー（選択時のみ） */}
              {isSel && (
                <div className="height-row">
                  <span className="height-label">高さ</span>
                  <input
                    type="range"
                    min="-8" max="8" step="0.1"
                    value={node.y}
                    onChange={e => setHeight(node.id, parseFloat(e.target.value))}
                    className="height-slider"
                  />
                  <span className="height-val">{node.y.toFixed(1)}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ─── 認証・保存 UI ─── */}
      <AuthUI />
    </aside>
  );
}
