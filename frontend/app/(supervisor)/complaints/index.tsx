import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Searchbar, Button, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Complaint } from '@/types/complaint';
import { useAuth } from '@/contexts/AuthContext';

const statusColors = {
  pending: '#ff9800',
  in_progress: '#2196f3',
  resolved: '#4caf50',
  rejected: '#f44336',
};

export default function SupervisorComplaints() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadComplaints();
  }, [filter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await apiService.getComplaints({ status: filter === 'all' ? undefined : filter });
      // setComplaints(data);
      
      // Mock data for now
      setTimeout(() => {
        setComplaints(generateMockComplaints(15));
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints();
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complaint.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || complaint.status === filter;
    return matchesSearch && matchesFilter;
  });

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <Card 
      style={styles.complaintCard}
      onPress={() => router.push(`/(supervisor)/complaints/${item.id}`)}
    >
      <Card.Content>
        <View style={styles.complaintHeader}>
          <Title style={styles.complaintId}>{item.id}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: `${statusColors[item.status]}20` }]}
            textStyle={{ color: statusColors[item.status] }}
          >
            {item.status.replace('_', ' ')}
          </Chip>
        </View>
        <Paragraph numberOfLines={2} style={styles.complaintDescription}>
          {item.description}
        </Paragraph>
        <View style={styles.complaintFooter}>
          <Paragraph style={styles.complaintDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Paragraph>
          <View style={styles.complaintStats}>
            <Chip icon="thumb-up" style={styles.statChip}>
              {item.upvotes}
            </Chip>
            {item.media?.length > 0 && (
              <Chip icon="image" style={styles.statChip}>
                {item.media.length}
              </Chip>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search complaints..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Chip 
          mode={filter === 'all' ? 'flat' : 'outlined'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip 
          mode={filter === 'pending' ? 'flat' : 'outlined'}
          onPress={() => setFilter('pending')}
          style={styles.filterChip}
          icon="clock"
        >
          Pending
        </Chip>
        <Chip 
          mode={filter === 'in_progress' ? 'flat' : 'outlined'}
          onPress={() => setFilter('in_progress')}
          style={styles.filterChip}
          icon="progress-wrench"
        >
          In Progress
        </Chip>
        <Chip 
          mode={filter === 'resolved' ? 'flat' : 'outlined'}
          onPress={() => setFilter('resolved')}
          style={styles.filterChip}
          icon="check"
        >
          Resolved
        </Chip>
      </ScrollView>

      <FlatList
        data={filteredComplaints}
        renderItem={renderComplaint}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph>No complaints found</Paragraph>
          </View>
        }
      />
    </View>
  );
}

// Helper function to generate mock complaints
function generateMockComplaints(count: number): Complaint[] {
  const statuses = ['pending', 'in_progress', 'resolved', 'rejected'] as const;
  const categories = ['Sanitation', 'Roads', 'Electricity', 'Water', 'Sewage'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `COMP-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    description: `Complaint about ${categories[i % categories.length].toLowerCase()} issue ${i + 1}`,
    status: statuses[i % statuses.length],
    category: categories[i % categories.length],
    location: {
      latitude: 0,
      longitude: 0,
      address: `${i + 1} Main St, City`,
    },
    media: Array.from({ length: i % 3 }),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    userId: `user${i}`,
    userName: `User ${i + 1}`,
    userPhone: `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`,
    isAnonymous: Math.random() > 0.8,
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    upvotes: Math.floor(Math.random() * 50),
    confirmations: Math.floor(Math.random() * 10),
  }));
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
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  complaintCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  complaintDescription: {
    marginBottom: 12,
    color: '#333',
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  complaintDate: {
    fontSize: 12,
    color: '#666',
  },
  complaintStats: {
    flexDirection: 'row',
  },
  statusChip: {
    height: 24,
    borderRadius: 12,
  },
  statChip: {
    height: 24,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
