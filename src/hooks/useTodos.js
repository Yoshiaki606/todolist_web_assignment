/**
 * src/hooks/useTodos.js
 *
 * Custom hook quản lý state và data-fetching cho danh sách todos.
 * Giao tiếp với GET, POST, PATCH, DELETE /api/todos.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {Object} Todo
 * @property {string}  id
 * @property {string}  title
 * @property {string|null} description
 * @property {'pending'|'completed'} status
 * @property {string}  created_at
 * @property {string}  updated_at
 */

/**
 * @typedef {Object} FetchParams
 * @property {string} [status]   - Lọc theo trạng thái ('pending' | 'completed')
 * @property {string} [keyword]  - Tìm kiếm theo title
 * @property {number} [page]     - Số trang (mặc định 1)
 * @property {number} [limit]    - Số item mỗi trang (mặc định 20)
 */

export function useTodos() {
  /** @type {[Todo[], React.Dispatch<React.SetStateAction<Todo[]>>]} */
  const [todos, setTodos]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /**
   * Giữ lại params của lần fetch gần nhất.
   * Đảm bảo addTodo() gọi fetchTodos() không args vẫn giữ đúng filter đang active.
   */
  const currentParamsRef = useRef({});

  /**
   * Gọi GET /api/todos với các tham số filter/phân trang tuỳ chọn.
   * Nếu không truyền params, dùng lại params của lần gọi trước (để giữ filter khi refresh).
   * @param {FetchParams} [params]
   */
  const fetchTodos = useCallback(async (params) => {
    // Nếu không truyền params mới, dùng lại params cuối cùng (ví dụ: sau addTodo)
    const resolvedParams = params !== undefined ? params : currentParamsRef.current;
    currentParamsRef.current = resolvedParams;

    setLoading(true);
    setError(null);

    try {
      // Lọc bỏ các key có giá trị rỗng/undefined trước khi build query string
      const cleanParams = Object.fromEntries(
        Object.entries(resolvedParams).filter(([, v]) => v !== undefined && v !== '' && v !== null)
      );
      const query = new URLSearchParams(cleanParams).toString();
      const url   = `/api/todos${query ? `?${query}` : ''}`;

      const response = await fetch(url);

      // Xử lý response không phải 2xx
      if (!response.ok) {
        let message = `Lỗi server: ${response.status}`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // body không phải JSON, giữ nguyên message mặc định
        }
        throw new Error(message);
      }

      const { data, total: responseTotal } = await response.json();
      setTodos(data ?? []);
      setTotal(responseTotal ?? 0);

    } catch (err) {
      // TypeError thường xảy ra khi mất kết nối mạng (fetch failed)
      if (err instanceof TypeError) {
        setError('Không thể kết nối tới server. Kiểm tra lại kết nối mạng.');
      } else {
        setError(err.message || 'Đã xảy ra lỗi không xác định.');
      }
      setTodos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []); // deps rỗng: fetchTodos tự stable, params được resolve qua ref

  // ---------------------------------------------------------------------------
  // [THÊM MỚI] addTodo — gọi POST /api/todos, throw nếu lỗi
  // ---------------------------------------------------------------------------

  /**
   * Tạo todo mới và refresh danh sách sau khi thành công.
   * Throws {Error} nếu API trả lỗi — để caller (TodoForm) bắt và hiển thị.
   *
   * @param {{ title: string, description?: string }} payload
   * @returns {Promise<Todo>} Todo vừa được tạo
   */
  const addTodo = useCallback(async ({ title, description }) => {
    const response = await fetch('/api/todos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, description }),
    });

    if (!response.ok) {
      let message = `Lỗi server: ${response.status}`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch {
        // body không phải JSON
      }
      throw new Error(message);
    }

    const newTodo = await response.json();

    // Refresh danh sách — không await để UI responsive hơn
    fetchTodos();

    return newTodo;
  }, [fetchTodos]);

  // ---------------------------------------------------------------------------
  // [THÊM MỚI] updateTodo — gọi PATCH /api/todos/:id
  // ---------------------------------------------------------------------------

  /**
   * Cập nhật một phần todo (title, description, hoặc status).
   * Cập nhật optimistic state ngay lập tức, rollback nếu API lỗi.
   * Throws {Error} nếu API trả lỗi — để TodoItem hiển thị inline.
   *
   * @param {string} id
   * @param {{ title?: string, description?: string, status?: string }} payload
   * @returns {Promise<Todo>} Todo sau khi cập nhật
   */
  const updateTodo = useCallback(async (id, payload) => {
    // Lưu lại state cũ để rollback nếu cần
    const previousTodos = todos;

    // Optimistic update: cập nhật UI ngay trước khi API phản hồi
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...payload } : t))
    );

    const response = await fetch(`/api/todos/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      // Rollback về state cũ
      setTodos(previousTodos);
      let message = `Lỗi server: ${response.status}`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch { /* ignore */ }
      throw new Error(message);
    }

    const updated = await response.json();

    // Sync lại với dữ liệu chính xác từ server (updated_at, etc.)
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
    );

    return updated;
  }, [todos]);

  // ---------------------------------------------------------------------------
  // [THÊM MỚI] deleteTodo — gọi DELETE /api/todos/:id
  // ---------------------------------------------------------------------------

  /**
   * Xóa todo khỏi danh sách.
   * Xóa khỏi local state ngay lập tức (optimistic), rollback nếu lỗi.
   * Throws {Error} nếu API trả lỗi — để TodoItem hiển thị inline.
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  const deleteTodo = useCallback(async (id) => {
    const previousTodos = todos;
    const previousTotal = total;

    // Optimistic: xóa khỏi UI ngay
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));

    const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      // Rollback
      setTodos(previousTodos);
      setTotal(previousTotal);
      let message = `Lỗi server: ${response.status}`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch { /* ignore */ }
      throw new Error(message);
    }
  }, [todos, total]);

  // Không có auto-fetch ở đây.
  // App.jsx kiểm soát hoàn toàn việc fetch qua filter useEffect.

  return { todos, total, loading, error, fetchTodos, addTodo, updateTodo, deleteTodo };
}
