import React, { useState } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemedView } from '@/components/themed-view';
import { GuestService, GuestSession } from '@/services/guestService';
// Guest session state management

export default function GuestModeScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [existingSession, setExistingSession] = useState<GuestSession | null>(null);
  // Use existingSession state to track guest session

  // Check for existing session on mount
  useFocusEffect(
    React.useCallback(() => {
      const checkExistingSession = async () => {
        try {
          const session = await GuestService.getSession();
          if (session && GuestService.isSessionValid(session)) {
            setExistingSession(session);
          } else if (session) {
            // Clear expired session
            await GuestService.clearSession();
          }
        } catch (error) {
          console.error('Error checking guest session:', error);
        } finally {
          setIsLoading(false);
        }
      };

      checkExistingSession();
    }, [])
  );

  const handleGuestContinue = async () => {
    if (!guestName.trim()) {
      Alert.alert(
        t('error', 'Error'),
        t('guest.enterName', 'Please enter your name')
      );
      return;
    }

    if (!guestPhone.trim() || !/^\d{10}$/.test(guestPhone)) {
      Alert.alert(
        t('error', 'Error'),
        t('guest.enterValidPhone', 'Please enter a valid 10-digit phone number')
      );
      return;
    }

    try {
      setIsLoading(true);
      const session = await GuestService.createSession(guestName, guestPhone);
      
      router.replace({
        pathname: '/(tabs)',
        params: { 
          language,
          userType: 'guest',
          guestId: session.id,
          guestName: session.name
        }
      });
    } catch (error) {
      console.error('Error creating guest session:', error);
      Alert.alert(
        t('error', 'Error'),
        t('guest.sessionError', 'Error creating session. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    if (!existingSession) return;
    
    try {
      await GuestService.updateLastActivity();
      
      router.replace({
        pathname: '/(tabs)',
        params: { 
          language,
          userType: 'guest',
          guestId: existingSession.id,
          guestName: existingSession.name
        }
      });
    } catch (error) {
      console.error('Error continuing guest session:', error);
      Alert.alert(
        t('error', 'Error'),
        t('guest.continueError', 'Error continuing session. Please try again.')
      );
    }
  };

  const handleLoginInstead = () => {
    router.push({
      pathname: '/auth/citizen-login',
      params: { language }
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View 
          animation="fadeInUp" 
          duration={800}
          style={styles.content}
        >
          <Text style={styles.appName}>JANMITRA</Text>
          <Card style={styles.card}>
            <Card.Content>
              {existingSession ? (
                <>
                  <Text variant="headlineSmall" style={styles.title}>
                    {t('guest.welcomeBack', 'Welcome Back!')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('guest.loggedInAs', 'You\'re logged in as {{name}} from a previous session.', 
                      { name: existingSession.name })}
                  </Text>
                  
                  <Button 
                    mode="contained" 
                    onPress={handleContinueAsGuest}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                  >
                    {t('guest.continueAsGuest', 'Continue as Guest')}
                  </Button>
                  
                  <Text style={styles.divider}>
                    {t('common.or', 'OR')}
                  </Text>
                  
                  <Button 
                    onPress={handleLoginInstead}
                    style={styles.secondaryButton}
                    labelStyle={styles.secondaryButtonLabel}
                  >
                    {t('auth.loginInstead', 'Login Instead')}
                  </Button>
                </>
              ) : (
                <>
                  <Text variant="headlineSmall" style={styles.title}>
                    {t('guest.guestMode', 'Guest Mode')}
                  </Text>
                  
                  <Text style={styles.subtitle}>
                    {t('guest.guestModeDescription', 'Continue as guest to file complaints.')}
                  </Text>
                  
                  <TextInput
                    label={t('guest.yourName', 'Your Name')}
                    value={guestName}
                    onChangeText={setGuestName}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="words"
                  />
                  
                  <TextInput
                    label={t('guest.phoneNumber', 'Phone Number')}
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  
                  <Button 
                    mode="contained" 
                    onPress={handleGuestContinue}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? t('common.processing', 'Processing...')
                      : t('guest.continueAsGuest', 'Continue as Guest')}
                  </Button>
                  
                  <Button 
                    onPress={handleLoginInstead}
                    style={styles.secondaryButton}
                    labelStyle={styles.secondaryButtonLabel}
                    disabled={isLoading}
                  >
                    {t('auth.loginInstead', 'Login Instead')}
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
          
          <Text style={styles.note}>
            {t('guest.sessionNote', 'Note: Guest session will expire after 24 hours of inactivity.')}
          </Text>
        </Animatable.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  divider: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#2196f3',
    borderRadius: 12,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
  secondaryButton: {
    marginTop: 8,
  },
  secondaryButtonLabel: {
    color: '#2196f3',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    color: '#999',
    textAlign: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
