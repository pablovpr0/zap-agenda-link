
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getStorageData, setStorageData, removeStorageData, MockUser, STORAGE_KEYS, initializeDefaultData } from '@/data/mockData';

interface AuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = getStorageData(STORAGE_KEYS.IS_AUTHENTICATED, false);
        if (isAuthenticated) {
          const storedUser = getStorageData<MockUser | null>(STORAGE_KEYS.USER, null);
          if (storedUser) {
            setUser(storedUser);
            initializeDefaultData();
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: MockUser = {
        id: 'user-1',
        email,
        name: 'Usuário Demo'
      };

      setStorageData(STORAGE_KEYS.USER, mockUser);
      setStorageData(STORAGE_KEYS.IS_AUTHENTICATED, true);
      setUser(mockUser);
      initializeDefaultData();
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: MockUser = {
        id: 'user-1',
        email,
        name
      };

      setStorageData(STORAGE_KEYS.USER, mockUser);
      setStorageData(STORAGE_KEYS.IS_AUTHENTICATED, true);
      setUser(mockUser);
      initializeDefaultData();
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Clear all storage
      removeStorageData(STORAGE_KEYS.USER);
      removeStorageData(STORAGE_KEYS.IS_AUTHENTICATED);
      removeStorageData(STORAGE_KEYS.COMPANY_SETTINGS);
      removeStorageData(STORAGE_KEYS.PROFILE);
      removeStorageData(STORAGE_KEYS.CLIENTS);
      removeStorageData(STORAGE_KEYS.SERVICES);
      removeStorageData(STORAGE_KEYS.PROFESSIONALS);
      removeStorageData(STORAGE_KEYS.APPOINTMENTS);
      
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
