import { useState, useEffect } from 'react';
import { useTodos } from './hooks/useTodos.js';
import FilterBar from './components/FilterBar.jsx';
import TodoForm from './components/TodoForm.jsx';
import TodoList from './components/TodoList.jsx';
import './App.css';

const DEBOUNCE_MS = 300;

export default function App() {
  const { todos, total, loading, error, fetchTodos, addTodo, updateTodo, deleteTodo } = useTodos();

  // --- Filter state ---
  const [activeStatus, setActiveStatus] = useState('all');
  const [keyword, setKeyword]           = useState('');

  const hasActiveFilters = activeStatus !== 'all' || keyword.trim().length > 0;

  /**
   * Debounced effect: mỗi khi activeStatus hoặc keyword thay đổi,
   * chờ DEBOUNCE_MS rồi mới gọi fetchTodos với params tương ứng.
   *
   * - Status: gọi ngay (không cần debounce, user click 1 lần)
   * - Keyword: debounce 300ms để tránh gọi API liên tục khi gõ
   *
   * Cùng 1 useEffect đảm bảo không có 2 request đồng thời cho status + keyword.
   */
  useEffect(() => {
    const params = {};
    if (activeStatus !== 'all')    params.status  = activeStatus;
    if (keyword.trim().length > 0) params.keyword = keyword.trim();

    // status change không cần delay, keyword cần debounce
    const delay = keyword !== '' ? DEBOUNCE_MS : 0;

    const timer = setTimeout(() => {
      fetchTodos(params);
    }, delay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, keyword]); // fetchTodos stable (deps=[]) nên không cần thêm

  return (
    <div id="app">
      <main className="app-main">
        <TodoForm addTodo={addTodo} />

        <FilterBar
          activeStatus={activeStatus}
          keyword={keyword}
          onStatusChange={setActiveStatus}
          onKeywordChange={setKeyword}
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
        />
      </main>
    </div>
  );
}
