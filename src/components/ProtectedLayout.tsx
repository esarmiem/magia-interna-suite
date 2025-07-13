import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Login } from './Login';
import { Layout } from './Layout';
import { Loader2 } from 'lucide-react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/magiainternalogo.webp"
            alt="Magia Interna Logo"
            className="mx-auto h-16 w-auto mb-4 animate-pulse"
          />
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-gray-600 dark:text-gray-400">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Layout>{children}</Layout>;
}; 