import { useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ProfileRow } from '../types/database';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { AuthContext } from './auth';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    const synchronizeProfile = async (nextSession: Session | null) => {
      if (!nextSession) {
        if (active) { setProfile(null); setLoading(false); }
        return;
      }
      const { data, error: profileError } = await client.from('profiles').select('*').eq('id', nextSession.user.id).maybeSingle();
      if (!active) return;
      setProfile(data);
      setError(profileError?.message ?? null);
      setLoading(false);
    };

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setSession(data.session);
      if (sessionError) setError(sessionError.message);
      return synchronizeProfile(data.session);
    }).catch((reason: unknown) => {
      if (active) { setError(reason instanceof Error ? reason.message : 'Falha ao restaurar a sessão.'); setLoading(false); }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(Boolean(nextSession));
      void synchronizeProfile(nextSession);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  };

  return <AuthContext.Provider value={{ session, profile, loading, error, configured: isSupabaseConfigured, signIn, signOut }}>{children}</AuthContext.Provider>;
}