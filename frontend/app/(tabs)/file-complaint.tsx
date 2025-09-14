import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function FileComplaintScreen() {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse coordinates if provided
      let lat = null;
      let lng = null;
      
      if (latitude.trim() && longitude.trim()) {
        lat = parseFloat(latitude);
        lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
          Alert.alert('Error', 'Invalid latitude or longitude format');
          setIsSubmitting(false);
          return;
        }
      }

      const complaintData = {
        citizen_id: 'test-user',
        description: description.trim(),
        location: {
          lat: lat,
          lng: lng,
          address: address.trim()
        },
        media: []
      };

      const response = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit complaint');
      }

      const result = await response.json();
      
      Alert.alert(
        'Success!',
        `Complaint submitted with ID: ${result.complaint_id}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setDescription('');
              setAddress('');
              setLatitude('');
              setLongitude('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Error', error.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            File Complaint
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Submit a new civic issue
          </ThemedText>
        </View>

        {/* Description Input */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Description
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Describe the civic issue..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.textInput}
            />
          </Card.Content>
        </Card>

        {/* Address Input */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Address
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Enter the address of the issue..."
              value={address}
              onChangeText={setAddress}
              style={styles.textInput}
            />
          </Card.Content>
        </Card>

        {/* Coordinates Input (Optional) */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Coordinates (Optional - for testing)
            </Text>
            <View style={styles.coordinatesContainer}>
              <TextInput
                mode="outlined"
                placeholder="Latitude"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                style={[styles.textInput, styles.coordinateInput]}
              />
              <TextInput
                mode="outlined"
                placeholder="Longitude"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                style={[styles.textInput, styles.coordinateInput]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </View>
      </ScrollView>
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
    marginTop: 0,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  textInput: {
    backgroundColor: '#fff',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#2196f3',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
