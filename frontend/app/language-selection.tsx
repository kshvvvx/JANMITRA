import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';


const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    description: 'Continue in English',
    nativeName: 'English'
  },
  {
    code: 'hi',
    name: 'हिंदी',
    flag: '🇮🇳',
    description: 'हिंदी में जारी रखें',
    nativeName: 'हिंदी'
  }
];

export default function LanguageSelectionScreen() {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language || 'en');
  const params = useLocalSearchParams();

  // Update selected language when i18n language changes
  useEffect(() => {
    if (i18n.language && i18n.language !== selectedLanguage) {
      setSelectedLanguage(i18n.language);
    }
  }, [i18n.language, selectedLanguage]);

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await i18n.changeLanguage(languageCode);
    setLanguage(languageCode);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Navigate to user type selection with language parameter
      router.replace({
        pathname: '/user-type-selection',
        params: { language: selectedLanguage, ...params }
      });
    }
  };

  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200} style={styles.headerContent}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            {t('languageSelection.title', 'Welcome to JANMITRA')}
          </Text>
          <ThemedText type="default" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('languageSelection.subtitle', 'Please select your preferred language')}
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <View style={styles.languageContainer}>
          {LANGUAGES.map((language, index) => (
            <Animatable.View
              key={language.code}
              animation="fadeInUp"
              delay={200 + index * 100}
              style={styles.languageItemContainer}
            >
              <Card
                style={[
                  styles.languageCard,
                  selectedLanguage === language.code && {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surfaceVariant,
                  }
                ]}
                mode="elevated"
                elevation={selectedLanguage === language.code ? 4 : 1}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.flagContainer}>
                    <Text style={styles.flag}>{language.flag}</Text>
                  </View>
                  <View style={styles.languageInfo}>
                    <Text variant="titleMedium" style={[styles.languageName, { color: theme.colors.onSurface }]}>
                      {language.nativeName}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.languageName, { color: theme.colors.onSurfaceVariant }]}>
                      {language.name}
                    </Text>
                    <Text style={[styles.languageDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {language.code === 'en'
                        ? t('continueInEnglish', 'Continue in English')
                        : t('continueInHindi', 'हिंदी में जारी रखें')}
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Animatable.View 
                      animation="pulse" 
                      iterationCount="infinite"
                      style={styles.selectedIndicator}
                    >
                      <Text style={{ color: theme.colors.primary }}>✓</Text>
                    </Animatable.View>
                  )}
                </Card.Content>
              </Card>
            </Animatable.View>
          ))}
        </View>

        <Animatable.View animation="fadeInUp" delay={1000}>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!selectedLanguage}
              style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={[styles.continueButtonLabel, { color: theme.colors.onPrimary }]}
              contentStyle={styles.continueButtonContent}
            >
              {t('common.continue', 'Continue')}
            </Button>
            <Text style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
              {t('languageSelection.languageCanBeChangedLater', 'You can change the language later in settings')}
            </Text>
          </View>
        </Animatable.View>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          {t('makingCitiesBetter', 'Making cities better, one complaint at a time')}
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  languageContainer: {
    marginTop: 16,
  },
  languageItemContainer: {
    marginBottom: 16,
  },
  languageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  selectedIndicator: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  flagContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flag: {
    fontSize: 28,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    marginBottom: 2,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  continueButton: {
    borderRadius: 8,
    elevation: 2,
  },
  continueButtonContent: {
    height: 48,
  },
  continueButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.7,
  },
  footer: {
    paddingBottom: 24,
    padding: 20,
  },
  footerText: {
    color: '#999',
    textAlign: 'center',
  },
});
