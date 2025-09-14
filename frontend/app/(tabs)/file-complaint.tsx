import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function FileComplaintScreen() {
  const router = useRouter();

  const startComplaintFlow = () => {
    router.push('/complaint-flow/MediaCaptureScreen');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          File Complaint
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Report a civic issue in your area
        </ThemedText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              📋 New Complaint
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Follow our guided process to report civic issues like potholes, 
              broken streetlights, garbage collection problems, and more.
            </Text>
            
            <View style={styles.stepsContainer}>
              <Text variant="titleMedium" style={styles.stepsTitle}>
                Quick Steps:
              </Text>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Add photos/videos</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Set location</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Describe issue</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Review & submit</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={startComplaintFlow}
              style={styles.startButton}
              contentStyle={styles.startButtonContent}
            >
              Start Filing Complaint
            </Button>
          </Card.Content>
        </Card>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
  },
  cardTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  cardDescription: {
    marginBottom: 24,
    lineHeight: 22,
    color: '#666',
    textAlign: 'center',
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepsTitle: {
    marginBottom: 16,
    color: '#333',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    backgroundColor: '#2196f3',
    color: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: '#333',
  },
  startButton: {
    backgroundColor: '#2196f3',
  },
  startButtonContent: {
    paddingVertical: 8,
  },
});
