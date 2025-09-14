import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Text, Button, Card, IconButton } from 'react-native-paper';
// import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

export default function MediaCaptureScreen() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const router = useRouter();

  const requestPermissions = async () => {
    // Media permissions disabled until expo-image-picker is installed
    Alert.alert('Feature Unavailable', 'Media capture requires expo-image-picker package. Please install dependencies first.');
    return false;
  };

  const capturePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Camera functionality disabled until expo-image-picker is installed
    Alert.alert('Feature Unavailable', 'Camera capture requires expo-image-picker package.');
    return;

    // const result = await ImagePicker.launchCameraAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [4, 3],
    //   quality: 0.8,
    // });

    // if (!result.canceled && result.assets[0]) {
    //   const newMedia: MediaItem = {
    //     uri: result.assets[0].uri,
    //     type: 'image'
    //   };
    //   setMedia(prev => [...prev, newMedia]);
    // }
  };

  const captureVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Video capture functionality disabled until expo-image-picker is installed
    Alert.alert('Feature Unavailable', 'Video capture requires expo-image-picker package.');
    return;

    // const result = await ImagePicker.launchCameraAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    //   allowsEditing: true,
    //   videoMaxDuration: 30,
    //   quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    // });

    // if (!result.canceled && result.assets[0]) {
    //   const newMedia: MediaItem = {
    //     uri: result.assets[0].uri,
    //     type: 'video'
    //   };
    //   setMedia(prev => [...prev, newMedia]);
    // }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Gallery functionality disabled until expo-image-picker is installed
    Alert.alert('Feature Unavailable', 'Gallery selection requires expo-image-picker package.');
    return;

    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.All,
    //   allowsEditing: true,
    //   aspect: [4, 3],
    //   quality: 0.8,
    //   allowsMultipleSelection: true,
    // });

    // if (!result.canceled) {
    //   const newMediaItems: MediaItem[] = result.assets.map((asset: any) => ({
    //     uri: asset.uri,
    //     type: asset.type === 'video' ? 'video' : 'image'
    //   }));
    //   setMedia(prev => [...prev, ...newMediaItems]);
    // }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    // Pass media data to next screen
    const mediaData = media.length > 0 ? media : [];
    router.push({
      pathname: '/complaint-flow/LocationScreen',
      params: { 
        media: JSON.stringify(mediaData),
        step: '2'
      }
    });
  };

  const handleSkip = () => {
    // Continue without media
    router.push({
      pathname: '/complaint-flow/LocationScreen',
      params: { 
        media: JSON.stringify([]),
        step: '2'
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Add Media
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Capture or upload photos/videos of the issue
        </ThemedText>
      </View>

      {/* Media Capture Options */}
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Capture Media
          </Text>
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={capturePhoto}
              icon="camera"
              style={styles.actionButton}
            >
              Photo
            </Button>
            <Button
              mode="outlined"
              onPress={captureVideo}
              icon="video"
              style={styles.actionButton}
            >
              Video
            </Button>
            <Button
              mode="outlined"
              onPress={pickFromGallery}
              icon="image"
              style={styles.actionButton}
            >
              Gallery
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Media Preview */}
      {media.length > 0 && (
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Selected Media ({media.length})
            </Text>
            <View style={styles.mediaGrid}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removeMedia(index)}
                    style={styles.removeButton}
                  />
                  <Text style={styles.mediaType}>
                    {item.type === 'video' ? '🎥' : '📷'}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.backButton}
        >
          Back
        </Button>
        <View style={styles.rightButtons}>
          <Button
            mode="outlined"
            onPress={handleSkip}
            style={styles.skipButton}
          >
            Skip
          </Button>
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.nextButton}
          >
            Next
          </Button>
        </View>
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
  card: {
    margin: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  mediaType: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: 'auto',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    minWidth: 80,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  skipButton: {
    minWidth: 80,
  },
  nextButton: {
    minWidth: 80,
    backgroundColor: '#2196f3',
  },
});
