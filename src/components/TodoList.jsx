/**
 * src/components/TodoList.jsx
 *
 * Hiển thị toàn bộ danh sách todos.
 * Quản lý 3 trạng thái: loading, error, danh sách.
 *
 * Props nhận từ App.jsx (dữ liệu được nâng lên để chia sẻ với TodoForm):
 *   todos    {Todo[]}   — danh sách hiện tại
 *   total    {number}   — tổng số record
 *   loading  {boolean}
 *   error    {string|null}
 *   onRetry         {Function} — gọi lại khi bấm nút Thử lại
 *   onUpdate        {Function} — (id, payload) => Promise
 *   onDelete        {Function} — (id) => Promise
 *   hasActiveFilters{boolean}  — true nếu đang lọc/tìm kiếm, ảnh hưởng empty state message
 */

import TodoItem from './TodoItem.jsx';
import './TodoList.css';

/* ------------------------------------------------------------------ */
/* Sub-components: Loading skeleton                                     */
/* ------------------------------------------------------------------ */
function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__badge skeleton-pulse" />
      <div className="skeleton-card__title skeleton-pulse" />
      <div className="skeleton-card__desc skeleton-pulse" />
      <div className="skeleton-card__desc skeleton-pulse" style={{ width: '60%' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components: Error state                                          */
/* ------------------------------------------------------------------ */
function ErrorState({ message, onRetry }) {
  return (
    <div className="todo-list__error" role="alert">
      <span className="todo-list__error-icon">⚠️</span>
      <p className="todo-list__error-message">{message}</p>
      <button
        id="btn-retry-fetch"
        className="todo-list__retry-btn"
        onClick={onRetry}
      >
        Thử lại
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components: Empty state                                          */
/* ------------------------------------------------------------------ */
function EmptyState({ hasActiveFilters }) {
  return (
    <div className="todo-list__empty">
      <span className="todo-list__empty-icon">
        {hasActiveFilters ? '🔍' : '📋'}
      </span>
      <p>
        {hasActiveFilters
          ? 'Không tìm thấy công việc nào phù hợp.'
          : 'Chưa có công việc nào. Thêm công việc đầu tiên!'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
export default function TodoList({
  todos,
  total,
  loading,
  error,
  onRetry,
  onUpdate,
  onDelete,
  hasActiveFilters,
  page,
  limit,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / limit);

  // Tạo mảng danh sách trang
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <section className="todo-list" aria-label="Danh sách công việc">
      {/* Header */}
      <header className="todo-list__header">
        <h1 className="todo-list__title">Công việc của tôi</h1>
        {!loading && !error && (
          <span className="todo-list__count">
            {total} công việc
          </span>
        )}
      </header>

      {/* Loading state — skeleton cards */}
      {loading && (
        <div className="todo-list__grid" aria-busy="true" aria-label="Đang tải...">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <ErrorState message={error} onRetry={onRetry} />
      )}

      {/* Empty state */}
      {!loading && !error && todos.length === 0 && <EmptyState hasActiveFilters={hasActiveFilters} />}

      {/* Danh sách todos */}
      {!loading && !error && todos.length > 0 && (
        <ul className="todo-list__grid" role="list">
          {todos.map((todo) => (
            <li key={todo.id} role="listitem">
              <TodoItem todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}

      {/* Phân trang */}
      {!loading && !error && totalPages > 1 && (
        <nav className="todo-list__pagination" aria-label="Phân trang danh sách công việc">
          <button
            className="todo-list__page-btn todo-list__page-btn--nav"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Trang trước"
          >
            ‹
          </button>
          
          {pageNumbers.map((num) => (
            <button
              key={num}
              className={`todo-list__page-btn ${page === num ? 'todo-list__page-btn--active' : ''}`}
              onClick={() => onPageChange(num)}
              aria-label={`Trang ${num}`}
              aria-current={page === num ? 'page' : undefined}
            >
              {num}
            </button>
          ))}

          <button
            className="todo-list__page-btn todo-list__page-btn--nav"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Trang sau"
          >
            ›
          </button>
        </nav>
      )}
    </section>
  );
}
