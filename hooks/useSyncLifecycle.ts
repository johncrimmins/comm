import { useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuth';
import { startSync, stopSync } from '@/lib/sync';

/**
 * Manages sync engine lifecycle based on auth state.
 * Must be mounted at app root to ensure sync runs for entire session.
 * 
 * - Starts sync when user signs in
 * - Stops sync when user signs out
 * - Idempotent (startSync/stopSync guard against duplicates)
 */
export function useSyncLifecycle() {
  const user = useAuthUser();

  useEffect(() => {
    if (user?.uid) {
      startSync(user.uid);
      // Keep sync running until explicit sign-out
      return () => {
        // Note: We don't call stopSync here because the effect only re-runs
        // when user.uid changes. The sync should continue running until
        // user becomes null (explicit sign-out).
      };
    } else {
      stopSync();
    }
  }, [user?.uid]);
}

