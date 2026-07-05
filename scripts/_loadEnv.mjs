/**
 * scripts/_loadEnv.mjs
 *
 * Tiện ích dùng chung: load biến môi trường từ file .env.local
 * cho các script phát triển trong thư mục /scripts.
 *
 * Cách dùng:
 *   import { loadEnvLocal } from './_loadEnv.mjs';
 *   loadEnvLocal();
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Đọc và parse file .env.local từ thư mục gốc của dự án,
 * sau đó nạp các biến vào process.env (không ghi đè biến đã tồn tại).
 *
 * @throws {Error} Nếu file .env.local không tìm thấy
 */
export function loadEnvLocal() {
  const envPath = resolve(__dirname, '../.env.local');
  const content = readFileSync(envPath, 'utf-8');

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
}
