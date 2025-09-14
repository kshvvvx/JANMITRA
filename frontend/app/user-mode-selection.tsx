import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';

const USER_MODES = [
  {
    id: 'citizen',
    titleKey: 'citizen',
    title: 'Citizen',
    icon: '👤',
    descriptionKey: 'citizenDescription',
    description: 'Report civic issues and track their resolution',
    color: '#2196f3'
  },
  {
    id: 'staff',
    titleKey: 'municipalStaff',
    title: 'Municipal Staff',
    icon: '👷‍♂️',
    descriptionKey: 'staffDescription',
    description: 'Manage and resolve citizen complaints',
    color: '#4caf50'
  },
  {
    id: 'supervisor',
    titleKey: 'supervisor',
    title: 'Supervisor',
    icon: '👨‍💼',
    descriptionKey: 'supervisorDescription',
    description: 'Monitor department efficiency and handle escalations',
    color: '#ff9800'
  }
];

export default function UserModeSelectionScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<string>('');
  const params = useLocalSearchParams();
  
  // Set document title based on current language
  useEffect(() => {
    document.title = t('selectUserType', 'Select User Type');
  }, [language, t]);

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
  };

  const handleContinue = () => {
    if (selectedMode) {
      // Navigate to appropriate authentication screen based on mode
      const navigationParams = { ...params };
      
      if (selectedMode === 'citizen') {
        router.push({
          pathname: '/phone-verification',
          params: navigationParams
        });
      } else if (selectedMode === 'staff') {
        router.push({
          pathname: '/staff-login',
          params: navigationParams
        });
      } else if (selectedMode === 'supervisor') {
        router.push({
          pathname: '/supervisor-login',
          params: navigationParams
        });
      }
      if (selectedMode === 'citizen') {
        router.push({
          pathname: '/phone-verification',
          params: { language, userType: selectedMode }
        });
      } else if (selectedMode === 'staff') {
        router.push({
          pathname: '/staff-login',
          params: { language, userType: selectedMode }
        });
      } else if (selectedMode === 'supervisor') {
        router.push({
          pathname: '/supervisor-login',
          params: { language, userType: selectedMode }
        });
      }
    }
  };


  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.appName}>JANMITRA</Text>
          <ThemedText type="default" style={styles.subtitle}>
            {t('appSubtitle', 'Civic Issue Reporting App')}
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.title}>
            {t('selectUserType', 'Select User Type')}
          </Text>
          <ThemedText type="default" style={styles.subtitle}>
            {t('selectUserTypeDescription', 'Please select your user type to continue')}
          </ThemedText>
        </Animatable.View>

        <View style={styles.modeContainer}>
          {USER_MODES.map((mode, index) => (
            <Animatable.View
              key={mode.id}
              animation="bounceIn"
              delay={600 + index * 200}
            >
              <Card
                style={[
                  styles.modeCard,
                  selectedMode === mode.id && styles.selectedCard,
                  { borderColor: selectedMode === mode.id ? mode.color : '#e0e0e0' }
                ]}
                mode={selectedMode === mode.id ? 'elevated' : 'outlined'}
                onPress={() => handleModeSelect(mode.id)}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={[styles.iconContainer, { backgroundColor: mode.color + '20' }]}>
                    <Text style={styles.icon}>{mode.icon}</Text>
                  </View>
                  <View style={styles.modeInfo}>
                    <Text style={[styles.modeTitle, { color: mode.color }]}>
                      {t(mode.titleKey, mode.title)}
                    </Text>
                    <Text style={styles.modeDescription}>
                      {t(mode.descriptionKey, mode.description)}
                    </Text>
                  </View>
                  {selectedMode === mode.id && (
                    <Animatable.View animation="pulse" iterationCount="infinite">
                      <Text style={[styles.checkmark, { color: mode.color }]}>✓</Text>
                    </Animatable.View>
                  )}
                </Card.Content>
              </Card>
            </Animatable.View>
          ))}
        </View>

        <Animatable.View animation="fadeInUp" delay={1200}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!selectedMode}
            style={styles.continueButton}
            labelStyle={styles.continueButtonLabel}
          >
            {t('continue', 'Continue')}
          </Button>
        </Animatable.View>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          {t('footerText', 'Making cities better, one complaint at a time')}
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
  modeContainer: {
    marginBottom: 40,
  },
  modeCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  selectedCard: {
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  modeDescription: {
    color: '#666',
    lineHeight: 18,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
    paddingVertical: 8,
  },
  continueButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
