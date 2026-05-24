/**
 * CrearAvanceModal - Modal para crear un nuevo avance (story)
 * Permite subir foto o video corto con texto opcional
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subirMediaAvance, validarArchivoAvance } from '../lib/storage';
import { crearAvance, getMisProyectosParaAvance } from '../lib/database';
import { MAX_DURACION_VIDEO_AVANCE } from '../types';

interface CrearAvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onAvanceCreado: () => void;
}

export default function CrearAvanceModal({
  isOpen,
  onClose,
  userId,
  onAvanceCreado,
}: CrearAvanceModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tipoMedia, setTipoMedia] = useState<'foto' | 'video' | null>(null);
  const [texto, setTexto] = useState('');
  const [proyectoId, setProyectoId] = useState<string>('');
  const [misProyectos, setMisProyectos] = useState<{ id: string; titulo: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duracionVideo, setDuracionVideo] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      cargarMisProyectos();
    } else {
      // Limpiar al cerrar
      resetForm();
    }
  }, [isOpen]);

  async function cargarMisProyectos() {
    const proyectos = await getMisProyectosParaAvance(userId);
    setMisProyectos(proyectos);
  }

  function resetForm() {
    setArchivo(null);
    setPreview(null);
    setTipoMedia(null);
    setTexto('');
    setProyectoId('');
    setError(null);
    setDuracionVideo(0);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar archivo
    const validacion = validarArchivoAvance(file);
    if (!validacion.valido) {
      setError(validacion.error || 'Archivo no válido');
      return;
    }

    setArchivo(file);
    setTipoMedia(validacion.tipo);

    // Crear preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Si es video, verificar duración
    if (validacion.tipo === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        setDuracionVideo(video.duration);
        if (video.duration > MAX_DURACION_VIDEO_AVANCE) {
          setError(`El video es muy largo. Máximo ${MAX_DURACION_VIDEO_AVANCE} segundos.`);
        }
      };
      video.src = url;
    }
  }

  async function handleSubmit() {
    if (!archivo || !tipoMedia) {
      setError('Selecciona una foto o video');
      return;
    }

    if (tipoMedia === 'video' && duracionVideo > MAX_DURACION_VIDEO_AVANCE) {
      setError(`El video es muy largo. Máximo ${MAX_DURACION_VIDEO_AVANCE} segundos.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Subir archivo al storage
      const resultado = await subirMediaAvance(archivo, userId);

      if (resultado.error || !resultado.url || !resultado.storagePath) {
        setError(resultado.error || 'Error al subir el archivo');
        setLoading(false);
        return;
      }

      // Crear avance en la BD
      const { error: dbError } = await crearAvance({
        autor_id: userId,
        proyecto_id: proyectoId || null,
        tipo_media: tipoMedia,
        media_url: resultado.url,
        storage_path: resultado.storagePath,
        texto_opcional: texto.trim() || undefined,
      });

      if (dbError) {
        setError(dbError);
        setLoading(false);
        return;
      }

      // Éxito
      onAvanceCreado();
      onClose();
    } catch (err) {
      setError('Error inesperado al crear el avance');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <h2 className="text-lg font-display font-bold text-surface-900">
              Nuevo avance
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Selector de archivo */}
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
              >
                <span className="material-symbols-outlined text-5xl text-surface-400 mb-3">
                  add_photo_alternate
                </span>
                <p className="text-surface-600 font-medium">
                  Selecciona una foto o video
                </p>
                <p className="text-sm text-surface-400 mt-1">
                  Foto hasta 5MB • Video hasta 25MB (máx. 30 seg)
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px] mx-auto">
                {tipoMedia === 'foto' ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={preview}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                )}

                {/* Botón cambiar */}
                <button
                  onClick={() => {
                    setArchivo(null);
                    setPreview(null);
                    setTipoMedia(null);
                    setError(null);
                    setDuracionVideo(0);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>

                {/* Duración del video */}
                {tipoMedia === 'video' && duracionVideo > 0 && (
                  <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    duracionVideo > MAX_DURACION_VIDEO_AVANCE
                      ? 'bg-red-500 text-white'
                      : 'bg-black/50 text-white'
                  }`}>
                    {Math.round(duracionVideo)}s / {MAX_DURACION_VIDEO_AVANCE}s
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Texto opcional */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Texto (opcional)
              </label>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe algo sobre tu avance..."
                maxLength={200}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-surface-400 mt-1 text-right">
                {texto.length}/200
              </p>
            </div>

            {/* Selector de proyecto */}
            {misProyectos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Ligar a proyecto (opcional)
                </label>
                <select
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">Sin proyecto</option>
                  {misProyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-surface-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-surface-200 text-surface-700 rounded-xl font-medium hover:bg-surface-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!archivo || loading || (tipoMedia === 'video' && duracionVideo > MAX_DURACION_VIDEO_AVANCE)}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Subiendo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Publicar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
