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
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

const domains = [
  'profinder.auth',
  'profind.app',
  'users.profind.app',
  'profind.local',
  'example.com',
  'mail.app',
];

for (const domain of domains) {
  const email = `testuser_${Date.now()}@${domain}`;
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password: 'TestPass123!', data: { username: 'testuser' } }),
  });
  const body = await res.json();
  const msg = body.error || body.msg || (res.ok ? 'OK' : res.status);
  console.log(`${domain}: ${res.status} - ${msg}`);
}
