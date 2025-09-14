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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SupervisorLoginScreen = () => {
  const { t } = useTranslation();
  const [supervisorId, setSupervisorId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!supervisorId || !password) {
      Alert.alert(
        t('supervisorLogin_error_title'),
        !supervisorId 
          ? t('supervisorLogin_validation_supervisorId') 
          : t('supervisorLogin_validation_password')
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/supervisor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          supervisor_id: supervisorId, 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token and user info
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
        await AsyncStorage.setItem('userRole', 'supervisor');
        
        // Navigate to supervisor dashboard
        router.replace('/(tabs)');
        
        Alert.alert(
          t('supervisorLogin_success_title'),
          t('supervisorLogin_success_message')
        );
      } else {
        throw new Error(data.message || t('supervisorLogin_error_invalidCredentials'));
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : t('supervisorLogin_error_network');
      Alert.alert(
        t('supervisorLogin_error_title'),
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('supervisorLogin_title')}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>{t('supervisorLogin_supervisorId')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('supervisorLogin_supervisorId')}
            value={supervisorId}
            onChangeText={setSupervisorId}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>{t('supervisorLogin_password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('supervisorLogin_password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>
                {t('supervisorLogin_loginButton')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => {}}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>
              {t('supervisorLogin_forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#a0c9e8',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
  },
});

export default SupervisorLoginScreen;
