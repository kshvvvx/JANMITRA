import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, Switch, TextInput } from 'react-native-paper';
// import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Commented out for now - will be used when Picker component is available
// const STATES = [
//   'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
//   'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
//   'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
//   'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
//   'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
//   'Uttarakhand', 'West Bengal'
// ];

// const CITIES: { [key: string]: string[] } = {
//   'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
//   'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
//   'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
//   'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
//   'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
// };

export default function LocationScreen() {
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
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
    let locationData;

    if (useCurrentLocation) {
      if (!currentLocation) {
        Alert.alert('Error', 'Please wait for location to be fetched or switch to manual entry.');
        return;
      }
      locationData = currentLocation;
    } else {
      if (!selectedState || !selectedCity || !selectedArea) {
        Alert.alert('Error', 'Please fill in all location fields.');
        return;
      }
      locationData = {
        lat: null,
        lng: null,
        address: `${selectedArea}, ${selectedCity}, ${selectedState}${extraDetails ? `, ${extraDetails}` : ''}`
      };
    }

    router.push({
      pathname: '/complaint-flow/ComplaintInputScreen',
      params: {
        media: params.media,
        location: JSON.stringify(locationData),
        step: '3'
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  // const availableCities = selectedState ? CITIES[selectedState] || [] : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
          <>
            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Select State
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Select State (manual entry for now)"
                  value={selectedState}
                  onChangeText={setSelectedState}
                  style={styles.textInput}
                />
              </Card.Content>
            </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Select City
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Select City (manual entry for now)"
                  value={selectedCity}
                  onChangeText={setSelectedCity}
                  style={styles.textInput}
                  editable={!!selectedState}
                />
              </Card.Content>
            </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Area/Locality
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Enter area or locality"
                  value={selectedArea}
                  onChangeText={setSelectedArea}
                  style={styles.textInput}
                />
              </Card.Content>
            </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Additional Details (Optional)
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Landmark, street name, etc."
                  value={extraDetails}
                  onChangeText={setExtraDetails}
                  style={styles.textInput}
                />
              </Card.Content>
            </Card>
          </>
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
          disabled={useCurrentLocation && !currentLocation}
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
    flex: 2,
    backgroundColor: '#2196f3',
  },
});
