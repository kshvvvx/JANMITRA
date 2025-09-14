import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { AppProviders } from '@/providers/AppProviders';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading screen while checking authentication
    return null;
  }

  return (
    <>
      <Stack>
        {!isAuthenticated ? (
          // Authentication screens
          <>
            <Stack.Screen name="language-selection" options={{ headerShown: false }} />
            <Stack.Screen name="user-type-selection" options={{ headerShown: false }} />
            <Stack.Screen name="citizen-login" options={{ headerShown: false }} />
            <Stack.Screen name="staff-login" options={{ headerShown: false }} />
            <Stack.Screen name="supervisor-login" options={{ headerShown: false }} />
            <Stack.Screen name="phone-verification" options={{ headerShown: false }} />
          </>
        ) : (
          // Main app screens
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="staff-dashboard" options={{ title: 'Staff Dashboard' }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
