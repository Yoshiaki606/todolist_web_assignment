# TaskFlow — Ứng dụng Quản lý Công việc

Ứng dụng quản lý công việc hiện đại, trực quan, bảo mật cao. Được xây dựng trên nền tảng **React 19 (Vite) + Vercel Serverless Functions + Supabase (PostgreSQL)**.

🌐 **Link chạy thử trên Web (Production):** [https://todolist-web-assignment.vercel.app/](https://todolist-web-assignment.vercel.app/)

---

## 📖 Hướng dẫn Sử dụng nhanh

Khi truy cập vào đường link website, bạn có thể thực hiện ngay các thao tác sau:

1. **Thêm công việc:**
   - Nhập tiêu đề vào ô "Nhập tiêu đề công việc..." (tối đa 200 ký tự).
   - Nhập mô tả (không bắt buộc) và chọn **Hạn hoàn thành (Due Date)** nếu muốn.
   - Bấm nút **Thêm công việc** hoặc nhấn `Enter`.
2. **Xem và Lọc danh sách:**
   - Lọc nhanh theo trạng thái: **Tất cả**, **Đang làm** (Pending), hoặc **Đã xong** (Completed).
   - Tìm kiếm thời gian thực (Real-time Search) bằng cách gõ từ khóa vào ô tìm kiếm.
   - Sắp xếp linh hoạt theo: **Ngày tạo**, **Tên công việc**, hoặc **Hạn hoàn thành** (tăng dần/giảm dần).
3. **Phân trang:**
   - Mỗi trang hiển thị tối đa **3 công việc** để tối ưu hóa không gian. 
   - Sử dụng thanh phân trang thu gọn ở cuối danh sách để chuyển qua lại giữa các trang.
4. **Cập nhật & Xóa:**
   - Tích chọn vào hình tròn trước mỗi công việc để chuyển đổi nhanh trạng thái Đang làm ↔ Đã hoàn thành.
   - Nhấp vào nút sửa (biểu tượng bút chì) trên mỗi Task Card để sửa trực tiếp tiêu đề, mô tả hoặc hạn hoàn thành.
   - Bấm nút xóa (biểu tượng thùng rác) và xác nhận để xóa công việc khỏi danh sách.

---

## 🐳 Hướng dẫn Cài đặt & Chạy trên máy Local

Để chạy dự án trên máy cá nhân của bạn, vui lòng làm theo các bước dưới đây:

### Yêu cầu hệ thống
- **Node.js** >= 18
- Tài khoản [Supabase](https://supabase.com) (để tạo cơ sở dữ liệu Postgres miễn phí)

### Bước 1: Nhân bản (Clone) Dự án
Mở Terminal và chạy lệnh:
```bash
git clone https://github.com/Yoshiaki606/todolist_web_assignment.git
cd todolist_web_assignment/my-todo-app
```

### Bước 2: Thiết lập Biến môi trường
1. Sao chép tệp cấu hình mẫu:
   ```bash
   cp .env.example .env.local
   ```
2. Mở file `.env.local` vừa tạo và điền các khóa kết nối Supabase của bạn:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
   > ⚠️ **Lưu ý bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` là khóa quản trị tối cao của cơ sở dữ liệu. Nó được bảo mật tuyệt đối ở phía Server và không bao giờ bị lộ ra ngoài trình duyệt của người dùng.

---

### Bước 3: Lựa chọn Cách khởi chạy

#### Cách 1: Chạy trực tiếp bằng Node.js & Vercel CLI (Khuyên dùng khi phát triển)
1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Khởi chạy môi trường local (chạy song song cả Frontend React và Backend Serverless API):
   ```bash
   npx vercel dev
   ```
   *Ứng dụng sẽ hoạt động tại địa chỉ: **http://localhost:3000***

#### Cách 2: Khởi chạy bằng Docker (Standalone Express Server)
Dự án đã được cấu hình Dockerfile tối ưu (Multi-stage build) và tích hợp sẵn server Express standalone (`server.js` đóng vai trò là gateway chạy Serverless Functions).

1. Build Docker image:
   ```bash
   docker build -t taskflow .
   ```
2. Chạy Docker container (nạp trực tiếp cấu hình bảo mật từ tệp `.env.local` ở máy bạn):
   ```bash
   docker run -d -p 3000:3000 --env-file .env.local --name taskflow-app taskflow
   ```
   *Truy cập ứng dụng ngay tại: **http://localhost:3000***

---

## 🏗️ Cấu trúc Thư mục Dự án

```
my-todo-app/
├── src/                    # Mã nguồn Frontend (React)
│   ├── assets/             # Hình ảnh, icons
│   ├── components/         # Các thành phần giao diện
│   │   ├── ConfirmDialog.jsx
│   │   ├── FilterBar.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskForm.jsx
│   │   └── TaskList.jsx
│   ├── hooks/
│   │   └── useTasks.js     # Hook tùy chỉnh quản lý state & CRUD gọi API
│   ├── App.jsx             # Component gốc lắp ráp ứng dụng
│   └── main.jsx
├── api/                    # Mã nguồn Backend (Vercel Serverless Functions)
│   ├── _helpers.js         # Các hàm tiện ích gửi JSON dùng chung
│   ├── _supabase.js        # Khởi tạo Supabase client an toàn, làm sạch key
│   ├── _validators.js      # Kiểm tra tính hợp lệ của dữ liệu đầu vào
│   └── todos/
│       ├── index.js        # GET /api/todos (danh sách) & POST /api/todos (tạo)
│       └── [id].js         # PUT/PATCH (sửa) & DELETE (xóa) theo ID
├── supabase/               # Cấu trúc cơ sở dữ liệu SQL
│   └── schema.sql
├── server.js               # Máy chủ Express giả lập gateway cho Docker/Standalone
├── Dockerfile              # Cấu hình đóng gói Docker
├── .dockerignore           # Loại bỏ tệp rác khi build Docker
├── .env.example            # Mẫu cấu hình môi trường
├── package.json
└── vercel.json             # Cấu hình định tuyến của Vercel
```

---

## 🔗 Luồng Kiến trúc & Xử lý Dữ liệu

```
  [Trình duyệt của Người dùng (React)]
                 │
                 │  Gửi yêu cầu HTTP (Ví dụ: GET /api/todos)
                 ▼
     [Vercel Serverless / Express]
                 │
                 ├─► 1. Làm sạch & kiểm tra đầu vào (Validators)
                 ├─► 2. Kiểm tra & chuẩn hóa biến môi trường (Sanitizer)
                 │
                 ▼  Sử dụng service_role key kết nối bảo mật
        [Supabase Database]
```

### Điểm nổi bật về kiến trúc:
* **Không lưu thông tin nhạy cảm ở client:** Frontend không hề chứa Supabase keys, ngăn ngừa hoàn toàn nguy cơ tấn công chiếm quyền quản trị DB.
* **Xử lý bất đồng bộ mượt mà (Optimistic UI):** Khi cập nhật trạng thái hoặc xóa công việc, UI sẽ thay đổi ngay lập tức để mang lại trải nghiệm nhanh chóng, đồng thời gửi yêu cầu ngầm đến server. Nếu có lỗi phát sinh, UI sẽ tự động rollback về trạng thái cũ và hiển thị thông báo lỗi.
* **Tự động chuẩn hóa Key:** Server có bộ lọc giúp tự động làm sạch các khóa cấu hình (như loại bỏ dấu nháy thừa `""` hoặc các chú thích copy nhầm), đảm bảo hệ thống luôn kết nối ổn định.

---

## 🛠️ Công nghệ Sử dụng

* **Frontend:** React 19, Vite 8, Vanilla CSS (Glassmorphism UI, Dark Mode).
* **Backend:** Node.js (Vercel Serverless Functions API), Express 5 (dành cho Docker).
* **Database:** Supabase (PostgreSQL 15), pg (node-postgres).
* **Tooling:** Linter siêu tốc Oxlint.
