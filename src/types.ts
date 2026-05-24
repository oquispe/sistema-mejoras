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
  rol: 'usuario' | 'jurado' | 'admin';
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
  // Archivos del proyecto
  archivos?: ProyectoArchivo[];
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

/**
 * Archivo de proyecto (tabla: proyecto_archivos)
 */
export interface ProyectoArchivo {
  id: string;
  proyecto_id: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
  mime_type: string;
  tamanio: number;
  storage_path: string;
  url: string;
  subido_por: string;
  created_at: string;
}

/**
 * Archivo local antes de subir (para el componente FileUploader)
 */
export interface ArchivoLocal {
  id: string; // ID temporal para identificar en la UI
  file: File;
  preview?: string;
  tipo: 'imagen' | 'documento';
  nombre: string;
  tamanio: number;
}

/**
 * Notificación (tabla: notificaciones)
 */
export interface Notificacion {
  id: string;
  usuario_destino: string;
  tipo: 'like' | 'comentario' | 'concurso';
  proyecto_id: string | null;
  concurso_id?: string | null;
  generada_por: string | null;
  mensaje: string;
  leida: boolean;
  created_at: string;
  // Campos unidos
  generador_nombre?: string;
  generador_avatar?: string | null;
  proyecto_titulo?: string;
  concurso_nombre?: string;
}

// ============================================================
// FASE 3: CONCURSOS Y POSTULACIONES
// ============================================================

/**
 * Concurso (tabla: concursos)
 * Representa un concurso/convocatoria donde los usuarios postulan proyectos
 *
 * Flujo de estados:
 * - proximamente: Antes de fecha_inicio_postulacion
 * - postulacion: Entre fecha_inicio_postulacion y fecha_fin_postulacion
 * - en_proceso: Entre fecha_fin_postulacion y cuando admin cambia a evaluacion
 * - evaluacion: Jurado puede calificar (hasta fecha_fin_evaluacion)
 * - finalizado: Se muestran los ganadores
 */
export interface Concurso {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_inicio_postulacion: string;
  fecha_fin_postulacion: string;
  fecha_fin_evaluacion: string;
  estado: 'activo' | 'evaluacion' | 'finalizado' | 'cancelado';
  creado_por: string;
  created_at: string;
}

/**
 * Fase visual calculada del concurso (basada en fechas y estado)
 */
export type FaseConcurso = 'proximamente' | 'postulacion' | 'en_proceso' | 'evaluacion' | 'finalizado' | 'cancelado';

/**
 * Concurso con información adicional para mostrar en la UI
 */
export interface ConcursoConStats extends Concurso {
  // Información del creador (admin)
  creador_nombre?: string;
  creador_avatar?: string | null;
  // Estadísticas
  total_postulaciones: number;
  // Estados calculados en el cliente
  fase_actual?: FaseConcurso;
  puede_postular?: boolean; // true si está en fase de postulación
  puede_evaluar?: boolean; // true si está en fase de evaluación
}

/**
 * Postulación (tabla: postulaciones)
 * Relaciona un proyecto con un concurso
 */
export interface Postulacion {
  id: string;
  concurso_id: string;
  proyecto_id: string;
  fecha_postulacion: string;
}

/**
 * Postulación con información expandida para mostrar en la UI
 */
export interface PostulacionConDetalles extends Postulacion {
  // Info del proyecto
  proyecto_titulo: string;
  proyecto_descripcion?: string;
  proyecto_categoria: 'proyecto' | 'mejora' | 'innovacion';
  proyecto_autor_id?: string; // Para validar que jurado no califique su propio proyecto
  proyecto_autor_nombre: string;
  proyecto_autor_avatar?: string | null;
  proyecto_area: string;
  proyecto_imagen_url?: string | null;
  // Info del concurso
  concurso_nombre: string;
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
export const ROLES = ['usuario', 'jurado', 'admin'] as const;
export const ESTADOS_CONCURSO = ['activo', 'evaluacion', 'finalizado', 'cancelado'] as const;
export const FASES_CONCURSO = ['proximamente', 'postulacion', 'en_proceso', 'evaluacion', 'finalizado', 'cancelado'] as const;

// ============================================================
// EVALUACIONES (Sistema de Jurado)
// ============================================================

/**
 * Evaluación de un jurado a un proyecto postulado
 */
export interface Evaluacion {
  id: string;
  postulacion_id: string;
  jurado_id: string;
  puntaje_innovacion: number;
  puntaje_impacto: number;
  puntaje_factibilidad: number;
  puntaje_presentacion: number;
  puntaje_total: number;
  comentario: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Evaluación con información del jurado
 */
export interface EvaluacionConJurado extends Evaluacion {
  jurado_nombre: string;
  jurado_avatar: string | null;
}

/**
 * Ranking de un proyecto en un concurso
 */
export interface RankingProyecto {
  concurso_id: string;
  proyecto_id: string;
  proyecto_titulo: string;
  proyecto_categoria: 'proyecto' | 'mejora' | 'innovacion';
  autor_nombre: string;
  autor_avatar: string | null;
  autor_area: string;
  total_evaluaciones: number;
  puntaje_promedio: number;
  promedio_innovacion: number;
  promedio_impacto: number;
  promedio_factibilidad: number;
  promedio_presentacion: number;
  posicion?: number;
}

/**
 * Criterios de evaluación
 */
export const CRITERIOS_EVALUACION = [
  { id: 'innovacion', label: 'Innovación', descripcion: 'Originalidad y creatividad de la propuesta', icon: 'lightbulb' },
  { id: 'impacto', label: 'Impacto', descripcion: 'Beneficio potencial para la organización', icon: 'trending_up' },
  { id: 'factibilidad', label: 'Factibilidad', descripcion: 'Viabilidad técnica y económica', icon: 'engineering' },
  { id: 'presentacion', label: 'Presentación', descripcion: 'Claridad y calidad de la documentación', icon: 'description' },
] as const;

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

// Tipos de archivos permitidos
export const TIPOS_IMAGEN = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const TIPOS_DOCUMENTO = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
] as const;

export const MAX_ARCHIVOS_POR_PROYECTO = 10;
export const MAX_TAMANIO_IMAGEN = 5 * 1024 * 1024; // 5MB
export const MAX_TAMANIO_DOCUMENTO = 10 * 1024 * 1024; // 10MB
