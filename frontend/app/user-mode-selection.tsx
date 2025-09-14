import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const USER_MODES = [
  {
    id: 'citizen',
    title: 'Citizen',
    titleHindi: 'नागरिक',
    icon: '👤',
    description: 'Report civic issues and track their resolution',
    descriptionHindi: 'नागरिक समस्याओं की रिपोर्ट करें और उनके समाधान को ट्रैक करें',
    color: '#2196f3'
  },
  {
    id: 'staff',
    title: 'Municipal Staff',
    titleHindi: 'नगर निगम कर्मचारी',
    icon: '👷‍♂️',
    description: 'Manage and resolve citizen complaints',
    descriptionHindi: 'नागरिक शिकायतों का प्रबंधन और समाधान करें',
    color: '#4caf50'
  },
  {
    id: 'supervisor',
    title: 'Supervisor',
    titleHindi: 'पर्यवेक्षक',
    icon: '👨‍💼',
    description: 'Monitor department efficiency and handle escalations',
    descriptionHindi: 'विभागीय दक्षता की निगरानी और एस्केलेशन को संभालें',
    color: '#ff9800'
  }
];

export default function UserModeSelectionScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const [selectedMode, setSelectedMode] = useState<string>('');
  const isHindi = language === 'hi';

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
  };

  const handleContinue = () => {
    if (selectedMode) {
      // Navigate to appropriate authentication screen based on mode
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

  const getTitle = (mode: typeof USER_MODES[0]) => isHindi ? mode.titleHindi : mode.title;
  const getDescription = (mode: typeof USER_MODES[0]) => isHindi ? mode.descriptionHindi : mode.description;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" delay={200}>
          <Text style={styles.appName}>JANMITRA</Text>
          <ThemedText type="default" style={styles.subtitle}>
            {isHindi ? 'नागरिक समस्या रिपोर्टिंग ऐप' : 'Civic Issue Reporting App'}
          </ThemedText>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <Animatable.View animation="fadeInUp" delay={400}>
          <Text variant="headlineSmall" style={styles.title}>
            {isHindi ? 'अपना मोड चुनें' : 'Choose Your Mode'}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {isHindi 
              ? 'आप कैसे ऐप का उपयोग करना चाहते हैं?' 
              : 'How would you like to use the app?'
            }
          </Text>
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
                    <Text variant="titleMedium" style={styles.modeTitle}>
                      {getTitle(mode)}
                    </Text>
                    <Text variant="bodySmall" style={styles.modeDescription}>
                      {getDescription(mode)}
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
            contentStyle={styles.continueButtonContent}
          >
            {isHindi ? 'जारी रखें' : 'Continue'}
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
