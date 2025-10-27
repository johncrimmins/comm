/**
 * Message Status Calculation Utilities
 * Pure functions for calculating message delivery/read status
 * Extracted from hooks/useMessages.ts for reusability
 */

export type MessageStatus = 'sent' | 'delivered' | 'read' | null;

/**
 * Calculate the delivery status for a message
 * Status is only shown on the current user's own messages
 * 
 * @param senderId - The ID of the message sender
 * @param currentUserId - The ID of the current user
 * @param deliveredTo - Array of user IDs who have received the message
 * @param readBy - Array of user IDs who have read the message
 * @returns 'sent' | 'delivered' | 'read' | null
 */
export function calculateMessageStatus(
  senderId: string,
  currentUserId: string,
  deliveredTo: string[],
  readBy: string[]
): MessageStatus {
  // Only calculate status for current user's own messages
  if (senderId !== currentUserId) {
    return null;
  }

  // Message is read if more than just the sender has read it
  if (readBy.length > 1) {
    return 'read';
  }

  // Message is delivered if more than just the sender has received it
  if (deliveredTo.length > 1) {
    return 'delivered';
  }

  // Message is sent if only the sender has received it
  return 'sent';
}

/**
 * Check if a message should show delivery status
 * Only current user's own messages show status
 */
export function shouldShowStatus(senderId: string, currentUserId: string): boolean {
  return senderId === currentUserId;
}

