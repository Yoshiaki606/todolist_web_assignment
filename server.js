/**
 * server.js
 *
 * Express server dùng để chạy dự án TaskFlow trong môi trường Docker / Production độc lập.
 * Serve các file tĩnh của frontend (thư mục /dist) và chạy các API routes tương thích Vercel.
 *
 * Chạy: node server.js
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// API Handlers (Vercel Serverless Function format)
import todosHandler from './api/todos/index.js';
import todoIdHandler from './api/todos/[id].js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Nạp biến môi trường cục bộ nếu có (trong Docker Production, biến môi trường được truyền qua OS)
function tryLoadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    try {
      const envPath = path.resolve(__dirname, file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) continue;
          const key   = trimmed.slice(0, eqIdx).trim();
          let value   = trimmed.slice(eqIdx + 1).trim();

          // Loại bỏ dấu nháy kép hoặc nháy đơn bọc ngoài giá trị nếu có
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
        console.log(`ℹ️ Đã nạp biến môi trường từ: ${file}`);
        break; // Dừng lại sau khi nạp thành công file đầu tiên tìm thấy
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi khi đọc file môi trường ${file}:`, err.message);
    }
  }
}

tryLoadEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware phân tích JSON body cho API
app.use(express.json());

/**
 * Adapter chuyển đổi Express req/res sang định dạng tương thích với Vercel Serverless Function handler.
 * Map req.params (ví dụ: id) vào req.query để API handler đọc đúng req.query.id.
 *
 * @param {Function} vercelHandler
 * @returns {express.RequestHandler}
 */
function adaptHandler(vercelHandler) {
  return async (req, res) => {
    // Inject params của Express (:id) vào req.query của Vercel
    req.query = { ...req.query, ...req.params };

    try {
      await vercelHandler(req, res);
    } catch (err) {
      console.error('💥 API handler error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Lỗi hệ thống nội bộ.' });
      }
    }
  };
}

// 1. Cấu hình các API routes
app.all('/api/todos', adaptHandler(todosHandler));
app.all('/api/todos/:id', adaptHandler(todoIdHandler));

// 2. Serve static files từ thư mục /dist sau khi Vite build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// 3. Fallback cho SPA Client Routing (React Router hoặc fallback)
app.get('/*splat', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(
      '<h3>Không tìm thấy các file tĩnh của Frontend.</h3>' +
      '<p>Vui lòng chạy lệnh <code>npm run build</code> trước khi khởi chạy server.</p>'
    );
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow running at http://localhost:${PORT}`);
});
