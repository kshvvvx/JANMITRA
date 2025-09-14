import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function PhoneVerificationScreen() {
  const { language, userType } = useLocalSearchParams<{ language: string; userType: string }>();
  const { sendOTP, login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const otpInputRef = useRef<RNTextInput>(null);
  const isHindi = language === 'hi';

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as +91 XXXXXXXXXX
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.slice(0, 10);
  };

  const handlePhoneSubmit = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया 10 अंकों का मान्य फोन नंबर दर्ज करें' : 'Please enter a valid 10-digit phone number'
      );
      return;
    }

    setIsLoading(true);
    try {
      const success = await sendOTP(`+91${phoneNumber}`);
      if (success) {
        setOtpSent(true);
        setStep('otp');
        setCountdown(60);
        startCountdown();
        otpInputRef.current?.focus();
      } else {
        Alert.alert(
          isHindi ? 'त्रुटि' : 'Error',
          isHindi ? 'OTP भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'Error sending OTP. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const success = await sendOTP(`+91${phoneNumber}`);
      if (success) {
        setCountdown(60);
        startCountdown();
        Alert.alert(
          isHindi ? 'सफलता' : 'Success',
          isHindi ? 'OTP पुनः भेजा गया' : 'OTP resent successfully'
        );
      }
    } catch (error) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'OTP भेजने में त्रुटि हुई' : 'Error resending OTP'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (otp.length !== 6) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया 6 अंकों का OTP दर्ज करें' : 'Please enter 6-digit OTP'
      );
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(`+91${phoneNumber}`, otp);
      if (success) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          isHindi ? 'त्रुटि' : 'Error',
          isHindi ? 'गलत OTP। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      setOtpSent(false);
      setCountdown(0);
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.appName}>JANMITRA</Text>
          <ThemedText type="default" style={styles.subtitle}>
            {isHindi ? 'फोन सत्यापन' : 'Phone Verification'}
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        {step === 'phone' ? (
          <Animatable.View animation="fadeInUp" delay={400}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.title}>
                  {isHindi ? 'अपना फोन नंबर दर्ज करें' : 'Enter Your Phone Number'}
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  {isHindi 
                    ? 'हम आपके फोन नंबर पर OTP भेजेंगे' 
                    : 'We will send an OTP to your phone number'
                  }
                </Text>

                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    mode="outlined"
                    placeholder={isHindi ? 'फोन नंबर' : 'Phone Number'}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.phoneInput}
                    left={<TextInput.Icon icon="phone" />}
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handlePhoneSubmit}
                  loading={isLoading}
                  disabled={isLoading || phoneNumber.length !== 10}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                >
                  {isLoading 
                    ? (isHindi ? 'भेजा जा रहा है...' : 'Sending...') 
                    : (isHindi ? 'OTP भेजें' : 'Send OTP')
                  }
                </Button>
              </Card.Content>
            </Card>
          </Animatable.View>
        ) : (
          <Animatable.View animation="fadeInUp" delay={400}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.title}>
                  {isHindi ? 'OTP दर्ज करें' : 'Enter OTP'}
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  {isHindi 
                    ? `हमने OTP भेजा है +91${phoneNumber} पर` 
                    : `We have sent an OTP to +91${phoneNumber}`
                  }
                </Text>

                <TextInput
                  ref={otpInputRef}
                  mode="outlined"
                  placeholder={isHindi ? '6 अंकों का OTP' : '6-digit OTP'}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpInput}
                  left={<TextInput.Icon icon="shield-key" />}
                />

                <View style={styles.resendContainer}>
                  {countdown > 0 ? (
                    <Text variant="bodySmall" style={styles.countdownText}>
                      {isHindi ? 'पुनः भेजें' : 'Resend'} OTP in {countdown}s
                    </Text>
                  ) : (
                    <Button
                      mode="text"
                      onPress={handleResendOTP}
                      disabled={isLoading}
                      style={styles.resendButton}
                    >
                      {isHindi ? 'OTP पुनः भेजें' : 'Resend OTP'}
                    </Button>
                  )}
                </View>

                <Button
                  mode="contained"
                  onPress={handleOTPSubmit}
                  loading={isLoading}
                  disabled={isLoading || otp.length !== 6}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                >
                  {isLoading 
                    ? (isHindi ? 'सत्यापित किया जा रहा है...' : 'Verifying...') 
                    : (isHindi ? 'सत्यापित करें' : 'Verify')
                  }
                </Button>
              </Card.Content>
            </Card>
          </Animatable.View>
        )}

        <Animatable.View animation="fadeInUp" delay={600}>
          <Button
            mode="text"
            onPress={handleBack}
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
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
    paddingVertical: 16,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  otpInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: {
    color: '#666',
  },
  resendButton: {
    marginTop: -8,
  },
  submitButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 20,
  },
});
