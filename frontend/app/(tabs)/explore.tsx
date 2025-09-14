import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, IconButton, FAB } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface NearbyComplaint {
  complaint_id: string;
  description: string;
  status: string;
  created_at: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  upvotes: string[];
  category: string;
  distance?: number;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  roads: '🛣️',
  sanitation: '🗑️',
  electric: '⚡',
  water: '💧',
  parks: '🌳',
  traffic: '🚦',
  other: '📋',
};

export default function NearbyScreen() {
  const [complaints, setComplaints] = useState<NearbyComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState('Getting location...');

  const fetchNearbyComplaints = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5000/api/complaints?near=28.7041,77.1025&radius_km=5');
      // const data = await response.json();
      
      // Mock data for now
      const mockComplaints: NearbyComplaint[] = [
        {
          complaint_id: 'compl-0003',
          description: 'Large pothole causing vehicle damage',
          status: 'unresolved',
          created_at: '2024-01-16T09:15:00Z',
          location: { 
            address: 'Main Road, Sector X',
            lat: 28.7041,
            lng: 77.1025
          },
          upvotes: ['user-456', 'user-789', 'user-101'],
          category: 'roads',
          distance: 0.2
        },
        {
          complaint_id: 'compl-0004',
          description: 'Garbage not collected for 3 days',
          status: 'in-progress',
          created_at: '2024-01-15T14:30:00Z',
          location: { 
            address: 'Residential Area, Sector Y',
            lat: 28.7051,
            lng: 77.1035
          },
          upvotes: ['user-123', 'user-456'],
          category: 'sanitation',
          distance: 0.5
        },
        {
          complaint_id: 'compl-0005',
          description: 'Street light not working at night',
          status: 'unresolved',
          created_at: '2024-01-14T18:45:00Z',
          location: { 
            address: 'Park Street, Sector Z',
            lat: 28.7031,
            lng: 77.1015
          },
          upvotes: ['user-789'],
          category: 'electric',
          distance: 0.8
        }
      ];
      
      setComplaints(mockComplaints);
      setUserLocation('Near Sector X Market, Delhi');
    } catch (error) {
      console.error('Error fetching nearby complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNearbyComplaints();
    setRefreshing(false);
  };

  const handleUpvote = async (complaintId: string) => {
    try {
      // TODO: Implement actual API call
      // await fetch(`http://localhost:5000/api/complaints/${complaintId}/upvote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ citizen_id: 'user-123' })
      // });
      
      // Update local state
      setComplaints(prev => prev.map(complaint => 
        complaint.complaint_id === complaintId
          ? { ...complaint, upvotes: [...complaint.upvotes, 'user-123'] }
          : complaint
      ));
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  useEffect(() => {
    fetchNearbyComplaints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unresolved': return '#ff9800';
      case 'in-progress': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'closed': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unresolved': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComplaint = ({ item, index }: { item: NearbyComplaint; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={styles.complaintContainer}
    >
      <Card style={styles.complaintCard} mode="outlined">
        <Card.Content>
          <View style={styles.complaintHeader}>
            <View style={styles.complaintTitleContainer}>
              <Text variant="titleMedium" style={styles.complaintTitle}>
                {CATEGORY_ICONS[item.category] || '📋'} {item.description}
              </Text>
              <Text variant="bodySmall" style={styles.complaintDistance}>
                📍 {item.distance?.toFixed(1)}km away
              </Text>
            </View>
            <Chip 
              mode="outlined" 
              textStyle={{ color: getStatusColor(item.status) }}
              style={{ borderColor: getStatusColor(item.status) }}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>
          
          <Text variant="bodyMedium" style={styles.complaintLocation}>
            {item.location.address}
          </Text>
          
          <View style={styles.complaintFooter}>
            <View style={styles.complaintMeta}>
              <Text variant="bodySmall" style={styles.complaintDate}>
                {formatDate(item.created_at)}
              </Text>
              <Text variant="bodySmall" style={styles.complaintUpvotes}>
                👍 {item.upvotes.length} upvotes
              </Text>
            </View>
            <Animatable.View animation="pulse" iterationCount="infinite">
              <IconButton
                icon="thumb-up-outline"
                size={20}
                onPress={() => handleUpvote(item.complaint_id)}
                style={styles.upvoteButton}
              />
            </Animatable.View>
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Nearby Issues
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          📍 {userLocation}
        </ThemedText>
      </View>

      {complaints.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No issues nearby
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Great! Your area seems to be well-maintained
          </Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderComplaint}
          keyExtractor={(item) => item.complaint_id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to complaint creation screen
          console.log('Create new complaint');
        }}
      />
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
  listContainer: {
    padding: 16,
  },
  complaintContainer: {
    marginBottom: 12,
  },
  complaintCard: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  complaintTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  complaintTitle: {
    lineHeight: 20,
    marginBottom: 4,
  },
  complaintDistance: {
    color: '#666',
  },
  complaintLocation: {
    color: '#666',
    marginBottom: 8,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintMeta: {
    flex: 1,
  },
  complaintDate: {
    color: '#999',
    marginBottom: 2,
  },
  complaintUpvotes: {
    color: '#666',
  },
  upvoteButton: {
    margin: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
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
