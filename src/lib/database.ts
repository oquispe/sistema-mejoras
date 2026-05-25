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
import {
  Proyecto,
  ProyectoConStats,
  Comentario,
  Profile,
  ProyectoArchivo,
  Notificacion,
  Concurso,
  ConcursoConStats,
  Postulacion,
  PostulacionConDetalles,
  FaseConcurso,
  Evaluacion,
  EvaluacionConJurado,
  RankingProyecto,
  Avance,
  AvanceConDetalles,
  AvanceVistaConUsuario,
  HORAS_EXPIRACION_AVANCE
} from '../types';
import { eliminarArchivoProyecto, eliminarMediaAvance } from './storage';

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
  usuarioId: string,
  nombreUsuario?: string
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

    if (!error) {
      // Crear notificación para el autor del proyecto
      const { data: proyecto } = await supabase
        .from('proyectos')
        .select('autor_id, titulo')
        .eq('id', proyectoId)
        .single();

      if (proyecto && proyecto.autor_id !== usuarioId) {
        await crearNotificacion({
          usuario_destino: proyecto.autor_id,
          tipo: 'like',
          proyecto_id: proyectoId,
          generada_por: usuarioId,
          mensaje: `${nombreUsuario || 'Alguien'} le dio like a tu proyecto "${proyecto.titulo}"`,
        });
      }
    }

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
  contenido: string,
  nombreAutor?: string
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

  // Crear notificación para el autor del proyecto
  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('autor_id, titulo')
    .eq('id', proyectoId)
    .single();

  if (proyecto && proyecto.autor_id !== autorId) {
    await crearNotificacion({
      usuario_destino: proyecto.autor_id,
      tipo: 'comentario',
      proyecto_id: proyectoId,
      generada_por: autorId,
      mensaje: `${nombreAutor || 'Alguien'} comentó en tu proyecto "${proyecto.titulo}"`,
    });
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

// ============================================================
// ARCHIVOS DE PROYECTOS
// ============================================================

/**
 * Obtener archivos de un proyecto
 */
export async function getArchivosProyecto(proyectoId: string): Promise<ProyectoArchivo[]> {
  const { data, error } = await supabase
    .from('proyecto_archivos')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error obteniendo archivos:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Crear registro de archivo en la BD
 */
export async function crearArchivoProyecto(archivo: {
  proyecto_id: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
  mime_type: string;
  tamanio: number;
  storage_path: string;
  url: string;
  subido_por: string;
}): Promise<{ data: ProyectoArchivo | null; error: string | null }> {
  const { data, error } = await supabase
    .from('proyecto_archivos')
    .insert(archivo)
    .select()
    .single();

  if (error) {
    console.error('Error creando archivo:', error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Eliminar archivo (de BD y Storage)
 */
export async function eliminarArchivoDeProyecto(
  archivoId: string
): Promise<{ error: string | null }> {
  // Primero obtener el archivo para saber el storage_path
  const { data: archivo, error: fetchError } = await supabase
    .from('proyecto_archivos')
    .select('storage_path')
    .eq('id', archivoId)
    .single();

  if (fetchError || !archivo) {
    return { error: 'Archivo no encontrado' };
  }

  // Eliminar del Storage
  const { error: storageError } = await eliminarArchivoProyecto(archivo.storage_path);
  if (storageError) {
    console.warn('Error eliminando del storage:', storageError);
    // Continuamos para eliminar de la BD de todas formas
  }

  // Eliminar de la BD
  const { error } = await supabase
    .from('proyecto_archivos')
    .delete()
    .eq('id', archivoId);

  if (error) {
    console.error('Error eliminando archivo de BD:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Obtener archivos de múltiples proyectos (para el feed)
 */
export async function getArchivosPorProyectos(
  proyectoIds: string[]
): Promise<Map<string, ProyectoArchivo[]>> {
  if (proyectoIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('proyecto_archivos')
    .select('*')
    .in('proyecto_id', proyectoIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error obteniendo archivos:', error.message);
    return new Map();
  }

  // Agrupar por proyecto_id
  const archivosPorProyecto = new Map<string, ProyectoArchivo[]>();
  for (const archivo of data || []) {
    const lista = archivosPorProyecto.get(archivo.proyecto_id) || [];
    lista.push(archivo);
    archivosPorProyecto.set(archivo.proyecto_id, lista);
  }

  return archivosPorProyecto;
}

// ============================================================
// NOTIFICACIONES
// ============================================================

/**
 * Obtener notificaciones de un usuario
 */
export async function getNotificaciones(userId: string): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select(`
      *,
      generador:profiles!generada_por (
        nombre_completo,
        avatar_url
      ),
      proyecto:proyectos!proyecto_id (
        titulo
      )
    `)
    .eq('usuario_destino', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error obteniendo notificaciones:', error.message);
    return [];
  }

  return (data || []).map((n: any) => ({
    ...n,
    generador_nombre: n.generador?.nombre_completo,
    generador_avatar: n.generador?.avatar_url,
    proyecto_titulo: n.proyecto?.titulo,
  }));
}

/**
 * Contar notificaciones no leídas
 */
export async function contarNotificacionesNoLeidas(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_destino', userId)
    .eq('leida', false);

  if (error) {
    console.error('Error contando notificaciones:', error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Crear notificación
 */
export async function crearNotificacion(notificacion: {
  usuario_destino: string;
  tipo: 'like' | 'comentario';
  proyecto_id: string;
  generada_por: string;
  mensaje: string;
}): Promise<{ error: string | null }> {
  // No notificar si el usuario se notifica a sí mismo
  if (notificacion.usuario_destino === notificacion.generada_por) {
    return { error: null };
  }

  const { error } = await supabase
    .from('notificaciones')
    .insert(notificacion);

  if (error) {
    console.error('Error creando notificación:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Marcar notificación como leída
 */
export async function marcarNotificacionLeida(notificacionId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', notificacionId);

  if (error) {
    console.error('Error marcando notificación:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidas(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_destino', userId)
    .eq('leida', false);

  if (error) {
    console.error('Error marcando notificaciones:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

// ============================================================
// CONCURSOS
// ============================================================

/**
 * Calcular la fase actual de un concurso basándose en fechas y estado
 */
export function calcularFaseConcurso(concurso: Concurso): FaseConcurso {
  // Si está cancelado o finalizado por admin, usar ese estado
  if (concurso.estado === 'cancelado') return 'cancelado';
  if (concurso.estado === 'finalizado') return 'finalizado';
  if (concurso.estado === 'evaluacion') return 'evaluacion';

  const ahora = new Date();
  const fechaInicioPost = new Date(concurso.fecha_inicio_postulacion);
  const fechaFinPost = new Date(concurso.fecha_fin_postulacion);
  const fechaFinEval = new Date(concurso.fecha_fin_evaluacion);

  // Antes de que abra postulación
  if (ahora < fechaInicioPost) {
    return 'proximamente';
  }

  // En período de postulación
  if (ahora >= fechaInicioPost && ahora <= fechaFinPost) {
    return 'postulacion';
  }

  // Después de postulación pero antes de evaluación (en proceso)
  if (ahora > fechaFinPost && ahora <= fechaFinEval) {
    return 'en_proceso';
  }

  // Después de fecha de evaluación - debería estar finalizado
  return 'finalizado';
}

/**
 * Obtener todos los concursos con estadísticas
 */
export async function getConcursos(): Promise<ConcursoConStats[]> {
  const { data, error } = await supabase
    .from('concursos')
    .select(`
      *,
      creador:profiles!creado_por (
        nombre_completo,
        avatar_url
      )
    `)
    .order('fecha_inicio_postulacion', { ascending: false });

  if (error) {
    console.error('Error obteniendo concursos:', error.message);
    return [];
  }

  // Obtener conteo de postulaciones para cada concurso
  const concursosConStats: ConcursoConStats[] = await Promise.all(
    (data || []).map(async (c: any) => {
      const { count } = await supabase
        .from('postulaciones')
        .select('*', { count: 'exact', head: true })
        .eq('concurso_id', c.id);

      const fase = calcularFaseConcurso(c);

      return {
        ...c,
        creador_nombre: c.creador?.nombre_completo,
        creador_avatar: c.creador?.avatar_url,
        total_postulaciones: count || 0,
        fase_actual: fase,
        puede_postular: fase === 'postulacion',
        puede_evaluar: fase === 'evaluacion',
      };
    })
  );

  return concursosConStats;
}

/**
 * Obtener un concurso por ID
 */
export async function getConcurso(id: string): Promise<ConcursoConStats | null> {
  const { data: c, error } = await supabase
    .from('concursos')
    .select(`
      *,
      creador:profiles!creado_por (
        nombre_completo,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !c) {
    console.error('Error obteniendo concurso:', error?.message);
    return null;
  }

  const { count } = await supabase
    .from('postulaciones')
    .select('*', { count: 'exact', head: true })
    .eq('concurso_id', c.id);

  const fase = calcularFaseConcurso(c);

  return {
    ...c,
    creador_nombre: c.creador?.nombre_completo,
    creador_avatar: c.creador?.avatar_url,
    total_postulaciones: count || 0,
    fase_actual: fase,
    puede_postular: fase === 'postulacion',
    puede_evaluar: fase === 'evaluacion',
  };
}

/**
 * Crear un nuevo concurso (solo admin)
 * También envía notificaciones a todos los usuarios
 */
export async function crearConcurso(concurso: {
  nombre: string;
  descripcion?: string;
  fecha_inicio_postulacion: string;
  fecha_fin_postulacion: string;
  fecha_fin_evaluacion: string;
  creado_por: string;
}): Promise<{ data: Concurso | null; error: string | null }> {
  const { data, error } = await supabase
    .from('concursos')
    .insert({
      nombre: concurso.nombre,
      descripcion: concurso.descripcion || null,
      fecha_inicio_postulacion: concurso.fecha_inicio_postulacion,
      fecha_fin_postulacion: concurso.fecha_fin_postulacion,
      fecha_fin_evaluacion: concurso.fecha_fin_evaluacion,
      creado_por: concurso.creado_por,
      estado: 'activo',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando concurso:', error.message);
    return { data: null, error: error.message };
  }

  // Enviar notificaciones a todos los usuarios
  if (data) {
    await notificarNuevoConcurso(data.id, data.nombre, concurso.creado_por);
  }

  return { data, error: null };
}

/**
 * Enviar notificación de nuevo concurso a todos los usuarios
 * Usa una función de BD con SECURITY DEFINER para bypass de RLS
 */
async function notificarNuevoConcurso(
  concursoId: string,
  nombreConcurso: string,
  creadoPor: string
): Promise<void> {
  try {
    console.log('Enviando notificaciones de nuevo concurso...');

    const { data, error } = await supabase.rpc('notificar_nuevo_concurso', {
      p_concurso_id: concursoId,
      p_nombre_concurso: nombreConcurso,
      p_creado_por: creadoPor,
    });

    if (error) {
      console.error('Error notificando concurso:', error.message);
    } else {
      console.log(`Notificaciones enviadas: ${data} usuarios`);
    }
  } catch (err) {
    console.error('Error enviando notificaciones de concurso:', err);
  }
}

/**
 * Enviar notificación de resultados de concurso finalizado
 */
export async function notificarResultadosConcurso(
  concursoId: string,
  nombreConcurso: string,
  creadoPor: string
): Promise<void> {
  try {
    console.log('Enviando notificaciones de resultados...');

    const { data, error } = await supabase.rpc('notificar_resultados_concurso', {
      p_concurso_id: concursoId,
      p_nombre_concurso: nombreConcurso,
      p_creado_por: creadoPor,
    });

    if (error) {
      console.error('Error notificando resultados:', error.message);
    } else {
      console.log(`Notificaciones de resultados enviadas: ${data} usuarios`);
    }
  } catch (err) {
    console.error('Error enviando notificaciones de resultados:', err);
  }
}

/**
 * Actualizar un concurso (solo admin)
 */
export async function actualizarConcurso(
  id: string,
  cambios: Partial<Concurso>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('concursos')
    .update(cambios)
    .eq('id', id);

  if (error) {
    console.error('Error actualizando concurso:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Iniciar evaluación de un concurso (cambiar estado a 'evaluacion')
 */
export async function iniciarEvaluacion(id: string): Promise<{ error: string | null }> {
  return actualizarConcurso(id, { estado: 'evaluacion' });
}

/**
 * Finalizar un concurso (cambiar estado a 'finalizado')
 * También envía notificación a todos los usuarios
 */
export async function finalizarConcurso(id: string): Promise<{ error: string | null }> {
  // Primero obtener datos del concurso para la notificación
  const { data: concurso } = await supabase
    .from('concursos')
    .select('nombre, creado_por')
    .eq('id', id)
    .single();

  const resultado = await actualizarConcurso(id, { estado: 'finalizado' });

  // Si se finalizó correctamente, notificar a todos
  if (!resultado.error && concurso) {
    await notificarResultadosConcurso(id, concurso.nombre, concurso.creado_por);
  }

  return resultado;
}

/**
 * Cancelar un concurso (cambiar estado a 'cancelado')
 */
export async function cancelarConcurso(id: string): Promise<{ error: string | null }> {
  return actualizarConcurso(id, { estado: 'cancelado' });
}

/**
 * Reactivar un concurso (cambiar estado a 'activo')
 */
export async function reactivarConcurso(id: string): Promise<{ error: string | null }> {
  return actualizarConcurso(id, { estado: 'activo' });
}

/**
 * Eliminar un concurso (solo admin)
 */
export async function eliminarConcurso(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('concursos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando concurso:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Obtener concursos en fase de postulación (abiertos para postular)
 */
export async function getConcursosActivos(): Promise<ConcursoConStats[]> {
  const ahora = new Date().toISOString();

  const { data, error } = await supabase
    .from('concursos')
    .select(`
      *,
      creador:profiles!creado_por (
        nombre_completo,
        avatar_url
      )
    `)
    .eq('estado', 'activo')
    .lte('fecha_inicio_postulacion', ahora)
    .gte('fecha_fin_postulacion', ahora)
    .order('fecha_fin_postulacion', { ascending: true });

  if (error) {
    console.error('Error obteniendo concursos activos:', error.message);
    return [];
  }

  return (data || []).map((c: any) => ({
    ...c,
    creador_nombre: c.creador?.nombre_completo,
    creador_avatar: c.creador?.avatar_url,
    total_postulaciones: 0,
    fase_actual: 'postulacion' as FaseConcurso,
    puede_postular: true,
    puede_evaluar: false,
  }));
}

// ============================================================
// POSTULACIONES
// ============================================================

/**
 * Postular un proyecto a un concurso
 */
export async function postularProyecto(
  concursoId: string,
  proyectoId: string
): Promise<{ data: Postulacion | null; error: string | null }> {
  const { data, error } = await supabase
    .from('postulaciones')
    .insert({
      concurso_id: concursoId,
      proyecto_id: proyectoId,
    })
    .select()
    .single();

  if (error) {
    // Error de duplicado (ya postulado)
    if (error.code === '23505') {
      return { data: null, error: 'Este proyecto ya está postulado a este concurso' };
    }
    console.error('Error postulando proyecto:', error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Retirar postulación de un proyecto
 */
export async function retirarPostulacion(
  concursoId: string,
  proyectoId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('postulaciones')
    .delete()
    .eq('concurso_id', concursoId)
    .eq('proyecto_id', proyectoId);

  if (error) {
    console.error('Error retirando postulación:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Obtener postulaciones de un concurso
 */
export async function getPostulacionesConcurso(concursoId: string): Promise<PostulacionConDetalles[]> {
  const { data, error } = await supabase
    .from('postulaciones')
    .select(`
      *,
      proyecto:proyectos!proyecto_id (
        titulo,
        categoria,
        area,
        autor:profiles!autor_id (
          nombre_completo,
          avatar_url
        )
      ),
      concurso:concursos!concurso_id (
        nombre
      )
    `)
    .eq('concurso_id', concursoId)
    .order('fecha_postulacion', { ascending: false });

  if (error) {
    console.error('Error obteniendo postulaciones:', error.message);
    return [];
  }

  return (data || []).map((p: any) => ({
    ...p,
    proyecto_titulo: p.proyecto?.titulo,
    proyecto_categoria: p.proyecto?.categoria,
    proyecto_area: p.proyecto?.area,
    proyecto_autor_nombre: p.proyecto?.autor?.nombre_completo,
    proyecto_autor_avatar: p.proyecto?.autor?.avatar_url,
    concurso_nombre: p.concurso?.nombre,
  }));
}

/**
 * Verificar si un proyecto ya está postulado a un concurso
 */
export async function verificarPostulacion(
  concursoId: string,
  proyectoId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('postulaciones')
    .select('id')
    .eq('concurso_id', concursoId)
    .eq('proyecto_id', proyectoId)
    .single();

  return !!data;
}

/**
 * Obtener las postulaciones de un proyecto específico
 */
export async function getPostulacionesProyecto(proyectoId: string): Promise<PostulacionConDetalles[]> {
  const { data, error } = await supabase
    .from('postulaciones')
    .select(`
      *,
      concurso:concursos!concurso_id (
        nombre,
        estado,
        fecha_fin_postulacion,
        fecha_fin_evaluacion
      )
    `)
    .eq('proyecto_id', proyectoId)
    .order('fecha_postulacion', { ascending: false });

  if (error) {
    console.error('Error obteniendo postulaciones del proyecto:', error.message);
    return [];
  }

  return (data || []).map((p: any) => ({
    ...p,
    concurso_nombre: p.concurso?.nombre,
    proyecto_titulo: '',
    proyecto_categoria: 'mejora',
    proyecto_area: '',
    proyecto_autor_nombre: '',
  }));
}

// ============================================================
// EVALUACIONES (Sistema de Jurado)
// ============================================================

/**
 * Obtener postulaciones de un concurso para evaluar (con info de si ya fue evaluada)
 */
export async function getPostulacionesParaEvaluar(
  concursoId: string,
  juradoId: string
): Promise<(PostulacionConDetalles & { mi_evaluacion?: Evaluacion })[]> {
  const { data, error } = await supabase
    .from('postulaciones')
    .select(`
      *,
      proyecto:proyectos!proyecto_id (
        id,
        titulo,
        descripcion,
        categoria,
        area,
        imagen_url,
        autor_id,
        autor:profiles!autor_id (
          nombre_completo,
          avatar_url,
          area
        )
      ),
      concurso:concursos!concurso_id (
        nombre
      ),
      evaluaciones!postulacion_id (
        id,
        jurado_id,
        puntaje_innovacion,
        puntaje_impacto,
        puntaje_factibilidad,
        puntaje_presentacion,
        puntaje_total,
        comentario
      )
    `)
    .eq('concurso_id', concursoId)
    .order('fecha_postulacion', { ascending: true });

  if (error) {
    console.error('Error obteniendo postulaciones para evaluar:', error.message);
    return [];
  }

  return (data || []).map((p: any) => {
    // Buscar si este jurado ya evaluó
    const miEvaluacion = p.evaluaciones?.find((e: any) => e.jurado_id === juradoId);

    return {
      ...p,
      proyecto_titulo: p.proyecto?.titulo,
      proyecto_descripcion: p.proyecto?.descripcion,
      proyecto_categoria: p.proyecto?.categoria,
      proyecto_area: p.proyecto?.area,
      proyecto_imagen_url: p.proyecto?.imagen_url,
      proyecto_autor_id: p.proyecto?.autor_id || null, // ID del autor para validación
      proyecto_autor_nombre: p.proyecto?.autor?.nombre_completo,
      proyecto_autor_avatar: p.proyecto?.autor?.avatar_url,
      concurso_nombre: p.concurso?.nombre,
      mi_evaluacion: miEvaluacion || undefined,
    };
  });
}

/**
 * Crear o actualizar evaluación
 */
export async function guardarEvaluacion(evaluacion: {
  postulacion_id: string;
  jurado_id: string;
  puntaje_innovacion: number;
  puntaje_impacto: number;
  puntaje_factibilidad: number;
  puntaje_presentacion: number;
  comentario?: string;
}): Promise<{ data: Evaluacion | null; error: string | null }> {
  // Usar upsert para crear o actualizar
  const { data, error } = await supabase
    .from('evaluaciones')
    .upsert({
      postulacion_id: evaluacion.postulacion_id,
      jurado_id: evaluacion.jurado_id,
      puntaje_innovacion: evaluacion.puntaje_innovacion,
      puntaje_impacto: evaluacion.puntaje_impacto,
      puntaje_factibilidad: evaluacion.puntaje_factibilidad,
      puntaje_presentacion: evaluacion.puntaje_presentacion,
      comentario: evaluacion.comentario || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'postulacion_id,jurado_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error guardando evaluación:', error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtener evaluaciones de una postulación
 */
export async function getEvaluacionesPostulacion(postulacionId: string): Promise<EvaluacionConJurado[]> {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      *,
      jurado:profiles!jurado_id (
        nombre_completo,
        avatar_url
      )
    `)
    .eq('postulacion_id', postulacionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo evaluaciones:', error.message);
    return [];
  }

  return (data || []).map((e: any) => ({
    ...e,
    jurado_nombre: e.jurado?.nombre_completo,
    jurado_avatar: e.jurado?.avatar_url,
  }));
}

/**
 * Obtener ranking de un concurso
 */
export async function getRankingConcurso(concursoId: string): Promise<RankingProyecto[]> {
  const { data, error } = await supabase
    .from('ranking_concurso')
    .select('*')
    .eq('concurso_id', concursoId)
    .order('puntaje_promedio', { ascending: false });

  if (error) {
    console.error('Error obteniendo ranking:', error.message);
    return [];
  }

  // Agregar posición
  return (data || []).map((r: any, index: number) => ({
    ...r,
    posicion: index + 1,
  }));
}

/**
 * Contar evaluaciones pendientes de un jurado en un concurso
 */
export async function contarEvaluacionesPendientes(
  concursoId: string,
  juradoId: string
): Promise<{ total: number; evaluadas: number; pendientes: number }> {
  // Total de postulaciones
  const { count: total } = await supabase
    .from('postulaciones')
    .select('*', { count: 'exact', head: true })
    .eq('concurso_id', concursoId);

  // Primero obtener los IDs de postulaciones del concurso
  const { data: postulacionesData } = await supabase
    .from('postulaciones')
    .select('id')
    .eq('concurso_id', concursoId);

  const postulacionIds = (postulacionesData || []).map(p => p.id);

  // Evaluaciones del jurado para esas postulaciones
  let evaluadas = 0;
  if (postulacionIds.length > 0) {
    const { count } = await supabase
      .from('evaluaciones')
      .select('*', { count: 'exact', head: true })
      .eq('jurado_id', juradoId)
      .in('postulacion_id', postulacionIds);
    evaluadas = count || 0;
  }

  return {
    total: total || 0,
    evaluadas,
    pendientes: (total || 0) - evaluadas,
  };
}

// ============================================================
// GESTIÓN DE JURADOS (Admin)
// ============================================================

/**
 * Obtener todos los usuarios con rol jurado
 */
export async function getUsuariosJurado(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'jurado')
    .order('nombre_completo');

  if (error) {
    console.error('Error obteniendo jurados:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Obtener todos los usuarios (para asignar como jurado)
 */
export async function getTodosUsuarios(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('nombre_completo');

  if (error) {
    console.error('Error obteniendo usuarios:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Cambiar rol de un usuario
 */
export async function cambiarRolUsuario(
  userId: string,
  nuevoRol: 'usuario' | 'jurado' | 'admin'
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ rol: nuevoRol })
    .eq('id', userId);

  if (error) {
    console.error('Error cambiando rol:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Asignar jurado a un concurso
 */
export async function asignarJuradoAConcurso(
  concursoId: string,
  juradoId: string,
  asignadoPor: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('concurso_jurados')
    .insert({
      concurso_id: concursoId,
      jurado_id: juradoId,
      asignado_por: asignadoPor,
    });

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este jurado ya está asignado a este concurso' };
    }
    console.error('Error asignando jurado:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Remover jurado de un concurso
 */
export async function removerJuradoDeConcurso(
  concursoId: string,
  juradoId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('concurso_jurados')
    .delete()
    .eq('concurso_id', concursoId)
    .eq('jurado_id', juradoId);

  if (error) {
    console.error('Error removiendo jurado:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Obtener jurados asignados a un concurso
 */
export async function getJuradosDeConcurso(concursoId: string): Promise<(Profile & { asignado_at: string })[]> {
  const { data, error } = await supabase
    .from('concurso_jurados')
    .select(`
      created_at,
      jurado:profiles!jurado_id (*)
    `)
    .eq('concurso_id', concursoId);

  if (error) {
    console.error('Error obteniendo jurados del concurso:', error.message);
    return [];
  }

  return (data || []).map((d: any) => ({
    ...d.jurado,
    asignado_at: d.created_at,
  }));
}

/**
 * Obtener concursos asignados a un jurado (solo los que están en evaluación)
 */
export async function getConcursosAsignadosAJurado(juradoId: string): Promise<ConcursoConStats[]> {
  // Obtener IDs de concursos asignados al jurado
  const { data: asignaciones, error: errorAsignaciones } = await supabase
    .from('concurso_jurados')
    .select('concurso_id')
    .eq('jurado_id', juradoId);

  if (errorAsignaciones) {
    console.error('Error obteniendo asignaciones:', errorAsignaciones.message);
    return [];
  }

  if (!asignaciones || asignaciones.length === 0) {
    return [];
  }

  const concursoIds = asignaciones.map(a => a.concurso_id);

  // Obtener los concursos que están en evaluación
  const { data: concursos, error } = await supabase
    .from('concursos')
    .select(`
      *,
      creador:profiles!creado_por (
        nombre_completo,
        avatar_url
      )
    `)
    .in('id', concursoIds)
    .eq('estado', 'evaluacion')
    .order('fecha_fin_evaluacion', { ascending: true });

  if (error) {
    console.error('Error obteniendo concursos del jurado:', error.message);
    return [];
  }

  // Agregar conteo de postulaciones
  const concursosConStats: ConcursoConStats[] = await Promise.all(
    (concursos || []).map(async (c: any) => {
      const { count } = await supabase
        .from('postulaciones')
        .select('*', { count: 'exact', head: true })
        .eq('concurso_id', c.id);

      return {
        ...c,
        creador_nombre: c.creador?.nombre_completo,
        creador_avatar: c.creador?.avatar_url,
        total_postulaciones: count || 0,
        fase_actual: 'evaluacion' as FaseConcurso,
        puede_postular: false,
        puede_evaluar: true,
      };
    })
  );

  return concursosConStats;
}

/**
 * Obtener resumen de evaluaciones de un concurso para admin
 */
export async function getResumenEvaluacionesConcurso(concursoId: string): Promise<{
  jurado_id: string;
  jurado_nombre: string;
  jurado_avatar: string | null;
  total_evaluaciones: number;
  promedio_dado: number;
}[]> {
  // Primero obtener las postulaciones del concurso
  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select('id')
    .eq('concurso_id', concursoId);

  if (!postulaciones || postulaciones.length === 0) return [];

  const postulacionIds = postulaciones.map(p => p.id);

  // Obtener evaluaciones con info del jurado
  const { data: evaluaciones, error } = await supabase
    .from('evaluaciones')
    .select(`
      jurado_id,
      puntaje_total,
      jurado:profiles!jurado_id (
        nombre_completo,
        avatar_url
      )
    `)
    .in('postulacion_id', postulacionIds);

  if (error) {
    console.error('Error obteniendo resumen:', error.message);
    return [];
  }

  // Agrupar por jurado
  const porJurado = new Map<string, {
    nombre: string;
    avatar: string | null;
    puntajes: number[]
  }>();

  for (const e of evaluaciones || []) {
    const existing = porJurado.get(e.jurado_id);
    if (existing) {
      existing.puntajes.push(e.puntaje_total);
    } else {
      porJurado.set(e.jurado_id, {
        nombre: (e.jurado as any)?.nombre_completo || 'Jurado',
        avatar: (e.jurado as any)?.avatar_url,
        puntajes: [e.puntaje_total],
      });
    }
  }

  // Calcular promedios
  return Array.from(porJurado.entries()).map(([juradoId, data]) => ({
    jurado_id: juradoId,
    jurado_nombre: data.nombre,
    jurado_avatar: data.avatar,
    total_evaluaciones: data.puntajes.length,
    promedio_dado: data.puntajes.reduce((a, b) => a + b, 0) / data.puntajes.length,
  }));
}

/**
 * Obtener evaluaciones detalladas de un jurado en un concurso
 */
export async function getEvaluacionesDeJuradoEnConcurso(
  concursoId: string,
  juradoId: string
): Promise<{
  proyecto_titulo: string;
  proyecto_id: string;
  puntaje_innovacion: number;
  puntaje_impacto: number;
  puntaje_factibilidad: number;
  puntaje_presentacion: number;
  puntaje_total: number;
  comentario: string | null;
}[]> {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      puntaje_innovacion,
      puntaje_impacto,
      puntaje_factibilidad,
      puntaje_presentacion,
      puntaje_total,
      comentario,
      postulacion:postulaciones!postulacion_id (
        concurso_id,
        proyecto:proyectos!proyecto_id (
          id,
          titulo
        )
      )
    `)
    .eq('jurado_id', juradoId);

  if (error) {
    console.error('Error obteniendo evaluaciones del jurado:', error.message);
    return [];
  }

  // Filtrar solo las del concurso especificado
  return (data || [])
    .filter((e: any) => e.postulacion?.concurso_id === concursoId)
    .map((e: any) => ({
      proyecto_titulo: e.postulacion?.proyecto?.titulo || 'Proyecto',
      proyecto_id: e.postulacion?.proyecto?.id,
      puntaje_innovacion: e.puntaje_innovacion,
      puntaje_impacto: e.puntaje_impacto,
      puntaje_factibilidad: e.puntaje_factibilidad,
      puntaje_presentacion: e.puntaje_presentacion,
      puntaje_total: e.puntaje_total,
      comentario: e.comentario,
    }));
}

// ============================================================
// AVANCES (Stories temporales)
// ============================================================

/**
 * Obtener avances vigentes (últimas 24h, no expirados)
 * Agrupa por autor para mostrar en la barra de stories
 */
export async function getAvancesVigentes(userId?: string): Promise<AvanceConDetalles[]> {
  // Calcular fecha límite (24h atrás)
  const fechaLimite = new Date();
  fechaLimite.setHours(fechaLimite.getHours() - HORAS_EXPIRACION_AVANCE);

  const { data, error } = await supabase
    .from('avances')
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url,
        area
      ),
      proyecto:proyectos!proyecto_id (
        titulo
      )
    `)
    .eq('expirado', false)
    .gte('created_at', fechaLimite.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo avances:', error.message);
    return [];
  }

  // Obtener vistas del usuario actual si está autenticado
  let misVistas: string[] = [];
  if (userId) {
    const { data: vistasData } = await supabase
      .from('avances_vistas')
      .select('avance_id')
      .eq('usuario_id', userId);
    misVistas = (vistasData || []).map(v => v.avance_id);
  }

  return (data || []).map((a: any) => ({
    ...a,
    autor_nombre: a.autor?.nombre_completo || 'Usuario',
    autor_avatar: a.autor?.avatar_url,
    autor_area: a.autor?.area || 'General',
    proyecto_titulo: a.proyecto?.titulo,
    visto_por_mi: misVistas.includes(a.id),
  }));
}

/**
 * Obtener avances de un autor específico
 */
export async function getAvancesDeAutor(autorId: string): Promise<AvanceConDetalles[]> {
  const fechaLimite = new Date();
  fechaLimite.setHours(fechaLimite.getHours() - HORAS_EXPIRACION_AVANCE);

  const { data, error } = await supabase
    .from('avances')
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url,
        area
      ),
      proyecto:proyectos!proyecto_id (
        titulo
      )
    `)
    .eq('autor_id', autorId)
    .eq('expirado', false)
    .gte('created_at', fechaLimite.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error obteniendo avances del autor:', error.message);
    return [];
  }

  return (data || []).map((a: any) => ({
    ...a,
    autor_nombre: a.autor?.nombre_completo || 'Usuario',
    autor_avatar: a.autor?.avatar_url,
    autor_area: a.autor?.area || 'General',
    proyecto_titulo: a.proyecto?.titulo,
  }));
}

/**
 * Obtener avances de un proyecto específico
 */
export async function getAvancesDeProyecto(proyectoId: string): Promise<AvanceConDetalles[]> {
  const fechaLimite = new Date();
  fechaLimite.setHours(fechaLimite.getHours() - HORAS_EXPIRACION_AVANCE);

  const { data, error } = await supabase
    .from('avances')
    .select(`
      *,
      autor:profiles!autor_id (
        nombre_completo,
        avatar_url,
        area
      )
    `)
    .eq('proyecto_id', proyectoId)
    .eq('expirado', false)
    .gte('created_at', fechaLimite.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo avances del proyecto:', error.message);
    return [];
  }

  return (data || []).map((a: any) => ({
    ...a,
    autor_nombre: a.autor?.nombre_completo || 'Usuario',
    autor_avatar: a.autor?.avatar_url,
    autor_area: a.autor?.area || 'General',
  }));
}

/**
 * Crear un nuevo avance
 */
export async function crearAvance(avance: {
  autor_id: string;
  proyecto_id?: string | null;
  tipo_media: 'foto' | 'video';
  media_url: string;
  storage_path: string;
  texto_opcional?: string;
}): Promise<{ data: Avance | null; error: string | null }> {
  const { data, error } = await supabase
    .from('avances')
    .insert({
      autor_id: avance.autor_id,
      proyecto_id: avance.proyecto_id || null,
      tipo_media: avance.tipo_media,
      media_url: avance.media_url,
      storage_path: avance.storage_path,
      texto_opcional: avance.texto_opcional || null,
      expirado: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando avance:', error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Eliminar un avance (solo el autor puede)
 */
export async function eliminarAvance(avanceId: string): Promise<{ error: string | null }> {
  // Primero obtener el avance para eliminar el archivo
  const { data: avance, error: fetchError } = await supabase
    .from('avances')
    .select('storage_path')
    .eq('id', avanceId)
    .single();

  if (fetchError || !avance) {
    return { error: 'Avance no encontrado' };
  }

  // Eliminar del storage
  await eliminarMediaAvance(avance.storage_path);

  // Eliminar de la BD
  const { error } = await supabase
    .from('avances')
    .delete()
    .eq('id', avanceId);

  if (error) {
    console.error('Error eliminando avance:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Registrar que un usuario vio un avance
 */
export async function registrarVistaAvance(
  avanceId: string,
  usuarioId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('avances_vistas')
    .insert({
      avance_id: avanceId,
      usuario_id: usuarioId,
    });

  // Ignorar error de duplicado (ya vio este avance)
  if (error && error.code !== '23505') {
    console.error('Error registrando vista:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Obtener quiénes vieron un avance (solo el autor puede ver esto)
 */
export async function getVistasAvance(avanceId: string): Promise<AvanceVistaConUsuario[]> {
  const { data, error } = await supabase
    .from('avances_vistas')
    .select(`
      *,
      usuario:profiles!usuario_id (
        nombre_completo,
        avatar_url
      )
    `)
    .eq('avance_id', avanceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo vistas:', error.message);
    return [];
  }

  return (data || []).map((v: any) => ({
    ...v,
    usuario_nombre: v.usuario?.nombre_completo || 'Usuario',
    usuario_avatar: v.usuario?.avatar_url,
  }));
}

/**
 * Contar vistas de un avance
 */
export async function contarVistasAvance(avanceId: string): Promise<number> {
  const { count, error } = await supabase
    .from('avances_vistas')
    .select('*', { count: 'exact', head: true })
    .eq('avance_id', avanceId);

  if (error) {
    console.error('Error contando vistas:', error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Obtener proyectos del usuario para ligar a un avance
 */
export async function getMisProyectosParaAvance(userId: string): Promise<{ id: string; titulo: string }[]> {
  const { data, error } = await supabase
    .from('proyectos')
    .select('id, titulo')
    .eq('autor_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo proyectos:', error.message);
    return [];
  }

  return data || [];
}
