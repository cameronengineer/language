import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { AuthGuard } from '@/src/components/auth';
import { useAuth } from '@/src/stores';
import { COLORS } from '@/src/utils/constants';

function DashboardScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Language Learning!</Text>
        <Text style={styles.subtitle}>
          Hello {user?.first_name || 'there'}! 👋
        </Text>
        <Text style={styles.description}>
          Your language learning journey begins here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function ProtectedDashboard() {
  return (
    <AuthGuard>
      <DashboardScreen />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});