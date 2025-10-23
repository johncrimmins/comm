import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type User = {
  id: string;
  name: string;
  status: string;
  avatarColor: string;
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Johnson', status: 'online', avatarColor: '#FF6B6B' },
  { id: '2', name: 'Mike Chen', status: 'Active 2h ago', avatarColor: '#4ECDC4' },
  { id: '3', name: 'Emily Davis', status: 'online', avatarColor: '#95E1D3' },
  { id: '4', name: 'Alex Rodriguez', status: 'Active yesterday', avatarColor: '#F38181' },
  { id: '5', name: 'Jessica Lee', status: 'online', avatarColor: '#A8E6CF' },
  { id: '6', name: 'David Kim', status: 'Active 5h ago', avatarColor: '#FFD3B6' },
  { id: '7', name: 'Rachel Martinez', status: 'online', avatarColor: '#FFAAA5' },
  { id: '8', name: 'Tom Wilson', status: 'Active 1d ago', avatarColor: '#FF8B94' },
];

export default function NewConversationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserPress = (user: User) => {
    router.push(`/chat/${user.id}`);
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: colors.border }]}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.userStatus, { color: colors.icon }]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: colors.tint }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Conversation</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colorScheme === 'dark' ? colors.secondary : '#F0F2F5',
              color: colors.text,
            },
          ]}
          placeholder="Search users..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No users found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});
