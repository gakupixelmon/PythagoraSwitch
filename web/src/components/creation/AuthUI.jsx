import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDbStore } from '../../store/dbStore';
import { useCourseStore } from '../../store/courseStore';

export default function AuthUI() {
  const { user, profile, loading: authLoading, authError, signInWithGitHub, signInWithEmail, signUpWithEmail, signOut, clearError } = useAuthStore();
  const { courses, fetchCourses, saveCourse, updateCourse, deleteCourse, loadCourseNodes, loading: dbLoading, error: dbError } = useDbStore();
  const { objects, setObjects, currentCourseId, currentCourseName, setCurrentCourse } = useCourseStore();
  
  const [courseName, setCourseName] = useState('');
  const [showList, setShowList] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // ユーザー変更時にコース一覧を取得
  useEffect(() => {
    if (user) fetchCourses();
  }, [user, fetchCourses]);

  // 現在のコース名がストアで変わったらinputに反映
  useEffect(() => {
    setCourseName(currentCourseName || '');
  }, [currentCourseName]);

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
      if (currentCourseId) {
        await updateCourse(currentCourseId, courseName, objects);
        setCurrentCourse(currentCourseId, courseName);
        alert('上書き保存しました！');
      } else {
        const newCourse = await saveCourse(courseName, objects);
        setCurrentCourse(newCourse.id, newCourse.name);
        alert('保存しました！');
      }
      await fetchCourses();
    } catch (e) {
      console.error('Save error:', e);
      alert(`保存エラー: ${e.message}`);
    }
  };

  const handleSaveAsNew = async () => {
    if (!courseName) return alert('コース名を入力してください');
    try {
      const newCourse = await saveCourse(courseName, objects);
      setCurrentCourse(newCourse.id, newCourse.name);
      alert('新規保存しました！');
      await fetchCourses();
    } catch (e) {
      alert(`保存エラー: ${e.message}`);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('本当にこのコースを削除しますか？')) return;
    try {
      await deleteCourse(id);
      if (currentCourseId === id) {
        setCurrentCourse(null, '');
        setCourseName('');
      }
      alert('削除しました');
    } catch (err) {
      alert(`削除エラー: ${err.message}`);
    }
  };

  const handleLoad = async (c) => {
    try {
      const loadedObjects = await loadCourseNodes(c.id);
      setObjects(loadedObjects, c.id, c.name);
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
        <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
          <button className="btn-save" onClick={handleSave} disabled={dbLoading || objects.length < 2} style={{ flex: 1 }}>
            {dbLoading ? '保存中...' : (currentCourseId ? '💾 上書き保存' : '💾 保存')}
          </button>
          {currentCourseId && (
            <button className="btn-save" onClick={handleSaveAsNew} disabled={dbLoading || objects.length < 2} style={{ flex: 1, background: '#4f46e5' }}>
              🆕 新規保存
            </button>
          )}
        </div>
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
              <div>
                <button className="btn-load" onClick={() => handleLoad(c)} style={{ marginRight: '5px' }}>開く</button>
                <button className="btn-load" onClick={(e) => handleDelete(e, c.id)} style={{ background: '#ef4444' }}>削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
