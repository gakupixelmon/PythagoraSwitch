import { useCourseStore, TEMPLATES, TEMPLATE_CATEGORIES } from '../../store/courseStore';
import { useGameStore } from '../../store/gameStore';
import AuthUI from './AuthUI';

const TYPE_ICONS = {
  main_ball:    '🥎',
  goal_zone:    '🏁',
  straight_rail:'➖',
  curved_rail:  '↪️',
  sphere:       '⚪️',
  seesaw:       '⚖️',
  cup:          '🥤',
  funnel:       '🫙',
  hole_plate:   '🔲',
};

const TYPE_NAMES = {
  main_ball:    'メインボール',
  goal_zone:    'ゴールゾーン',
  straight_rail:'直線レール',
  curved_rail:  'カーブレール',
  sphere:       'ボール',
  seesaw:       'シーソー',
  cup:          'コップ',
  funnel:       'すり鉢',
  hole_plate:   '穴あきプレート',
};

// ─── 共通スタイル ────────────────────────────────────────────────
const inputStyle = {
  background: '#374151', color: '#fff',
  border: '1px solid #4b5563', padding: '4px 6px',
  borderRadius: '4px', width: '70px', fontSize: '0.8rem'
};
const labelStyle = {
  display: 'flex', alignItems: 'center',
  gap: '6px', fontSize: '0.82rem', color: '#d1d5db'
};
const selectStyle = {
  background: '#374151', color: '#fff',
  border: '1px solid #4b5563', padding: '4px 6px',
  borderRadius: '4px', fontSize: '0.8rem', flex: 1
};

