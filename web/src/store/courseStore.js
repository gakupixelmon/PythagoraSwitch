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
  straight_rail: {
    name: '直線レール',
    type: 'straight_rail',
    isStatic: true,
    mass: 1,
    properties: { length: 4, width: 0.65 }
  },
  curved_rail: {
    name: 'カーブレール',
    type: 'curved_rail',
    isStatic: true,
    mass: 1,
    properties: { radius: 2, angle: 90, width: 0.65 }
  },
  sphere: {
    name: 'ボール',
    type: 'sphere',
    isStatic: false,
    mass: 0.5,
    properties: { radius: 0.2, color: '#f97316' }
  }
};

export const useCourseStore = create((set, get) => ({
  objects: JSON.parse(JSON.stringify(DEFAULT_OBJECTS)),
  selectedId: null,

  // ─── 選択 ───────────────────────────────────────────
  select:   (id) => set({ selectedId: id }),
  deselect: ()   => set({ selectedId: null }),

  // ─── オブジェクト操作 ────────────────────────────────
  addObject: (templateKey, position) => set(state => {
    const template = TEMPLATES[templateKey];
    if (!template) return state;
    
    // メインボールは1つだけ
    if (templateKey === 'main_ball' && state.objects.some(o => o.type === 'main_ball')) {
      return state;
    }
    
    const newObj = {
      id: uid(),
      type: template.type,
      position: position || [0, 5, 0],
      rotation: [0, 0, 0],
      isStatic: template.isStatic,
      mass: template.mass,
      properties: { ...template.properties }
    };
    return { objects: [...state.objects, newObj], selectedId: newObj.id };
  }),

  updateObject: (id, updates) => set(state => ({
    objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
  })),

  deleteObject: (id) => set(state => {
    const obj = state.objects.find(o => o.id === id);
    if (obj?.type === 'main_ball' || obj?.type === 'goal_zone') {
      return state; // メインボールとゴールゾーンは削除不可
    }
    return {
      objects: state.objects.filter(o => o.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    };
  }),

  // ─── リセット ────────────────────────────────────────
  reset: () => set({ objects: JSON.parse(JSON.stringify(DEFAULT_OBJECTS)), selectedId: null }),

  // ─── コース取得（従来の後方互換性用ラッパー、あるいはそのままobjectsを返す） ───
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
