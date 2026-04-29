import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then((res) => {
      setUser(res.data?.user || null);
      setLoading(false);
    });
  }, []);

  const login = async (email: string, name?: string) => {
    const res = await api.auth.login(email, name);
    if (res.data?.user) {
      setUser(res.data.user);
      return {};
    }
    return { error: res.error || 'Login failed' };
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}