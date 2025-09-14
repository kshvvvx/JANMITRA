import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function SupervisorLoginScreen() {
  const { language, userType } = useLocalSearchParams<{ language: string; userType: string }>();
  const [supervisorId, setSupervisorId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isHindi = language === 'hi';

  const handleLogin = async () => {
    if (!supervisorId.trim() || !password.trim()) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill all fields'
      );
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Implement actual supervisor authentication API call
      // For now, we'll simulate authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful login
      Alert.alert(
        isHindi ? 'सफलता' : 'Success',
        isHindi ? 'सफलतापूर्वक लॉग इन हुए!' : 'Successfully logged in!',
        [
          {
            text: isHindi ? 'ठीक है' : 'OK',
            onPress: () => {
              // TODO: Navigate to supervisor dashboard
              console.log('Navigate to supervisor dashboard');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        isHindi ? 'लॉगिन असफल' : 'Login Failed',
        isHindi ? 'गलत क्रेडेंशियल। कृपया पुनः प्रयास करें।' : 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.appName}>JANMITRA</Text>
          <ThemedText type="default" style={styles.subtitle}>
            {isHindi ? 'पर्यवेक्षक लॉगिन' : 'Supervisor Login'}
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <Animatable.View animation="fadeInUp" delay={400}>
          <Card style={styles.loginCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>
                {isHindi ? 'पर्यवेक्षक पहुंच' : 'Supervisor Access'}
              </Title>
              <Paragraph style={styles.cardSubtitle}>
                {isHindi 
                  ? 'अपने पर्यवेक्षक क्रेडेंशियल दर्ज करें'
                  : 'Enter your supervisor credentials'
                }
              </Paragraph>

              <TextInput
                mode="outlined"
                label={isHindi ? 'पर्यवेक्षक ID' : 'Supervisor ID'}
                placeholder={isHindi ? 'पर्यवेक्षक ID दर्ज करें' : 'Enter supervisor ID'}
                value={supervisorId}
                onChangeText={setSupervisorId}
                style={styles.input}
                left={<TextInput.Icon icon="account-tie" />}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                mode="outlined"
                label={isHindi ? 'पासवर्ड' : 'Password'}
                placeholder={isHindi ? 'पासवर्ड दर्ज करें' : 'Enter password'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
              >
                {loading 
                  ? (isHindi ? 'लॉग इन हो रहे हैं...' : 'Logging in...') 
                  : (isHindi ? 'लॉग इन करें' : 'Login')
                }
              </Button>
            </Card.Content>
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={600}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Title style={styles.infoTitle}>
                {isHindi ? 'पर्यवेक्षक कार्य' : 'Supervisor Functions'}
              </Title>
              <Paragraph style={styles.infoText}>
                {isHindi 
                  ? '• विभागीय दक्षता की निगरानी\n• शिकायत एस्केलेशन को संभालना\n• विभागों के साथ चैट\n• रेटिंग और प्रतिक्रिया'
                  : '• Monitor department efficiency\n• Handle complaint escalations\n• Chat with departments\n• Rating and feedback'
                }
              </Paragraph>
            </Card.Content>
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={800}>
          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            {isHindi ? 'वापस जाएं' : 'Go Back'}
          </Button>
        </Animatable.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loginCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: '#ff9800',
    borderRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  infoText: {
    color: '#666',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 20,
  },
});
