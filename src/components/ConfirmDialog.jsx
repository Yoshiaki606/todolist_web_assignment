/**
 * src/components/ConfirmDialog.jsx
 *
 * Dialog xác nhận xóa — không dùng window.confirm.
 *
 * Props:
 *   onConfirm {Function} — callback khi bấm "Xóa"
 *   onCancel  {Function} — callback khi bấm "Hủy"
 */

// Dùng chung CSS của TaskCard vì các class confirm đã được định nghĩa ở đó
import './TaskCard.css';

export default function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="todo-item__confirm" role="dialog" aria-modal="true" aria-label="Xác nhận xóa">
      <p className="todo-item__confirm-text">Bạn chắc chắn muốn xóa công việc này?</p>
      <div className="todo-item__confirm-actions">
        <button
          id="btn-confirm-cancel"
          className="todo-item__btn todo-item__btn--ghost"
          onClick={onCancel}
          autoFocus
          type="button"
        >
          Hủy
        </button>
        <button
          id="btn-confirm-delete"
          className="todo-item__btn todo-item__btn--danger"
          onClick={onConfirm}
          type="button"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
