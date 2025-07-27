import { useState, useEffect, createContext, useContext } from 'react';
import { getStorageData, setStorageData, removeStorageData, STORAGE_KEYS, MockUser, initializeDefaultData } from '@/data/mockData';

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = getStorageData(STORAGE_KEYS.IS_AUTHENTICATED, false);
    if (isAuthenticated) {
      const savedUser = getStorageData<MockUser | null>(STORAGE_KEYS.USER, null);
      setUser(savedUser);
      initializeDefaultData();
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation for demo
    if (email && password) {
      const newUser: MockUser = {
        id: 'user-1',
        email,
        name: email.split('@')[0]
      };
      
      setUser(newUser);
      setStorageData(STORAGE_KEYS.USER, newUser);
      setStorageData(STORAGE_KEYS.IS_AUTHENTICATED, true);
      initializeDefaultData();
    } else {
      throw new Error('Email e senha são obrigatórios');
    }
  };

  const signUp = async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation for demo
    if (email && password) {
      const newUser: MockUser = {
        id: 'user-1',
        email,
        name: email.split('@')[0]
      };
      
      setUser(newUser);
      setStorageData(STORAGE_KEYS.USER, newUser);
      setStorageData(STORAGE_KEYS.IS_AUTHENTICATED, true);
      initializeDefaultData();
    } else {
      throw new Error('Email e senha são obrigatórios');
    }
  };

  const signOut = async () => {
    setUser(null);
    // Clear all data
    Object.values(STORAGE_KEYS).forEach(key => {
      removeStorageData(key);
    });
    removeStorageData('zapagenda_credentials');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};