import { useState, useEffect } from 'react';
import { useTodos } from './hooks/useTodos.js';
import FilterBar from './components/FilterBar.jsx';
import TodoForm from './components/TodoForm.jsx';
import TodoList from './components/TodoList.jsx';
import './App.css';

const DEBOUNCE_MS = 300;

export default function App() {
  const { todos, total, loading, error, fetchTodos, addTodo, updateTodo, deleteTodo } = useTodos();

  // --- Filter and Pagination state ---
  const [activeStatus, setActiveStatus] = useState('all');
  const [keyword, setKeyword]           = useState('');
  const [page, setPage]                 = useState(1);
  const [sortBy, setSortBy]             = useState('created_at');
  const [sortOrder, setSortOrder]       = useState('desc');
  const limit = 10;

  const hasActiveFilters = activeStatus !== 'all' || keyword.trim().length > 0;

  // Custom handlers to automatically reset page to 1
  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleKeywordChange = (kw) => {
    setKeyword(kw);
    setPage(1);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  /**
   * Debounced effect: mỗi khi activeStatus, keyword, page, limit, sortBy, hoặc sortOrder thay đổi,
   * chờ DEBOUNCE_MS rồi mới gọi fetchTodos với params tương ứng.
   */
  useEffect(() => {
    const params = { page, limit, sortBy, sortOrder };
    if (activeStatus !== 'all')    params.status  = activeStatus;
    if (keyword.trim().length > 0) params.keyword = keyword.trim();

    // status, page, sorting change không cần delay, keyword cần debounce
    const delay = keyword !== '' ? DEBOUNCE_MS : 0;

    const timer = setTimeout(() => {
      fetchTodos(params);
    }, delay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, keyword, page, limit, sortBy, sortOrder]);

  const completedCount = todos.filter(t => t.status === 'completed').length;
  const pageTotal = todos.length;
  const percent = pageTotal > 0 ? Math.round((completedCount / pageTotal) * 100) : 0;
  
  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div id="app">
      <div className="background-glows">
        <div className="glow-circle glow-circle-1"></div>
        <div className="glow-circle glow-circle-2"></div>
      </div>
      
      <main className="app-main">
        <header className="app-header">
          <div className="app-header__branding">
            <span className="app-logo">⚡ TaskFlow</span>
            <p className="app-header__tagline">Quản lý công việc hiệu quả và khoa học</p>
          </div>
          <div className="app-header__info">
            <time className="app-header__date">{todayStr}</time>
            {pageTotal > 0 && (
              <div className="app-header__stats">
                <span className="app-header__stats-text">Trang này: {percent}% hoàn thành ({completedCount}/{pageTotal})</span>
                <div className="app-header__progress-bar">
                  <div className="app-header__progress-fill" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            )}
          </div>
          <h1 className="app-title-hidden">Task Manager</h1>
        </header>

        <TodoForm addTodo={addTodo} />

        <FilterBar
          activeStatus={activeStatus}
          keyword={keyword}
          onStatusChange={handleStatusChange}
          onKeywordChange={handleKeywordChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          total={total}
          loading={loading}
        />

        <TodoList
          todos={todos}
          total={total}
          loading={loading}
          error={error}
          onRetry={fetchTodos}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          hasActiveFilters={hasActiveFilters}
          page={page}
          limit={limit}
          onPageChange={setPage}
        />
      </main>

      <footer className="app-footer">
        <div className="app-footer__content">
          <p className="app-footer__copyright">© 2026 TaskFlow. Thiết kế bởi Nhóm SRT.</p>
          <div className="app-footer__quote">
            <span className="quote-icon">“</span>
            <span className="quote-text">Kỷ luật là cầu nối giữa mục tiêu và thành tựu.</span>
          </div>
          <div className="app-footer__badges">
            <span className="footer-badge">React 19</span>
            <span className="footer-badge">Vite 8</span>
            <span className="footer-badge">Supabase</span>
            <span className="footer-badge">Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
