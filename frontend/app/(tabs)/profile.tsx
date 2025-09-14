import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, List, Switch, Button, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { getUserInfo, clearAuth, UserInfo } from '../../utils/auth';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function ProfileScreen() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          await clearAuth();
          router.replace('/auth/citizen-login');
        }}
      ]
    );
  };

  const handleStaffLogin = () => {
    router.push('/auth/staff-login');
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      } catch (error) {
        console.error('Error loading user info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <ThemedText type="title" style={styles.userName}>
            {user?.name || 'Citizen User'}
          </ThemedText>
          <ThemedText type="default" style={styles.userEmail}>
            {user?.phone || user?.email || 'user@janmitra.com'}
          </ThemedText>
        </View>

        {/* Stats */}
        <Card style={styles.statsCard} mode="outlined">
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>5</Text>
                <Text variant="bodyMedium" style={styles.statLabel}>Issues Reported</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>3</Text>
                <Text variant="bodyMedium" style={styles.statLabel}>Resolved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>12</Text>
                <Text variant="bodyMedium" style={styles.statLabel}>Upvotes Given</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Settings
            </Text>
            
            <List.Item
              title="Push Notifications"
              description="Get notified about issue updates"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Location Services"
              description="Allow location access for nearby issues"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actions
            </Text>
            
            <List.Item
              title="Staff Login"
              description="Access staff dashboard"
              left={(props) => <List.Icon {...props} icon="account-tie" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleStaffLogin}
            />
            
            <Divider />
            
            <List.Item
              title="Help & Support"
              description="Get help with the app"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Help pressed')}
            />
            
            <Divider />
            
            <List.Item
              title="About JANMITRA"
              description="Learn more about the app"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('About pressed')}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#d32f2f"
            buttonColor="transparent"
          >
            Logout
          </Button>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text variant="bodySmall" style={styles.versionText}>
            JANMITRA v1.0.0
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    padding: 30,
    paddingTop: 80,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  statsCard: {
    margin: 16,
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutContainer: {
    padding: 16,
    paddingTop: 8,
  },
  logoutButton: {
    borderColor: '#d32f2f',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
