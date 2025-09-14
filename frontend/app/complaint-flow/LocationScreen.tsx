import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Card, Switch, TextInput } from 'react-native-paper';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LocationSelector from '@/components/LocationSelector';

// Location state interface
interface LocationData {
  state: string;
  city: string;
  area: string;
  stateId: string;
  cityId: string;
}

export default function LocationScreen() {
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    state: '',
    city: '',
    area: '',
    stateId: '',
    cityId: ''
  });
  const [extraDetails, setExtraDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (useCurrentLocation) {
      getCurrentLocation();
    }
  }, [useCurrentLocation]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get current location.');
        setUseCurrentLocation(false);
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        address: address[0] ? `${address[0].name}, ${address[0].city}, ${address[0].region}` : 'Current Location'
      });
    } catch {
      Alert.alert('Error', 'Failed to get current location. Please try again or enter manually.');
      setUseCurrentLocation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    let locationPayload;

    if (useCurrentLocation) {
      if (!currentLocation) {
        Alert.alert('Error', 'Please wait for location to be fetched or switch to manual entry.');
        return;
      }
      locationPayload = currentLocation;
    } else {
      if (!locationData.state || !locationData.city || !locationData.area) {
        Alert.alert('Error', 'Please fill in all location fields.');
        return;
      }
      locationPayload = {
        lat: null,
        lng: null,
        address: `${locationData.area}, ${locationData.city}, ${locationData.state}${extraDetails ? `, ${extraDetails}` : ''}`,
        stateId: locationData.stateId,
        cityId: locationData.cityId
      };
    }

    router.push({
      pathname: '/complaint-flow/ComplaintInputScreen',
      params: {
        media: params.media,
        location: JSON.stringify(locationPayload),
        step: '3'
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleLocationSelect = (location: LocationData) => {
    setLocationData(location);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Location
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Where is the issue located?
          </ThemedText>
        </View>

        {/* Current Location Toggle */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleText}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Use Current Location
                </Text>
                <Text variant="bodySmall" style={styles.toggleSubtext}>
                  Automatically detect your location
                </Text>
              </View>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Current Location Display */}
        {useCurrentLocation && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Current Location
              </Text>
              {isLoading ? (
                <Text>Getting location...</Text>
              ) : currentLocation ? (
                <View>
                  <Text variant="bodyMedium" style={styles.locationText}>
                    📍 {currentLocation.address}
                  </Text>
                  <Text variant="bodySmall" style={styles.coordinatesText}>
                    Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.errorText}>Failed to get location</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Manual Location Entry */}
        {!useCurrentLocation && (
          <Card style={[styles.card, styles.manualEntryCard]} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Enter Location Manually
              </Text>
              
              <LocationSelector 
                onLocationSelect={handleLocationSelect}
                showSearch={true}
                style={styles.locationSelector}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <TextInput
                  value={extraDetails}
                  onChangeText={setExtraDetails}
                  placeholder="E.g., Near Central Park, Behind Mall"
                  style={[styles.pickerInput, styles.textArea]}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

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
          disabled={useCurrentLocation && !currentLocation}
        >
          Next
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
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
  manualEntryCard: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleSubtext: {
    color: '#666',
    marginTop: 4,
  },
  locationText: {
    color: '#333',
    marginBottom: 4,
  },
  coordinatesText: {
    color: '#666',
  },
  errorText: {
    color: '#f44336',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: '#fff',
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
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#2196f3',
  },
  locationSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  pickerInput: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
