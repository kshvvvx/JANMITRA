import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
// import { Audio } from 'expo-av';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ReviewSubmitScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Audio playback state - disabled until expo-av is installed
  // const [isPlaying, setIsPlaying] = useState(false);
  // const [sound, setSound] = useState<any>(null);
  
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse data from previous screens
  const mediaData = params.media ? JSON.parse(params.media as string) : [];
  const locationData = params.location ? JSON.parse(params.location as string) : null;
  const complaintData = params.complaint ? JSON.parse(params.complaint as string) : null;

  // Audio playback disabled until expo-av is installed
  // const playVoiceNote = async () => {
  //   if (!complaintData?.voiceNote) return;
  // };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Prepare submission data for backend API
      const submissionData = {
        citizen_id: 'demo-user',
        description: complaintData?.description || 'Voice complaint recorded',
        location: {
          lat: locationData?.lat || null,
          lng: locationData?.lng || null,
          address: locationData?.address || 'Location not specified'
        },
        media: mediaData.length > 0 
          ? mediaData.map((item: any) => ({
              type: item.type || 'image',
              url: item.uri || 'dummy-url-placeholder' // TODO: Replace with actual media upload URL
            }))
          : []
      };

      console.log('Submitting complaint data:', submissionData);

      // TODO: For physical devices, replace localhost with ngrok URL (e.g., https://abc123.ngrok.io)
      // For Expo web, localhost:5000 should work fine
      const response = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit complaint';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If error response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Complaint submitted successfully:', result);
      
      // Navigate to success screen with real complaint ID
      router.replace({
        pathname: '/complaint-flow/ConfirmationScreen',
        params: { 
          complaintId: result.complaint_id,
          step: '5'
        }
      });

    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to submit complaint. Please try again.';
      
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('Server error: 5')) {
        userMessage = 'Server is currently unavailable. Please try again later.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      Alert.alert('Submission Failed', userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Review & Submit
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Please review your complaint before submitting
          </ThemedText>
        </View>

        {/* Complaint Description */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Issue Description
            </Text>
            {complaintData?.inputMethod === 'text' ? (
              <Text variant="bodyMedium" style={styles.descriptionText}>
                {complaintData.description}
              </Text>
            ) : (
              <View style={styles.voiceNoteContainer}>
                <Text variant="bodyMedium" style={styles.descriptionText}>
                  Voice recording feature is currently unavailable (requires expo-av package).
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Location */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location
            </Text>
            <Text variant="bodyMedium" style={styles.locationText}>
              📍 {locationData?.address}
            </Text>
            {locationData?.lat && locationData?.lng && (
              <Text variant="bodySmall" style={styles.coordinatesText}>
                Coordinates: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Media */}
        {mediaData.length > 0 && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Media ({mediaData.length} items)
              </Text>
              <View style={styles.mediaGrid}>
                {mediaData.map((item: any, index: number) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                    <Text style={styles.mediaType}>
                      {item.type === 'video' ? '🎥' : '📷'}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Summary */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Description:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {complaintData?.inputMethod === 'text' ? 'Text' : 'Voice Note'}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Location:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {locationData?.lat ? 'Current Location' : 'Manual Entry'}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Media:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {mediaData.length} items
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.backButton}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
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
  scrollView: {
    flex: 1,
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
  card: {
    margin: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionText: {
    color: '#333',
    lineHeight: 22,
  },
  voiceNoteContainer: {
    alignItems: 'center',
    padding: 12,
  },
  playButton: {
    marginBottom: 8,
  },
  voiceNoteText: {
    color: '#666',
  },
  locationText: {
    color: '#333',
    marginBottom: 4,
  },
  coordinatesText: {
    color: '#666',
    fontSize: 12,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mediaType: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValue: {
    color: '#666',
  },
  divider: {
    marginVertical: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#2196f3',
  },
});
