import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { isAuthenticated } from './utils/auth';

const IndexScreen = () => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          // User is logged in, redirect to main app
          router.replace('/(tabs)');
        } else {
          // User is not logged in, redirect to citizen login
          router.replace('/auth/citizen-login');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // On error, redirect to login
        router.replace('/auth/citizen-login');
      } finally {
        setChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default IndexScreen;
