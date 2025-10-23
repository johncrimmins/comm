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
import { Colors } from '@/constants/Colors';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';

type User = {
  id: string;
  name: string;
  status: string;
  avatarColor: string;
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'sarah johnson', status: 'online', avatarColor: '#C084FC' },
  { id: '2', name: 'mike chen', status: 'active 2h ago', avatarColor: '#9333EA' },
  { id: '3', name: 'emily davis', status: 'online', avatarColor: '#A855F7' },
  { id: '4', name: 'alex rodriguez', status: 'active yesterday', avatarColor: '#7C3AED' },
  { id: '5', name: 'jessica lee', status: 'online', avatarColor: '#C084FC' },
  { id: '6', name: 'david kim', status: 'active 5h ago', avatarColor: '#9333EA' },
  { id: '7', name: 'rachel martinez', status: 'online', avatarColor: '#A855F7' },
  { id: '8', name: 'tom wilson', status: 'active 1d ago', avatarColor: '#7C3AED' },
];

export default function NewConversationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const filteredUsers = MOCK_USERS.filter((user) =>
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

  const handleUserPress = (user: User) => {
    if (selectedUsers.size === 0) {
      router.push(`/chat/${user.id}`);
    } else {
      toggleUserSelection(user.id);
    }
  };

  const handleCreateChat = () => {
    if (selectedUsers.size === 0) return;
    
    if (selectedUsers.size === 1) {
      const userId = Array.from(selectedUsers)[0];
      router.push(`/chat/${userId}`);
    } else {
      router.back();
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id);
    
    return (
      <TouchableOpacity
        onPress={() => handleUserPress(item)}
        onLongPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.9}
        style={styles.userWrapper}
      >
        <GlassCard intensity={20} style={[
          styles.userCard,
          isSelected && styles.userCardSelected
        ]}>
          <View style={styles.userContent}>
            {selectedUsers.size > 0 && (
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, { borderColor: Colors.dark.border }]}>
                  {isSelected && (
                    <View style={[styles.checkboxChecked, { backgroundColor: Colors.dark.accentStart }]} />
                  )}
                </View>
              </View>
            )}
            
            <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
              <Text style={styles.avatarText}>
                {item.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name.toLowerCase()}</Text>
              <Text style={styles.userStatus}>{item.status.toLowerCase()}</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>new message</Text>
            {selectedUsers.size > 0 && (
              <Text style={styles.headerSubtitle}>
                {selectedUsers.size} selected
              </Text>
            )}
          </View>
        </View>

        <View style={styles.searchContainer}>
          <GlassCard intensity={20} style={styles.searchCard}>
            <TextInput
              style={styles.searchInput}
              placeholder="search contacts..."
              placeholderTextColor={Colors.dark.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </GlassCard>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {selectedUsers.size > 0 && (
          <View style={styles.footer}>
            <GradientButton
              onPress={handleCreateChat}
              title={selectedUsers.size === 1 ? 'start chat' : `create group (${selectedUsers.size})`}
              style={styles.createButton}
            />
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
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
    paddingTop: 12,
    paddingBottom: 20,
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
    color: Colors.dark.text,
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchCard: {
    borderRadius: 16,
  },
  searchInput: {
    fontSize: 15,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  userWrapper: {
    marginBottom: 4,
  },
  userCard: {
    overflow: 'hidden',
  },
  userCardSelected: {
    borderColor: Colors.dark.accentStart,
    borderWidth: 1,
  },
  userContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
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
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  createButton: {
    marginBottom: 0,
  },
});
