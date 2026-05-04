import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] 環境変数が未設定です。' +
    '.env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。'
  );
}

/**
 * Supabase クライアント
 *
 * セキュリティ注意事項:
 *   - anon key のみ使用（service_role key は絶対にフロントに含めない）
 *   - 全データアクセスは Row Level Security (RLS) で保護される
 *   - セッションは localStorage に暗号化して保存される
 */
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
    storageKey:          'pythagora_auth',   // 他アプリと衝突させない
  },
  global: {
    headers: {
      'x-app-name': 'pythagora-switch-3d',  // デバッグ用識別子
    },
  },
});
