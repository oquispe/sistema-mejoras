/**
 * AuthContext - Contexto de Autenticación
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, nombreCompleto: string, area: string) => Promise<{
    error: string | null;
    needsEmailConfirmation: boolean;
  }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil
  async function loadProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Perfil no encontrado');
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.warn('Error cargando perfil:', err);
      return null;
    }
  }

  // Refrescar perfil
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

      if (session?.user) {
        loadProfile(session.user.id).then(setProfile);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth evento:', event);

      // Actualizar usuario
      setUser(session?.user ?? null);

      // Cargar perfil si hay usuario
      if (session?.user) {
        loadProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }

      // Asegurar que loading se desactive
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Registrar nuevo usuario
  async function signUp(
    email: string,
    password: string,
    nombreCompleto: string,
    area: string
  ): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre_completo: nombreCompleto, area },
        },
      });

      if (error) {
        // Traducir errores comunes al español
        if (error.message.includes('rate limit') || error.message.includes('Too Many')) {
          return {
            error: 'Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.',
            needsEmailConfirmation: false
          };
        }
        if (error.message.includes('already registered')) {
          return { error: 'Este correo ya está registrado. Intenta iniciar sesión.', needsEmailConfirmation: false };
        }
        if (error.message.includes('Password')) {
          return { error: 'La contraseña debe tener al menos 6 caracteres.', needsEmailConfirmation: false };
        }
        if (error.message.includes('valid email')) {
          return { error: 'Ingresa un correo electrónico válido.', needsEmailConfirmation: false };
        }
        return { error: error.message, needsEmailConfirmation: false };
      }

      // Caso especial: Email ya existe pero no confirmado
      // Supabase retorna user con identities vacío en lugar de error (por seguridad)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          error: 'Este correo ya está registrado. Revisa tu bandeja de entrada para confirmar, o intenta iniciar sesión.',
          needsEmailConfirmation: false
        };
      }

      // Caso 1: Confirmación de email DESACTIVADA
      // data.session existe = usuario logueado automáticamente
      if (data.session) {
        // Actualizar estado inmediatamente
        setUser(data.session.user);
        loadProfile(data.session.user.id).then(setProfile);
        return { error: null, needsEmailConfirmation: false };
      }

      // Caso 2: Confirmación de email ACTIVADA
      // data.user existe pero data.session es null
      if (data.user && !data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      // Caso especial: Supabase retorna null cuando el email ya existe
      if (!data.user && !data.session) {
        return {
          error: 'Este correo ya está registrado. Si no recuerdas tu contraseña, intenta iniciar sesión o usa otro correo.',
          needsEmailConfirmation: false
        };
      }

      return { error: 'Ocurrió un problema al registrar. Intenta de nuevo.', needsEmailConfirmation: false };
    } catch (err) {
      return { error: 'Error inesperado al registrar', needsEmailConfirmation: false };
    }
  }

  // Iniciar sesión
  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('Too Many')) {
          return { error: 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.' };
        }
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Correo o contraseña incorrectos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.' };
        }
        return { error: error.message };
      }

      // Actualizar estado inmediatamente para evitar esperar onAuthStateChange
      if (data.session) {
        setUser(data.session.user);
        loadProfile(data.session.user.id).then(setProfile);
      }

      return { error: null };
    } catch (err) {
      return { error: 'Error inesperado al iniciar sesión' };
    }
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
