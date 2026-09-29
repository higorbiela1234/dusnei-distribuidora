import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ProfileRow } from '../types/database';

export interface AuthContextValue {
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}