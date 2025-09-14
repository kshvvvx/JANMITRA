import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Chip, IconButton } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const CATEGORIES = [
  { id: 'roads', label: 'Roads & Potholes', icon: '🛣️' },
  { id: 'sanitation', label: 'Sanitation', icon: '🗑️' },
  { id: 'electric', label: 'Electricity', icon: '⚡' },
  { id: 'water', label: 'Water Supply', icon: '💧' },
  { id: 'parks', label: 'Parks & Gardens', icon: '🌳' },
  { id: 'traffic', label: 'Traffic & Signals', icon: '🚦' },
  { id: 'other', label: 'Other', icon: '📋' },
];

export default function ReportScreen() {
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('Getting location...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetLocation = () => {
    // TODO: Implement location fetching
    setLocation('Near Sector X Market, Delhi');
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description of the issue');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Implement actual API call
      const complaintData = {
        citizen_id: 'user-123', // TODO: Get from auth context
        description: description.trim(),
        category: selectedCategory,
        location: {
          lat: 28.7041,
          lng: 77.1025,
          address: location
        },
        media: []
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success!',
        'Your complaint has been submitted successfully. You can track its progress in "My Issues" tab.',
        [
          {
            text: 'OK',
            onPress: () => {
              setDescription('');
              setSelectedCategory('');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
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
            Report Issue
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Help make your city better
          </ThemedText>
        </View>

        {/* Description */}
        <Animatable.View animation="fadeInUp" delay={200}>
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Describe the Issue
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Describe the civic issue you want to report..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.textInput}
              />
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Category Selection */}
        <Animatable.View animation="fadeInUp" delay={400}>
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Category
              </Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((category, index) => (
                  <Animatable.View
                    key={category.id}
                    animation="bounceIn"
                    delay={600 + index * 100}
                  >
                    <Chip
                      mode={selectedCategory === category.id ? 'flat' : 'outlined'}
                      selected={selectedCategory === category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.id && styles.selectedChip
                      ]}
                      textStyle={styles.categoryText}
                    >
                      {category.icon} {category.label}
                    </Chip>
                  </Animatable.View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Location */}
        <Animatable.View animation="fadeInUp" delay={800}>
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.locationHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Location
                </Text>
                <IconButton
                  icon="crosshairs-gps"
                  size={20}
                  onPress={handleGetLocation}
                />
              </View>
              <Text variant="bodyMedium" style={styles.locationText}>
                📍 {location}
              </Text>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Media Upload Placeholder */}
        <Animatable.View animation="fadeInUp" delay={1000}>
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Add Photos/Videos
              </Text>
              <View style={styles.mediaPlaceholder}>
                <Text variant="bodyMedium" style={styles.mediaText}>
                  📷 Tap to add photos or videos
                </Text>
                <Text variant="bodySmall" style={styles.mediaSubtext}>
                  (Coming soon)
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View animation="fadeInUp" delay={1200}>
          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </View>
        </Animatable.View>
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  categoryText: {
    fontSize: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: '#666',
    paddingLeft: 4,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  mediaText: {
    color: '#666',
    marginBottom: 4,
  },
  mediaSubtext: {
    color: '#999',
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
