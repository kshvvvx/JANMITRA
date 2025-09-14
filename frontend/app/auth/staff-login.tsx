import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StaffLoginScreen = () => {
  const { t } = useTranslation();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!staffId || !password) {
      Alert.alert(
        t('error'),
        !staffId ? t('staffLogin_validation_staffId') : t('staffLogin_validation_password')
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          staff_id: staffId, 
          password 
        }),
      });

      const data = await response.json() as {
        token: string;
        user: {
          id: string;
          staff_id: string;
          role: string;
          name: string;
        };
        error?: string;
      };

      if (response.ok && data.token) {
        // Store JWT token and user info
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
        
        Alert.alert(
          t('staffLogin_success_title'), 
          t('staffLogin_success_message'),
          [{
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          }]
        );
      } else {
        Alert.alert(
          t('staffLogin_error_title'),
          data.error || t('staffLogin_error_invalidCredentials')
        );
      }
    } catch (error) {
      Alert.alert(
        t('staffLogin_error_title'),
        t('staffLogin_error_network')
      );
      console.error('Staff login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('staffLogin_title')}</Text>
        <Text style={styles.subtitle}>
          {t('staffLogin_guestModeDescription')}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t('staffLogin_staffId')}
          value={staffId}
          onChangeText={setStaffId}
          autoCapitalize="characters"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder={t('staffLogin_password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('staffLogin_loginButton')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.testCredentials}>
          <Text style={styles.testTitle}>{t('test_credentials', 'Test Credentials:')}</Text>
          <Text style={styles.testText}>Staff: STAFF001 / password123</Text>
          <Text style={styles.testText}>Staff: STAFF002 / password123</Text>
          <Text style={styles.testText}>Supervisor: SUP001 / supervisor123</Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/auth/citizen-login')}
        >
          <Text style={styles.linkText}>{t('citizenLogin')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FF9800',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testCredentials: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  testText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#FF9800',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default StaffLoginScreen;
