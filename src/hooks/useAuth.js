import { useState, useEffect, useCallback } from 'react';
import { getSession, setSession, clearSession, isAuthenticated, CREDENTIALS } from '../utils/storage';

export const useAuth = () => {
  const [user, setUser] = useState(() => getSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    // Simulate async auth
    await new Promise(r => setTimeout(r, 800));
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      const userData = { username, loggedAt: new Date().toISOString() };
      setSession(userData);
      setUser(userData);
      setLoading(false);
      return true;
    }
    setError('Invalid username or password');
    setLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return { user, loading, error, login, logout, isAuthenticated: !!user };
};
