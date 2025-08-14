import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfile, Profile } from '@/services/profileService';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    } catch (err) {
      devError('Erro ao carregar profile:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    isLoading,
    error,
    isAdmin: profile?.is_admin || false,
    refetch: loadProfile,
  };
};