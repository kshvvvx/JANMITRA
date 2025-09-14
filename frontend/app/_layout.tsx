import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading screen while checking authentication
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {!isAuthenticated ? (
          // Authentication screens
          <>
            <Stack.Screen name="language-selection" options={{ headerShown: false }} />
            <Stack.Screen name="user-mode-selection" options={{ headerShown: false }} />
            <Stack.Screen name="phone-verification" options={{ headerShown: false }} />
            <Stack.Screen name="staff-login" options={{ headerShown: false }} />
            <Stack.Screen name="supervisor-login" options={{ headerShown: false }} />
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
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
