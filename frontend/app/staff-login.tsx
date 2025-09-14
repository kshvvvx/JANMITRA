import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

export default function StaffLoginScreen() {
  const [dept, setDept] = useState('');
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!dept.trim() || !staffId.trim()) {
      Alert.alert('Error', 'Please enter both department and staff ID');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.staffLogin({
        dept: dept.trim(),
        staff_id: staffId.trim()
      });

      if (response.success) {
        // TODO: Store token and navigate to staff dashboard
        Alert.alert(
          'Login Successful',
          `Welcome ${response.staff.name}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // TODO: Navigate to staff dashboard
                console.log('Navigate to staff dashboard');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Staff Login
        </ThemedText>
        <ThemedText type="default" style={styles.headerSubtitle}>
          Access staff dashboard
        </ThemedText>
      </View>

      <Card style={styles.loginCard} mode="outlined">
        <Card.Content>
          <Title style={styles.cardTitle}>Municipal Staff Access</Title>
          <Paragraph style={styles.cardSubtitle}>
            Enter your department and staff ID to access the complaint management system.
          </Paragraph>

          <TextInput
            mode="outlined"
            label="Department"
            placeholder="e.g., sanitation, roads, electric"
            value={dept}
            onChangeText={setDept}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            mode="outlined"
            label="Staff ID"
            placeholder="e.g., staff-001"
            value={staffId}
            onChangeText={setStaffId}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard} mode="outlined">
        <Card.Content>
          <Title style={styles.infoTitle}>Available Staff Accounts</Title>
          <Paragraph style={styles.infoText}>
            • Sanitation: staff-001 (Ramesh Kumar){'\n'}
            • Roads: staff-002 (Anita Singh){'\n'}
            • Electric: staff-003 (Dev Verma)
          </Paragraph>
        </Card.Content>
      </Card>
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
  loginCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: '#2196f3',
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    color: '#666',
    lineHeight: 20,
  },
});
