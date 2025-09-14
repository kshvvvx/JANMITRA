import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const USER_TYPES = [
  {
    id: 'citizen',
    title: 'userType.citizen',
    description: 'userType.citizenDescription',
    icon: 'account',
    color: '#4CAF50',
  },
  {
    id: 'guest',
    title: 'userType.guest',
    description: 'userType.guestDescription',
    icon: 'account-question',
    color: '#9C27B0',
  },
  {
    id: 'staff',
    title: 'userType.staff',
    description: 'userType.staffDescription',
    icon: 'shield-account',
    color: '#2196F3',
  },
  {
    id: 'supervisor',
    title: 'userType.supervisor',
    description: 'userType.supervisorDescription',
    icon: 'shield-star',
    color: '#FF9800',
  },
];

export default function UserTypeSelection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { loginAsGuest, setUserType } = useAuth();

  const handleSelectType = async (type: string) => {
    if (type === 'guest') {
      const success = await loginAsGuest();
      if (success) {
        router.replace('/(tabs)');
      }
    } else {
      await setUserType(type as any);
      router.push(`/auth/${type}-login`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: theme.colors.primary }]}>
          {t('userType.title', 'Select User Type')}
        </ThemedText>
        <ThemedText type="default" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('userType.subtitle', 'Choose how you want to use the app')}
        </ThemedText>
      </View>

      <View style={styles.content}>
        {USER_TYPES.map((userType) => (
          <Card
            key={userType.id}
            style={[styles.card, { borderColor: userType.color, borderWidth: 1 }]}
            onPress={() => handleSelectType(userType.id)}
            mode="elevated"
          >
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${userType.color}20` }]}>
                <Text style={[styles.icon, { color: userType.color }]}>{userType.icon}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                  {t(userType.title, userType.title.split('.').pop() || '')}
                </Text>
                <Text variant="bodyMedium" style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {t(userType.description, userType.description.split('.').pop() || '')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    opacity: 0.8,
  },
});
