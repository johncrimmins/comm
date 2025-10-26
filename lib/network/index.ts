/**
 * Network State Tracking
 * Monitor online/offline status for offline support
 */

import NetInfo from '@react-native-community/netinfo';

let isOnline = true;
let listeners: Array<(online: boolean) => void> = [];

/**
 * Initialize network monitoring
 */
export function initializeNetworkMonitoring() {
  console.log('🌐 [Network] Initializing network monitoring');
  
  const unsubscribe = NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? false;
    
    console.log(`🌐 [Network] State check - isConnected: ${state.isConnected}, type: ${state.type}`);
    
    if (wasOnline !== isOnline) {
      console.log(`🔄 [Network] Status changed: ${wasOnline ? 'ONLINE' : 'OFFLINE'} → ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      // Notify listeners
      console.log(`📢 [Network] Notifying ${listeners.length} listeners`);
      listeners.forEach(listener => listener(isOnline));
      
      // When coming back online, trigger sync
      if (isOnline && !wasOnline) {
        console.log(`🌐 [Network] Back online - triggering pending message flush`);
        import('@/lib/sync').then(module => {
          module.flushPendingMessages();
        });
      }
    }
  });
  
  console.log('✅ [Network] Network monitoring initialized');
  return unsubscribe;
}

/**
 * Get current network state
 */
export function getNetworkState(): boolean {
  return isOnline;
}

/**
 * Add network state listener
 */
export function addNetworkListener(listener: (online: boolean) => void): () => void {
  listeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

