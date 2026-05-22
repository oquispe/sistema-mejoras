/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================
// TIPOS PARA SUPABASE (coinciden con las tablas de la BD)
// ============================================================

/**
 * Perfil de usuario (tabla: profiles)
 */
export interface Profile {
  id: string;
  nombre_completo: string;
  area: string;
  rol: 'usuario' | 'jurado';
  avatar_url: string | null;
  created_at: string;
}

/**
 * Proyecto/Mejora (tabla: proyectos)
 */
export interface Proyecto {
  id: string;
  autor_id: string;
  titulo: string;
  descripcion: string;
  categoria: 'proyecto' | 'mejora' | 'innovacion';
  area: string;
  tipo: 'produccion' | 'calidad' | 'seguridad';
  estado: 'en_progreso' | 'completado';
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Proyecto con estadísticas (vista: proyectos_con_stats)
 */
export interface ProyectoConStats extends Proyecto {
  autor_nombre: string;
  autor_avatar: string | null;
  autor_area: string;
  likes_count: number;
  comentarios_count: number;
  // Campo calculado en el cliente
  usuario_dio_like?: boolean;
}

/**
 * Comentario (tabla: comentarios)
 */
export interface Comentario {
  id: string;
  proyecto_id: string;
  autor_id: string;
  contenido: string;
  created_at: string;
  // Campos unidos desde profiles
  autor_nombre?: string;
  autor_avatar?: string | null;
}

/**
 * Reacción/Like (tabla: reacciones)
 */
export interface Reaccion {
  id: string;
  proyecto_id: string;
  usuario_id: string;
  created_at: string;
}

// ============================================================
// TIPOS LEGACY (para compatibilidad con componentes existentes)
// Los mantenemos mientras migramos gradualmente
// ============================================================

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  stats: {
    innovations: number;
    collabs: number;
    followers: string | number;
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: "UI Design" | "Research" | "Hardware" | "Ethics" | "Branding" | "Sustainability" | "Machine Learning" | "React Native";
  authorId: string;
  image: string;
  likes: number;
  commentCount: number;
  isLiked: boolean;
  tags?: string[];
  vision?: string;
  goals?: string[];
  relatedProjects?: string[];
}

export interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  parentId?: string;
  likes: number;
  isLiked?: boolean;
  isAuthor?: boolean;
}

export interface Topic {
  name: string;
  icon: string;
}

// ============================================================
// CONSTANTES ÚTILES
// ============================================================

export const CATEGORIAS = ['proyecto', 'mejora', 'innovacion'] as const;
export const TIPOS = ['produccion', 'calidad', 'seguridad'] as const;
export const ESTADOS = ['en_progreso', 'completado'] as const;
export const ROLES = ['usuario', 'jurado'] as const;

export const AREAS_EJEMPLO = [
  'Costura',
  'Corte',
  'Calidad',
  'Almacén',
  'Mantenimiento',
  'Administración',
  'Producción',
  'Ingeniería',
] as const;
