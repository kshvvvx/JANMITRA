import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="citizen-login" 
        options={{ 
          title: 'Citizen Login',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="staff-login" 
        options={{ 
          title: 'Staff Login',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="supervisor-login" 
        options={{ 
          title: 'Supervisor Login',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}
