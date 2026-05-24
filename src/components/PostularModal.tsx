/**
 * PostularModal - Modal para postular un proyecto a concursos activos
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConcursoConStats, PostulacionConDetalles } from '../types';
import {
  getConcursosActivos,
  postularProyecto,
  retirarPostulacion,
  getPostulacionesProyecto,
} from '../lib/database';

interface PostularModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId: string;
  proyectoTitulo: string;
}

export default function PostularModal({
  isOpen,
  onClose,
  proyectoId,
  proyectoTitulo,
}: PostularModalProps) {
  const [concursosActivos, setConcursosActivos] = useState<ConcursoConStats[]>([]);
  const [postulaciones, setPostulaciones] = useState<PostulacionConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen, proyectoId]);

  async function cargarDatos() {
    setLoading(true);
    setMensaje(null);

    const [concursos, posts] = await Promise.all([
      getConcursosActivos(),
      getPostulacionesProyecto(proyectoId),
    ]);

    setConcursosActivos(concursos);
    setPostulaciones(posts);
    setLoading(false);
  }

  // Verificar si ya está postulado a un concurso
  function estaPostulado(concursoId: string): boolean {
    return postulaciones.some((p) => p.concurso_id === concursoId);
  }

  // Postular a un concurso
  async function handlePostular(concursoId: string) {
    setProcesando(concursoId);
    setMensaje(null);

    const { error } = await postularProyecto(concursoId, proyectoId);

    if (error) {
      setMensaje({ tipo: 'error', texto: error });
    } else {
      setMensaje({ tipo: 'exito', texto: '¡Proyecto postulado exitosamente!' });
      await cargarDatos();
    }

    setProcesando(null);
  }

  // Retirar postulación
  async function handleRetirar(concursoId: string) {
    if (!confirm('¿Retirar este proyecto del concurso?')) return;

    setProcesando(concursoId);
    setMensaje(null);

    const { error } = await retirarPostulacion(concursoId, proyectoId);

    if (error) {
      setMensaje({ tipo: 'error', texto: error });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Postulación retirada' });
      await cargarDatos();
    }

    setProcesando(null);
  }

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Calcular días restantes
  function diasRestantes(fechaCierre: string): string {
    const ahora = new Date();
    const cierre = new Date(fechaCierre);
    const diff = cierre.getTime() - ahora.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (dias <= 0) return 'Cierra hoy';
    if (dias === 1) return '1 día restante';
    return `${dias} días restantes`;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-soft-lg overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-surface-100 flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">emoji_events</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-bold text-surface-900">
              Postular a Concurso
            </h3>
            <p className="text-sm text-surface-500 truncate" title={proyectoTitulo}>
              {proyectoTitulo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-surface-400">close</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Mensaje de feedback */}
          <AnimatePresence>
            {mensaje && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
                  mensaje.tipo === 'exito'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {mensaje.tipo === 'exito' ? 'check_circle' : 'error'}
                </span>
                {mensaje.texto}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Aviso si ya está postulado en algún concurso */}
          {postulaciones.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-lg flex-shrink-0">info</span>
              <div>
                <p className="font-medium">Este proyecto ya está participando en un concurso</p>
                <p className="text-xs mt-1">Un proyecto solo puede participar en un concurso a la vez. Retira la postulación actual si deseas postular a otro concurso.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
                progress_activity
              </span>
              <p className="text-surface-500 mt-2">Cargando concursos...</p>
            </div>
          ) : concursosActivos.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-surface-300 mb-3">
                event_busy
              </span>
              <h4 className="text-lg font-semibold text-surface-700 mb-2">
                No hay concursos activos
              </h4>
              <p className="text-surface-500 text-sm">
                Cuando haya concursos abiertos, podrás postular tu proyecto aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Postulaciones actuales */}
              {postulaciones.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary-500">
                      check_circle
                    </span>
                    Postulaciones actuales
                  </h4>
                  <div className="space-y-2">
                    {postulaciones.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-primary-700 text-sm">
                            {post.concurso_nombre}
                          </p>
                          <p className="text-xs text-primary-500">
                            Postulado el {formatearFecha(post.fecha_postulacion)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRetirar(post.concurso_id)}
                          disabled={procesando === post.concurso_id}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {procesando === post.concurso_id ? (
                            <span className="material-symbols-outlined text-sm animate-spin">
                              progress_activity
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">close</span>
                          )}
                          Retirar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concursos disponibles */}
              <h4 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-surface-400">
                  emoji_events
                </span>
                Concursos disponibles
              </h4>

              {concursosActivos.map((concurso) => {
                const yaPostulado = estaPostulado(concurso.id);
                // No puede postular si ya está en OTRO concurso
                const tieneOtraPostulacion = postulaciones.length > 0 && !yaPostulado;

                return (
                  <div
                    key={concurso.id}
                    className={`p-4 rounded-xl border transition-all ${
                      yaPostulado || tieneOtraPostulacion
                        ? 'bg-surface-50 border-surface-200 opacity-60'
                        : 'bg-white border-surface-200 hover:border-primary-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-surface-900 mb-1">
                          {concurso.nombre}
                        </h5>
                        {concurso.descripcion && (
                          <p className="text-sm text-surface-500 line-clamp-2 mb-2">
                            {concurso.descripcion}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {diasRestantes(concurso.fecha_fin_postulacion)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span>
                            {concurso.total_postulaciones} postulaciones
                          </span>
                        </div>
                      </div>

                      {yaPostulado ? (
                        <span className="px-3 py-1.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check</span>
                          Postulado
                        </span>
                      ) : tieneOtraPostulacion ? (
                        <span className="px-3 py-1.5 bg-surface-100 text-surface-500 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">block</span>
                          No disponible
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePostular(concurso.id)}
                          disabled={procesando === concurso.id}
                          className="btn-primary py-2 px-4 text-sm"
                        >
                          {procesando === concurso.id ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">
                                progress_activity
                              </span>
                              Postulando...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">send</span>
                              Postular
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-100 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full">
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
