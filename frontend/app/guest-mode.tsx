import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, TextInput } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function GuestModeScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const isHindi = language === 'hi';

  const handleGuestContinue = () => {
    if (!guestName.trim()) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your name'
      );
      return;
    }

    if (!guestPhone.trim() || guestPhone.length !== 10) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया वैध फोन नंबर दर्ज करें' : 'Please enter a valid phone number'
      );
      return;
    }

    // Store guest info and navigate to citizen home
    router.push({
      pathname: '/(tabs)',
      params: { 
        language, 
        userType: 'guest',
        guestName,
        guestPhone
      }
    });
  };

  const handleLoginInstead = () => {
    router.push({
      pathname: '/auth/citizen-login',
      params: { language }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.appName}>JANMITRA</Text>
          <ThemedText type="default" style={styles.subtitle}>
            {isHindi ? 'अतिथि मोड' : 'Guest Mode'}
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <Animatable.View animation="fadeInUp" delay={400}>
          <Text variant="headlineSmall" style={styles.title}>
            {isHindi ? 'अतिथि के रूप में रिपोर्ट करें' : 'Report as Guest'}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {isHindi 
              ? 'बिना खाता बनाए शिकायत दर्ज करें' 
              : 'File complaints without creating an account'
            }
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={600}>
          <Card style={styles.formCard}>
            <Card.Content style={styles.cardContent}>
              <TextInput
                label={isHindi ? 'आपका नाम' : 'Your Name'}
                value={guestName}
                onChangeText={setGuestName}
                mode="outlined"
                style={styles.input}
                placeholder={isHindi ? 'अपना नाम दर्ज करें' : 'Enter your name'}
              />

              <TextInput
                label={isHindi ? 'फोन नंबर' : 'Phone Number'}
                value={guestPhone}
                onChangeText={setGuestPhone}
                mode="outlined"
                style={styles.input}
                placeholder={isHindi ? 'फोन नंबर दर्ज करें' : 'Enter phone number'}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text variant="bodySmall" style={styles.note}>
                {isHindi 
                  ? 'नोट: अतिथि मोड में आप केवल शिकायत दर्ज कर सकते हैं। पूर्ण सुविधाओं के लिए खाता बनाएं।'
                  : 'Note: In guest mode, you can only file complaints. Create an account for full features.'
                }
              </Text>
            </Card.Content>
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={800}>
          <Button
            mode="contained"
            onPress={handleGuestContinue}
            style={styles.continueButton}
            contentStyle={styles.continueButtonContent}
          >
            {isHindi ? 'शिकायत दर्ज करें' : 'File Complaint'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleLoginInstead}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            {isHindi ? 'खाता बनाएं/लॉगिन करें' : 'Create Account/Login'}
          </Button>
        </Animatable.View>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          {isHindi 
            ? 'शहरों को बेहतर बनाना, एक शिकायत के साथ' 
            : 'Making cities better, one complaint at a time'
          }
        </Text>
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
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 30,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  note: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
    marginBottom: 12,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
  loginButton: {
    borderColor: '#2196f3',
    borderRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    color: '#999',
    textAlign: 'center',
  },
});
