import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const complaintId = params.complaintId as string;

  const handleDone = () => {
    // Navigate back to main tabs
    router.replace('/(tabs)');
  };

  const handleViewComplaints = () => {
    // Navigate to my complaints tab
    router.replace('/(tabs)/my-complaints');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Complaint Submitted!
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Your complaint has been successfully submitted
          </ThemedText>
        </View>

        {/* Success Message */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="headlineSmall" style={styles.successTitle}>
              Complaint Submitted Successfully!
            </Text>
            <Text variant="bodyLarge" style={styles.complaintId}>
              Your Complaint ID: {complaintId || 'compl-9999'}
            </Text>
            <Text variant="bodySmall" style={styles.idNote}>
              Save this ID to track your complaint status
            </Text>
          </Card.Content>
        </Card>

        {/* Next Steps */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              What&apos;s Next?
            </Text>
            <View style={styles.stepsList}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text variant="bodyMedium" style={styles.stepText}>
                  Your complaint will be reviewed by local authorities
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text variant="bodyMedium" style={styles.stepText}>
                  You&apos;ll receive updates on the progress
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text variant="bodyMedium" style={styles.stepText}>
                  Track status in &quot;My Issues&quot; tab
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleViewComplaints}
          style={styles.actionButton}
        >
          View My Issues
        </Button>
        <Button
          mode="contained"
          onPress={handleDone}
          style={styles.doneButton}
        >
          Done
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    fontSize: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#2196f3',
  },
  complaintId: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2196f3',
  },
  idNote: {
    color: '#666',
    textAlign: 'center',
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#2196f3',
  },
});
