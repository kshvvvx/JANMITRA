import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, Button, FAB, SegmentedButtons } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

interface StaffComplaint {
  complaint_id: string;
  description: string;
  status: string;
  created_at: string;
  location: {
    address: string;
  };
  upvotes: string[];
  category: string;
  dangerScore?: number;
  aiAnalysis?: {
    urgency_level: string;
    confidence: number;
  };
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

export default function StaffDashboardScreen() {
  const [complaints, setComplaints] = useState<StaffComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock staff token - in real app, get from auth context
  const staffToken = 'mock-staff-token';

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiService.getStaffComplaints(staffToken, {
      //   sort: sortBy,
      //   status: statusFilter === 'all' ? undefined : statusFilter
      // });
      
      // Mock data for now
      const mockComplaints: StaffComplaint[] = [
        {
          complaint_id: 'compl-0001',
          description: 'Large pothole causing vehicle damage',
          status: 'unresolved',
          created_at: '2024-01-16T09:15:00Z',
          location: { address: 'Main Road, Sector X' },
          upvotes: ['user-456', 'user-789', 'user-101'],
          category: 'roads',
          dangerScore: 0.8,
          aiAnalysis: { urgency_level: 'high', confidence: 0.9 }
        },
        {
          complaint_id: 'compl-0002',
          description: 'Garbage not collected for 3 days',
          status: 'in-progress',
          created_at: '2024-01-15T14:30:00Z',
          location: { address: 'Residential Area, Sector Y' },
          upvotes: ['user-123', 'user-456'],
          category: 'sanitation',
          dangerScore: 0.3,
          aiAnalysis: { urgency_level: 'medium', confidence: 0.8 }
        },
        {
          complaint_id: 'compl-0003',
          description: 'Street light not working at night',
          status: 'unresolved',
          created_at: '2024-01-14T18:45:00Z',
          location: { address: 'Park Street, Sector Z' },
          upvotes: ['user-789'],
          category: 'electric',
          dangerScore: 0.6,
          aiAnalysis: { urgency_level: 'medium', confidence: 0.7 }
        }
      ];
      
      setComplaints(mockComplaints);
    } catch (error) {
      console.error('Error fetching staff complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      // TODO: Implement actual API call
      // await apiService.updateComplaintStatus(complaintId, staffToken, {
      //   status: newStatus,
      //   comment: `Status updated to ${newStatus}`
      // });
      
      // Update local state
      setComplaints(prev => prev.map(complaint => 
        complaint.complaint_id === complaintId
          ? { ...complaint, status: newStatus }
          : complaint
      ));
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [sortBy, statusFilter]);

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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
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

  const renderComplaint = ({ item }: { item: StaffComplaint }) => (
    <Card style={styles.complaintCard} mode="outlined">
      <Card.Content>
        <View style={styles.complaintHeader}>
          <View style={styles.complaintTitleContainer}>
            <Text variant="titleMedium" style={styles.complaintTitle}>
              {CATEGORY_ICONS[item.category] || '📋'} {item.description}
            </Text>
            <View style={styles.complaintMeta}>
              <Text variant="bodySmall" style={styles.complaintDate}>
                {formatDate(item.created_at)}
              </Text>
              {item.aiAnalysis && (
                <Chip 
                  mode="outlined" 
                  textStyle={{ color: getUrgencyColor(item.aiAnalysis.urgency_level) }}
                  style={{ borderColor: getUrgencyColor(item.aiAnalysis.urgency_level) }}
                >
                  {item.aiAnalysis.urgency_level.toUpperCase()}
                </Chip>
              )}
            </View>
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
          📍 {item.location.address}
        </Text>
        
        <View style={styles.complaintFooter}>
          <Text variant="bodySmall" style={styles.complaintUpvotes}>
            👍 {item.upvotes.length} upvotes
          </Text>
          {item.dangerScore && (
            <Text variant="bodySmall" style={styles.dangerScore}>
              ⚠️ Danger: {(item.dangerScore * 100).toFixed(0)}%
            </Text>
          )}
        </View>

        {item.status === 'unresolved' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleStatusUpdate(item.complaint_id, 'in-progress')}
              style={styles.actionButton}
            >
              Start Work
            </Button>
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate(item.complaint_id, 'resolved')}
              style={styles.actionButton}
            >
              Mark Resolved
            </Button>
          </View>
        )}

        {item.status === 'in-progress' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate(item.complaint_id, 'resolved')}
              style={styles.actionButton}
            >
              Mark Resolved
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Staff Dashboard
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Manage civic complaints
        </ThemedText>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={sortBy}
          onValueChange={setSortBy}
          buttons={[
            { value: 'priority', label: 'Priority' },
            { value: 'new', label: 'Newest' },
            { value: 'old', label: 'Oldest' },
          ]}
          style={styles.segmentedButtons}
        />
        
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'unresolved', label: 'Pending' },
            { value: 'in-progress', label: 'Active' },
            { value: 'resolved', label: 'Resolved' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {complaints.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No complaints found
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Great job! All complaints are resolved
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
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
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
  filtersContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segmentedButtons: {
    marginBottom: 8,
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
  complaintTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  complaintTitle: {
    lineHeight: 20,
    marginBottom: 4,
  },
  complaintMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complaintDate: {
    color: '#999',
  },
  complaintLocation: {
    color: '#666',
    marginBottom: 8,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  complaintUpvotes: {
    color: '#666',
  },
  dangerScore: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
