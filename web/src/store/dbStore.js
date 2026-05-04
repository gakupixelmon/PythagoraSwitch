import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

// ─── クライアントサイドのバリデーション ──────────────────────────────
// DB の CHECK 制約と二重でガード。悪意のあるデータを送信させない。

const MAX_NODES = 50;
const MIN_NODES = 2;
const MAX_COORD = 200;   // 座標の絶対値上限
const MAX_NAME_LEN = 100;

function validateObjects(objects) {
  if (!Array.isArray(objects))
    throw new Error('オブジェクトデータが不正です');
  if (objects.length > MAX_NODES)
    throw new Error(`オブジェクトは最大 ${MAX_NODES} 個までです`);

  const hasMainBall = objects.some(o => o.type === 'main_ball');
  const hasGoalZone = objects.some(o => o.type === 'goal_zone');
  if (!hasMainBall || !hasGoalZone) {
    throw new Error('メインボールとゴールゾーンは必須です');
  }

  for (const o of objects) {
    if (!Array.isArray(o.position) || o.position.length !== 3)
      throw new Error('位置データが不正です');
    if (!Array.isArray(o.rotation) || o.rotation.length !== 3)
      throw new Error('回転データが不正です');
  }
}

// サニタイズ
function sanitizeObjects(objects) {
  return objects.map(o => ({
    id: typeof o.id === 'number' ? o.id : 0,
    type: String(o.type),
    position: o.position.map(v => +v.toFixed(3)),
    rotation: o.rotation.map(v => +v.toFixed(3)),
    isStatic: Boolean(o.isStatic),
    mass: Number(o.mass) || 1,
    properties: o.properties || {}
  }));
}

/**
 * データベース操作ストア
 *
 * セキュリティ:
 *   - 保存前にクライアント側でバリデーション
 *   - DB 側も RLS + CHECK 制約で二重ガード
 *   - user_id はサーバー側の auth.uid() で強制（クライアント送信値は無視）
 */
export const useDbStore = create((set, get) => ({
  courses: [],
  loading: false,
  error:   null,

  clearError: () => set({ error: null }),

  // ─── 自分のコース一覧を取得 ────────────────────────────────────────
  fetchCourses: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, description, best_time, play_count, is_public, updated_at')
      .order('updated_at', { ascending: false });

    if (error) set({ error: error.message, loading: false });
    else       set({ courses: data ?? [], loading: false });
  },

  // ─── コースを新規保存 ──────────────────────────────────────────────
  saveCourse: async (name, nodes) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('ログインが必要です');

    // バリデーション
    if (!name || name.trim().length === 0)
      throw new Error('コース名を入力してください');
    if (name.trim().length > MAX_NAME_LEN)
      throw new Error(`コース名は ${MAX_NAME_LEN} 文字以内にしてください`);
    validateObjects(nodes);

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        name:    name.trim(),
        nodes:   sanitizeObjects(nodes),
      })
      .select('id, name, best_time, play_count, is_public, updated_at')
      .single();

    set({ loading: false });
    if (error) throw new Error(error.message);
    set(s => ({ courses: [data, ...s.courses] }));
    return data;
  },

  // ─── コースを上書き保存 ────────────────────────────────────────────
  updateCourse: async (id, name, nodes) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('ログインが必要です');

    if (!name || name.trim().length === 0)
      throw new Error('コース名を入力してください');
    validateObjects(nodes);

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('courses')
      .update({ name: name.trim(), nodes: sanitizeObjects(nodes) })
      .eq('id', id)
      .select('id, name, best_time, play_count, is_public, updated_at')
      .single();

    set({ loading: false });
    if (error) throw new Error(error.message);
    set(s => ({ courses: s.courses.map(c => c.id === id ? data : c) }));
    return data;
  },

  // ─── コースを削除 ─────────────────────────────────────────────────
  deleteCourse: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);           // RLS が user_id を自動チェック

    set({ loading: false });
    if (error) throw new Error(error.message);
    set(s => ({ courses: s.courses.filter(c => c.id !== id) }));
  },

  // ─── コースのノードを取得して返す ────────────────────────────────
  loadCourseNodes: async (id) => {
    const { data, error } = await supabase
      .from('courses')
      .select('nodes')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    validateObjects(data.nodes);  // ロード時も検証
    return data.nodes;
  },

  // ─── クリア記録を保存（DB Function 経由） ────────────────────────
  recordPlay: async (courseId, clearTime) => {
    const user = useAuthStore.getState().user;
    if (!user || !courseId) return;
    if (typeof clearTime !== 'number' || clearTime <= 0 || clearTime > 3600) return;

    // DB Function を通じて play_count + best_time を原子的に更新
    await supabase.rpc('record_play', {
      p_course_id: courseId,
      p_time:      +clearTime.toFixed(2),
    });
  },
}));
