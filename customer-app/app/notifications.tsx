import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Info, CheckCircle, AlertCircle } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../src/theme/tokens';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Order Delivered',
    message: 'Your fresh harvest has been delivered to your doorstep. Enjoy!',
    time: '2 hours ago',
    type: 'success',
  },
  {
    id: '2',
    title: 'Flash Sale! 🍎',
    message: 'Premium apples are 20% off for the next 2 hours. Grab them now!',
    time: '5 hours ago',
    type: 'promo',
  },
  {
    id: '3',
    title: 'Welcome to Juice Shop!',
    message: 'Thanks for joining our community of fresh food lovers.',
    time: '1 day ago',
    type: 'info',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const renderIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={24} color="#10b981" />;
      case 'promo': return <Bell size={24} color="#f59e0b" />;
      case 'info': return <Info size={24} color="#3b82f6" />;
      default: return <AlertCircle size={24} color="#64748b" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.darkText} />
        </TouchableOpacity>
        <Text style={TYPOGRAPHY.h3}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.notificationItem}>
            <View style={styles.iconContainer}>
              {renderIcon(item.type)}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifMessage}>{item.message}</Text>
              <Text style={styles.notifTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={64} color={COLORS.mutedGray} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconContainer: {
    marginRight: SPACING.md,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: 'Calibri',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
    marginBottom: 4,
  },
  notifMessage: {
    fontFamily: 'Calibri',
    fontSize: 14,
    color: COLORS.mutedGray,
    lineHeight: 20,
    marginBottom: 8,
  },
  notifTime: {
    fontSize: 12,
    color: COLORS.mutedGray,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: 'Calibri',
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mutedGray,
    fontWeight: '700',
  },
});
