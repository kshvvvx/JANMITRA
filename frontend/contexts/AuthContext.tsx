import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export type UserType = 'citizen' | 'staff' | 'supervisor' | 'guest';

export interface User {
  id: string;
  phoneNumber?: string; // Optional for guest users
  name?: string;
  email?: string;
  language: 'en' | 'hi';
  userType: UserType;
  isVerified: boolean;
  isGuest: boolean;
  createdAt: string;
  guestId?: string; // Unique ID for guest users
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (phoneNumber: string, otp: string) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setLanguage: (language: 'en' | 'hi') => Promise<void>;
  setUserType: (userType: UserType) => Promise<void>;
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
  const isGuest = user?.userType === 'guest';

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

  const setUserType = async (userType: UserType): Promise<void> => {
    await updateUser({ userType });
  };

  const loginAsGuest = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const guestId = `guest_${Date.now()}`;
      const guestUser: User = {
        id: guestId,
        userType: 'guest',
        language: 'en', // Default language
        isVerified: false,
        isGuest: true,
        guestId,
        createdAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(guestUser));
      setUser(guestUser);
      return true;
    } catch (error) {
      console.error('Error logging in as guest:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGuest,
    login,
    loginAsGuest,
    logout,
    updateUser,
    setLanguage,
    setUserType,
    sendOTP,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
