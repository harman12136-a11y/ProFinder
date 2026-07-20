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
const testUser = `diag_${Date.now()}`;
const email = `${testUser}@profind.app`;
const password = 'DiagTest123!';

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

const signupRes = await fetch(`${url}/auth/v1/signup`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    email,
    password,
    data: { name: 'Diag User', username: testUser },
  }),
});

const signup = await signupRes.json();
console.log('SIGNUP_STATUS', signupRes.status);
console.log('HAS_SESSION', Boolean(signup.access_token));
console.log('USER_ID', signup.user?.id || signup.id || 'none');
if (signup.error || signup.msg) console.log('SIGNUP_MSG', signup.error || signup.msg);

if (signup.access_token) {
  const profileRes = await fetch(
    `${url}/rest/v1/profiles?select=id,username&id=eq.${signup.user.id}`,
    { headers: { ...headers, Authorization: `Bearer ${signup.access_token}` } },
  );
  const profiles = await profileRes.json();
  console.log('PROFILE_AFTER_SIGNUP', profileRes.status, Array.isArray(profiles) ? profiles.length : profiles);
}
