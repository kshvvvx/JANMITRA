import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from '@/utils/notifications';
import { isAuthenticated } from '../utils/auth';

const UserTypeSelection = () => {
  const { t } = useTranslation();

  const handleUserTypeSelect = (userType: 'citizen' | 'staff' | 'supervisor') => {
    switch (userType) {
      case 'citizen':
        router.push('/auth/citizen-login');
        break;
      case 'staff':
        router.push('/auth/staff-login');
        break;
      case 'supervisor':
        router.push('/auth/supervisor-login');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userType_title')}</Text>
        <Text style={styles.subtitle}>{t('userType_subtitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => handleUserTypeSelect('citizen')}
        >
          <View style={styles.cardContent}>
            <Image
              source={require('@/assets/images/citizen-icon.png')}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t('userType_citizen')}</Text>
              <Text style={styles.cardDescription}>{t('userType_citizen_desc')}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => handleUserTypeSelect('staff')}
        >
          <View style={styles.cardContent}>
            <Image
              source={require('@/assets/images/staff-icon.png')}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t('userType_staff')}</Text>
              <Text style={styles.cardDescription}>{t('userType_staff_desc')}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => handleUserTypeSelect('supervisor')}
        >
          <View style={styles.cardContent}>
            <Image
              source={require('@/assets/images/supervisor-icon.png')}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t('userType_supervisor')}</Text>
              <Text style={styles.cardDescription}>{t('userType_supervisor_desc')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const IndexScreen = () => {
  const [checking, setChecking] = useState(true);
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          router.replace('/(tabs)');
        } else {
          setShowUserTypeSelection(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setShowUserTypeSelection(true);
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
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (showUserTypeSelection) {
    return <UserTypeSelection />;
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default IndexScreen;
