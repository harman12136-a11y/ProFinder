export function validateIndianPhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const patterns = [
    /^(\+91|91)?[6-9]\d{9}$/,
    /^[6-9]\d{9}$/,
  ];
  return patterns.some((p) => p.test(cleaned));
}

export function formatIndianPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) {
    const num = digits.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username.trim());
}

export function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

/** Internal auth email for Supabase — not shown to users */
export function usernameToAuthEmail(username) {
  return `${normalizeUsername(username)}@profinder.auth`;
}

export function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function validateUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
