import { createContext, useState, useEffect } from 'react';
import { getUsers, saveUsers, getCurrentUser, setCurrentUser } from '../utils/storage';
import { validateEmail, validateIndianPhone } from '../utils/validation';

const AuthContext = createContext(null);

export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    setCurrentUser(safeUser);
    return safeUser;
  };

  const signup = ({ name, email, phone, password }) => {
    if (!name.trim()) throw new Error('Name is required');
    if (!validateEmail(email)) throw new Error('Please enter a valid email');
    if (!validateIndianPhone(phone)) throw new Error('Please enter a valid Indian phone number');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const users = getUsers();
    if (users.find((u) => u.email === email)) throw new Error('An account with this email already exists');

    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password,
      provider: 'email',
      verified: { email: false, phone: false, github: false },
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    setCurrentUser(safeUser);
    return safeUser;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  const updateUser = (updates) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      saveUsers(users);
      const { password: _, ...safeUser } = users[idx];
      setUser(safeUser);
      setCurrentUser(safeUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
