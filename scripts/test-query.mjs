/**
 * scripts/test-query.mjs
 *
 * Test the exact Supabase query used in api/todos/index.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = resolve(__dirname, '../.env.local');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Connecting to Supabase...');
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Executing exact query...');
  const start = Date.now();
  const { data, error, count } = await supabase
    .from('todos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19);

  console.log(`Query finished in ${Date.now() - start}ms`);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
    console.log('Count:', count);
  }
}

main().catch(console.error);
