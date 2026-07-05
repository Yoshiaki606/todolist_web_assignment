/**
 * src/components/TaskForm.jsx
 *
 * Form tạo công việc mới.
 * Gọi addTodo() từ useTasks (trọng qua props từ App.jsx).
 *
 * Props:
 *   addTodo {Function} — (payload) => Promise<Task>; throws nếu lỗi
 */

import { useState } from 'react';
import './TaskForm.css';

const MAX_TITLE_LEN = 200; // khớp với rule validate phía server

export default function TodoForm({ addTodo }) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState(null);

  // Validation phía client: title không rỗng / không toàn khoảng trắng
  const isTitleValid = title.trim().length > 0;
  const isTitleTooLong = title.trim().length > MAX_TITLE_LEN;
  const canSubmit = isTitleValid && !isTitleTooLong && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();

    // Guard: không gọi API nếu client-side validation chưa pass
    if (!canSubmit) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await addTodo({
        title:       title.trim(),
        description: description.trim() || undefined,
        due_at:      dueAt || undefined,
      });

      // Thành công — reset form
      setTitle('');
      setDescription('');
      setDueAt('');
    } catch (err) {
      // Lỗi từ API (400 / 500) hoặc lỗi mạng
      setApiError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="todo-form"
      onSubmit={handleSubmit}
      aria-label="Thêm công việc mới"
      noValidate
    >
      <h2 className="todo-form__heading">Thêm công việc</h2>

      {/* Lỗi từ API — hiện inline, không dùng alert() */}
      {apiError && (
        <div className="todo-form__api-error" role="alert" aria-live="polite">
          <span className="todo-form__api-error-icon">⚠</span>
          {apiError}
        </div>
      )}

      {/* Field: Title */}
      <div className="todo-form__field">
        <label htmlFor="todo-title" className="todo-form__label">
          Tiêu đề <span className="todo-form__required" aria-label="bắt buộc">*</span>
        </label>
        <input
          id="todo-title"
          type="text"
          className={`todo-form__input ${
            title.length > 0 && !isTitleValid
              ? 'todo-form__input--error'
              : ''
          } ${isTitleTooLong ? 'todo-form__input--error' : ''}`}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (apiError) setApiError(null); // xóa lỗi cũ khi user bắt đầu gõ lại
          }}
          placeholder="Ví dụ: Mua sữa, Gọi điện cho khách hàng..."
          maxLength={MAX_TITLE_LEN + 10} // cho nhập quá để hiện lỗi, không hard-block
          disabled={submitting}
          aria-describedby={
            isTitleTooLong
              ? 'title-error-length'
              : title.length > 0 && !isTitleValid
              ? 'title-error-empty'
              : 'title-hint'
          }
          autoComplete="off"
        />

        {/* Inline validation messages */}
        {title.length > 0 && !isTitleValid && (
          <p id="title-error-empty" className="todo-form__field-error" role="alert">
            Tiêu đề không được để trống.
          </p>
        )}
        {isTitleTooLong && (
          <p id="title-error-length" className="todo-form__field-error" role="alert">
            Tiêu đề không được vượt quá {MAX_TITLE_LEN} ký tự
            ({title.trim().length}/{MAX_TITLE_LEN}).
          </p>
        )}
        {!isTitleTooLong && title.trim().length > 0 && (
          <p id="title-hint" className="todo-form__char-count">
            {title.trim().length}/{MAX_TITLE_LEN}
          </p>
        )}
      </div>

      {/* Field: Description */}
      <div className="todo-form__field">
        <label htmlFor="todo-description" className="todo-form__label">
          Mô tả <span className="todo-form__optional">(tùy chọn)</span>
        </label>
        <textarea
          id="todo-description"
          className="todo-form__textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ghi chú thêm về công việc này..."
          rows={3}
          disabled={submitting}
        />
      </div>

      {/* Field: Due Date */}
      <div className="todo-form__field">
        <label htmlFor="todo-due-at" className="todo-form__label">
          Hạn hoàn thành <span className="todo-form__optional">(tùy chọn)</span>
        </label>
        <input
          id="todo-due-at"
          type="datetime-local"
          className="todo-form__input"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={submitting}
        />
      </div>

      {/* Submit button */}
      <button
        id="btn-add-todo"
        type="submit"
        className="todo-form__submit"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
      >
        {submitting ? (
          <>
            <span className="todo-form__spinner" aria-hidden="true" />
            Đang lưu...
          </>
        ) : (
          <>
            <span aria-hidden="true">+</span>
            Thêm công việc
          </>
        )}
      </button>
    </form>
  );
}
