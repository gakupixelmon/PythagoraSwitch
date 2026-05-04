-- =====================================================================
--  3D ピタゴラスイッチ — Supabase初期マイグレーション
--  セキュリティ設計:
--    - Row Level Security (RLS) を全テーブルで有効化
--    - ポリシーにより auth.uid() === user_id を DB レベルで強制
--    - CHECK 制約でデータ整合性を保証
--    - updated_at は DB トリガーで自動更新（クライアント改竄防止）
-- =====================================================================

-- UUID 拡張（Supabase では通常有効済み）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
--  profiles テーブル（auth.users の公開情報ミラー）
--  auth.users は直接参照不可なため、表示名・アバターを安全に保持する
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT        CHECK (char_length(display_name) <= 50),
  avatar_url    TEXT        CHECK (char_length(avatar_url) <= 500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 誰でも公開プロフィールを読める（display_name, avatar_url のみ）
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

-- 自分のプロフィールのみ更新可
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- サインアップ時に自動でプロフィール作成（DB Function + Trigger）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'user_name', 'Anonymous'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
--  courses テーブル（ユーザーのコースデータ）
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL
                CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT
                CHECK (description IS NULL OR char_length(description) <= 500),
  -- nodes は JSONB。CHECK でノード数を 2〜50 に制限
  nodes       JSONB       NOT NULL
                CHECK (jsonb_typeof(nodes) = 'array'
                  AND jsonb_array_length(nodes) BETWEEN 2 AND 50),
  best_time   FLOAT
                CHECK (best_time IS NULL OR best_time > 0),
  play_count  INTEGER     NOT NULL DEFAULT 0
                CHECK (play_count >= 0),
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_courses_user_id ON public.courses (user_id);
CREATE INDEX idx_courses_public  ON public.courses (is_public, updated_at DESC)
  WHERE is_public = true;
CREATE INDEX idx_courses_updated ON public.courses (user_id, updated_at DESC);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 自分のコースは全操作可
CREATE POLICY "courses_select_own"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

-- 公開コースは全員が参照可（SELECT のみ）
CREATE POLICY "courses_select_public"
  ON public.courses FOR SELECT
  USING (is_public = true);

-- INSERT 時は user_id を auth.uid() に強制（クライアントが偽装不可）
CREATE POLICY "courses_insert_own"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE は自分のコースのみ、かつ user_id の変更は不可
CREATE POLICY "courses_update_own"
  ON public.courses FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE は自分のコースのみ
CREATE POLICY "courses_delete_own"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
--  play_records テーブル（プレイ記録）
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.play_records (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id  UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clear_time FLOAT       NOT NULL CHECK (clear_time > 0),
  played_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_play_records_course ON public.play_records (course_id, clear_time ASC);
CREATE INDEX idx_play_records_user   ON public.play_records (user_id, played_at DESC);

ALTER TABLE public.play_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "play_records_select_own"
  ON public.play_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "play_records_insert_own"
  ON public.play_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
--  Helper: コースのベストタイムを自動更新する関数
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_play(
  p_course_id UUID,
  p_time      FLOAT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- play_records に追記
  INSERT INTO public.play_records (course_id, user_id, clear_time)
  VALUES (p_course_id, auth.uid(), p_time);

  -- courses の play_count インクリメント & ベストタイム更新
  UPDATE public.courses
  SET
    play_count = play_count + 1,
    best_time  = CASE
                   WHEN best_time IS NULL OR p_time < best_time THEN p_time
                   ELSE best_time
                 END
  WHERE id = p_course_id;
END;
$$;
