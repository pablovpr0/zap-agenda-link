import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SyncOptions {
  onSettingsChange?: () => void;
  onScheduleChange?: () => void;
  onCompanyDataChange?: () => void;
  onClientAreaChange?: () => void;
}

export const useRealTimeSync = (options: SyncOptions = {}) => {
  const { user } = useAuth();

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time sync for user:', user.id);

    // Subscribe to company_settings changes
    const settingsSubscription = supabase
      .channel('company_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Company settings changed:', payload);
          options.onSettingsChange?.();
        }
      )
      .subscribe();

    // Subscribe to daily_schedules changes
    const scheduleSubscription = supabase
      .channel('daily_schedules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_schedules',
          filter: `company_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Schedule changed:', payload);
          options.onScheduleChange?.();
        }
      )
      .subscribe();

    // Subscribe to profiles changes
    const profileSubscription = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Profile changed:', payload);
          options.onCompanyDataChange?.();
        }
      )
      .subscribe();

    return () => {
      settingsSubscription.unsubscribe();
      scheduleSubscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [user, options]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [setupRealtimeSubscription]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    console.log('🔄 Manual sync triggered');
    options.onSettingsChange?.();
    options.onScheduleChange?.();
    options.onCompanyDataChange?.();
    options.onClientAreaChange?.();
  }, [options]);

  return { triggerSync };
};