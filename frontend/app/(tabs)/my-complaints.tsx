import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface Complaint {
  complaint_id: string;
  description: string;
  status: string;
  created_at: string;
  location: {
    address: string;
  };
  upvotes: string[];
  category: string;
}

export default function MyComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5000/api/complaints?citizen_id=user-123');
      // const data = await response.json();
      
      // Mock data for now
      const mockComplaints: Complaint[] = [
        {
          complaint_id: 'compl-0001',
          description: 'Pothole near market causing traffic issues',
          status: 'in-progress',
          created_at: '2024-01-15T10:30:00Z',
          location: { address: 'Near Sector X Market' },
          upvotes: ['user-456', 'user-789'],
          category: 'roads'
        },
        {
          complaint_id: 'compl-0002',
          description: 'Broken street light on main road',
          status: 'resolved',
          created_at: '2024-01-10T14:20:00Z',
          location: { address: 'Main Road, Sector Y' },
          upvotes: ['user-123'],
          category: 'electric'
        }
      ];
      
      setComplaints(mockComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyComplaints();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMyComplaints();
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
      year: 'numeric'
    });
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <Card style={styles.complaintCard} mode="outlined">
      <Card.Content>
        <View style={styles.complaintHeader}>
          <Text variant="titleMedium" style={styles.complaintTitle}>
            {item.description}
          </Text>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getStatusColor(item.status) }}
            style={{ borderColor: getStatusColor(item.status) }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>
        
        <Text variant="bodyMedium" style={styles.complaintLocation}>
          📍 {item.location.address}
        </Text>
        
        <View style={styles.complaintFooter}>
          <Text variant="bodySmall" style={styles.complaintDate}>
            {formatDate(item.created_at)}
          </Text>
          <Text variant="bodySmall" style={styles.complaintUpvotes}>
            👍 {item.upvotes.length} upvotes
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          My Issues
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Track your reported civic issues
        </ThemedText>
      </View>

      {complaints.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No issues reported yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Start by reporting a civic issue in your area
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
  complaintCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  complaintTitle: {
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
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
  complaintDate: {
    color: '#999',
  },
  complaintUpvotes: {
    color: '#666',
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
