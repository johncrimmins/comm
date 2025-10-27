# Styling Extraction Approaches for Rapid Iteration

## Current State
- Styles are scattered across files using `StyleSheet.create()` at the bottom of each component
- Centralized colors in `constants/Colors.ts`
- Glassmorphic UI components (`GlassCard`, `GradientBackground`, `GradientButton`)
- Tailwind CSS configured but not actively used
- Inter font family loaded globally

## Goal
Extract styling logic to enable quick iteration on app styling without touching individual component files.

---

## Approach 1: Centralized Theme Object Pattern (Recommended)

### Concept
Create a single theme configuration file that exports all styles organized by screen/component. Import and apply styles in components.

### Implementation

**File Structure**:
```
styles/
├── theme.ts              # Main theme configuration
├── screens/
│   ├── auth.ts          # Auth screen styles
│   ├── tabs.ts          # Tabs screen styles
│   ├── chat.ts          # Chat screen styles
│   └── newConversation.ts # New conversation styles
└── components/
    ├── chat.ts          # Chat component styles
    ├── conversation.ts  # Conversation component styles
    └── auth.ts          # Auth component styles
```

**Example**: `styles/theme.ts`
```typescript
import { Colors } from '@/constants/Colors';

export const theme = {
  colors: Colors.dark,
  typography: {
    heading1: {
      fontSize: 32,
      fontWeight: '800' as const,
      fontFamily: 'Inter_800ExtraBold',
      letterSpacing: -1,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '700' as const,
      fontFamily: 'Inter_700Bold',
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
};
```

**Example**: `styles/screens/auth.ts`
```typescript
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...theme.typography.heading1,
    color: theme.colors.text,
    marginBottom: 12,
  },
  heroText: {
    ...theme.typography.heading2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  // ... more styles
});
```

**Usage in Component**:
```typescript
import { authStyles } from '@/styles/screens/auth';

export default function AuthScreen() {
  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Comm</Text>
    </View>
  );
}
```

### Pros
- ✅ Single source of truth for all styles
- ✅ Easy to iterate (change styles in one place)
- ✅ Type-safe with TypeScript
- ✅ Minimal changes to existing code
- ✅ Supports design tokens (spacing, typography, colors)

### Cons
- ❌ Styles still separated from components
- ❌ Need to manage multiple style files
- ❌ Slightly more verbose imports

---

## Approach 2: NativeWind/Tailwind Integration (Most Modern)

### Concept
Activate the already-configured Tailwind CSS setup with NativeWind for utility-first styling in components.

### Implementation

**Update** `tailwind.config.js`:
```javascript
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          text: '#FFFFFF',
          textSecondary: '#B0B0B5',
          background: '#0A0A0F',
          border: 'rgba(192, 132, 252, 0.1)',
          accentStart: '#C084FC',
          accentEnd: '#9333EA',
          // ... etc
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'sans-serif'],
        semibold: ['Inter_600SemiBold', 'sans-serif'],
        bold: ['Inter_700Bold', 'sans-serif'],
        extrabold: ['Inter_800ExtraBold', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};
```

**Create** `styles/theme.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-card {
    @apply rounded-2xl overflow-hidden border border-purple-500/10;
  }
  
  .gradient-bg {
    @apply bg-gradient-to-br from-gray-950 to-purple-950;
  }
  
  .text-heading-1 {
    @apply text-[32px] font-extrabold tracking-tight;
  }
  
  .text-heading-2 {
    @apply text-2xl font-bold;
  }
  
  .text-body {
    @apply text-[15px] font-normal;
  }
}
```

**Usage in Component**:
```typescript
import { View, Text } from 'react-native';
import '../styles/theme.css';

export default function AuthScreen() {
  return (
    <View className="flex-1 gradient-bg p-6">
      <Text className="text-heading-1 text-white mb-3">Comm</Text>
      <Text className="text-body text-gray-400">Context at the speed of thought</Text>
    </View>
  );
}
```

### Pros
- ✅ Most modern approach (Tailwind + React Native)
- ✅ Highly composable utility classes
- ✅ Rapid iteration (change classes directly)
- ✅ Already configured in project
- ✅ Responsive utilities built-in

### Cons
- ❌ Requires learning Tailwind syntax
- ❌ Larger learning curve for team
- ❌ May need to refactor existing components
- ❌ Potential build-time overhead

---

## Approach 3: Hybrid Theme Provider Pattern (Balanced)

### Concept
Create a ThemeProvider context that supplies theme values and style factories. Components use hooks to access theme-aware styles.

### Implementation

**Create** `styles/ThemeProvider.tsx`:
```typescript
import React, { createContext, useContext } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Theme {
  colors: typeof Colors.dark;
  spacing: typeof spacing;
  typography: typeof typography;
  createStyles: <T extends Record<string, ViewStyle | TextStyle>>(styles: T) => T;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '800' as const,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
  },
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = {
    colors: Colors.dark,
    spacing,
    typography,
    createStyles: (styles) => StyleSheet.create(styles),
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

**Export Screen Styles**: `styles/screens/auth.ts`
```typescript
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const authScreenStyles = {
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginBottom: 12,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  // ... more styles
};

export const styles = StyleSheet.create(authScreenStyles);
```

**Usage in Component**:
```typescript
import { useTheme } from '@/styles/ThemeProvider';
import { styles } from '@/styles/screens/auth';

export default function AuthScreen() {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comm</Text>
      {/* Can also use theme dynamically */}
      <Text style={{ color: theme.colors.accentStart }}>Accent</Text>
    </View>
  );
}
```

### Pros
- ✅ Context-based theme access (good for dynamic theming)
- ✅ Can switch themes at runtime
- ✅ Styles still centralized
- ✅ Minimal refactoring needed
- ✅ Type-safe theme values

### Cons
- ❌ Requires wrapping app in ThemeProvider
- ❌ Slightly more complex than Approach 1
- ❌ Context overhead for simple use cases

---

## Recommendation

**Use Approach 1 (Centralized Theme Object Pattern)** because:
1. **Simple**: Minimal changes to existing code
2. **Fast**: Move existing styles to separate files
3. **Clear**: One style file per screen/component
4. **Iterative**: Change styles in one place, see updates everywhere
5. **Type-safe**: Full TypeScript support
6. **Practical**: Follows established React Native patterns

### Migration Path for Approach 1

1. Create `styles/theme.ts` with design tokens
2. Create `styles/screens/auth.ts` and move auth screen styles
3. Update `app/(auth)/index.tsx` to import from styles
4. Repeat for each screen (`tabs`, `chat`, `new-conversation`)
5. Create `styles/components/` for reusable component styles
6. Gradually refactor components to use centralized styles

### Quick Win Strategy

Start with **Approach 1** for immediate benefits:
- Extract styles from one screen (e.g., auth)
- Test the pattern
- Extract remaining screens over time
- Optional: Later migrate to Approach 2 (NativeWind) if desired

