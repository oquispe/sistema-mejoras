/**
 * storage.ts - Funciones para subir archivos a Supabase Storage
 */

import { supabase } from './supabase';
import {
  TIPOS_IMAGEN,
  TIPOS_DOCUMENTO,
  MAX_TAMANIO_IMAGEN,
  MAX_TAMANIO_DOCUMENTO,
} from '../types';

const BUCKET_ARCHIVOS = 'proyecto-archivos';

/**
 * Subir una imagen al storage
 * @param file - Archivo de imagen
 * @param userId - ID del usuario que sube
 * @returns URL pública de la imagen o null si falla
 */
export async function subirImagen(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Tipo de archivo no permitido. Usa JPG, PNG, GIF o WebP.' };
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, error: 'La imagen es muy grande. Máximo 5MB.' };
    }

    // Generar nombre único
    const extension = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${extension}`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from('proyectos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo imagen:', error.message);
      return { url: null, error: error.message };
    }

    // Obtener URL pública
    const { data: publicUrl } = supabase.storage
      .from('proyectos')
      .getPublicUrl(data.path);

    return { url: publicUrl.publicUrl, error: null };
  } catch (err) {
    console.error('Error inesperado:', err);
    return { url: null, error: 'Error al subir la imagen' };
  }
}

/**
 * Eliminar una imagen del storage
 */
export async function eliminarImagen(url: string): Promise<{ error: string | null }> {
  try {
    // Extraer el path de la URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/storage/v1/object/public/proyectos/');

    if (pathParts.length < 2) {
      return { error: 'URL de imagen inválida' };
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('proyectos')
      .remove([filePath]);

    if (error) {
      console.error('Error eliminando imagen:', error.message);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Error al eliminar la imagen' };
  }
}

// ============================================================
// FUNCIONES PARA MÚLTIPLES ARCHIVOS (proyecto-archivos bucket)
// ============================================================

/**
 * Determina si un archivo es imagen o documento
 */
export function getTipoArchivo(mimeType: string): 'imagen' | 'documento' | null {
  if ((TIPOS_IMAGEN as readonly string[]).includes(mimeType)) return 'imagen';
  if ((TIPOS_DOCUMENTO as readonly string[]).includes(mimeType)) return 'documento';
  return null;
}

/**
 * Valida un archivo antes de subirlo
 */
export function validarArchivo(file: File): { valido: boolean; error?: string } {
  const tipo = getTipoArchivo(file.type);

  if (!tipo) {
    return {
      valido: false,
      error: `Tipo no permitido: ${file.name}. Usa imágenes (JPG, PNG, GIF, WebP) o documentos (PDF, Excel, Word).`
    };
  }

  const maxSize = tipo === 'imagen' ? MAX_TAMANIO_IMAGEN : MAX_TAMANIO_DOCUMENTO;
  const maxSizeMB = maxSize / (1024 * 1024);

  if (file.size > maxSize) {
    return {
      valido: false,
      error: `${file.name} es muy grande. Máximo ${maxSizeMB}MB para ${tipo === 'imagen' ? 'imágenes' : 'documentos'}.`
    };
  }

  return { valido: true };
}

/**
 * Subir un archivo al bucket proyecto-archivos
 */
export async function subirArchivoProyecto(
  file: File,
  userId: string
): Promise<{
  url: string | null;
  storagePath: string | null;
  tipo: 'imagen' | 'documento' | null;
  error: string | null;
}> {
  try {
    // Validar archivo
    const validacion = validarArchivo(file);
    if (!validacion.valido) {
      return { url: null, storagePath: null, tipo: null, error: validacion.error! };
    }

    const tipo = getTipoArchivo(file.type)!;

    // Generar nombre único preservando el nombre original para referencia
    const extension = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const storagePath = `${userId}/${timestamp}-${randomId}.${extension}`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_ARCHIVOS)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo archivo:', error.message);
      return { url: null, storagePath: null, tipo: null, error: error.message };
    }

    // Obtener URL pública
    const { data: publicUrl } = supabase.storage
      .from(BUCKET_ARCHIVOS)
      .getPublicUrl(data.path);

    return {
      url: publicUrl.publicUrl,
      storagePath: data.path,
      tipo,
      error: null
    };
  } catch (err) {
    console.error('Error inesperado:', err);
    return { url: null, storagePath: null, tipo: null, error: 'Error al subir el archivo' };
  }
}

/**
 * Eliminar un archivo del bucket proyecto-archivos
 */
export async function eliminarArchivoProyecto(storagePath: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_ARCHIVOS)
      .remove([storagePath]);

    if (error) {
      console.error('Error eliminando archivo:', error.message);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Error al eliminar el archivo' };
  }
}

/**
 * Obtener icono según el tipo MIME
 */
export function getIconoArchivo(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'picture_as_pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table_chart';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
  if (mimeType.startsWith('image/')) return 'image';
  return 'attach_file';
}

/**
 * Obtener color del icono según el tipo
 */
export function getColorIconoArchivo(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'text-red-500';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-green-600';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-600';
  return 'text-gray-500';
}

/**
 * Formatear tamaño de archivo
 */
export function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// AVATARES DE USUARIO
// ============================================================

const BUCKET_AVATARES = 'proyectos'; // Usamos el bucket existente con subcarpeta avatars/

/**
 * Subir avatar de usuario
 */
export async function subirAvatar(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Usa una imagen JPG, PNG, GIF o WebP.' };
    }

    // Validar tamaño (max 2MB para avatares)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, error: 'La imagen es muy grande. Máximo 2MB.' };
    }

    // Nombre único: avatars/{userId}/avatar.{ext}
    // Usamos el mismo nombre para sobrescribir el anterior
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}/avatar-${Date.now()}.${extension}`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_AVATARES)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Sobrescribir si existe
      });

    if (error) {
      console.error('Error subiendo avatar:', error.message);
      return { url: null, error: error.message };
    }

    // Obtener URL pública
    const { data: publicUrl } = supabase.storage
      .from(BUCKET_AVATARES)
      .getPublicUrl(data.path);

    return { url: publicUrl.publicUrl, error: null };
  } catch (err) {
    console.error('Error inesperado:', err);
    return { url: null, error: 'Error al subir la imagen' };
  }
}
