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

  return (
    <div id="app">
      <div className="background-glows">
        <div className="glow-circle glow-circle-1"></div>
        <div className="glow-circle glow-circle-2"></div>
      </div>
      
      <main className="app-main">
        <header className="app-header">
          <span className="app-logo">⚡ TaskFlow</span>
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
    </div>
  );
}
