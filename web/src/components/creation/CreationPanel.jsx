import { useCourseStore, TEMPLATES } from '../../store/courseStore';
import { useGameStore } from '../../store/gameStore';
import AuthUI from './AuthUI';

/**
 * 作成モードの左サイドパネル
 */
export default function CreationPanel() {
  const { objects, selectedId, select, updateObject, deleteObject, reset, addObject } = useCourseStore();
  const setAppMode = useGameStore(s => s.setAppMode);
  const dragMode = useGameStore(s => s.dragMode);
  const setDragMode = useGameStore(s => s.setDragMode);
  
  const hasMainBall = objects.some(o => o.type === 'main_ball');
  const hasGoalZone = objects.some(o => o.type === 'goal_zone');
  const canPlay = hasMainBall && hasGoalZone;

  const selectedObj = objects.find(o => o.id === selectedId);

  return (
    <aside className="creation-panel">
      {/* ─── タイトル ─── */}
      <div className="panel-title">
        <span className="panel-icon">🛤️</span>
        コースエディター
      </div>

      {/* ─── 説明 ─── */}
      <div className="panel-tip">
        <b>3Dビューをクリック</b>で選択・移動。<br />
        テンプレートから物体を追加。
      </div>

      {/* ─── 視点操作 ─── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: '16px' }}>
        <button 
          style={{ flex: 1, padding: '8px', background: dragMode === 'rotate' ? '#3b82f6' : '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: dragMode === 'rotate' ? 'bold' : 'normal' }}
          onClick={() => setDragMode('rotate')}>
          🔄 視点回転
        </button>
        <button 
          style={{ flex: 1, padding: '8px', background: dragMode === 'pan' ? '#3b82f6' : '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: dragMode === 'pan' ? 'bold' : 'normal' }}
          onClick={() => setDragMode('pan')}>
          ✋ 平行移動
        </button>
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
        <p className="panel-warn">メインボールとゴールゾーンが必要です</p>
      )}

      {/* ─── テンプレート追加 ─── */}
      <div className="template-add-section" style={{ marginTop: '20px' }}>
        <h4>➕ テンプレート追加</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
          {Object.entries(TEMPLATES).map(([key, temp]) => (
            <button key={key} className="btn-save" onClick={() => addObject(key)} style={{ padding: '8px', fontSize: '0.8rem' }}>
              {temp.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── オブジェクトプロパティ編集 ─── */}
      {selectedObj ? (
        <div className="property-editor" style={{ marginTop: '20px', background: '#1f2937', padding: '12px', borderRadius: '8px' }}>
          <h4>✎ プロパティ ({selectedObj.type})</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {/* isStatic */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={selectedObj.isStatic} 
                onChange={e => updateObject(selectedId, { isStatic: e.target.checked })}
              />
              空間に固定する (Static)
            </label>

            {/* mass */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              重さ (Mass)
              <input 
                type="number" 
                step="0.1" 
                value={selectedObj.mass} 
                onChange={e => updateObject(selectedId, { mass: parseFloat(e.target.value) || 0.1 })}
                style={{ width: '60px', background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
              />
            </label>

            {/* Position Y (Height) quick editor */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              高さ (Y)
              <input 
                type="number" 
                step="0.1" 
                value={selectedObj.position[1].toFixed(2)} 
                onChange={e => {
                  const newPos = [...selectedObj.position];
                  newPos[1] = parseFloat(e.target.value) || 0;
                  updateObject(selectedId, { position: newPos });
                }}
                style={{ width: '80px', background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
              />
            </label>

            {/* Some specific properties */}
            {selectedObj.type === 'sphere' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                半径
                <input 
                  type="number" 
                  step="0.05" 
                  value={selectedObj.properties.radius} 
                  onChange={e => updateObject(selectedId, { properties: { ...selectedObj.properties, radius: parseFloat(e.target.value) || 0.1 } })}
                  style={{ width: '60px', background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                />
              </label>
            )}

            <button 
              className="btn-del" 
              onClick={() => deleteObject(selectedId)}
              style={{ marginTop: '10px' }}
            >
              🗑️ この物体を削除
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
          3Dビューで物体をクリックして編集
        </div>
      )}

      {/* ─── オブジェクトリスト概要 ─── */}
      <div className="node-list-header" style={{ marginTop: '20px' }}>
        <span>オブジェクト ({objects.length})</span>
        <button className="btn-icon" onClick={reset} title="リセット">↺</button>
      </div>
      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #374151', borderRadius: '4px', padding: '8px', fontSize: '0.8rem' }}>
        {objects.map(o => (
          <div 
            key={o.id} 
            onClick={() => select(o.id)}
            style={{ 
              padding: '4px', 
              cursor: 'pointer', 
              background: selectedId === o.id ? '#3b82f644' : 'transparent',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>{o.type}</span>
            <span>y: {o.position[1].toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* ─── 認証・保存 UI ─── */}
      <div style={{ marginTop: '20px' }}>
        <AuthUI />
      </div>
    </aside>
  );
}
