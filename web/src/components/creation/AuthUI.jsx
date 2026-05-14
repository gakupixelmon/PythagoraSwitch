import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDbStore } from '../../store/dbStore';
import { useCourseStore } from '../../store/courseStore';

export default function AuthUI() {
  const { user, profile, loading: authLoading, authError, signInWithGitHub, signInWithEmail, signUpWithEmail, signOut, clearError } = useAuthStore();
  const { courses, fetchCourses, saveCourse, loadCourseNodes, loading: dbLoading, error: dbError } = useDbStore();
  const { objects, setObjects } = useCourseStore();

  const [courseName, setCourseName] = useState('');
  const [showList, setShowList] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // ユーザー変更時にコース一覧を取得
  useEffect(() => {
    if (user) fetchCourses();
  }, [user, fetchCourses]);

  if (authLoading) return <div className="auth-panel">読み込み中...</div>;

  // 未ログイン時：ログインフォーム表示
  if (!user) {
    return (
      <div className="auth-panel">
        <div className="auth-title">{isRegister ? '新規登録' : 'ログイン'}して保存</div>

        <div className="email-auth-form">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-auth"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-auth"
          />

          {authError && <div className="auth-error-text">{authError}</div>}

          <div className="auth-actions">
            {isRegister ? (
              <button className="btn-auth email" onClick={() => signUpWithEmail(email, password)}>登録する</button>
            ) : (
              <button className="btn-auth email" onClick={() => signInWithEmail(email, password)}>ログイン</button>
            )}
          </div>

          <button className="btn-text-toggle" onClick={() => { setIsRegister(!isRegister); clearError(); }}>
            {isRegister ? 'すでにアカウントをお持ちの方' : '新しくアカウントを作る'}
          </button>
        </div>

        <div className="auth-divider">または</div>

        <button className="btn-auth github" onClick={signInWithGitHub}>GitHub でログイン</button>
      </div>
    );
  }

  // ログイン済み時：ユーザー情報と保存/読み込みUI
  const handleSave = async () => {
    if (!courseName) return alert('コース名を入力してください');
    try {
      await saveCourse(courseName, objects);
      setCourseName('');
      alert('保存しました！');
      // 保存後にリストを再取得（確実に同期させる）
      await fetchCourses();
    } catch (e) {
      console.error('Save error:', e);
      alert(`保存エラー: ${e.message}`);
    }
  };

  const handleLoad = async (courseId) => {
    try {
      const loadedObjects = await loadCourseNodes(courseId);
      setObjects(loadedObjects);
      alert('コースを読み込みました');
      setShowList(false);
    } catch (e) {
      alert(`読み込みエラー: ${e.message}`);
    }
  };

  return (
    <div className="auth-panel">
      <div className="user-info">
        {profile?.avatar_url && <img src={profile.avatar_url} alt="avatar" className="avatar" />}
        <span className="user-name">{profile?.display_name || 'ユーザー'}</span>
        <button className="btn-icon" onClick={signOut} title="ログアウト">🚪</button>
      </div>

      <div className="save-section">
        <input
          type="text"
          placeholder="新しいコース名"
          value={courseName}
          onChange={e => setCourseName(e.target.value)}
          className="input-course"
          maxLength={50}
        />
        <button className="btn-save" onClick={handleSave} disabled={dbLoading || objects.length < 2}>
          {dbLoading ? '保存中...' : '💾 保存'}
        </button>
      </div>

      <button className="btn-list-toggle" onClick={() => setShowList(!showList)}>
        📂 マイコースを開く ({courses.length})
      </button>

      {showList && (
        <ul className="course-list">
          {dbError && <li className="error-text">{dbError}</li>}
          {courses.length === 0 && <li className="empty-text">コースがありません</li>}
          {courses.map(c => (
            <li key={c.id} className="course-list-item">
              <span className="course-name">{c.name}</span>
              <button className="btn-load" onClick={() => handleLoad(c.id)}>開く</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
