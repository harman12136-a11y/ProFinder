import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getUsers, saveUsers, getCurrentUser, setCurrentUser } from '../utils/storage';
import { validateEmail, validateIndianPhone } from '../utils/validation';
import {
  fetchProfile,
  upsertProfile,
  updateProfile,
  updateLastLogin,
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

function localLogin(email, password) {
  const users = getUsers();
  const found = users.find((u) => u.email === email && u.password === password);
  if (!found) throw new Error('Invalid email or password');
  const { password: _, ...safeUser } = found;
  return safeUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((safeUser) => {
    setUser(safeUser);
    setCurrentUser(safeUser);
    syncUserToLocalCache(safeUser);
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

  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      const safeUser = localLogin(email, password);
      applyUser(safeUser);
      return safeUser;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    if (error) throw new Error(error.message === 'Invalid login credentials'
      ? 'Invalid email or password'
      : error.message);

    let profile = await fetchProfile(data.user.id);
    if (!profile) {
      await upsertProfile(userToProfileRow({
        id: data.user.id,
        name: data.user.user_metadata?.name || '',
        email: data.user.email,
      }));
      profile = await fetchProfile(data.user.id);
    }

    await updateLastLogin(data.user.id);
    const safeUser = profileToUser({ ...profile, last_login_at: new Date().toISOString() });
    applyUser(safeUser);
    return safeUser;
  };

  const signup = async ({
    name, email, phone, password, dob, survey, avatar, bio, skills, portfolio,
  }) => {
    if (!name.trim()) throw new Error('Name is required');
    if (!validateEmail(email)) throw new Error('Please enter a valid email');
    if (!validateIndianPhone(phone)) throw new Error('Please enter a valid Indian phone number');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    if (!isSupabaseConfigured()) {
      const users = getUsers();
      if (users.find((u) => u.email === email)) {
        throw new Error('An account with this email already exists');
      }

      const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.toLowerCase(),
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

      users.push(newUser);
      saveUsers(users);
      const { password: _, ...safeUser } = newUser;
      applyUser(safeUser);
      return safeUser;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) throw new Error(error.message);

    const profileRow = userToProfileRow({
      id: data.user.id,
      name: name.trim(),
      email: email.toLowerCase(),
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
      throw new Error('Account created! Check your email to confirm, then log in.');
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
    if (idx === -1) return;

    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    const { password: _, ...safeUser } = users[idx];
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
