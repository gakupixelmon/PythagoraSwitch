import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDbStore } from '../../store/dbStore';
import { useCourseStore } from '../../store/courseStore';

export default function AuthUI() {
  const { user, profile, loading: authLoading, signInWithGitHub, signInWithGoogle, signOut } = useAuthStore();
  const { courses, fetchCourses, saveCourse, loadCourseNodes, loading: dbLoading, error: dbError } = useDbStore();
  const { nodes, reset: resetCourse } = useCourseStore();
  
  const [courseName, setCourseName] = useState('');
  const [showList, setShowList] = useState(false);

  // ユーザー変更時にコース一覧を取得
  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  if (authLoading) return <div className="auth-panel">読み込み中...</div>;

  // 未ログイン時：ログインボタン表示
  if (!user) {
    return (
      <div className="auth-panel">
        <div className="auth-title">ログインしてコースを保存</div>
        <button className="btn-auth github" onClick={signInWithGitHub}>GitHub でログイン</button>
        <button className="btn-auth google" onClick={signInWithGoogle}>Google でログイン</button>
      </div>
    );
  }

  // ログイン済み時：ユーザー情報と保存/読み込みUI
  const handleSave = async () => {
    if (!courseName) return alert('コース名を入力してください');
    try {
      await saveCourse(courseName, nodes);
      setCourseName('');
      alert('保存しました！');
    } catch (e) {
      alert(`保存エラー: ${e.message}`);
    }
  };

  const handleLoad = async (courseId) => {
    try {
      const loadedNodes = await loadCourseNodes(courseId);
      useCourseStore.setState({ nodes: loadedNodes, selectedId: null });
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
        <button className="btn-save" onClick={handleSave} disabled={dbLoading || nodes.length < 2}>
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
