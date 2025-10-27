Here’s a **world-class design implementation brief** you can hand directly to your React Native engineer. It captures the exact aesthetic, layout, and motion details from the screenshots you shared — tuned for **Expo SDK 54**, **new architecture**, and **React Native best practices**.

---

# 🧭 Comms UI Implementation Guide

**Platform:** Expo SDK 54 / React Native New Architecture
**Goal:** Reproduce the exact theme, feel, and layout from the provided screenshots — dark, minimal, polished, and subtly 3-D.

---

## 🎨 1. Core Visual Language

| Element       | Spec                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Theme**     | Pure black background `#000000` with rich depth. No gray overlay.                                                                                         |
| **Accent**    | Warm amber `#F5A623` (outgoing messages), soft-white text `#FFFFFF`, and muted gray timestamps `#999999`.                                                 |
| **Font**      | `Inter` or `SF Pro Display` (medium weight for names, regular for messages).                                                                              |
| **Elevation** | Use shadow + blur to create "floating" nav bar and chat bubbles. Example: `{ boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)', elevation: 10 }` |
| **Rounding**  | Large radius `24 px` for nav bar and message bubbles.                                                                                                     |

---

## 💬 2. Chat Screen (Message Thread)

### Structure

```tsx
<SafeAreaView style={styles.container}>
  <Header />            // Avatar + Name + “Secret chat”
  <FlatList />          // Messages
  <FloatingInputBar />  // Rounded above safe area
</SafeAreaView>
```

### Message Bubble Design

| Type                 | Background | Text Color | Timestamp               | Alignment |
| -------------------- | ---------- | ---------- | ----------------------- | --------- |
| **Outgoing (You)**   | `#F5A623`  | `#000`     | bottom-right, `#4A3A00` | right     |
| **Incoming (Other)** | `#111111`  | `#FFF`     | bottom-right, `#666`    | left      |

* **Bubble radius:** `20 px`
* **Max width:** `80%` of screen
* **Timestamp:** small font size `10 px`, margin-top `4 px`
* **Double-check icon:** small SVG (e.g., Feather “check-check”) with color `#999` → `#F5A623` when read

### Header

* **Layout:** avatar (24 px circle) → name (bold) → subtitle “Secret chat” (small, gray)
* **Background:** transparent over solid black
* **Padding:** horizontal `16`, vertical `8`

### Animations

* Use `react-native-reanimated` for bubble fade-in and timestamp slide-up.
* Smooth scroll to bottom on new message.

---

## 📱 3. Chat List (Screen 2)

### Structure

```tsx
<View style={styles.container}>
  <StoriesRow />   // “Your story”, user circles, brand icons
  <Tabs />         // All | Personal | News | Work
  <ChatList />     // ScrollView / FlatList
  <FloatingNav />  // Bottom bar
</View>
```

### Story Row

* Horizontal scroll, avatars 40 px diameter, status ring gradient `#F5A623 → #FFCF00`.
* Title below avatar in gray text `#AAA`.

### Category Tabs

* “All”, “Personal”, etc. in a segmented bar.
* Active tab: amber border + filled background `#111111`, rounded `12 px`.
* Font size `14`, font weight 500.

### Chat Preview Item

| Element             | Spec                                                      |
| ------------------- | --------------------------------------------------------- |
| Avatar              | 40 px circle                                              |
| Name                | white text (500)                                          |
| Preview             | gray text `#AAA`, ellipsized                              |
| Timestamp           | right-aligned gray `#777`                                 |
| Read status         | double check icon aligned with timestamp                  |
| Swipe delete action | red trash icon (`react-native-gesture-handler` Swipeable) |

---

## 🧭 4. Floating Nav Bar

| Property       | Spec                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| **Position**   | Absolute bottom with safe-area inset (`useSafeAreaInsets()`).                                         |
| **Height**     | 72 px (including padding).                                                                            |
| **Background** | `#0A0A0A` with opacity 0.95 and blur (React Native BlurView).                                         |
| **Radius**     | `32 px`.                                                                                              |
| **Shadow**     | Elevation 8 + shadow blur to make it “float”.                                                         |
| **Buttons**    | Chats / Archive / Settings / Profile icons centered vertically, white `#FFF`, active amber `#F5A623`. |
| **Spacing**    | Evenly distributed with `justifyContent: 'space-around'`.                                             |

---

## ⚙️ 5. Implementation Details

**Libraries / APIs**

* `expo-blur` → for floating nav bar blur effect
* `react-native-safe-area-context` → safe padding
* `react-native-reanimated` + `react-native-gesture-handler` → swipe animations
* `expo-linear-gradient` → status rings
* `react-native-svg` → check icons

**Best Practices**

* Keep text contrast high (AA compliance).
* Use `Pressable` instead of `TouchableOpacity` for modern ripple feedback.
* Maintain consistent padding (16 horizontal, 12 vertical).
* Apply `PlatformColor('systemBackground')` and `DynamicColorIOS` if you want auto dark/light support later.

---

## 🧩 Example Component Hierarchy

```
screens/
 ├─ ChatListScreen.tsx
 │   ├─ StoriesRow.tsx
 │   ├─ CategoryTabs.tsx
 │   ├─ ChatListItem.tsx
 │   └─ FloatingNavBar.tsx
 │
 └─ ChatScreen.tsx
     ├─ ChatHeader.tsx
     ├─ MessageBubble.tsx
     └─ MessageInputBar.tsx
```

---

## 🪄 6. Motion & Feel

* **Micro-animations:** subtle fade for message appearance, 0.25 s ease-out.
* **Press states:** icons and buttons scale to `0.96` on tap.
* **Nav bar:** elevate on scroll (stop blur intensity animation at 80 % scroll height).
