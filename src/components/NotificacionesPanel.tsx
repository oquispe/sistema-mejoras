/**
 * NotificacionesPanel - Muestra las notificaciones del usuario
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Notificacion } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface NotificacionesPanelProps {
  onVerConcurso?: () => void;
  onVerProyecto?: (proyectoId: string) => void;
}

export default function NotificacionesPanel({ onVerConcurso, onVerProyecto }: NotificacionesPanelProps) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      cargarNotificaciones();
    }
  }, [user]);

  async function cargarNotificaciones() {
    setLoading(true);

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
        ),
        concurso:concursos!concurso_id (
          nombre
        )
      `)
      .eq('usuario_destino', user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error cargando notificaciones:', error.message);
    } else {
      const notifs = (data || []).map((n: any) => ({
        ...n,
        generador_nombre: n.generador?.nombre_completo,
        generador_avatar: n.generador?.avatar_url,
        proyecto_titulo: n.proyecto?.titulo,
        concurso_nombre: n.concurso?.nombre,
      }));
      setNotificaciones(notifs);
    }

    setLoading(false);
  }

  async function marcarComoLeida(id: string) {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);

    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  }

  async function marcarTodasComoLeidas() {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_destino', user!.id)
      .eq('leida', false);

    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: true }))
    );
  }

  function formatearTiempo(fecha: string): string {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diff = ahora.getTime() - notifFecha.getTime();
    const minutos = Math.floor(diff / (1000 * 60));
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias} días`;
    return notifFecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  function getIcono(tipo: string) {
    switch (tipo) {
      case 'like':
        return { icon: 'favorite', color: 'text-red-500', bg: 'bg-red-100' };
      case 'comentario':
        return { icon: 'chat_bubble', color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'concurso':
        return { icon: 'emoji_events', color: 'text-amber-500', bg: 'bg-amber-100' };
      default:
        return { icon: 'notifications', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">notifications</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">
                Notificaciones
              </h1>
              {noLeidas > 0 && (
                <p className="text-sm text-primary-600 font-medium">
                  {noLeidas} sin leer
                </p>
              )}
            </div>
          </div>

          {noLeidas > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">done_all</span>
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
            progress_activity
          </span>
          <p className="text-surface-500 mt-2">Cargando notificaciones...</p>
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-surface-300 mb-3">
            notifications_none
          </span>
          <h3 className="text-lg font-semibold text-surface-700 mb-2">
            No tienes notificaciones
          </h3>
          <p className="text-surface-500 text-sm">
            Cuando alguien interactúe con tus proyectos o haya un nuevo concurso, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notificaciones.map((notif, index) => {
              const { icon, color, bg } = getIcono(notif.tipo);

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    if (!notif.leida) {
                      marcarComoLeida(notif.id);
                    }
                    if (notif.tipo === 'concurso' && onVerConcurso) {
                      onVerConcurso();
                    } else if (notif.proyecto_id && onVerProyecto) {
                      onVerProyecto(notif.proyecto_id);
                    }
                  }}
                  className={`bg-white rounded-xl border shadow-soft p-4 cursor-pointer transition-all hover:shadow-soft-lg ${
                    notif.leida
                      ? 'border-surface-200'
                      : 'border-primary-200 bg-primary-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined ${color}`}>
                        {icon}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.leida ? 'text-surface-600' : 'text-surface-900 font-medium'}`}>
                        {notif.mensaje}
                      </p>

                      {/* Info adicional */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-surface-400">
                        <span>{formatearTiempo(notif.created_at)}</span>
                        {notif.tipo === 'concurso' && notif.concurso_nombre && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-medium">
                              {notif.concurso_nombre}
                            </span>
                          </>
                        )}
                        {notif.proyecto_titulo && (
                          <>
                            <span>•</span>
                            <span className="truncate">{notif.proyecto_titulo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Indicador no leída */}
                    {!notif.leida && (
                      <div className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
