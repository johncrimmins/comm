# Image Support Implementation

## Overview
Added image attachment support to chat messages, allowing users to send and receive images within conversations.

## New Dependencies
- `expo-image-picker` - For selecting images from device library

## Files Created

### `services/storage.ts`
Firebase Storage service for uploading images:
- `uploadImage()` - Uploads image blob to Firebase Storage
- Returns download URL for storage in message documents
- Path: `conversations/{conversationId}/images/{messageId}.jpg`

## Files Modified

### `lib/firebase/app.ts`
- Added Firebase Storage initialization
- Exported `storage` instance

### Message Types & Components

**`components/chat/Message.tsx`**
- Added `imageUrl?: string` to Message type
- Imported `expo-image` Image component
- Display image when `imageUrl` is present
- Text renders below image if both exist

**`styles/components/message.ts`**
- Added `image` style (200x200px with rounded corners)
- Added `imageContainer` for overflow handling

### Chat Input

**`components/chat/ChatInput.tsx`**
- Added `onImageSelect` and `selectedImageUri` props
- Implemented `handleImagePick()` using expo-image-picker
- Added paperclip button (📎) to left of text input
- Image preview above input with remove button
- Send button enabled when image OR text is present

**`styles/components/chatInput.ts`**
- Added `attachButton` and `attachButtonText` styles
- Added `imagePreviewContainer`, `imagePreview` styles
- Added `removeImageButton` and `removeImageButtonText` styles

### Chat Screen

**`app/chat/[id].tsx`**
- Added `selectedImageUri` state
- Imported `uploadImage` from storage service
- Updated `handleSend()` to:
  - Upload image to Firebase Storage if selected
  - Pass `imageUrl` to `sendMessage()`
  - Clear image state after send
- Passed image props to ChatInput component

### Services

**`services/chat.ts`**
- Updated `sendMessage()` signature to accept optional `imageUrl`
- Store `imageUrl` in Firestore message document if provided

### Hooks

**`hooks/useMessages.ts`**
- Added `imageUrl?: string` to message type
- Read `imageUrl` from Firestore documents
- Pass `imageUrl` to UI components

## Data Flow

1. **User selects image:**
   - Tap paperclip → ImagePicker opens → Image selected
   - Preview displayed above input
   - Remove button to clear selection

2. **User sends message:**
   - Image uploaded to Firebase Storage
   - Download URL stored in message document
   - Message appears in chat with image

3. **Message display:**
   - Real-time listener detects new message
   - Image URL fetched from Firestore
   - Image rendered in message bubble

## Message Structure

Firestore message documents now include:
```typescript
{
  text: string,
  imageUrl?: string,  // New field
  senderId: string,
  createdAt: Timestamp,
  deliveredTo: string[],
  readBy: string[]
}
```

## Firebase Storage Structure

```
conversations/
  {conversationId}/
    images/
      {messageId}.jpg
```

## User Experience

- **Paperclip button** positioned to left of text input (40x40px)
- **Image preview** appears above input (200px height, full width)
- **Remove button** (✕) overlays top-right of preview
- **Send enabled** when image selected OR text entered
- **Images display** in message bubbles (200x200px)
- **Text + image** supported in same message

## Technical Notes

- Uses `expo-image` for optimized image rendering
- Images compressed to 80% quality during selection
- Aspect ratio maintained at 4:3 during editing
- Permission requests handled automatically
- Upload errors show user-friendly alerts
- Real-time updates via Firestore listeners

