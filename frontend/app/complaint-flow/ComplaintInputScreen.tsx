import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, TextInput, IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ComplaintInputScreen() {
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  const [description, setDescription] = useState('');
  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();

  // Audio recording functions
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play recording', err);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const deleteRecording = () => {
    setRecordingUri(null);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (inputMethod === 'text' && !description.trim()) {
      Alert.alert('Error', 'Please enter a description of the issue.');
      return;
    }

    // Voice recording validation
    if (inputMethod === 'voice' && !recordingUri) {
      Alert.alert('Error', 'Please record a voice note describing the issue.');
      return;
    }
    
    // if (inputMethod === 'voice' && !recordingUri) {
    //   Alert.alert('Error', 'Please record a voice note describing the issue.');
    //   return;
    // }

    const complaintData = {
      description: inputMethod === 'text' ? description.trim() : null,
      voiceNote: recordingUri,
      inputMethod
    };

    router.push({
      pathname: '/complaint-flow/ReviewSubmitScreen',
      params: {
        media: params.media,
        location: params.location,
        complaint: JSON.stringify(complaintData),
        step: '4'
      }
    });
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
            Describe Issue
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Tell us about the problem
          </ThemedText>
        </View>

        {/* Input Method Selection */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              How would you like to describe the issue?
            </Text>
            <View style={styles.methodContainer}>
              <Button
                mode={inputMethod === 'text' ? 'contained' : 'outlined'}
                onPress={() => setInputMethod('text')}
                icon="text"
                style={styles.methodButton}
              >
                Type
              </Button>
              <Button
                mode={inputMethod === 'voice' ? 'contained' : 'outlined'}
                onPress={() => setInputMethod('voice')}
                icon="microphone"
                style={styles.methodButton}
              >
                Record
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Describe the Issue
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Describe the civic issue in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                style={styles.textInput}
              />
              <Text variant="bodySmall" style={styles.helperText}>
                Be specific about what you observed, when it happened, and how it affects you or others.
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Voice Recording - Disabled until expo-av is installed */}
        {inputMethod === 'voice' && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Voice Recording Unavailable
              </Text>
              <Text variant="bodyMedium" style={styles.helperText}>
                Voice recording requires expo-av package. Please install dependencies or use text input instead.
              </Text>
              <Button mode="outlined" onPress={() => setInputMethod('text')}>
                Switch to Text Input
              </Button>
            </Card.Content>
          </Card>
        )}
        
        {inputMethod === 'voice' && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Record Voice Note
              </Text>
              
              {!recordingUri ? (
                <View style={styles.recordingContainer}>
                  <IconButton
                    icon={isRecording ? "stop" : "microphone"}
                    size={60}
                    iconColor={isRecording ? "#f44336" : "#2196f3"}
                    style={[
                      styles.recordButton,
                      isRecording && styles.recordingActive
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                  />
                  <Text variant="bodyMedium" style={styles.recordingText}>
                    {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
                  </Text>
                </View>
              ) : (
                <View style={styles.playbackContainer}>
                  <View style={styles.playbackControls}>
                    <IconButton
                      icon={isPlaying ? "pause" : "play"}
                      size={40}
                      onPress={playRecording}
                      style={styles.playButton}
                    />
                    <IconButton
                      icon="delete"
                      size={40}
                      onPress={deleteRecording}
                      style={styles.deleteButton}
                    />
                  </View>
                  <Text variant="bodyMedium" style={styles.playbackText}>
                    {isPlaying ? 'Playing...' : 'Voice note recorded'}
                  </Text>
                  <Text variant="bodySmall" style={styles.helperText}>
                    Tap play to review or delete to record again
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.backButton}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
        >
          Next
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
  methodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#fff',
    minHeight: 120,
  },
  helperText: {
    color: '#666',
    marginTop: 8,
  },
  recordingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  recordButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 3,
    borderColor: '#2196f3',
  },
  recordingActive: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  recordingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  playbackContainer: {
    alignItems: 'center',
    padding: 20,
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 20,
  },
  playButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  playbackText: {
    marginTop: 12,
    textAlign: 'center',
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
  nextButton: {
    flex: 2,
    backgroundColor: '#2196f3',
  },
});
