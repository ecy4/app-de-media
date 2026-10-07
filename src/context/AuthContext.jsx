import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, checkSupabaseHealth } from '../lib/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState({ connected: false, checking: true, message: '' });

  // 1. Initial Health Check & Session Retrieval
  useEffect(() => {
    async function initAuthAndHealth() {
      const health = await checkSupabaseHealth();
      setHealthStatus({ connected: health.connected, checking: false, message: health.message });

      if (health.connected && supabase) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          
          if (currentSession?.user) {
            setUser(currentSession.user);
            await loadProfile(currentSession.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }

          // Realtime Auth State Listener
          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            if (newSession?.user) {
              setUser(newSession.user);
              await loadProfile(newSession.user.id);
            } else {
              setUser(null);
              setProfile(null);
            }
          });

          return () => {
            authListener?.subscription?.unsubscribe();
          };
        } catch (err) {
          console.error('Auth initialization error:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
      setLoading(false);
    }

    initAuthAndHealth();
  }, []);

  // 2. Fetch User Profile from 'profiles' table
  const loadProfile = async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e);
    }
  };

  // 3. Real Supabase Login (Email & Password)
  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase no está conectado.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // 4. Real Supabase Signup
  const signup = async (email, password, metadata = {}) => {
    if (!supabase) throw new Error('Supabase no está conectado.');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: metadata.fullName || email.split('@')[0],
          username: metadata.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          avatar_url: metadata.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // 4.5 Resend Confirmation Email
  const resendConfirmation = async (email) => {
    if (!supabase) throw new Error('Supabase no está conectado.');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    if (error) throw error;
  };

  // 5. Logout
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // 6. Update Profile
  const updateProfileData = async (newProfileData) => {
    if (!supabase || !user) throw new Error('No hay sesión activa.');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: newProfileData.full_name,
        username: newProfileData.username,
        bio: newProfileData.bio,
        website: newProfileData.website,
        avatar_url: newProfileData.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  // Combined User Metadata (Auth Metadata + Profile Table Data)
  const mergedUser = user ? {
    ...user,
    role: profile?.role || user.user_metadata?.role || 'user',
    user_metadata: {
      ...user.user_metadata,
      full_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
      username: profile?.username || user.user_metadata?.username || 'usuario',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      bio: profile?.bio || user.user_metadata?.bio || 'Creador visual ✨',
      website: profile?.website || user.user_metadata?.website,
      role: profile?.role || user.user_metadata?.role || 'user'
    }
  } : null;

  const value = {
    user: mergedUser,
    profile,
    session,
    loading,
    healthStatus,
    isSupabaseConfigured,
    login,
    signup,
    resendConfirmation,
    logout,
    updateProfile: updateProfileData,
    recheckHealth: async () => {
      setHealthStatus(prev => ({ ...prev, checking: true }));
      const health = await checkSupabaseHealth();
      setHealthStatus({ connected: health.connected, checking: false, message: health.message });
      return health;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
