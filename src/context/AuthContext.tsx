import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthUser {
  id: string;
  email?: string;
  demo?: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

const DEMO_KEY = 'central_geral_demo_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Modo demo: restaura sessão local se existir.
      const demo = localStorage.getItem(DEMO_KEY);
      if (demo) setUser({ id: 'demo', demo: true });
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setUser(s ? { id: s.user.id, email: s.user.email ?? undefined } : null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session ? { id: session.user.id, email: session.user.email ?? undefined } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx['signIn'] = async (email, password) => {
    if (!supabase) return { error: 'Supabase não configurado' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp: AuthCtx['signUp'] = async (email, password) => {
    if (!supabase) return { error: 'Supabase não configurado' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Se confirmação de e-mail estiver ligada, não há sessão ainda.
    return { needsConfirm: !data.session };
  };

  const signInDemo = () => {
    localStorage.setItem(DEMO_KEY, '1');
    setUser({ id: 'demo', demo: true });
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(DEMO_KEY);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, configured: isSupabaseConfigured, signIn, signUp, signInDemo, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
