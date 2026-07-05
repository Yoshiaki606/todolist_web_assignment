/**
 * src/components/TodoItem.jsx
 *
 * Hiển thị một công việc, hỗ trợ:
 *   - Xem (display mode)
 *   - Toggle trạng thái pending ↔ completed (optimistic, với rollback)
 *   - Sửa inline (edit mode) — không tải lại trang
 *   - Xóa có xác nhận (confirm modal đơn giản)
 *
 * Props:
 *   todo     {Object}   — object todo từ API
 *   onUpdate {Function} — (id, payload) => Promise<Todo>; throws nếu lỗi
 *   onDelete {Function} — (id) => Promise<void>;          throws nếu lỗi
 */

import { useState, useRef, useEffect } from 'react';
import './TodoItem.css';

const MAX_TITLE_LEN = 200; // khớp với server-side rule

/** Format ISO timestamp → ngày/giờ dễ đọc bằng tiếng Việt */
function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('vi-VN', {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/* Confirm modal đơn giản — không dùng window.confirm                  */
/* ------------------------------------------------------------------ */
function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="todo-item__confirm" role="dialog" aria-modal="true" aria-label="Xác nhận xóa">
      <p className="todo-item__confirm-text">Bạn chắc chắn muốn xóa công việc này?</p>
      <div className="todo-item__confirm-actions">
        <button
          id="btn-confirm-cancel"
          className="todo-item__btn todo-item__btn--ghost"
          onClick={onCancel}
          autoFocus
        >
          Hủy
        </button>
        <button
          id="btn-confirm-delete"
          className="todo-item__btn todo-item__btn--danger"
          onClick={onConfirm}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
export default function TodoItem({ todo, onUpdate, onDelete }) {
  const isCompleted = todo.status === 'completed';

  // --- UI state ---
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'confirm-delete'

  // --- Toggle state (tách riêng để không gây race condition với saving) ---
  const [toggling, setToggling] = useState(false);

  // --- Edit form state ---
  const [editTitle, setEditTitle]           = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description ?? '');
  const [saving, setSaving]                 = useState(false);
  const [itemError, setItemError]           = useState(null);

  // Auto-focus input khi vào edit mode
  const titleInputRef = useRef(null);
  useEffect(() => {
    if (mode === 'edit') titleInputRef.current?.focus();
  }, [mode]);

  // Sync edit fields khi todo prop thay đổi từ bên ngoài
  useEffect(() => {
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
  }, [todo.title, todo.description]);

  // --- Validation ---
  const trimmedTitle   = editTitle.trim();
  const isTitleValid   = trimmedTitle.length > 0;
  const isTitleTooLong = trimmedTitle.length > MAX_TITLE_LEN;
  const canSave        = isTitleValid && !isTitleTooLong && !saving;

  // --- Handlers ---

  /**
   * Toggle status: pending → completed hoặc completed → pending.
   * Dùng lại onUpdate (đã có optimistic update + rollback trong useTodos).
   * toggling=true trong suốt thời gian chờ API → không cho click thêm.
   */
  async function handleToggle() {
    if (toggling) return; // guard chống race condition
    setToggling(true);
    setItemError(null);

    const nextStatus = isCompleted ? 'pending' : 'completed';

    try {
      await onUpdate(todo.id, { status: nextStatus });
    } catch (err) {
      // onUpdate đã rollback optimistic state bên trong useTodos
      if (err.message?.includes('404') || err.message?.includes('Không tìm thấy')) {
        setItemError('Công việc này không còn tồn tại.');
      } else {
        setItemError(err.message || 'Cập nhật thất bại, vui lòng thử lại.');
      }
    } finally {
      setToggling(false);
    }
  }

  function handleEditClick() {
    setItemError(null);
    setMode('edit');
  }

  function handleCancelEdit() {
    // Reset về giá trị gốc
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
    setItemError(null);
    setMode('view');
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setItemError(null);

    try {
      await onUpdate(todo.id, {
        title:       trimmedTitle,
        description: editDescription.trim() || null,
      });
      setMode('view');
    } catch (err) {
      // 404: record không còn tồn tại
      if (err.message?.includes('404') || err.message?.includes('Không tìm thấy')) {
        setItemError('Công việc này không còn tồn tại. Tải lại trang để cập nhật danh sách.');
      } else {
        setItemError(err.message || 'Lưu thất bại, vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setSaving(true);
    setItemError(null);

    try {
      await onDelete(todo.id);
      // Không cần setMode — component sẽ unmount sau khi xóa thành công
    } catch (err) {
      setSaving(false);
      if (err.message?.includes('404') || err.message?.includes('Không tìm thấy')) {
        setItemError('Công việc này đã được xóa trước đó.');
      } else {
        setItemError(err.message || 'Xóa thất bại, vui lòng thử lại.');
      }
      setMode('view');
    }
  }

  // ----------------------------------------------------------------
  // Render: Edit mode
  // ----------------------------------------------------------------
  if (mode === 'edit') {
    return (
      <article className="todo-item todo-item--editing">
        {/* Inline error */}
        {itemError && (
          <div className="todo-item__inline-error" role="alert">⚠ {itemError}</div>
        )}

        {/* Title input */}
        <div className="todo-item__edit-field">
          <label htmlFor={`edit-title-${todo.id}`} className="todo-item__edit-label">
            Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id={`edit-title-${todo.id}`}
            ref={titleInputRef}
            type="text"
            className={`todo-item__edit-input ${!isTitleValid || isTitleTooLong ? 'todo-item__edit-input--error' : ''}`}
            value={editTitle}
            onChange={(e) => { setEditTitle(e.target.value); setItemError(null); }}
            disabled={saving}
            maxLength={MAX_TITLE_LEN + 10}
            autoComplete="off"
          />
          {isTitleTooLong && (
            <p className="todo-item__edit-hint todo-item__edit-hint--error">
              Tối đa {MAX_TITLE_LEN} ký tự ({trimmedTitle.length}/{MAX_TITLE_LEN})
            </p>
          )}
          {!isTitleTooLong && trimmedTitle.length > 0 && (
            <p className="todo-item__edit-hint">
              {trimmedTitle.length}/{MAX_TITLE_LEN}
            </p>
          )}
        </div>

        {/* Description textarea */}
        <div className="todo-item__edit-field">
          <label htmlFor={`edit-desc-${todo.id}`} className="todo-item__edit-label">
            Mô tả <span className="todo-item__edit-optional">(tùy chọn)</span>
          </label>
          <textarea
            id={`edit-desc-${todo.id}`}
            className="todo-item__edit-textarea"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={saving}
            rows={3}
          />
        </div>

        {/* Edit actions */}
        <div className="todo-item__edit-actions">
          <button
            id={`btn-save-${todo.id}`}
            className="todo-item__btn todo-item__btn--primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? (
              <><span className="todo-item__spinner" aria-hidden="true" /> Đang lưu...</>
            ) : 'Lưu'}
          </button>
          <button
            id={`btn-cancel-${todo.id}`}
            className="todo-item__btn todo-item__btn--ghost"
            onClick={handleCancelEdit}
            disabled={saving}
          >
            Hủy
          </button>
        </div>
      </article>
    );
  }

  // ----------------------------------------------------------------
  // Render: Confirm delete mode
  // ----------------------------------------------------------------
  if (mode === 'confirm-delete') {
    return (
      <article className={`todo-item ${isCompleted ? 'todo-item--completed' : ''} todo-item--confirming`}>
        {/* Vẫn hiển thị title để user biết mình đang xóa cái gì */}
        <h2 className="todo-item__title">{todo.title}</h2>
        <ConfirmDialog
          onConfirm={handleConfirmDelete}
          onCancel={() => setMode('view')}
        />
        {itemError && (
          <div className="todo-item__inline-error" role="alert">⚠ {itemError}</div>
        )}
      </article>
    );
  }

  // ----------------------------------------------------------------
  // Render: View mode (default)
  // ----------------------------------------------------------------
  return (
    <article className={`todo-item ${isCompleted ? 'todo-item--completed' : ''} ${toggling ? 'todo-item--toggling' : ''}`}>
      {/* Top row: checkbox toggle + badge + action buttons */}
      <div className="todo-item__top-row">

        {/* Checkbox toggle trạng thái */}
        <label
          className="todo-item__toggle"
          title={isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
          aria-label={isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
        >
          <input
            id={`toggle-${todo.id}`}
            type="checkbox"
            className="todo-item__toggle-input"
            checked={isCompleted}
            onChange={handleToggle}
            disabled={toggling}
            aria-busy={toggling}
          />
          <span
            className={`todo-item__toggle-custom ${toggling ? 'todo-item__toggle-custom--loading' : ''}`}
            aria-hidden="true"
          />
        </label>

        <span className={`todo-item__badge todo-item__badge--${todo.status}`}>
          {isCompleted ? '✓ Hoàn thành' : '○ Đang chờ'}
        </span>

        <div className="todo-item__actions">
          <button
            id={`btn-edit-${todo.id}`}
            className="todo-item__btn todo-item__btn--icon"
            onClick={handleEditClick}
            title="Sửa công việc"
            aria-label={`Sửa: ${todo.title}`}
            disabled={toggling}
          >
            ✎
          </button>
          <button
            id={`btn-delete-${todo.id}`}
            className="todo-item__btn todo-item__btn--icon todo-item__btn--icon-danger"
            onClick={() => { setItemError(null); setMode('confirm-delete'); }}
            title="Xóa công việc"
            aria-label={`Xóa: ${todo.title}`}
            disabled={toggling}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inline error (sau khi thao tác thất bại) */}
      {itemError && (
        <div className="todo-item__inline-error" role="alert">⚠ {itemError}</div>
      )}

      {/* Body */}
      <div className="todo-item__body">
        <h2 className="todo-item__title">{todo.title}</h2>
        {todo.description && (
          <p className="todo-item__description">{todo.description}</p>
        )}
      </div>

      {/* Footer */}
      <footer className="todo-item__footer">
        <time
          className="todo-item__date"
          dateTime={todo.created_at}
          title={`Cập nhật: ${formatDate(todo.updated_at)}`}
        >
          Tạo lúc {formatDate(todo.created_at)}
        </time>
      </footer>
    </article>
  );
}
