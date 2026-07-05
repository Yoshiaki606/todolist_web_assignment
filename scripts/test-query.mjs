/**
 * scripts/test-query.mjs
 *
 * Test the exact Supabase query used in api/todos/index.js
 * Chạy: node scripts/test-query.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal }  from './_loadEnv.mjs';

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
