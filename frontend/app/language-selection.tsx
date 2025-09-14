import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    description: 'Continue in English'
  },
  {
    code: 'hi',
    name: 'हिंदी',
    flag: '🇮🇳',
    description: 'हिंदी में जारी रखें'
  }
];

export default function LanguageSelectionScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Store language preference and navigate to user mode selection
      router.push({
        pathname: '/user-mode-selection',
        params: { language: selectedLanguage }
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.appName}>JANMITRA</Text>
          <ThemedText type="default" style={styles.subtitle}>
            Civic Issue Reporting App
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <Animatable.View animation="fadeInUp" delay={400}>
          <Text variant="headlineSmall" style={styles.title}>
            Choose Your Language
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Select your preferred language to continue
          </Text>
        </Animatable.View>

        <View style={styles.languageContainer}>
          {LANGUAGES.map((language, index) => (
            <Animatable.View
              key={language.code}
              animation="bounceIn"
              delay={600 + index * 200}
            >
              <Card
                style={[
                  styles.languageCard,
                  selectedLanguage === language.code && styles.selectedCard
                ]}
                mode={selectedLanguage === language.code ? 'elevated' : 'outlined'}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.flag}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text variant="titleMedium" style={styles.languageName}>
                      {language.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.languageDescription}>
                      {language.description}
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Animatable.View animation="pulse" iterationCount="infinite">
                      <Text style={styles.checkmark}>✓</Text>
                    </Animatable.View>
                  )}
                </Card.Content>
              </Card>
            </Animatable.View>
          ))}
        </View>

        <Animatable.View animation="fadeInUp" delay={1000}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!selectedLanguage}
            style={styles.continueButton}
            contentStyle={styles.continueButtonContent}
          >
            Continue
          </Button>
        </Animatable.View>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Making cities better, one complaint at a time
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
  languageContainer: {
    marginBottom: 40,
  },
  languageCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  selectedCard: {
    borderColor: '#2196f3',
    borderWidth: 2,
    backgroundColor: '#e3f2fd',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  languageDescription: {
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
  },
  continueButtonContent: {
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
