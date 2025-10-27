# Message Transformations Implementation

## Overview

Comm's message transformation feature allows users to transform messages before sending using OpenAI GPT-4o-mini. Long-press the send button to reveal transformation options that modify message tone and style while preserving meaning.

## Architecture

### User Flow

```
User Types Message
       ↓
Long-Press Send Button (400ms)
       ↓
Transformation Popover Appears
       ↓
User Selects Transformation
       ↓
OpenAI API Call
       ↓
Transformed Text Replaces Input
       ↓
User Sends Message
```

### Key Components

- **`services/messageTransformations.ts`**: Transformation definitions
- **`services/openai.ts`**: OpenAI API integration
- **`components/chat/ChatInput.tsx`**: Long-press gesture handler
- **`styles/components/chatInput.ts`**: Popover styling

## Transformation Options

### 1. Concise

**Goal**: Make messages shorter while preserving meaning

**System Prompt**:
```
You are a helpful assistant that makes messages more concise while preserving 
the original intent and any references (names, dates, places, etc.). 
Return only the concise version without any additional explanation.
```

**Example**:
```
Before: "I wanted to let you know that I was thinking about the project and 
         I believe we should probably schedule a meeting sometime next week 
         to discuss our progress on the deliverables."

After: "Let's meet next week to discuss project progress."
```

### 2. Professionalize

**Goal**: Rewrite with professional tone

**System Prompt**:
```
You are a helpful assistant that rewrites messages to sound more professional 
without jargon. Maintain the core meaning and all references (names, dates, 
places, etc.). Return only the professional version without any additional 
explanation.
```

**Example**:
```
Before: "hey can we chat about that thing tomorrow?"

After: "Could we schedule a brief discussion tomorrow regarding that matter?"
```

### 3. Technicalize

**Goal**: Use precise technical terminology

**System Prompt**:
```
You are a helpful assistant that replaces ambiguous or unclear terms with 
precise technical terminology. Maintain clarity and all references (names, 
dates, places, etc.). Return only the technical version without any additional 
explanation.
```

**Example**:
```
Before: "the app crashed when I clicked the button"

After: "the application encountered a runtime error when triggering the event handler"
```

## Implementation

### Transformation Definitions

```typescript
// services/messageTransformations.ts
export interface Transformation {
  id: string;
  label: string;
  systemPrompt: string;
}

export const transformations: Transformation[] = [
  {
    id: 'concise',
    label: 'Concise',
    systemPrompt: 'You are a helpful assistant that makes messages more concise...'
  },
  {
    id: 'professionalize',
    label: 'Professionalize',
    systemPrompt: 'You are a helpful assistant that rewrites messages...'
  },
  {
    id: 'technicalize',
    label: 'Technicalize',
    systemPrompt: 'You are a helpful assistant that replaces ambiguous terms...'
  }
];
```

### OpenAI Integration

```typescript
// services/openai.ts
export async function transformText(options: TransformOptions): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: options.systemPrompt
        },
        {
          role: 'user',
          content: `Transform this message:\n\n${options.text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}
```

## Gesture Handling

### Long-Press Implementation

```typescript
// components/chat/ChatInput.tsx
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

const handleLongPress = (event: any) => {
  if (event.nativeEvent.state === State.ACTIVE && inputText.trim()) {
    setHasLongPressed(true);
    setShowMenu(true);
    // Animate popover in
    popoverOpacity.value = withTiming(1, { duration: 200 });
    popoverScale.value = withSpring(1, { damping: 15 });
  }
};

// Wrap send button
<LongPressGestureHandler
  onHandlerStateChange={handleLongPress}
  minDurationMs={400}
>
  <TouchableOpacity onPress={handleSendPress}>
    <Text>→</Text>
  </TouchableOpacity>
</LongPressGestureHandler>
```

### State Management

```typescript
const [hasLongPressed, setHasLongPressed] = useState(false);
const [showMenu, setShowMenu] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);

// Prevent accidental send after long press
const handleSendPress = () => {
  if (hasLongPressed || showMenu) {
    return; // Don't send
  }
  onSend();
};
```

## Popover UI

### Animation

```typescript
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const popoverOpacity = useSharedValue(0);
const popoverScale = useSharedValue(0.8);
const popoverY = useSharedValue(0);

const popoverAnimatedStyle = useAnimatedStyle(() => ({
  opacity: popoverOpacity.value,
  transform: [
    { scale: popoverScale.value },
    { translateY: popoverY.value },
  ],
}));
```

### Dismiss on Tap Outside

```typescript
{showMenu && (
  <TouchableOpacity
    style={styles.overlay}
    activeOpacity={1}
    onPress={handleDismissPopover}
  />
)}

