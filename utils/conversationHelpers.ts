/**
 * Conversation Helper Utilities
 * Pure functions for conversation search and filtering
 * Extracted from services/n8n.ts for reusability
 */

export interface User {
  id: string;
  name: string;
}

export interface ConversationDocument {
  id: string;
  participantIds: string[];
}

/**
 * Find a conversation by participant name
 * Returns the conversationId of the first matching conversation
 * Prefers 1-on-1 conversations over group chats
 * 
 * @param conversations - Array of conversation documents
 * @param users - Array of user documents with id and name
 * @param userId - Current user's ID (for filtering)
 * @param participantName - Name to search for
 * @returns conversationId or null if not found
 */
export function findConversationByParticipantName(
  conversations: ConversationDocument[],
  users: User[],
  userId: string,
  participantName: string
): string | null {
  // 1. Find user IDs that match the participant name
  const matchingUserIds = users
    .filter(user => user.name.toLowerCase().includes(participantName.toLowerCase()))
    .map(user => user.id);

  if (matchingUserIds.length === 0) {
    return null;
  }

  // 2. Filter conversations where the current user is a participant
  const userConversations = conversations.filter(conv =>
    conv.participantIds.includes(userId)
  );

  // 3. Find conversations that also include the matching participant
  const matchingConversations = userConversations.filter(conv =>
    matchingUserIds.some(id => conv.participantIds.includes(id))
  );

  if (matchingConversations.length === 0) {
    return null;
  }

  // 4. Separate 1-on-1 conversations from group chats
  const oneOnOneConversations = matchingConversations.filter(conv =>
    conv.participantIds.length === 2
  );

  const groupChats = matchingConversations.filter(conv =>
    conv.participantIds.length > 2
  );

  // 5. Prefer 1-on-1 conversations, fall back to group chats
  const candidates = oneOnOneConversations.length > 0 ? oneOnOneConversations : groupChats;

  if (candidates.length === 0) {
    return null;
  }

  return candidates[0].id;
}

/**
 * Filter conversations to only those where the user is a participant
 */
export function filterUserConversations(
  conversations: ConversationDocument[],
  userId: string
): ConversationDocument[] {
  return conversations.filter(conv => conv.participantIds.includes(userId));
}

/**
 * Separate 1-on-1 and group conversations
 */
export function categorizeConversations(conversations: ConversationDocument[]): {
  oneOnOne: ConversationDocument[];
  group: ConversationDocument[];
} {
  return {
    oneOnOne: conversations.filter(conv => conv.participantIds.length === 2),
    group: conversations.filter(conv => conv.participantIds.length > 2),
  };
}

