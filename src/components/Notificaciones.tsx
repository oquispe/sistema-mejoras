/**
 * Notificaciones - Panel desplegable de notificaciones
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Notificacion } from '../types';
import {
  getNotificaciones,
  contarNotificacionesNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../lib/database';
import { useAuth } from '../context/AuthContext';

interface NotificacionesProps {
  onVerProyecto?: (proyectoId: string) => void;
}

export default function Notificaciones({ onVerProyecto }: NotificacionesProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar contador de no leídas al montar
  useEffect(() => {
    if (user) {
      cargarContador();
      // Actualizar contador cada 30 segundos
      const interval = setInterval(cargarContador, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const cargarContador = async () => {
    if (!user) return;
    const count = await contarNotificacionesNoLeidas(user.id);
    setNoLeidas(count);
  };

  const cargarNotificaciones = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getNotificaciones(user.id);
    setNotificaciones(data);
    setLoading(false);
  };

  // Abrir panel
  const handleOpen = async () => {
    setIsOpen(true);
    await cargarNotificaciones();
  };

  // Cerrar panel
  const handleClose = () => {
    setIsOpen(false);
  };

  // Marcar una como leída y navegar al proyecto
  const handleClickNotificacion = async (notif: Notificacion) => {
    if (!notif.leida) {
      await marcarNotificacionLeida(notif.id);
      setNotificaciones(prev =>
        prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    }

    if (notif.proyecto_id && onVerProyecto) {
      onVerProyecto(notif.proyecto_id);
      handleClose();
    }
  };

  // Marcar todas como leídas
  const handleMarcarTodasLeidas = async () => {
    if (!user) return;
    await marcarTodasLeidas(user.id);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  // Formatear fecha relativa
  const formatearFecha = (fecha: string): string => {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diffMs = ahora.getTime() - notifFecha.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return notifFecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      {/* Botón campana */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Notificaciones"
      >
        <span className="material-symbols-outlined text-xl text-on-surface-variant">
          notifications
        </span>

        {/* Badge contador */}
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para cerrar */}
            <div
              className="fixed inset-0 z-40"
              onClick={handleClose}
            />

            {/* Panel - Responsive para móvil */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-12 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#eff4ff] z-50 overflow-hidden max-h-[70vh] sm:max-h-none"
            >
              {/* Header del panel */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff4ff] bg-[#f8f9ff]">
                <h3 className="font-bold text-on-surface">Notificaciones</h3>
                {noLeidas > 0 && (
                  <button
                    onClick={handleMarcarTodasLeidas}
                    className="text-xs text-primary hover:underline"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* Lista de notificaciones */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="material-symbols-outlined text-2xl text-primary animate-spin">
                      progress_activity
                    </span>
                  </div>
                ) : notificaciones.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
                      notifications_none
                    </span>
                    <p className="text-sm text-on-surface-variant">
                      No tienes notificaciones
                    </p>
                  </div>
                ) : (
                  <div>
                    {notificaciones.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleClickNotificacion(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-[#f8f9ff] transition-colors border-b border-[#eff4ff] last:border-b-0 ${
                          !notif.leida ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Avatar del generador */}
                          <div className="flex-shrink-0">
                            {notif.generador_avatar ? (
                              <img
                                src={notif.generador_avatar}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                                {notif.generador_nombre?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.leida ? 'font-medium' : ''} text-on-surface`}>
                              {notif.mensaje}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`material-symbols-outlined text-sm ${
                                notif.tipo === 'like' ? 'text-red-500' : 'text-blue-500'
                              }`}>
                                {notif.tipo === 'like' ? 'favorite' : 'chat_bubble'}
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                {formatearFecha(notif.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Indicador no leída */}
                          {!notif.leida && (
                            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
