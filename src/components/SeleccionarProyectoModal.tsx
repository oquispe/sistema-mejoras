/**
 * SeleccionarProyectoModal - Modal para seleccionar un proyecto propio y postularlo a un concurso
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProyectoConStats, ConcursoConStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { postularProyecto, getPostulacionesProyecto } from '../lib/database';

interface SeleccionarProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  concurso: ConcursoConStats;
  proyectos: ProyectoConStats[];
  onPostulacionExitosa: () => void;
}

export default function SeleccionarProyectoModal({
  isOpen,
  onClose,
  concurso,
  proyectos,
  onPostulacionExitosa,
}: SeleccionarProyectoModalProps) {
  const { user } = useAuth();
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [proyectosYaPostulados, setProyectosYaPostulados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filtrar solo proyectos del usuario actual
  const misProyectos = proyectos.filter(p => p.autor_id === user?.id);

  // Cargar qué proyectos ya están postulados
  useEffect(() => {
    if (isOpen && misProyectos.length > 0) {
      verificarPostulaciones();
    }
  }, [isOpen]);

  async function verificarPostulaciones() {
    setLoading(true);
    const yaPostulados = new Set<string>();

    for (const proyecto of misProyectos) {
      const postulaciones = await getPostulacionesProyecto(proyecto.id);
      if (postulaciones.length > 0) {
        yaPostulados.add(proyecto.id);
      }
    }

    setProyectosYaPostulados(yaPostulados);
    setLoading(false);
  }

  async function handlePostular(proyectoId: string) {
    setProcesando(proyectoId);
    setMensaje(null);

    const { error } = await postularProyecto(concurso.id, proyectoId);

    if (error) {
      setMensaje({ tipo: 'error', texto: error });
    } else {
      setMensaje({ tipo: 'exito', texto: '¡Proyecto postulado exitosamente!' });
      onPostulacionExitosa();
      setTimeout(() => {
        onClose();
      }, 1500);
    }

    setProcesando(null);
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
        {/* Header con info del concurso */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl">emoji_events</span>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">Postular a</p>
              <h3 className="font-display text-xl font-bold">{concurso.nombre}</h3>
            </div>
          </div>
          <p className="text-sm opacity-90">Selecciona el proyecto que deseas postular</p>
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

          {loading ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
                progress_activity
              </span>
              <p className="text-surface-500 mt-2">Cargando tus proyectos...</p>
            </div>
          ) : misProyectos.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-surface-300 mb-3">
                folder_off
              </span>
              <h4 className="text-lg font-semibold text-surface-700 mb-2">
                No tienes proyectos
              </h4>
              <p className="text-surface-500 text-sm">
                Primero debes crear un proyecto para poder postularlo a este concurso.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {misProyectos.map((proyecto) => {
                const yaPostulado = proyectosYaPostulados.has(proyecto.id);

                return (
                  <div
                    key={proyecto.id}
                    className={`p-4 rounded-xl border transition-all ${
                      yaPostulado
                        ? 'bg-surface-50 border-surface-200 opacity-60'
                        : 'bg-white border-surface-200 hover:border-primary-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Imagen o placeholder */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
                        {proyecto.archivos?.find(a => a.tipo === 'imagen')?.url || proyecto.imagen_url ? (
                          <img
                            src={proyecto.archivos?.find(a => a.tipo === 'imagen')?.url || proyecto.imagen_url || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-surface-400 text-2xl">
                              {proyecto.categoria === 'proyecto' ? 'folder' :
                               proyecto.categoria === 'mejora' ? 'trending_up' : 'lightbulb'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-surface-900 line-clamp-1">
                          {proyecto.titulo}
                        </h4>
                        <p className="text-sm text-surface-500 line-clamp-1 mb-2">
                          {proyecto.descripcion}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className={`tag text-xs ${
                            proyecto.categoria === 'proyecto' ? 'tag-proyecto' :
                            proyecto.categoria === 'mejora' ? 'tag-mejora' : 'tag-innovacion'
                          }`}>
                            {proyecto.categoria}
                          </span>
                        </div>
                      </div>

                      {/* Acción */}
                      {yaPostulado ? (
                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">block</span>
                          Ya postulado
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePostular(proyecto.id)}
                          disabled={procesando === proyecto.id}
                          className="btn-primary py-2 px-4 text-sm flex-shrink-0"
                        >
                          {procesando === proyecto.id ? (
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
