import { create } from 'zustand';

let _nextId = 10;
const uid = () => ++_nextId;

// デフォルトノード（ボール直下にレールが来るよう調整済み）
const DEFAULT_NODES = [
  { id: 1, x: 0,   y: 4.0, z: 0   },
  { id: 2, x: 0,   y: 3.0, z: 2.5 },
  { id: 3, x: 2.5, y: 2.0, z: 4.5 },
  { id: 4, x: 2.5, y: 0.5, z: 7.0 },
  { id: 5, x: 0,   y: -0.5,z: 9.0 },
  { id: 6, x: 0,   y: -2.0,z: 11.5},
];

/**
 * ノードリストからコース定義を生成する
 *
 * 【ボール位置の計算】
 * node[0] は第1レールセグメントの"端"であるため、
 * そのまま配置するとボールが端から落下してしまう。
 * node[0] → node[1] 方向に "BALL_INSET" だけ内側に進んだ
 * レール上の点にボールを配置することで、
 * ガイド壁に囲まれた安全な位置でスタートできる。
 */
const BALL_RADIUS = 0.12;
const RAIL_HALF_THICK = 0.04; // thick=0.08 の半分
const BALL_INSET = 0.5;       // レール端から何m内側に置くか

function nodesToCourse(nodes) {
  if (nodes.length < 2) return null;

  const segments = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    segments.push({
      type: 'straight',
      start: [a.x, a.y, a.z],
      end:   [b.x, b.y, b.z],
      width: 0.65,
    });
  }

  // ─── ボール開始位置: レール内側に BALL_INSET 分オフセット ───
  const n0 = nodes[0];
  const n1 = nodes[1];

  // node[0] → node[1] の単位ベクトル
  const dx = n1.x - n0.x;
  const dy = n1.y - n0.y;
  const dz = n1.z - n0.z;
  const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const ux = dx / segLen;
  const uy = dy / segLen;
  const uz = dz / segLen;

  // BALL_INSET だけ進んだ点（セグメント長の50%以下に抑える）
  const inset = Math.min(BALL_INSET, segLen * 0.45);
  const bx = n0.x + ux * inset;
  const by = n0.y + uy * inset; // レール傾斜に沿った高さ
  const bz = n0.z + uz * inset;

  // レール上面 + ボール半径分だけ上に置く
  // （レールの"local up" は傾いているが、近似として world Y で補正）
  const ballY = by + RAIL_HALF_THICK + BALL_RADIUS + 0.04; // 0.04 = 余裕

  const last = nodes[nodes.length - 1];
  return {
    id: 'custom',
    name: 'カスタムコース',
    ballStart: [bx, ballY, bz],
    goalPos:   [last.x, last.y - 0.5, last.z],
    segments,
  };
}

export const useCourseStore = create((set, get) => ({
  nodes: DEFAULT_NODES.map(n => ({ ...n })),
  selectedId: null,

  // ─── 選択 ───────────────────────────────────────────
  select:    (id) => set({ selectedId: id }),
  deselect:  ()   => set({ selectedId: null }),

  // ─── 追加（指定xz、直前ノードより0.5低い） ──────────
  addNode: (x, z) => set(state => {
    const nodes = state.nodes;
    const last  = nodes[nodes.length - 1];
    const y     = last ? last.y - 0.6 : 3;
    const id    = uid();
    return { nodes: [...nodes, { id, x, y, z }], selectedId: id };
  }),

  // ─── 移動（xz平面） ─────────────────────────────────
  moveNode: (id, x, z) => set(state => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, x, z } : n),
  })),

  // ─── 高さ変更 ────────────────────────────────────────
  setHeight: (id, y) => set(state => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, y } : n),
  })),

  // ─── 削除 ────────────────────────────────────────────
  deleteNode: (id) => set(state => ({
    nodes:      state.nodes.filter(n => n.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  })),

  // ─── リセット ────────────────────────────────────────
  reset: () => set({ nodes: DEFAULT_NODES.map(n => ({ ...n })), selectedId: null }),

  // ─── コース生成 ──────────────────────────────────────
  getCourse: () => nodesToCourse(get().nodes),
}));
