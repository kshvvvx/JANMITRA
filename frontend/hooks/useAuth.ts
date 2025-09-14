import { useState, useCallback } from 'react';
import { GuestSession } from '@/services/guestService';

type UserType = 'guest' | 'citizen' | 'staff' | 'supervisor' | null;

interface AuthState {
  userType: UserType;
  token: string | null;
  guestSession: GuestSession | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    userType: null,
    token: null,
    guestSession: null,
  });

  const setGuestSession = useCallback((session: GuestSession | null) => {
    setAuthState(prev => ({
      ...prev,
      userType: session ? 'guest' : null,
      guestSession: session,
    }));
  }, []);

  const setToken = useCallback((token: string | null, userType: UserType) => {
    setAuthState(prev => ({
      ...prev,
      token,
      userType: token ? userType : null,
      guestSession: token ? null : prev.guestSession, // Clear guest session if logging in as registered user
    }));
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      userType: null,
      token: null,
      guestSession: null,
    });
  }, []);

  return {
    ...authState,
    isAuthenticated: !!authState.token || !!authState.guestSession,
    setGuestSession,
    setToken,
    logout,
  };
};

export type { UserType };

declare module '@react-navigation/native' {
  export interface RootParamList {
    '/(tabs)': { userType: UserType; guestId?: string };
    '/auth/guest-mode': { language: string };
    '/auth/citizen-login': { language: string };
  }
}
