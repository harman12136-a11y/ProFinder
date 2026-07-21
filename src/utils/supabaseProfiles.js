import { supabase } from '../lib/supabase';
import { normalizeUsername } from './validation';

function isMissingTableError(error) {
  const msg = error?.message || '';
  return msg.includes('Could not find the table') || msg.includes('does not exist');
}

function formatDbError(error) {
  const msg = error?.message || 'Database error';
  if (msg.includes('Could not find the table') && msg.includes('deleted_users')) {
    return 'Missing deleted_users table. Open Supabase → SQL Editor → run supabase/deleted_users.sql';
  }
  if (isMissingTableError(error)) {
    return 'Database setup incomplete. In Supabase SQL Editor, run supabase/fix_database.sql, then try again.';
  }
  return msg;
}

export function profileToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username || '',
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    dob: row.dob || '',
    survey: row.survey || null,
    avatar: row.avatar || '',
    bio: row.bio || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    portfolio: Array.isArray(row.portfolio) ? row.portfolio : [],
    provider: row.provider || 'email',
    verified: row.verified || { email: false, phone: false, github: false },
    githubUsername: row.github_username || '',
    subscriptionExpiresAt: row.subscription_expires_at || null,
    createdAt: row.created_at || null,
    lastLoginAt: row.last_login_at || null,
  };
}

export function userToProfileRow(user) {
  return {
    id: user.id,
    username: user.username ? normalizeUsername(user.username) : undefined,
    name: user.name,
    email: user.email?.toLowerCase() || '',
    phone: user.phone || '',
    dob: user.dob || '',
    survey: user.survey || null,
    avatar: user.avatar || '',
    bio: user.bio || '',
    skills: user.skills || [],
    portfolio: user.portfolio || [],
    provider: user.provider || 'email',
    verified: user.verified || { email: false, phone: false, github: false },
    github_username: user.githubUsername || null,
    subscription_expires_at: user.subscriptionExpiresAt || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(formatDbError(error));
  return data;
}

export async function isUsernameTaken(username) {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();

  if (error) throw new Error(formatDbError(error));
  if (data) return true;

  const { data: deleted, error: deletedError } = await supabase
    .from('deleted_users')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();

  if (deletedError) {
    if (isMissingTableError(deletedError)) return Boolean(data);
    throw new Error(formatDbError(deletedError));
  }
  return Boolean(deleted);
}

export async function isUserDeleted(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('deleted_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return false;
    throw new Error(formatDbError(error));
  }
  return Boolean(data);
}

export async function markUserDeleted(userId, username) {
  const { error } = await supabase.from('deleted_users').upsert({
    id: userId,
    username: username ? normalizeUsername(username) : null,
    deleted_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(formatDbError(error));
    }
    throw new Error(formatDbError(error));
  }
}

export async function upsertProfile(row) {
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(formatDbError(error));
}

export async function updateProfile(userId, updates) {
  const row = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.username !== undefined) row.username = normalizeUsername(updates.username);
  if (updates.email !== undefined) row.email = updates.email.toLowerCase();
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.dob !== undefined) row.dob = updates.dob;
  if (updates.survey !== undefined) row.survey = updates.survey;
  if (updates.avatar !== undefined) row.avatar = updates.avatar;
  if (updates.bio !== undefined) row.bio = updates.bio;
  if (updates.skills !== undefined) row.skills = updates.skills;
  if (updates.portfolio !== undefined) row.portfolio = updates.portfolio;
  if (updates.provider !== undefined) row.provider = updates.provider;
  if (updates.verified !== undefined) row.verified = updates.verified;
  if (updates.githubUsername !== undefined) row.github_username = updates.githubUsername;
  if (updates.subscriptionExpiresAt !== undefined) {
    row.subscription_expires_at = updates.subscriptionExpiresAt;
  }

  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function updateLastLogin(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function deleteProfile(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw new Error(formatDbError(error));
}

/** Permanently removes the logged-in user from Supabase Auth (requires delete_own_account RPC). */
export async function deleteAuthUser() {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw new Error(formatDbError(error));
}
