import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envText = readFileSync(resolve(root, '.env'), 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter(Boolean).map((line) => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1)];
  }),
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function probe(name, path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
  return { name, status: res.status, ok: res.ok, body };
}

const tables = [
  'profiles',
  'software_listings',
  'jobs',
  'services',
];

const results = await Promise.all(
  tables.map((t) => probe(t, `${t}?select=*&limit=3`)),
);

for (const r of results) {
  const count = Array.isArray(r.body) ? r.body.length : 'n/a';
  console.log(`${r.name}: HTTP ${r.status}, rows=${count}`);
  if (!r.ok) console.log('  error:', JSON.stringify(r.body));
}
