import { create } from 'zustand';

let _nextId = 100;
export const uid = () => ++_nextId;

// デフォルトオブジェクト
const DEFAULT_OBJECTS = [
  {
    id: 1,
    type: 'main_ball',
    position: [0, 5, 0],
    rotation: [0, 0, 0],
    isStatic: false,
    mass: 0.5,
    properties: { radius: 0.12, color: '#00b4ff' }
  },
  {
    id: 2,
    type: 'straight_rail',
    position: [0, 4, 2],
    rotation: [0.3, 0, 0],
    isStatic: true,
    mass: 1,
    properties: { length: 8, width: 0.65 }
  },
  {
    id: 3,
    type: 'goal_zone',
    position: [0, 1, 8],
    rotation: [0, 0, 0],
    isStatic: true,
    mass: 1,
    properties: {}
  }
];

// テンプレート定義
export const TEMPLATES = {
  // ─── レール ───────────────────────────────────────────
  straight_rail: {
    name: '直線レール',
    icon: '➖',
    category: 'rails',
    type: 'straight_rail',
    isStatic: true,
    mass: 1,
    properties: { length: 4, width: 0.65, holes: [] }
  },
  curved_rail_h: {
    name: '水平カーブ',
    icon: '↪️',
    category: 'rails',
    type: 'curved_rail',
    isStatic: true,
    mass: 1,
    properties: { radius: 2, angle: 90, width: 0.65, bendAxis: 'horizontal', bendDirection: 'left', holes: [] }
  },
  curved_rail_v: {
    name: '縦カーブ',
    icon: '🎢',
    category: 'rails',
    type: 'curved_rail',
    isStatic: true,
    mass: 1,
    properties: { radius: 2, angle: 90, width: 0.65, bendAxis: 'vertical', bendDirection: 'left', holes: [] }
  },

  // ─── ギミック ─────────────────────────────────────────
  seesaw: {
    name: 'シーソー',
    icon: '⚖️',
    category: 'gimmicks',
    type: 'seesaw',
    isStatic: false,
    mass: 1,
    properties: { length: 6, width: 0.65, pivotHeight: 1.2, holes: [] }
  },
  cup: {
    name: 'コップ',
    icon: '🥤',
    category: 'gimmicks',
    type: 'cup',
    isStatic: true,
    mass: 1,
    properties: { topRadius: 0.8, bottomRadius: 0.4, height: 1.2, wallThick: 0.06, holes: [] }
  },
  funnel: {
    name: 'すり鉢',
    icon: '🫙',
    category: 'gimmicks',
    type: 'funnel',
    isStatic: true,
    mass: 1,
    properties: { radius: 1.2, depth: 0.6, wallThick: 0.06, holeRadius: 0, holes: [] }
  },
  hole_plate: {
    name: '穴あきプレート',
    icon: '🔲',
    category: 'gimmicks',
    type: 'hole_plate',
    isStatic: true,
    mass: 1,
    properties: { width: 2, depth: 2, thickness: 0.15, holeShape: 'circle', holeSize: 0.4, holeOffsetX: 0, holeOffsetZ: 0, holes: [] }
  },

  // ─── 球体 ─────────────────────────────────────────────
  sphere: {
    name: 'ボール',
    icon: '⚪️',
    category: 'balls',
    type: 'sphere',
    isStatic: false,
    mass: 0.5,
    properties: { radius: 0.2, color: '#f97316' }
  }
};

// カテゴリ定義
export const TEMPLATE_CATEGORIES = {
  rails: { label: 'レール', icon: '🛤️' },
  gimmicks: { label: 'ギミック', icon: '⚙️' },
  balls: { label: 'ボール', icon: '⚽' }
};

export const useCourseStore = create((set, get) => ({
  objects: JSON.parse(JSON.stringify(DEFAULT_OBJECTS)),
  selectedId: null,
  history: [JSON.parse(JSON.stringify(DEFAULT_OBJECTS))],
  historyIndex: 0,

  // ─── 履歴 ───────────────────────────────────────────
  undo: () => set(state => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return { objects: JSON.parse(JSON.stringify(state.history[newIndex])), historyIndex: newIndex };
    }
    return state;
  }),

  redo: () => set(state => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return { objects: JSON.parse(JSON.stringify(state.history[newIndex])), historyIndex: newIndex };
    }
    return state;
  }),

  // ─── 選択 ───────────────────────────────────────────
  select: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),

  // ─── オブジェクト操作 ────────────────────────────────
  addObject: (templateKey, position) => set(state => {
    const template = TEMPLATES[templateKey];
    if (!template) return state;
    if (templateKey === 'main_ball' && state.objects.some(o => o.type === 'main_ball')) return state;

    const newObj = {
      id: uid(),
      type: template.type,
      position: position || [0, 5, 0],
      rotation: [0, 0, 0],
      isStatic: template.isStatic,
      mass: template.mass,
      properties: { ...template.properties }
    };
    const newObjects = [...state.objects, newObj];
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    return { objects: newObjects, selectedId: newObj.id, history: nextHistory, historyIndex: nextHistory.length - 1 };
  }),

  updateObject: (id, updates) => set(state => {
    const newObjects = state.objects.map(o => o.id === id ? { ...o, ...updates } : o);
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    return { objects: newObjects, history: nextHistory, historyIndex: nextHistory.length - 1 };
  }),

  // ─── 穴あけ機能 ────────────────────────────────────────
  addHole: (objectId, hole) => set(state => {
    const newObjects = state.objects.map(o => {
      if (o.id !== objectId) return o;
      const holes = [...(o.properties.holes || []), { ...hole, id: uid() }];
      return { ...o, properties: { ...o.properties, holes } };
    });
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    return { objects: newObjects, history: nextHistory, historyIndex: nextHistory.length - 1 };
  }),

  removeHole: (objectId, holeId) => set(state => {
    const newObjects = state.objects.map(o => {
      if (o.id !== objectId) return o;
      const holes = (o.properties.holes || []).filter(h => h.id !== holeId);
      return { ...o, properties: { ...o.properties, holes } };
    });
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    return { objects: newObjects, history: nextHistory, historyIndex: nextHistory.length - 1 };
  }),

  deleteObject: (id) => set(state => {
    const obj = state.objects.find(o => o.id === id);
    if (obj?.type === 'main_ball' || obj?.type === 'goal_zone') return state;
    const newObjects = state.objects.filter(o => o.id !== id);
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    return {
      objects: newObjects,
      selectedId: state.selectedId === id ? null : state.selectedId,
      history: nextHistory,
      historyIndex: nextHistory.length - 1
    };
  }),

  reset: () => set(state => {
    const newObjects = JSON.parse(JSON.stringify(DEFAULT_OBJECTS));
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    return { objects: newObjects, selectedId: null, history: nextHistory, historyIndex: nextHistory.length - 1 };
  }),

  setObjects: (objects) => set({
    objects: JSON.parse(JSON.stringify(objects)),
    history: [JSON.parse(JSON.stringify(objects))],
    historyIndex: 0,
    selectedId: null
  }),

  getCourse: () => {
    const { objects } = get();
    const mainBall = objects.find(o => o.type === 'main_ball');
    const goalZone = objects.find(o => o.type === 'goal_zone');
    return {
      id: 'custom',
      name: 'カスタムコース',
      ballStart: mainBall ? mainBall.position : [0, 5, 0],
      goalPos: goalZone ? goalZone.position : [0, 0, 10],
      objects: objects,
    };
  }
}));
