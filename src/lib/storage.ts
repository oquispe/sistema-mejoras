/**
 * storage.ts - Funciones para subir imágenes a Supabase Storage
 */

import { supabase } from './supabase';

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
