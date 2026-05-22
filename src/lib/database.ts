/**
 * database.ts - Funciones para interactuar con Supabase
 *
 * Este archivo contiene todas las funciones para:
 * - Leer proyectos
 * - Crear proyectos
 * - Dar/quitar likes
 * - Manejar comentarios
 */

import { supabase } from './supabase';
import { Proyecto, ProyectoConStats, Comentario, Profile } from '../types';

// ============================================================
// PROYECTOS
// ============================================================

/**
 * Obtener todos los proyectos con sus estadísticas
 */
export async function getProyectos(userId?: string): Promise<ProyectoConStats[]> {
  // Obtener proyectos con info del autor
  const { data: proyectos, error } = await supabase
    .from('proyectos')
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url,
        area
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo proyectos:', error.message);
    return [];
  }

  // Obtener conteos de likes y comentarios
  const proyectosConStats: ProyectoConStats[] = await Promise.all(
    (proyectos || []).map(async (p: any) => {
      // Contar likes
      const { count: likesCount } = await supabase
        .from('reacciones')
        .select('*', { count: 'exact', head: true })
        .eq('proyecto_id', p.id);

      // Contar comentarios
      const { count: comentariosCount } = await supabase
        .from('comentarios')
        .select('*', { count: 'exact', head: true })
        .eq('proyecto_id', p.id);

      // Verificar si el usuario actual dio like
      let usuarioDioLike = false;
      if (userId) {
        const { data: like } = await supabase
          .from('reacciones')
          .select('id')
          .eq('proyecto_id', p.id)
          .eq('usuario_id', userId)
          .single();
        usuarioDioLike = !!like;
      }

      return {
        ...p,
        autor_nombre: p.autor?.nombre_completo || 'Usuario',
        autor_avatar: p.autor?.avatar_url,
        autor_area: p.autor?.area || 'General',
        likes_count: likesCount || 0,
        comentarios_count: comentariosCount || 0,
        usuario_dio_like: usuarioDioLike,
      };
    })
  );

  return proyectosConStats;
}

/**
 * Obtener un proyecto por ID
 */
export async function getProyecto(id: string, userId?: string): Promise<ProyectoConStats | null> {
  const { data: p, error } = await supabase
    .from('proyectos')
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url,
        area
      )
    `)
    .eq('id', id)
    .single();

  if (error || !p) {
    console.error('Error obteniendo proyecto:', error?.message);
    return null;
  }

  // Contar likes
  const { count: likesCount } = await supabase
    .from('reacciones')
    .select('*', { count: 'exact', head: true })
    .eq('proyecto_id', p.id);

  // Contar comentarios
  const { count: comentariosCount } = await supabase
    .from('comentarios')
    .select('*', { count: 'exact', head: true })
    .eq('proyecto_id', p.id);

  // Verificar si el usuario actual dio like
  let usuarioDioLike = false;
  if (userId) {
    const { data: like } = await supabase
      .from('reacciones')
      .select('id')
      .eq('proyecto_id', p.id)
      .eq('usuario_id', userId)
      .single();
    usuarioDioLike = !!like;
  }

  return {
    ...p,
    autor_nombre: p.autor?.nombre_completo || 'Usuario',
    autor_avatar: p.autor?.avatar_url,
    autor_area: p.autor?.area || 'General',
    likes_count: likesCount || 0,
    comentarios_count: comentariosCount || 0,
    usuario_dio_like: usuarioDioLike,
  };
}

/**
 * Crear un nuevo proyecto
 */
export async function crearProyecto(proyecto: {
  titulo: string;
  descripcion: string;
  categoria: 'proyecto' | 'mejora' | 'innovacion';
  area: string;
  tipo: 'produccion' | 'calidad' | 'seguridad';
  imagen_url?: string;
  autor_id: string;
}): Promise<{ data: Proyecto | null; error: string | null }> {
  const { data, error } = await supabase
    .from('proyectos')
    .insert({
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion,
      categoria: proyecto.categoria,
      area: proyecto.area,
      tipo: proyecto.tipo,
      imagen_url: proyecto.imagen_url || null,
      autor_id: proyecto.autor_id,
      estado: 'en_progreso',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando proyecto:', error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Actualizar un proyecto
 */
export async function actualizarProyecto(
  id: string,
  cambios: Partial<Proyecto>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('proyectos')
    .update(cambios)
    .eq('id', id);

  if (error) {
    console.error('Error actualizando proyecto:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Eliminar un proyecto
 */
export async function eliminarProyecto(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('proyectos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando proyecto:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

// ============================================================
// LIKES / REACCIONES
// ============================================================

/**
 * Dar like a un proyecto
 */
export async function darLike(
  proyectoId: string,
  usuarioId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reacciones')
    .insert({
      proyecto_id: proyectoId,
      usuario_id: usuarioId,
    });

  if (error) {
    // Si el error es de duplicado, ignorarlo
    if (error.code === '23505') {
      return { error: null };
    }
    console.error('Error dando like:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Quitar like de un proyecto
 */
export async function quitarLike(
  proyectoId: string,
  usuarioId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reacciones')
    .delete()
    .eq('proyecto_id', proyectoId)
    .eq('usuario_id', usuarioId);

  if (error) {
    console.error('Error quitando like:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Toggle like (dar o quitar según estado actual)
 */
export async function toggleLike(
  proyectoId: string,
  usuarioId: string
): Promise<{ liked: boolean; error: string | null }> {
  // Verificar si ya tiene like
  const { data: existingLike } = await supabase
    .from('reacciones')
    .select('id')
    .eq('proyecto_id', proyectoId)
    .eq('usuario_id', usuarioId)
    .single();

  if (existingLike) {
    // Quitar like
    const { error } = await quitarLike(proyectoId, usuarioId);
    return { liked: false, error };
  } else {
    // Dar like
    const { error } = await darLike(proyectoId, usuarioId);
    return { liked: true, error };
  }
}

// ============================================================
// COMENTARIOS
// ============================================================

/**
 * Obtener comentarios de un proyecto
 */
export async function getComentarios(proyectoId: string): Promise<Comentario[]> {
  const { data, error } = await supabase
    .from('comentarios')
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url
      )
    `)
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error obteniendo comentarios:', error.message);
    return [];
  }

  return (data || []).map((c: any) => ({
    ...c,
    autor_nombre: c.autor?.nombre_completo || 'Usuario',
    autor_avatar: c.autor?.avatar_url,
  }));
}

/**
 * Crear un comentario
 */
export async function crearComentario(
  proyectoId: string,
  autorId: string,
  contenido: string
): Promise<{ data: Comentario | null; error: string | null }> {
  const { data, error } = await supabase
    .from('comentarios')
    .insert({
      proyecto_id: proyectoId,
      autor_id: autorId,
      contenido,
    })
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Error creando comentario:', error.message);
    return { data: null, error: error.message };
  }

  return {
    data: {
      ...data,
      autor_nombre: data.autor?.nombre_completo || 'Usuario',
      autor_avatar: data.autor?.avatar_url,
    },
    error: null,
  };
}

/**
 * Eliminar un comentario
 */
export async function eliminarComentario(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('comentarios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando comentario:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

// ============================================================
// PERFILES
// ============================================================

/**
 * Obtener perfil por ID
 */
export async function getPerfil(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error obteniendo perfil:', error.message);
    return null;
  }

  return data;
}

/**
 * Actualizar perfil
 */
export async function actualizarPerfil(
  id: string,
  cambios: Partial<Profile>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(cambios)
    .eq('id', id);

  if (error) {
    console.error('Error actualizando perfil:', error.message);
    return { error: error.message };
  }

  return { error: null };
}
