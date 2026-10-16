import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return supabaseService.getCurrentUser();
  });
  const [loading, setLoading] = useState(true);

  // Fetch the exact profile row corresponding strictly to session.user.id
  const fetchExactProfile = useCallback(async (userId, fallbackEmail = '') => {
    if (!userId) return null;

    let profileData = null;
    let fetchError = null;

    // 1. Live Supabase Query: users table (authoritative database table)
    if (supabaseService.isConfigured()) {
      try {
        const { data, error } = await supabaseService.supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          profileData = data;
        } else {
          fetchError = error;
        }
      } catch (err) {
        fetchError = err;
      }
    }

    // 2. Local Registry query if Supabase didn't find or is in offline mode
    if (!profileData) {
      const registry = supabaseService._getLocal('users_registry', []);
      profileData = registry.find(a => a.id === userId || (fallbackEmail && a.email?.toLowerCase() === fallbackEmail.toLowerCase()));
    }

    if (profileData) {
      const displayName = profileData.display_name || profileData.username || 'Typist';
      const cleanEmail = profileData.email || fallbackEmail || '';
      const mappedUser = {
        ...profileData,
        id: profileData.id || userId,
        displayName: displayName,
        display_name: displayName,
        username: profileData.username || displayName,
        email: cleanEmail,
        role: (profileData.role === 'admin' || supabaseService.isAuthorizedAdminEmail(cleanEmail)) ? 'admin' : (profileData.role || 'user'),
        is_premium: Boolean(profileData.is_premium),
        avatar_url: profileData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
      };

      setUser(mappedUser);
      supabaseService.setCurrentUser(mappedUser);
      return mappedUser;
    }

    return null;
  }, []);

  // Listen for Supabase onAuthStateChange
  useEffect(() => {
    let isMounted = true;

    const setupAuthListener = async () => {
      // 1. If currently stored user is a Guest, protect it from being overwritten by stale Supabase sessions
      const currentStored = supabaseService.getCurrentUser();
      if (currentStored?.isGuest || currentStored?.id?.startsWith('guest_')) {
        setUser(currentStored);
        if (isMounted) setLoading(false);
        return;
      }

      const isRecovery = typeof window !== 'undefined' && (
        window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('type=magiclink') ||
        window.location.hash.includes('access_token') ||
        window.location.search.includes('code=') ||
        window.location.search.includes('type=recovery')
      );
      if (isRecovery) {
        sessionStorage.setItem('typemaster_session_authenticated', 'true');
        sessionStorage.setItem('typemaster_recovery_mode', 'true');
      }

      if (supabaseService.isConfigured()) {
        try {
          // Check existing session
          const { data: { session } } = await supabaseService.supabase.auth.getSession();
          if (session?.user && isMounted) {
            if (isRecovery) {
              sessionStorage.setItem('typemaster_session_authenticated', 'true');
              sessionStorage.setItem('typemaster_recovery_mode', 'true');
            }
            await fetchExactProfile(session.user.id, session.user.email);
          }
        } catch (e) {
          console.warn('Initial session check note:', e);
        }

        // Supabase Auth listener
        const { data: listener } = supabaseService.supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;

            // If user is currently a guest typist, do not let Supabase auth events overwrite or nullify the guest
            const current = supabaseService.getCurrentUser();
            if (current?.isGuest || current?.id?.startsWith('guest_')) {
              return;
            }

            if (session?.user && (
              event === 'SIGNED_IN' ||
              event === 'USER_UPDATED' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'PASSWORD_RECOVERY'
            )) {
              sessionStorage.setItem('typemaster_session_authenticated', 'true');
              if (event === 'PASSWORD_RECOVERY' || (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))) {
                sessionStorage.setItem('typemaster_recovery_mode', 'true');
              }
              await fetchExactProfile(session.user.id, session.user.email);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              supabaseService.setCurrentUser(null);
              sessionStorage.removeItem('typemaster_session_authenticated');
              sessionStorage.removeItem('typemaster_recovery_mode');
              localStorage.removeItem('typemaster_active_portal');
            }
          }
        );

        if (isMounted) setLoading(false);

        return () => {
          listener?.subscription?.unsubscribe();
        };
      } else {
        if (isMounted) setLoading(false);
      }
    };

    const cleanupPromise = setupAuthListener();

    return () => {
      isMounted = false;
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [fetchExactProfile]);

  // Two-Way Realtime Subscription: User Portal changes via supabase.channel('user-profile-sync')
  useEffect(() => {
    if (!user?.id) return;

    let channel = null;

    if (supabaseService.isConfigured()) {
      channel = supabaseService.supabase
        .channel('user-profile-sync')

        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
            if (payload.new) {
              const updated = {
                ...payload.new,
                displayName: payload.new.display_name || payload.new.username || user.displayName,
                display_name: payload.new.display_name || payload.new.username || user.displayName,
                is_premium: Boolean(payload.new.is_premium)
              };
              setUser(prev => ({ ...prev, ...updated }));
              supabaseService.setCurrentUser({ ...user, ...updated });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          (payload) => {
            if (payload.new) {
              window.dispatchEvent(new CustomEvent('typemaster-settings-changed', { detail: payload.new }));
            }
          }
        )
        .subscribe();
    }

    // Cross-tab BroadcastChannel for zero-latency instant updates across portals
    let bc = null;
    try {
      bc = new BroadcastChannel('user-profile-sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PROFILE_UPDATE' && event.data.userId === user.id) {
          const updates = event.data.updates;
          setUser(prev => {
            if (!prev) return prev;
            const merged = { ...prev, ...updates };
            supabaseService.setCurrentUser(merged);
            return merged;
          });
        }
      };
    } catch {
      // BroadcastChannel fallback
    }

    // Local in-window event listener
    const handleLocalProfileSync = (e) => {
      if (e.detail?.userId === user.id) {
        const updates = e.detail.updates;
        setUser(prev => {
          if (!prev) return prev;
          const merged = { ...prev, ...updates };
          supabaseService.setCurrentUser(merged);
          return merged;
        });
      }
    };
    window.addEventListener('typemaster-profile-sync', handleLocalProfileSync);

    return () => {
      if (channel && supabaseService.isConfigured()) {
        supabaseService.supabase.removeChannel(channel);
      }
      if (bc) bc.close();
      window.removeEventListener('typemaster-profile-sync', handleLocalProfileSync);
    };
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    const current = supabaseService.getCurrentUser();
    if (current?.isGuest || current?.id?.startsWith('guest_')) {
      setUser(current);
      return current;
    }
    if (user?.id) {
      return await fetchExactProfile(user.id, user.email);
    }
    return null;
  }, [user?.id, user?.email, fetchExactProfile]);

  const login = (newUser) => {
    if (!newUser) return;
    const displayName = newUser.display_name || newUser.username || 'Typist';
    const isGuest = Boolean(newUser.isGuest || newUser.id?.startsWith('guest_') || !newUser.email);
    const mapped = {
      ...newUser,
      displayName,
      display_name: displayName,
      isGuest,
      is_premium: Boolean(newUser.is_premium)
    };
    setUser(mapped);
    supabaseService.setCurrentUser(mapped);
  };

  const logout = async () => {
    await supabaseService.signOut();
    setUser(null);
    supabaseService.setCurrentUser(null);
    sessionStorage.removeItem('typemaster_session_authenticated');
    localStorage.removeItem('typemaster_active_portal');
  };

  const updateUserState = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      supabaseService.setCurrentUser(merged);
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        updateUserState,
        fetchExactProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
