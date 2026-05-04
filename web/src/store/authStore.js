import { create } from 'zustand';
import { supabase } from '../lib/supabase';

/**
 * 認証状態管理ストア
 *
 * - パスワード認証は使わない（OAuth のみ）
 * - セッション・ユーザー情報は Supabase が管理
 * - onAuthStateChange で状態を常に同期
 */
export const useAuthStore = create((set, get) => ({
  user:      null,
  session:   null,
  profile:   null,
  loading:   true,
  authError: null,

  // ─── 初期化（アプリ起動時に1回呼ぶ） ────────────────────────────
  init: async () => {
    // 既存セッションを復元
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });

    if (session?.user) await get()._fetchProfile(session.user.id);

    // 認証状態の変化を監視
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) await get()._fetchProfile(session.user.id);
      else set({ profile: null });
    });
  },

  // ─── プロフィール取得（内部用） ───────────────────────────────────
  _fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) set({ profile: data });
  },

  // ─── GitHub でログイン ────────────────────────────────────────────
  signInWithGitHub: async () => {
    set({ authError: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: 'read:user user:email',
      },
    });
    if (error) set({ authError: error.message });
  },

  // ─── Google でログイン ────────────────────────────────────────────
  signInWithGoogle: async () => {
    set({ authError: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: 'openid email profile',
      },
    });
    if (error) set({ authError: error.message });
  },

  // ─── ログアウト ───────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  clearError: () => set({ authError: null }),
}));