/** オブジェクトのプロパティ（type別追加フィールド） */
function TypeSpecificProps({ obj, onPropChange }) {
  const p = obj.properties;
  const set = (key, val) => onPropChange({ ...p, [key]: val });

  switch (obj.type) {

    case 'straight_rail':
      return (
        <>
          <label style={labelStyle}>
            長さ<input style={inputStyle} type="number" step="0.5" value={p.length ?? 4}
              onChange={e => set('length', +e.target.value || 1)} />
          </label>
          <label style={labelStyle}>
            幅<input style={inputStyle} type="number" step="0.05" value={p.width ?? 0.65}
              onChange={e => set('width', +e.target.value || 0.1)} />
          </label>
        </>
      );

    case 'curved_rail':
      return (
        <>
          <label style={labelStyle}>
            半径<input style={inputStyle} type="number" step="0.5" value={p.radius ?? 2}
              onChange={e => set('radius', +e.target.value || 0.5)} />
          </label>
          <label style={labelStyle}>
            幅<input style={inputStyle} type="number" step="0.05" value={p.width ?? 0.65}
              onChange={e => set('width', +e.target.value || 0.1)} />
          </label>
          <label style={labelStyle}>
            角度(°)<input style={inputStyle} type="number" step="5" value={p.angle ?? 90}
              onChange={e => set('angle', Math.min(360, Math.max(5, +e.target.value)))} />
          </label>
          <label style={labelStyle}>
            向き（軸）
            <select style={selectStyle} value={p.bendAxis ?? 'horizontal'}
              onChange={e => set('bendAxis', e.target.value)}>
              <option value="horizontal">水平（列車カーブ）</option>
              <option value="vertical">縦（急降下）</option>
            </select>
          </label>
          <label style={labelStyle}>
            方向
            <select style={selectStyle} value={p.bendDirection ?? 'left'}
              onChange={e => set('bendDirection', e.target.value)}>
              <option value="left">左 / 上</option>
              <option value="right">右 / 下</option>
            </select>
          </label>
        </>
      );

    case 'seesaw':
      return (
        <>
          <label style={labelStyle}>
            板の長さ<input style={inputStyle} type="number" step="0.5" value={p.length ?? 6}
              onChange={e => set('length', +e.target.value || 1)} />
          </label>
          <label style={labelStyle}>
            支点の高さ<input style={inputStyle} type="number" step="0.1" value={p.pivotHeight ?? 1.2}
              onChange={e => set('pivotHeight', +e.target.value || 0.1)} />
          </label>
        </>
      );

    case 'cup':
      return (
        <>
          <label style={labelStyle}>
            口の半径<input style={inputStyle} type="number" step="0.1" value={p.topRadius ?? 0.8}
              onChange={e => set('topRadius', +e.target.value || 0.1)} />
          </label>
          <label style={labelStyle}>
            底の半径<input style={inputStyle} type="number" step="0.1" value={p.bottomRadius ?? 0.4}
              onChange={e => set('bottomRadius', +e.target.value || 0.05)} />
          </label>
          <label style={labelStyle}>
            高さ<input style={inputStyle} type="number" step="0.1" value={p.height ?? 1.2}
              onChange={e => set('height', +e.target.value || 0.1)} />
          </label>
        </>
      );

    case 'funnel':
      return (
        <>
          <label style={labelStyle}>
            半径<input style={inputStyle} type="number" step="0.1" value={p.radius ?? 1.2}
              onChange={e => set('radius', +e.target.value || 0.1)} />
          </label>
          <label style={labelStyle}>
            深さ<input style={inputStyle} type="number" step="0.1" value={p.depth ?? 0.6}
              onChange={e => set('depth', +e.target.value || 0.05)} />
          </label>
          <label style={labelStyle}>
            底穴半径<input style={inputStyle} type="number" step="0.05" value={p.holeRadius ?? 0}
              onChange={e => set('holeRadius', Math.max(0, +e.target.value))} />
          </label>
        </>
      );

    case 'hole_plate':
      return (
        <>
          <label style={labelStyle}>
            幅<input style={inputStyle} type="number" step="0.25" value={p.width ?? 2}
              onChange={e => set('width', +e.target.value || 0.1)} />
          </label>
          <label style={labelStyle}>
            奥行き<input style={inputStyle} type="number" step="0.25" value={p.depth ?? 2}
              onChange={e => set('depth', +e.target.value || 0.1)} />
          </label>
          <label style={labelStyle}>
            厚さ<input style={inputStyle} type="number" step="0.02" value={p.thickness ?? 0.15}
              onChange={e => set('thickness', +e.target.value || 0.01)} />
          </label>
          <label style={labelStyle}>
            穴の形
            <select style={selectStyle} value={p.holeShape ?? 'circle'}
              onChange={e => set('holeShape', e.target.value)}>
              <option value="circle">丸穴</option>
              <option value="square">四角穴</option>
            </select>
          </label>
          <label style={labelStyle}>
            穴の大きさ<input style={inputStyle} type="number" step="0.05" value={p.holeSize ?? 0.4}
              onChange={e => set('holeSize', +e.target.value || 0.05)} />
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <label style={labelStyle}>
              穴X<input style={{ ...inputStyle, width: '55px' }} type="number" step="0.1" value={p.holeOffsetX ?? 0}
                onChange={e => set('holeOffsetX', +e.target.value)} />
            </label>
            <label style={labelStyle}>
              穴Z<input style={{ ...inputStyle, width: '55px' }} type="number" step="0.1" value={p.holeOffsetZ ?? 0}
                onChange={e => set('holeOffsetZ', +e.target.value)} />
            </label>
          </div>
        </>
      );

    case 'main_ball':
      return (
        <label style={labelStyle}>
          半径<input style={inputStyle} type="number" step="0.05" value={p.radius ?? 0.12}
            onChange={e => set('radius', +e.target.value || 0.05)} />
        </label>
      );

    case 'sphere':
      return (
        <label style={labelStyle}>
          半径<input style={inputStyle} type="number" step="0.05" value={p.radius ?? 0.2}
            onChange={e => set('radius', +e.target.value || 0.05)} />
        </label>
      );

    default:
      return null;
  }
}

/**
 * 作成モードの左サイドパネル
 */
