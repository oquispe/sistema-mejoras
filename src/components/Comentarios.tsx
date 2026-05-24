/**
 * Comentarios.tsx - Sistema de comentarios para proyectos
 */

import { useState, useEffect } from 'react';
import { Comentario } from '../types';
import { getComentarios, crearComentario, eliminarComentario } from '../lib/database';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface ComentariosProps {
  proyectoId: string;
  onComentarioCreado?: () => void;
}

export default function Comentarios({ proyectoId, onComentarioCreado }: ComentariosProps) {
  const { user, profile } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  // Cargar comentarios
  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const data = await getComentarios(proyectoId);
      setComentarios(data);
      setLoading(false);
    }
    cargar();
  }, [proyectoId]);

  // Enviar comentario
  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();

    if (!nuevoComentario.trim() || !user) return;

    setEnviando(true);

    const { data, error } = await crearComentario(
      proyectoId,
      user.id,
      nuevoComentario.trim(),
      profile?.nombre_completo
    );

    if (data && !error) {
      setComentarios([...comentarios, data]);
      setNuevoComentario('');
      onComentarioCreado?.();
    }

    setEnviando(false);
  }

  // Eliminar comentario
  async function handleEliminar(comentarioId: string) {
    if (!confirm('¿Eliminar este comentario?')) return;

    setEliminandoId(comentarioId);

    const { error } = await eliminarComentario(comentarioId);

    if (!error) {
      setComentarios(comentarios.filter(c => c.id !== comentarioId));
    }

    setEliminandoId(null);
  }

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
    });
  }

  return (
    <div className="mt-6">
      <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-xl">chat</span>
        Comentarios ({comentarios.length})
      </h3>

      {/* Formulario de nuevo comentario */}
      <form onSubmit={handleEnviar} className="mb-6">
        <div className="flex gap-3">
          {/* Avatar del usuario actual */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-surface-100">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nombre_completo}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {profile?.nombre_completo?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-grow">
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
              className="w-full p-3 border border-[#cfd2d9] rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!nuevoComentario.trim() || enviando}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {enviando ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    Comentar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Lista de comentarios */}
      {loading ? (
        <div className="text-center py-6">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">
            progress_activity
          </span>
        </div>
      ) : comentarios.length === 0 ? (
        <div className="text-center py-6 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2">forum</span>
          <p className="text-sm">No hay comentarios aún. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {comentarios.map((comentario) => (
              <motion.div
                key={comentario.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-3"
              >
                {/* Avatar del comentarista */}
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-surface-100">
                  {comentario.autor_avatar ? (
                    <img
                      src={comentario.autor_avatar}
                      alt={comentario.autor_nombre}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                      {comentario.autor_nombre?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-grow">
                  <div className="bg-[#f8f9ff] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-on-surface">
                        {comentario.autor_nombre}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {formatearFecha(comentario.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {comentario.contenido}
                    </p>
                  </div>

                  {/* Botón eliminar (solo para el autor) */}
                  {user?.id === comentario.autor_id && (
                    <button
                      onClick={() => handleEliminar(comentario.id)}
                      disabled={eliminandoId === comentario.id}
                      className="mt-1 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      {eliminandoId === comentario.id ? (
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">delete</span>
                      )}
                      Eliminar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