const handleDismissPopover = () => {
  popoverOpacity.value = withTiming(0, { duration: 150 });
  popoverScale.value = withTiming(0.8, { duration: 150 });
  setTimeout(() => {
    setShowMenu(false);
    setHasLongPressed(false);
  }, 150);
};
```

## Dynamic Button Rendering

### Stacked Buttons

```typescript
{transformations.map((transformation, index) => (
  <TouchableOpacity
    key={transformation.id}
    style={[
      styles.transformButton,
      index === 0 && styles.transformButtonFirst,
      index === transformations.length - 1 && styles.transformButtonLast
    ]}
    onPress={() => handleTransform(transformation)}
  >
    <Text style={styles.transformButtonText}>
      {isProcessing ? '...' : transformation.label}
    </Text>
  </TouchableOpacity>
))}
```

### Styling

```typescript
// styles/components/chatInput.ts
transformButton: {
  backgroundColor: Colors.dark.secondary,
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: Colors.dark.border,
},
transformButtonFirst: {
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
},
transformButtonLast: {
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  borderBottomWidth: 0,
},
```

## Transformation Processing

### Execute Transformation

```typescript
const handleTransform = async (transformation: Transformation) => {
  if (!inputText.trim() || isProcessing) return;
  
  setIsProcessing(true);
  setShowMenu(false);
  
  // Animate popover out
  popoverOpacity.value = withTiming(0, { duration: 150 });
  popoverScale.value = withTiming(0.8, { duration: 150 });
  
  try {
    const transformedText = await transformText({
      text: inputText,
      systemPrompt: transformation.systemPrompt
    });
    
    // Replace input text
    onChangeText(transformedText);
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to transform message');
  } finally {
    setIsProcessing(false);
    setHasLongPressed(false);
  }
};
```

## OpenAI Configuration

### Model Settings

- **Model**: `gpt-4o-mini` (fast, cost-effective)
- **Temperature**: `0.3` (consistent results)
- **Max tokens**: `500` (sufficient for most messages)
- **System prompt**: Custom per transformation

### Error Handling

```typescript
try {
  const transformedText = await transformText({ text, systemPrompt });
} catch (error: any) {
  Alert.alert(
    'Error',
    error.message || 'Failed to transform message. Please try again.',
    [{ text: 'OK' }]
  );
}
```

## User Experience

### Visual Feedback

- **Long press**: Haptic feedback (optional)
- **Popover**: Spring animation appears
- **Processing**: Button shows "..."
- **Success**: Text replaced immediately
- **Error**: Alert shown

### Accessibility

- **Touch target**: 40x40px minimum
- **Text size**: 15px readable
- **Contrast**: High contrast text
- **Focus**: Keyboard navigation supported

## Performance

### Optimization

- **Debounce**: Prevent rapid-fire transformations
- **Cache**: Could cache common transformations
- **Timeout**: 3-second max processing time
- **Background**: Process without blocking UI

### Response Times

- **Fast network**: <2 seconds
- **Slow network**: <5 seconds
- **Offline**: Error message shown

## Testing

### Manual Testing

1. Type a message
2. Long-press send button
3. Verify popover appears
4. Select transformation
5. Verify text transformed
6. Send message

### Edge Cases

- Empty message
- Very long message
- Special characters
- Multiple transformations
- Network errors

## Troubleshooting

### Transformations Not Working

1. Check OpenAI API key configured
2. Verify network connectivity
3. Check console logs for errors
4. Test with simple message first

### Popover Not Appearing

1. Verify long-press gesture handler
2. Check minimum duration (400ms)
3. Verify input has text
4. Review animation values

### Slow Transformations

1. Check network speed
2. Verify OpenAI API status
3. Reduce message length
4. Check device performance

## Code Examples

### Add New Transformation

```typescript
// services/messageTransformations.ts
export const transformations: Transformation[] = [
  // ... existing transformations
  {
    id: 'formalize',
    label: 'Formalize',
    systemPrompt: 'Rewrite this message in formal tone...'
  }
];
```

### Custom Transformation

```typescript
import { transformText } from '@/services/openai';

const customTransformation = async (text: string) => {
  return await transformText({
    text,
    systemPrompt: 'Your custom transformation prompt here'
  });
};
```

## Best Practices

### Do's

- Use consistent system prompts
- Show loading state during processing
- Handle errors gracefully
- Preserve important details
- Test edge cases

### Don'ts

- Don't transform empty messages
- Don't show popover without text
- Don't block UI during processing
- Don't ignore errors
- Don't modify original input directly

## References

- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
