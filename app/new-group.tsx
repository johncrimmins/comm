import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
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
  color: string;
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Johnson', status: 'online', color: '#FF6B6B' },
  { id: '2', name: 'Mike Chen', status: 'Active 2h ago', color: '#4ECDC4' },
  { id: '3', name: 'Emily Davis', status: 'online', color: '#95E1D3' },
  { id: '4', name: 'Alex Rodriguez', status: 'Active yesterday', color: '#FFE66D' },
  { id: '5', name: 'Jessica Lee', status: 'online', color: '#C7CEEA' },
  { id: '6', name: 'David Kim', status: 'Active 5h ago', color: '#FF8B94' },
  { id: '7', name: 'Rachel Martinez', status: 'online', color: '#A8E6CF' },
  { id: '8', name: 'Tom Wilson', status: 'Active 1d ago', color: '#FFD3B6' },
];

export default function NewGroupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = MOCK_USERS.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleCreateGroup = () => {
    if (selectedUsers.size === 0) {
      return;
    }
    router.back();
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { borderBottomColor: colors.border }]}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userContent}>
          <View style={[styles.checkbox, { borderColor: colors.icon }]}>
            {isSelected && (
              <View style={[styles.checkboxChecked, { backgroundColor: colors.tint }]} />
            )}
          </View>
          
          <View style={[styles.avatar, { backgroundColor: item.color }]}>
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.userStatus, { color: colors.icon }]} numberOfLines={1}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Group</Text>
          {selectedUsers.size > 0 && (
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              {selectedUsers.size} selected
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.inputSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.groupNameInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Group name (optional)"
          placeholderTextColor={colors.icon}
          value={groupName}
          onChangeText={setGroupName}
          autoCapitalize="words"
        />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.border }]}
          placeholder="Search contacts..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: selectedUsers.size > 0 ? colors.tint : colors.border }
          ]}
          onPress={handleCreateGroup}
          disabled={selectedUsers.size === 0}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.createButtonText,
            { color: selectedUsers.size > 0 ? '#FFFFFF' : colors.icon }
          ]}>
            Create Group
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  groupNameInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  userItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
