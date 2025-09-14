import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface ComplaintDetail {
  complaint_id: string;
  citizen_id: string;
  description: string;
  status: string;
  location: {
    lat?: number;
    lng?: number;
    address: string;
  };
  media: {
    type: string;
    url: string;
  }[];
  upvotes: number;
  created_at: string;
  actions: {
    actorType: string;
    action: string;
    timestamp: string;
    comment?: string;
  }[];
}

export default function ComplaintDetailScreen() {
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const complaintId = params.complaintId as string;

  const fetchComplaintDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: For physical devices, replace localhost with ngrok URL
      const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setComplaint(data);
    } catch (error: any) {
      console.error('Error fetching complaint detail:', error);
      setError(error.message || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  const handleUpvote = async () => {
    if (!complaint || upvoting) return;

    try {
      setUpvoting(true);

      // TODO: For physical devices, replace localhost with ngrok URL
      const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upvote complaint');
      }

      const result = await response.json();
      
      // Update local state with new upvote count
      setComplaint(prev => prev ? {
        ...prev,
        upvotes: result.upvotes
      } : null);

      Alert.alert('Success', 'Your upvote has been recorded!');
    } catch (error: any) {
      console.error('Error upvoting complaint:', error);
      Alert.alert('Error', 'Failed to upvote complaint. Please try again.');
    } finally {
      setUpvoting(false);
    }
  };

  useEffect(() => {
    if (complaintId) {
      fetchComplaintDetail();
    }
  }, [complaintId, fetchComplaintDetail]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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

  const handleBack = () => {
    router.back();
  };

  const handleRetry = () => {
    fetchComplaintDetail();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading complaint details...
          </Text>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Failed to Load Details
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {error}
          </Text>
          <Button mode="contained" onPress={handleRetry} style={styles.retryButton}>
            Retry
          </Button>
          <Button mode="outlined" onPress={handleBack} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (!complaint) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Complaint Not Found
          </Text>
          <Button mode="outlined" onPress={handleBack} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button mode="text" onPress={handleBack} style={styles.headerBackButton}>
          ← Back
        </Button>
        <ThemedText type="title" style={styles.headerTitle}>
          Complaint Details
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Complaint Info */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="headlineSmall" style={styles.complaintId}>
                #{complaint.complaint_id}
              </Text>
              <Chip 
                mode="flat"
                textStyle={{ color: '#fff', fontSize: 14 }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
              >
                {complaint.status.toUpperCase()}
              </Chip>
            </View>
            
            <Text variant="bodySmall" style={styles.submittedBy}>
              Submitted by: {complaint.citizen_id}
            </Text>
            
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(complaint.created_at)}
            </Text>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Description
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {complaint.description}
            </Text>
          </Card.Content>
        </Card>

        {/* Location */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location
            </Text>
            <Text variant="bodyMedium" style={styles.location}>
              📍 {complaint.location.address}
            </Text>
            {complaint.location.lat && complaint.location.lng && (
              <Text variant="bodySmall" style={styles.coordinates}>
                Coordinates: {complaint.location.lat.toFixed(6)}, {complaint.location.lng.toFixed(6)}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Media */}
        {complaint.media && complaint.media.length > 0 && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Media ({complaint.media.length})
              </Text>
              <View style={styles.mediaGrid}>
                {complaint.media.map((item, index) => (
                  <View key={index} style={styles.mediaItem}>
                    {item.type === 'image' ? (
                      <Image 
                        source={{ uri: item.url }} 
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <Text style={styles.videoText}>🎥 Video</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Upvotes */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.upvoteSection}>
              <View style={styles.upvoteInfo}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Community Support
                </Text>
                <Text variant="bodyMedium" style={styles.upvoteCount}>
                  👍 {complaint.upvotes} people support this complaint
                </Text>
              </View>
              <Button 
                mode="contained" 
                onPress={handleUpvote}
                loading={upvoting}
                disabled={upvoting}
                style={styles.upvoteButton}
              >
                {upvoting ? 'Upvoting...' : 'Upvote'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Action History */}
        {complaint.actions && complaint.actions.length > 0 && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Action History
              </Text>
              {complaint.actions.map((action, index) => (
                <View key={index}>
                  <View style={styles.actionItem}>
                    <Text variant="bodyMedium" style={styles.actionText}>
                      {action.action.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text variant="bodySmall" style={styles.actionDate}>
                      {formatDate(action.timestamp)}
                    </Text>
                  </View>
                  {action.comment && (
                    <Text variant="bodySmall" style={styles.actionComment}>
                      Comment: {action.comment}
                    </Text>
                  )}
                  {index < complaint.actions.length - 1 && <Divider style={styles.actionDivider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBackButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
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
    height: 32,
  },
  submittedBy: {
    color: '#666',
    marginBottom: 4,
  },
  date: {
    color: '#999',
    fontSize: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  description: {
    lineHeight: 22,
    color: '#333',
  },
  location: {
    color: '#333',
    marginBottom: 8,
  },
  coordinates: {
    color: '#666',
    fontStyle: 'italic',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 12,
    color: '#666',
  },
  upvoteSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upvoteInfo: {
    flex: 1,
  },
  upvoteCount: {
    color: '#666',
  },
  upvoteButton: {
    backgroundColor: '#2196f3',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionText: {
    fontWeight: 'bold',
    color: '#333',
  },
  actionDate: {
    color: '#666',
    fontSize: 12,
  },
  actionComment: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actionDivider: {
    marginVertical: 8,
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
    marginBottom: 12,
  },
  backButton: {
    borderColor: '#2196f3',
  },
});
