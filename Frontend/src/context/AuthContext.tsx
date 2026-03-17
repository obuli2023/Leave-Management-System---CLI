import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  userId: string | null;
  name: string | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (data: AuthState) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    name: localStorage.getItem('name'),
    role: localStorage.getItem('role')
  });

  const login = (data: AuthState) => {
    localStorage.setItem('token', data.token!);
    localStorage.setItem('userId', data.userId!);
    localStorage.setItem('name', data.name!);
    localStorage.setItem('role', data.role!);
    setAuthState(data);
  };

  const logout = () => {
    localStorage.clear();
    setAuthState({ token: null, userId: null, name: null, role: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