export default function CreationPanel() {
  const { objects, selectedId, select, updateObject, deleteObject, reset, addObject, undo, redo, historyIndex, history, removeHole } = useCourseStore();
  const setAppMode      = useGameStore(s => s.setAppMode);
  const transformMode   = useGameStore(s => s.transformMode);
  const setTransformMode= useGameStore(s => s.setTransformMode);
  const holeMode        = useGameStore(s => s.holeMode);
  const setHoleMode     = useGameStore(s => s.setHoleMode);
  const holeConfig      = useGameStore(s => s.holeConfig);
  const setHoleConfig   = useGameStore(s => s.setHoleConfig);
  
  const hasMainBall = objects.some(o => o.type === 'main_ball');
  const hasGoalZone = objects.some(o => o.type === 'goal_zone');
  const canPlay = hasMainBall && hasGoalZone;

  const selectedObj = objects.find(o => o.id === selectedId);
  const canUndo = historyIndex > 0;
  const canRedo = history && history.length ? historyIndex < history.length - 1 : false;

  const updateProp = (props) => updateObject(selectedId, { properties: props });
  const updatePos = (axis, val) => {
    const newPos = [...selectedObj.position];
    newPos[axis] = val;
    updateObject(selectedId, { position: newPos });
  };

  return (
    <aside className="creation-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', overflowY: 'auto' }}>
      {/* ─── タイトル ─── */}
      <div className="panel-title" style={{ flexShrink: 0 }}>
        <span className="panel-icon">{holeMode ? '🔩' : '🛤️'}</span>
        {holeMode ? '穴開け専用モード' : 'コースエディター'}
      </div>

      {/* ─── 穴開け専用モード時のUI ─── */}
      {holeMode && selectedObj && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px', background: '#374151', borderRadius: '6px', marginBottom: '10px', marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#fff' }}>
              対象: {TYPE_ICONS[selectedObj.type]} {TYPE_NAMES[selectedObj.type]}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '10px', lineHeight: '1.4' }}>
              物体表面の好きな場所をクリックすると穴が開きます。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#1f2937', padding: '10px', borderRadius: '4px' }}>
              <label style={labelStyle}>
                穴の形
                <select style={selectStyle} value={holeConfig.shape} onChange={e => setHoleConfig({ shape: e.target.value })}>
                  <option value="circle">丸穴</option>
                  <option value="square">四角穴</option>
                </select>
              </label>
              <label style={labelStyle}>
                大きさ
                <input style={inputStyle} type="number" step="0.05" value={holeConfig.radius} onChange={e => setHoleConfig({ radius: +e.target.value || 0.1 })} />
              </label>
            </div>
            
            {selectedObj.properties.holes && selectedObj.properties.holes.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px' }}>開けられた穴:</div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedObj.properties.holes.map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', padding: '6px 8px', borderRadius: '4px', marginBottom: '4px', fontSize: '0.8rem' }}>
                      <span>{h.shape === 'circle' ? '丸' : '四角'} ({h.localX.toFixed(1)}, {h.localY.toFixed(1)}, {h.localZ.toFixed(1)})</span>
                      <button onClick={() => removeHole(selectedId, h.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setHoleMode(false)}
            style={{ 
              marginTop: 'auto', padding: '12px', background: '#3b82f6', 
              color: '#fff', border: 'none', borderRadius: '6px', 
              fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}
          >
            ◀ コース編集に戻る
          </button>
        </div>
      )}

      {/* ─── 通常モードのUI ─── */}
      {!holeMode && (
        <>
          {/* ─── Undo / Redo ─── */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', marginBottom: '6px', flexShrink: 0 }}>
        <button onClick={undo} disabled={!canUndo}
          style={{ flex: 1, padding: '6px', background: '#374151', color: canUndo ? '#fff' : '#6b7280', border: 'none', borderRadius: '4px', cursor: canUndo ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
          ↶ 元に戻す
        </button>
        <button onClick={redo} disabled={!canRedo}
          style={{ flex: 1, padding: '6px', background: '#374151', color: canRedo ? '#fff' : '#6b7280', border: 'none', borderRadius: '4px', cursor: canRedo ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
          ↷ やり直し
        </button>
      </div>
      {/* ─── ギズモモード切替 ─── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexShrink: 0 }}>
        <button onClick={() => setTransformMode('translate')}
          style={{ flex: 1, padding: '6px', background: transformMode === 'translate' ? '#6366f1' : '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}>
          ✥ 物体を移動
        </button>
        <button onClick={() => setTransformMode('rotate')}
          style={{ flex: 1, padding: '6px', background: transformMode === 'rotate' ? '#6366f1' : '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}>
          ↻ 物体を回転
        </button>
      </div>

      {/* ─── プレイボタン ─── */}
      <div style={{ flexShrink: 0, marginBottom: '12px' }}>
        <button
          className={`btn-play-mode ${canPlay ? '' : 'disabled'}`}
          onClick={() => canPlay && setAppMode('play')}
          disabled={!canPlay}
          style={{ width: '100%' }}>
          ▶ プレイモードへ
        </button>
        {!canPlay && <p className="panel-warn" style={{ marginTop: '4px', fontSize: '0.78rem' }}>メインボールとゴールが必要です</p>}
      </div>

      <hr style={{ borderColor: '#374151', margin: '0 0 12px 0' }} />

      {/* ─── テンプレート追加（カテゴリ別） ─── */}
      <div style={{ flexShrink: 0 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#9ca3af' }}>➕ 物体を追加</h4>
        {Object.entries(TEMPLATE_CATEGORIES).map(([catKey, cat]) => {
          const catTemplates = Object.entries(TEMPLATES).filter(([, t]) => t.category === catKey);
          if (!catTemplates.length) return null;
          return (
            <div key={catKey} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '4px' }}>{cat.icon} {cat.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {catTemplates.map(([key, temp]) => (
                  <button key={key} className="btn-save" onClick={() => addObject(key)}
                    style={{ padding: '5px 4px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <span>{temp.icon}</span> {temp.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── デザインツリー ─── */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginTop: '8px', background: '#1f2937', borderRadius: '6px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
        <div style={{ padding: '7px 10px', background: '#374151', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px 6px 0 0' }}>
          <span>🌳 デザインツリー ({objects.length})</span>
          <button className="btn-icon" onClick={reset} title="全てリセット" style={{ fontSize: '0.95rem', padding: 0 }}>🗑️</button>
        </div>
        <div style={{ padding: '3px' }}>
          {objects.map(o => {
            const isSel = selectedId === o.id;
            return (
              <div key={o.id} onClick={() => select(o.id)}
                style={{
                  padding: '5px 8px', cursor: 'pointer',
                  background: isSel ? '#3b82f622' : 'transparent',
                  borderLeft: isSel ? '3px solid #3b82f6' : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  borderRadius: '2px', marginBottom: '1px', fontSize: '0.85rem'
                }}>
                <span style={{ width: '18px', textAlign: 'center', fontSize: '0.9rem' }}>{TYPE_ICONS[o.type] || '📦'}</span>
                <span style={{ flexGrow: 1, color: isSel ? '#fff' : '#d1d5db' }}>{TYPE_NAMES[o.type] || o.type}</span>
                {o.isStatic && <span style={{ fontSize: '0.68rem', color: '#9ca3af', border: '1px solid #4b5563', padding: '1px 3px', borderRadius: '3px' }}>固定</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── プロパティエディタ ─── */}
      {selectedObj && (
        <div style={{ flexShrink: 0, marginTop: '10px', background: '#1f2937', padding: '10px', borderRadius: '6px', border: '1px solid #374151' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#e5e7eb' }}>
            ✎ {TYPE_ICONS[selectedObj.type]} {TYPE_NAMES[selectedObj.type]}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>

            {/* 固定チェック */}
            <label style={labelStyle}>
              <input type="checkbox" checked={selectedObj.isStatic}
                onChange={e => updateObject(selectedId, { isStatic: e.target.checked })} />
              空間に固定する (Static)
            </label>

            {/* 重さ */}
            <label style={labelStyle}>
              重さ (Mass)
              <input style={inputStyle} type="number" step="0.1" value={selectedObj.mass}
                onChange={e => updateObject(selectedId, { mass: parseFloat(e.target.value) || 0.1 })} />
            </label>

            {/* 位置 XYZ */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['X', 'Y', 'Z'].map((ax, i) => (
                <label key={ax} style={labelStyle}>
                  {ax}:
                  <input style={{ ...inputStyle, width: '55px' }} type="number" step="0.5"
                    value={selectedObj.position[i].toFixed(2)}
                    onChange={e => updatePos(i, parseFloat(e.target.value) || 0)} />
                </label>
              ))}
            </div>

            {/* タイプ別固有プロパティ */}
            <TypeSpecificProps obj={selectedObj} onPropChange={updateProp} />

            {/* 削除（main_ball / goal_zone は不可） */}
            {selectedObj.type !== 'main_ball' && selectedObj.type !== 'goal_zone' && (
              <button className="btn-del" onClick={() => deleteObject(selectedId)}
                style={{ marginTop: '6px', padding: '5px', fontSize: '0.82rem' }}>
                🗑️ この物体を削除
              </button>
            )}

            {/* ─── 穴開け機能 ─── */}
            <hr style={{ borderColor: '#4b5563', margin: '8px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: 'bold' }}>🔩 穴開けモード</span>
              <button 
                onClick={() => setHoleMode(true)}
                style={{ 
                  background: '#374151', 
                  color: '#fff', border: 'none', borderRadius: '4px', 
                  padding: '6px 10px', fontSize: '0.82rem', cursor: 'pointer',
                  borderBottom: '2px solid #4b5563'
                }}
              >
                専用画面へ ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 認証・保存 UI ─── */}
      <div style={{ flexShrink: 0, marginTop: '14px' }}>
        <AuthUI />
      </div>
      </>
      )}
    </aside>
  );
}
