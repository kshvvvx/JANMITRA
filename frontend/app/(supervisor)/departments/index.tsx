import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Searchbar, Button, Chip, useTheme, ActivityIndicator, IconButton, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface Department {
  id: string;
  name: string;
  head: string;
  contact: string;
  activeComplaints: number;
  resolvedThisMonth: number;
  performance: 'good' | 'average' | 'poor';
}

export default function DepartmentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await apiService.getDepartments();
      // setDepartments(data);
      
      // Mock data for now
      setTimeout(() => {
        setDepartments([
          {
            id: 'dept1',
            name: 'Sanitation Department',
            head: 'Mr. Amit Kumar',
            contact: '+91 98765 43210',
            activeComplaints: 15,
            resolvedThisMonth: 42,
            performance: 'good',
          },
          {
            id: 'dept2',
            name: 'Roads & Infrastructure',
            head: 'Ms. Priya Singh',
            contact: '+91 98765 43211',
            activeComplaints: 28,
            resolvedThisMonth: 35,
            performance: 'average',
          },
          {
            id: 'dept3',
            name: 'Water Supply',
            head: 'Mr. Ramesh Patel',
            contact: '+91 98765 43212',
            activeComplaints: 32,
            resolvedThisMonth: 18,
            performance: 'poor',
          },
          {
            id: 'dept4',
            name: 'Electricity',
            head: 'Ms. Anjali Desai',
            contact: '+91 98765 43213',
            activeComplaints: 12,
            resolvedThisMonth: 56,
            performance: 'good',
          },
          {
            id: 'dept5',
            name: 'Public Health',
            head: 'Dr. Sameer Khan',
            contact: '+91 98765 43214',
            activeComplaints: 8,
            resolvedThisMonth: 23,
            performance: 'average',
          },
        ]);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading departments:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDepartments();
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'good':
        return '#4caf50'; // Green
      case 'average':
        return '#ff9800'; // Orange
      case 'poor':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  };

  const renderDepartment = ({ item }: { item: Department }) => (
    <Card style={styles.departmentCard}>
      <Card.Content>
        <View style={styles.departmentHeader}>
          <View style={styles.departmentTitle}>
            <Title style={styles.departmentName}>{item.name}</Title>
            <View style={styles.performanceBadge}>
              <Chip 
                style={[styles.performanceChip, { 
                  backgroundColor: `${getPerformanceColor(item.performance)}20`,
                  borderColor: getPerformanceColor(item.performance),
                }]}
                textStyle={{ color: getPerformanceColor(item.performance) }}
              >
                {item.performance.charAt(0).toUpperCase() + item.performance.slice(1)}
              </Chip>
            </View>
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item 
              onPress={() => {
                setMenuVisible(null);
                router.push(`/(supervisor)/departments/${item.id}`);
              }} 
              title="View Details" 
              leadingIcon="information"
            />
            <Menu.Item 
              onPress={() => {}} 
              title="View Complaints" 
              leadingIcon="clipboard-list"
            />
            <Menu.Item 
              onPress={() => {}} 
              title="Contact Department" 
              leadingIcon="phone"
            />
          </Menu>
        </View>
        
        <View style={styles.departmentInfo}>
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Department Head:</Paragraph>
            <Paragraph>{item.head}</Paragraph>
          </View>
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Contact:</Paragraph>
            <Paragraph>{item.contact}</Paragraph>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Paragraph style={styles.statValue}>{item.activeComplaints}</Paragraph>
              <Paragraph style={styles.statLabel}>Active</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Paragraph style={styles.statValue}>{item.resolvedThisMonth}</Paragraph>
              <Paragraph style={styles.statLabel}>Resolved (30d)</Paragraph>
            </View>
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
        placeholder="Search departments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredDepartments}
        renderItem={renderDepartment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph>No departments found</Paragraph>
          </View>
        }
      />
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
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  departmentCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  departmentTitle: {
    flex: 1,
    marginRight: 8,
  },
  departmentName: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  performanceBadge: {
    alignSelf: 'flex-start',
  },
  performanceChip: {
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  departmentInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
