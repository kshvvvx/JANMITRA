import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  language: 'en' | 'hi';
  userType: 'citizen' | 'staff' | 'supervisor';
  isVerified: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setLanguage: (language: 'en' | 'hi') => Promise<void>;
  setUserType: (userType: 'citizen' | 'staff' | 'supervisor') => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phoneNumber: string): Promise<boolean> => {
    try {
      const response = await apiService.sendOTP({ phoneNumber });
      return response.success;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

  const login = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.verifyOTP({ phoneNumber, otp });
      
      if (response.success && response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const setLanguage = async (language: 'en' | 'hi'): Promise<void> => {
    await updateUser({ language });
  };

  const setUserType = async (userType: 'citizen' | 'staff' | 'supervisor'): Promise<void> => {
    await updateUser({ userType });
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    setLanguage,
    setUserType,
    sendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
