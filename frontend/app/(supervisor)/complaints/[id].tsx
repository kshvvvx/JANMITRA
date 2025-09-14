import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Divider, Chip, useTheme, ActivityIndicator, IconButton, Menu } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Complaint } from '@/types/complaint';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import MapView, { Marker } from 'react-native-maps';
import { formatDistanceToNow } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await apiService.getComplaint(id as string);
      // setComplaint(data);
      
      // Mock data for now
      setTimeout(() => {
        setComplaint({
          id: id as string,
          description: 'Broken water pipe causing water wastage and road damage',
          status: 'pending',
          category: 'Water',
          location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: '123 Main Road, New Delhi, 110001',
          },
          media: [
            { type: 'image', uri: 'https://via.placeholder.com/600x400?text=Water+Leak' },
            { type: 'image', uri: 'https://via.placeholder.com/600x400?text=Damaged+Road' },
          ],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'user123',
          userName: 'Rahul Sharma',
          userPhone: '+919876543210',
          isAnonymous: false,
          priority: 'high',
          upvotes: 15,
          confirmations: 3,
          actions: [
            {
              actorType: 'user',
              actorId: 'user123',
              action: 'created',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading complaint:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load complaint details');
    }
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      // TODO: Implement assignment logic
      Alert.alert('Success', 'Complaint assigned successfully');
    } catch (error) {
      console.error('Error assigning complaint:', error);
      Alert.alert('Error', 'Failed to assign complaint');
    } finally {
      setAssigning(false);
      setMenuVisible(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setEscalating(true);
      // TODO: Implement escalation logic
      Alert.alert('Success', 'Complaint escalated to higher authority');
    } catch (error) {
      console.error('Error escalating complaint:', error);
      Alert.alert('Error', 'Failed to escalate complaint');
    } finally {
      setEscalating(false);
      setMenuVisible(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.primary;
      case 'resolved':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  if (loading || !complaint) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.complaintId}>Complaint #{complaint.id}</Text>
            <View style={styles.statusRow}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(complaint.status)}20` }]}
                textStyle={{ color: getStatusColor(complaint.status) }}
              >
                {complaint.status.replace('_', ' ')}
              </Chip>
              <Chip style={styles.priorityChip}>
                {complaint.priority} priority
              </Chip>
            </View>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item 
              onPress={handleAssign} 
              title="Assign to Department" 
              leadingIcon="account-group"
              disabled={assigning}
            />
            <Menu.Item 
              onPress={handleEscalate} 
              title="Escalate Issue" 
              leadingIcon="alert"
              disabled={escalating}
            />
          </Menu>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Description</Title>
            <Paragraph style={styles.description}>{complaint.description}</Paragraph>
            
            <Divider style={styles.divider} />
            
            <Title>Location</Title>
            <Paragraph style={styles.locationText}>{complaint.location.address}</Paragraph>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: complaint.location.latitude,
                  longitude: complaint.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: complaint.location.latitude,
                    longitude: complaint.location.longitude,
                  }}
                  pinColor={theme.colors.primary}
                />
              </MapView>
            </View>

            <Divider style={styles.divider} />
            
            <Title>Media</Title>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaContainer}
            >
              {complaint.media?.map((item, index) => (
                <Image
                  key={index}
                  source={{ uri: item.uri }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            <Divider style={styles.divider} />
            
            <Title>Details</Title>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text>{complaint.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reported by:</Text>
              <Text>{complaint.isAnonymous ? 'Anonymous' : complaint.userName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reported:</Text>
              <Text>{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status updated:</Text>
              <Text>{formatDistanceToNow(new Date(complaint.updatedAt), { addSuffix: true })}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Upvotes:</Text>
              <Text>{complaint.upvotes}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confirmations:</Text>
              <Text>{complaint.confirmations}/3</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.actionsCard]}>
          <Card.Title title="Actions" />
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                icon="message-text" 
                style={styles.actionButton}
                onPress={() => {}}
              >
                Chat
              </Button>
              <Button 
                mode="outlined" 
                icon="history" 
                style={styles.actionButton}
                onPress={() => {}}
              >
                History
              </Button>
              <Button 
                mode="outlined" 
                icon="account-group" 
                style={styles.actionButton}
                onPress={() => {}}
              >
                Assign
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          mode="contained" 
          style={styles.resolveButton}
          onPress={() => {}}
        >
          Mark as Resolved
        </Button>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flex: 1,
  },
  complaintId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusChip: {
    marginRight: 8,
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  card: {
    margin: 16,
    borderRadius: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  locationText: {
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaContainer: {
    paddingVertical: 8,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  actionsCard: {
    marginBottom: 80, // Space for the fixed footer button
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginBottom: 8,
    flexBasis: '48%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 4,
  },
  resolveButton: {
    width: '100%',
  },
});
