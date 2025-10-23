/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#25D366';
const tintColorDark = '#25D366';

export const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    icon: '#667781',
    tabIconDefault: '#667781',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    secondary: '#F0F2F5',
  },
  dark: {
    text: '#E9EDEF',
    background: '#0B141A',
    tint: tintColorDark,
    icon: '#8696A0',
    tabIconDefault: '#8696A0',
    tabIconSelected: tintColorDark,
    border: '#1F2C33',
    secondary: '#1F2C33',
  },
};
