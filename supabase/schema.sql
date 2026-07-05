-- ============================================================
-- Bảng: todos
-- Mô tả: Lưu trữ danh sách công việc của người dùng
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS todos (
  -- Khóa chính: UUID tự động sinh
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tiêu đề công việc (bắt buộc)
  title         TEXT        NOT NULL,

  -- Mô tả chi tiết (tùy chọn)
  description   TEXT,

  -- Trạng thái: chỉ cho phép 'pending' hoặc 'completed'
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed')),

  -- Timestamp: tự động ghi nhận thời điểm tạo và cập nhật
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Trigger: tự động cập nhật updated_at khi row bị UPDATE
-- ============================================================

-- Hàm helper dùng chung cho trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger vào bảng todos
CREATE OR REPLACE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- Index: tăng tốc truy vấn lọc theo status và sắp xếp theo thời gian
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_todos_status     ON todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos (created_at DESC);
