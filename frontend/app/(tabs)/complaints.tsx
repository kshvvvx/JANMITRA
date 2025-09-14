import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

interface Complaint {
  complaint_id: string;
  description: string;
  status: string;
  location: {
    address: string;
  };
  upvotes: number;
  created_at: string;
}

export default function ComplaintListScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchComplaints = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Import auth utilities
      const { authenticatedFetch, API_ENDPOINTS } = await import('../../utils/auth');
      
      // Make authenticated API call
      const response = await authenticatedFetch(API_ENDPOINTS.COMPLAINTS);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      setError(error.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints(true);
  }, []);

  const handleRetry = () => {
    fetchComplaints();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return '#4caf50';
      case 'in-progress':
        return '#ff9800';
      case 'unresolved':
      default:
        return '#f44336';
    }
  };

  const handleComplaintPress = (complaint: Complaint) => {
    router.push({
      pathname: '/complaint-detail',
      params: { complaintId: complaint.complaint_id }
    });
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <Card 
      style={styles.complaintCard} 
      mode="outlined"
      onPress={() => handleComplaintPress(item)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.complaintId}>
            #{item.complaint_id}
          </Text>
          <Chip 
            mode="flat"
            textStyle={{ color: '#fff', fontSize: 12 }}
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>
        
        <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text variant="bodySmall" style={styles.location}>
            📍 {item.location?.address || 'Location not specified'}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        
        <View style={styles.upvoteContainer}>
          <Text variant="bodySmall" style={styles.upvotes}>
            👍 {item.upvotes} upvotes
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Complaints Found
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        No complaints have been submitted yet.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text variant="headlineSmall" style={styles.errorTitle}>
        Failed to Load Complaints
      </Text>
      <Text variant="bodyMedium" style={styles.errorMessage}>
        {error}
      </Text>
      <Button 
        mode="contained" 
        onPress={handleRetry}
        style={styles.retryButton}
      >
        Retry
      </Button>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading complaints...
          </Text>
        </View>
      </ThemedView>
    );
  }

  if (error && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        {renderErrorState()}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          All Complaints
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Community reported issues
        </ThemedText>
      </View>

      <FlatList
        data={complaints}
        renderItem={renderComplaint}
        keyExtractor={(item) => item.complaint_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196f3']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
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
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  complaintCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  complaintId: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  statusChip: {
    height: 28,
  },
  description: {
    marginBottom: 12,
    lineHeight: 20,
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    flex: 1,
    color: '#666',
    marginRight: 8,
  },
  date: {
    color: '#999',
    fontSize: 12,
  },
  upvoteContainer: {
    alignItems: 'flex-end',
  },
  upvotes: {
    color: '#666',
    fontSize: 12,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#f44336',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#2196f3',
  },
});
