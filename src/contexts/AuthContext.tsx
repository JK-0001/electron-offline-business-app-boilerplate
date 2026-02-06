import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSetupComplete: boolean | null;
  user: AuthUser | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TOKEN_KEY = 'auth_session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Check if setup is complete and validate existing session
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // First check if setup is complete
      const setupComplete = await window.electronAPI.auth.checkSetup();
      setIsSetupComplete(setupComplete);

      if (!setupComplete) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Check for saved session token
      const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);

      if (savedToken) {
        const result = await window.electronAPI.auth.validateSession(savedToken);

        if (result.valid && result.user) {
          setIsAuthenticated(true);
          setUser(result.user);
        } else {
          // Invalid session, clear it
          localStorage.removeItem(SESSION_TOKEN_KEY);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session check
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Login function
  const login = async (
    username: string,
    password: string,
    rememberMe?: boolean
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await window.electronAPI.auth.login({
        username,
        password,
        rememberMe,
      });

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user || null);

        // Save session token if remember me is enabled
        if (result.sessionToken) {
          localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        }
      }

      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      await window.electronAPI.auth.logout(savedToken || undefined);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isSetupComplete,
        user,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
