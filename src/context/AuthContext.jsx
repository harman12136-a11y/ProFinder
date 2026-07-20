import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getUsers, saveUsers, getCurrentUser, setCurrentUser } from '../utils/storage';
import {
  validateUsername,
  validateIndianPhone,
  normalizeUsername,
  usernameToAuthEmail,
} from '../utils/validation';
import {
  fetchProfile,
  upsertProfile,
  updateProfile,
  updateLastLogin,
  isUsernameTaken,
  profileToUser,
  userToProfileRow,
} from '../utils/supabaseProfiles';

const AuthContext = createContext(null);

export { AuthContext };

function syncUserToLocalCache(safeUser) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === safeUser.id);
  const entry = { ...safeUser, password: users[idx]?.password || '' };
  if (idx >= 0) users[idx] = entry;
  else users.push(entry);
  saveUsers(users);
}

function localLogin(username, password) {
  const users = getUsers();
  const normalized = normalizeUsername(username);
  const found = users.find(
    (u) => (u.username === normalized || u.email === normalized) && u.password === password
  );
  if (!found) throw new Error('Invalid username or password');
  const { password: _, ...safeUser } = found;
  return safeUser;
}

function isLocalUsernameTaken(username) {
  const normalized = normalizeUsername(username);
  return getUsers().some((u) => u.username === normalized);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((safeUser) => {
    setUser(safeUser);
    setCurrentUser(safeUser);
    syncUserToLocalCache(safeUser);
    if (isSupabaseConfigured()) {
      window.dispatchEvent(new Event('profinder-refresh'));
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const saved = getCurrentUser();
      if (saved) setUser(saved);
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    const restoreSession = async (session) => {
      if (!session?.user || !mounted) return;
      try {
        const profile = await fetchProfile(session.user.id);
        if (profile) applyUser(profileToUser(profile));
      } catch {
        /* profile may not exist yet */
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      restoreSession(session).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) restoreSession(session);
      else if (mounted) {
        setUser(null);
        setCurrentUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyUser]);

  const login = async (username, password) => {
    if (!isSupabaseConfigured()) {
      const safeUser = localLogin(username, password);
      applyUser(safeUser);
      return safeUser;
    }

    const authEmail = usernameToAuthEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    if (error) {
      throw new Error(error.message === 'Invalid login credentials'
        ? 'Invalid username or password'
        : error.message);
    }

    let profile = await fetchProfile(data.user.id);
    if (!profile) {
      await upsertProfile(userToProfileRow({
        id: data.user.id,
        username: normalizeUsername(username),
        name: data.user.user_metadata?.name || '',
        email: authEmail,
      }));
      profile = await fetchProfile(data.user.id);
    }

    await updateLastLogin(data.user.id);
    const safeUser = profileToUser({ ...profile, last_login_at: new Date().toISOString() });
    applyUser(safeUser);
    return safeUser;
  };

  const signup = async ({
    name, username, phone, password, dob, survey, avatar, bio, skills, portfolio,
  }) => {
    if (!name.trim()) throw new Error('Name is required');
    if (!validateUsername(username)) {
      throw new Error('Username must be 3–20 characters (letters, numbers, underscore only)');
    }
    if (!validateIndianPhone(phone)) throw new Error('Please enter a valid Indian phone number');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const normalizedUsername = normalizeUsername(username);
    const authEmail = usernameToAuthEmail(normalizedUsername);

    if (!isSupabaseConfigured()) {
      if (isLocalUsernameTaken(normalizedUsername)) {
        throw new Error('This username is already taken');
      }

      const newUser = {
        id: crypto.randomUUID(),
        username: normalizedUsername,
        name: name.trim(),
        email: authEmail,
        phone,
        password,
        dob: dob || '',
        survey: survey || null,
        avatar: avatar || '',
        bio: bio || '',
        skills: Array.isArray(skills) ? skills : [],
        portfolio: Array.isArray(portfolio) ? portfolio : [],
        provider: 'email',
        verified: { email: false, phone: false, github: false },
        createdAt: new Date().toISOString(),
      };

      const users = getUsers();
      users.push(newUser);
      saveUsers(users);
      const { password: _, ...safeUser } = newUser;
      applyUser(safeUser);
      return safeUser;
    }

    if (await isUsernameTaken(normalizedUsername)) {
      throw new Error('This username is already taken');
    }

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        data: { name: name.trim(), username: normalizedUsername },
      },
    });
    if (error) throw new Error(error.message);

    const profileRow = userToProfileRow({
      id: data.user.id,
      username: normalizedUsername,
      name: name.trim(),
      email: authEmail,
      phone,
      dob,
      survey,
      avatar,
      bio,
      skills,
      portfolio,
      provider: 'email',
      verified: { email: false, phone: false, github: false },
      createdAt: new Date().toISOString(),
    });
    await upsertProfile(profileRow);

    if (!data.session) {
      throw new Error('Account created! You can now log in with your username.');
    }

    await updateLastLogin(data.user.id);
    const safeUser = profileToUser({ ...profileRow, last_login_at: new Date().toISOString() });
    applyUser(safeUser);
    return safeUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setCurrentUser(null);
  };

  const updateUser = async (updates) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    const merged = { ...(idx >= 0 ? users[idx] : user), ...updates };

    if (idx >= 0) users[idx] = merged;
    else users.push({ ...merged, password: '' });

    saveUsers(users);
    const { password: _, ...safeUser } = merged;
    setUser(safeUser);
    setCurrentUser(safeUser);

    if (isSupabaseConfigured()) {
      await updateProfile(user.id, updates);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
