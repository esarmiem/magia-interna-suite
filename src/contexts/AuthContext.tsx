import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext, AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si ya está autenticado al cargar la app
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const expectedUsername = import.meta.env.VITE_LOGIN_USERNAME || 'lore';
    const expectedPassword = import.meta.env.VITE_LOGIN_PASSWORD || 'pulga2025';
    
    if (username === expectedUsername && password === expectedPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 