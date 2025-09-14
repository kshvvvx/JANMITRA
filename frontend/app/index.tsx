import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from '@/utils/notifications';
import { isAuthenticated } from '../utils/auth';

const IndexScreen = () => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth/citizen-login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/auth/citizen-login');
      } finally {
        setChecking(false);
      }
    };

    checkAuthStatus();

    // Set up notification listeners
    const notificationListener = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Handle notification received while app is running
    });

    const responseListener = addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      // Handle notification tap
      const data = response.notification.request.content.data;
      
      if (data?.type === 'complaint_status_change' && data?.complaintId) {
        router.push(`/complaint-detail?id=${data.complaintId}`);
      } else if (data?.type === 'new_complaint' && data?.complaintId) {
        router.push(`/complaint-detail?id=${data.complaintId}`);
      } else if (data?.type === 'complaint_upvoted' && data?.complaintId) {
        router.push(`/complaint-detail?id=${data.complaintId}`);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
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
