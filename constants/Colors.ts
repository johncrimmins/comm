// Noir + Amber Theme
const amberAccent = '#F5A623'; // Warm amber from design spec
const amberAccentDark = '#D97706';
const amberDarkText = '#4A3A00'; // Dark amber for outgoing message timestamps

export const Colors = {
  light: {
    text: '#0A0A0A',
    textSecondary: '#4B5563',
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    tint: amberAccent,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: amberAccent,
    border: '#E5E7EB',
    secondary: '#F5F5F5',
    glass: 'rgba(0, 0, 0, 0.02)',
    glassLight: 'rgba(0, 0, 0, 0.04)',
    accentStart: amberAccent,
    accentEnd: amberAccentDark,
    glow: 'rgba(245, 158, 11, 0.22)',
  },
  dark: {
    text: '#FFFFFF', // Pure white for primary text
    textSecondary: '#A1A1AA',
    background: '#000000', // Pure black from design spec
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    tint: amberAccent,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: amberAccent,
    border: '#262626',
    secondary: '#111111',
    glass: 'rgba(255, 255, 255, 0.02)',
    glassLight: 'rgba(255, 255, 255, 0.04)',
    accentStart: amberAccent,
    accentEnd: amberAccentDark,
    glow: 'rgba(245, 158, 11, 0.22)',
    // Timestamp colors
    timestampIncoming: '#666666', // Gray for incoming message timestamps
    timestampOutgoing: amberDarkText, // Dark amber for outgoing message timestamps
    timestampGray: '#999999', // Generic gray timestamps
  },
};
