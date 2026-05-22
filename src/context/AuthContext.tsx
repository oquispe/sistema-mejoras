/**
 * AuthContext - Contexto de Autenticación (Simplificado)
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, nombreCompleto: string, area: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil (sin bloquear la app si falla)
  async function loadProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Perfil no encontrado, usando datos básicos');
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.warn('Error cargando perfil:', err);
      return null;
    }
  }

  // Refrescar perfil manualmente
  async function refreshProfile() {
    if (user) {
      const profileData = await loadProfile(user.id);
      setProfile(profileData);
    }
  }

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sesión inicial:', session ? 'Activa' : 'No hay');
      setUser(session?.user ?? null);
      setLoading(false);

      // Cargar perfil en background (no bloquea)
      if (session?.user) {
        loadProfile(session.user.id).then(setProfile);
      }
    });

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth:', event);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Registrar
  async function signUp(
    email: string,
    password: string,
    nombreCompleto: string,
    area: string
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre_completo: nombreCompleto, area },
      },
    });

    if (error) return { error: error.message };
    if (data.user && !data.session) {
      return { error: 'Revisa tu correo para confirmar tu cuenta.' };
    }
    return { error: null };
  }

  // Iniciar sesión
  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Correo o contraseña incorrectos' };
      }
      return { error: error.message };
    }
    return { error: null };
  }

  // Cerrar sesión
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
