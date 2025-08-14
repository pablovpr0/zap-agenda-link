
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          devError('Error getting initial session:', error);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setInitialized(true);
          setIsLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (isMounted) {
              setSession(session);
              setUser(session?.user ?? null);
              setIsLoading(false);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        devError('Error initializing auth:', error);
        if (isMounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: Error }> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        devError('SignIn error:', error);
        return { error: new Error(error.message) };
      }

      return {};
    } catch (error: any) {
      devError('SignIn catch error:', error);
      return { error: new Error('Erro inesperado ao fazer login') };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: Error }> => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            company_name: name,
          }
        }
      });

      if (error) {
        devError('SignUp error:', error);
        return { error: new Error(error.message) };
      }

      return {};
    } catch (error: any) {
      devError('SignUp catch error:', error);
      return { error: new Error('Erro inesperado ao criar conta') };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        devError('SignOut error:', error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      devError('SignOut catch error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: Error }> => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        devError('Reset password error:', error);
        return { error: new Error(error.message) };
      }

      return {};
    } catch (error: any) {
      devError('Reset password catch error:', error);
      return { error: new Error('Erro inesperado ao redefinir senha') };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading: isLoading || !initialized,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
