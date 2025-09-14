import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import { authenticatedFetch, API_ENDPOINTS } from '../../utils/auth';

interface NearbyComplaint {
  id: string;
  description: string;
  status: 'unresolved' | 'in-progress' | 'resolved';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  upvotes: number;
  created_at: string;
  distance: number;
}

export default function NearbyScreen() {
  const [complaints, setComplaints] = useState<NearbyComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5); // Default 5km radius

  useEffect(() => {
    getCurrentLocationAndFetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocationAndFetch = async () => {
    try {
      setLocationError(null);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location access to see nearby complaints.');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
      
      setCurrentLocation(coords);
      await fetchNearbyComplaints(coords.lat, coords.lng);
      
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Failed to get current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyComplaints = async (lat: number, lng: number) => {
    try {
      const response = await authenticatedFetch(
        API_ENDPOINTS.NEARBY_COMPLAINTS(lat, lng, radius)
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setComplaints(data.complaints || []);
      
    } catch (error) {
      console.error('Error fetching nearby complaints:', error);
      Alert.alert('Error', 'Failed to fetch nearby complaints. Please try again.');
    }
  };

  const onRefresh = async () => {
    if (!currentLocation) {
      await getCurrentLocationAndFetch();
      return;
    }
    
    setRefreshing(true);
    try {
      await fetchNearbyComplaints(currentLocation.lat, currentLocation.lng);
    } finally {
      setRefreshing(false);
    }
  };

  const handleComplaintPress = (complaintId: string) => {
    router.push(`/complaint-detail?id=${complaintId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'unresolved': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return 'Resolved';
      case 'in-progress': return 'In Progress';
      case 'unresolved': return 'Unresolved';
      default: return status;
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  const changeRadius = (newRadius: number) => {
    setRadius(newRadius);
    if (currentLocation) {
      setLoading(true);
      fetchNearbyComplaints(currentLocation.lat, currentLocation.lng)
        .finally(() => setLoading(false));
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </ThemedView>
    );
  }

  if (locationError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
          <Button 
            mode="contained" 
            onPress={getCurrentLocationAndFetch}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Nearby Issues
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Issues reported near your location
        </ThemedText>
      </View>

      {/* Radius Filter */}
      <View style={styles.filterContainer}>
        <Text variant="titleSmall" style={styles.filterTitle}>Search Radius:</Text>
        <View style={styles.radiusChips}>
          {[1, 2, 5, 10, 20].map((r) => (
            <Chip
              key={r}
              selected={radius === r}
              onPress={() => changeRadius(r)}
              style={styles.radiusChip}
            >
              {r}km
            </Chip>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {complaints.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No nearby issues found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                There are no reported issues within {radius}km of your location.
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => changeRadius(radius * 2)}
                style={styles.expandButton}
              >
                Expand search to {radius * 2}km
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Text variant="bodyMedium" style={styles.resultsText}>
              Found {complaints.length} issues within {radius}km
            </Text>
            
            {complaints.map((complaint) => (
              <Card
                key={complaint.id}
                style={styles.complaintCard}
                mode="outlined"
                onPress={() => handleComplaintPress(complaint.id)}
              >
                <Card.Content>
                  <View style={styles.complaintHeader}>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
                      textStyle={styles.statusText}
                    >
                      {getStatusText(complaint.status)}
                    </Chip>
                    <Text variant="bodySmall" style={styles.distanceText}>
                      {formatDistance(complaint.distance)} away
                    </Text>
                  </View>
                  
                  <Text variant="titleMedium" style={styles.complaintTitle} numberOfLines={2}>
                    {complaint.description}
                  </Text>
                  
                  <Text variant="bodySmall" style={styles.locationText}>
                    📍 {complaint.location.address}
                  </Text>
                  
                  <View style={styles.complaintFooter}>
                    <Text variant="bodySmall" style={styles.upvotesText}>
                      👍 {complaint.upvotes} upvotes
                    </Text>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB for reporting new issue */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/complaint-flow/MediaCaptureScreen')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: '#f44336',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196f3',
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
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    marginBottom: 8,
    color: '#333',
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  resultsText: {
    padding: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyCard: {
    margin: 16,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  expandButton: {
    alignSelf: 'center',
  },
  complaintCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  distanceText: {
    color: '#666',
    fontWeight: 'bold',
  },
  complaintTitle: {
    marginBottom: 8,
    color: '#333',
  },
  locationText: {
    color: '#666',
    marginBottom: 8,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upvotesText: {
    color: '#666',
  },
  dateText: {
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196f3',
  },
});
