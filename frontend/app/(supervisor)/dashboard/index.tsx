import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

type DashboardStats = {
  totalComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  departments: Array<{ name: string; count: number }>;
};

export default function SupervisorDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    departments: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await apiService.getSupervisorDashboard();
      // setStats(data);
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          totalComplaints: 142,
          pendingComplaints: 42,
          inProgressComplaints: 67,
          resolvedComplaints: 33,
          departments: [
            { name: 'Sanitation', count: 25 },
            { name: 'Roads', count: 18 },
            { name: 'Electricity', count: 12 },
            { name: 'Water', count: 8 },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Supervisor Dashboard</Title>
      
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title>{stats.totalComplaints}</Title>
            <Paragraph>Total Complaints</Paragraph>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={{ color: theme.colors.warning }}>{stats.pendingComplaints}</Title>
            <Paragraph>Pending</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={{ color: theme.colors.primary }}>{stats.inProgressComplaints}</Title>
            <Paragraph>In Progress</Paragraph>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={{ color: theme.colors.success }}>{stats.resolvedComplaints}</Title>
            <Paragraph>Resolved</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.sectionCard}>
        <Card.Title title="Departments" />
        <Card.Content>
          {stats.departments.map((dept) => (
            <View key={dept.name} style={styles.deptRow}>
              <Paragraph>{dept.name}</Paragraph>
              <Paragraph style={styles.deptCount}>{dept.count} complaints</Paragraph>
            </View>
          ))}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => router.push('/(supervisor)/departments')}>
            View All Departments
          </Button>
        </Card.Actions>
      </Card>

      <View style={styles.buttonRow}>
        <Button 
          mode="contained" 
          style={styles.actionButton}
          onPress={() => router.push('/(supervisor)/complaints')}
        >
          View All Complaints
        </Button>
        <Button 
          mode="outlined" 
          style={styles.actionButton}
          onPress={() => router.push('/(supervisor)/analytics')}
        >
          View Analytics
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionCard: {
    marginBottom: 16,
  },
  deptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deptCount: {
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
