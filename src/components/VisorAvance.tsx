/**
 * VisorAvance - Visor de avances a pantalla completa tipo Instagram Stories
 * Muestra foto/video con navegación entre avances del mismo autor
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AvanceConDetalles, AvanceVistaConUsuario } from '../types';
import { registrarVistaAvance, getVistasAvance, eliminarAvance } from '../lib/database';

interface VisorAvanceProps {
  avances: AvanceConDetalles[];
  indiceInicial?: number;
  userId?: string;
  onClose: () => void;
  onVerProyecto?: (proyectoId: string) => void;
  onAvanceEliminado?: () => void;
}

export default function VisorAvance({
  avances,
  indiceInicial = 0,
  userId,
  onClose,
  onVerProyecto,
  onAvanceEliminado,
}: VisorAvanceProps) {
  const [indiceActual, setIndiceActual] = useState(indiceInicial);
  const [progreso, setProgreso] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarVistas, setMostrarVistas] = useState(false);
  const [vistas, setVistas] = useState<AvanceVistaConUsuario[]>([]);
  const [cargandoVistas, setCargandoVistas] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const avanceActual = avances[indiceActual];
  const esPropio = avanceActual?.autor_id === userId;
  const duracionStory = 5000; // 5 segundos para fotos

  // Registrar vista al ver cada avance
  useEffect(() => {
    if (avanceActual && userId && userId !== avanceActual.autor_id) {
      registrarVistaAvance(avanceActual.id, userId);
    }
  }, [avanceActual?.id, userId]);

  // Timer de progreso para fotos
  useEffect(() => {
    if (!avanceActual || pausado) return;

    if (avanceActual.tipo_media === 'foto') {
      // Iniciar progreso
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duracionStory) * 100, 100);
        setProgreso(progress);

        if (progress >= 100) {
          siguienteAvance();
        }
      }, 50);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [indiceActual, pausado, avanceActual?.tipo_media]);

  // Para videos, actualizar progreso basado en el tiempo del video
  useEffect(() => {
    if (avanceActual?.tipo_media === 'video' && videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        if (video.duration) {
          setProgreso((video.currentTime / video.duration) * 100);
        }
      };

      const handleEnded = () => {
        siguienteAvance();
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);

      // Reproducir el video
      video.play().catch(() => {});

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [indiceActual, avanceActual?.tipo_media]);

  function siguienteAvance() {
    if (indiceActual < avances.length - 1) {
      setIndiceActual(indiceActual + 1);
      setProgreso(0);
    } else {
      onClose();
    }
  }

  function anteriorAvance() {
    if (indiceActual > 0) {
      setIndiceActual(indiceActual - 1);
      setProgreso(0);
    }
  }

  async function cargarVistas() {
    if (!avanceActual) return;
    setCargandoVistas(true);
    const data = await getVistasAvance(avanceActual.id);
    setVistas(data);
    setCargandoVistas(false);
    setMostrarVistas(true);
    setPausado(true);
  }

  async function handleEliminar() {
    if (!avanceActual || !confirm('¿Eliminar este avance?')) return;

    setEliminando(true);
    const { error } = await eliminarAvance(avanceActual.id);

    if (!error) {
      onAvanceEliminado?.();
      if (avances.length === 1) {
        onClose();
      } else {
        // Remover del array y ajustar índice
        if (indiceActual >= avances.length - 1) {
          setIndiceActual(Math.max(0, indiceActual - 1));
        }
      }
    }
    setEliminando(false);
  }

  function formatearTiempo(fecha: string) {
    const ahora = new Date();
    const creado = new Date(fecha);
    const diff = ahora.getTime() - creado.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor(diff / (1000 * 60));

    if (horas > 0) return `Hace ${horas}h`;
    if (minutos > 0) return `Hace ${minutos}m`;
    return 'Ahora';
  }

  if (!avanceActual) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      >
        {/* Contenedor principal */}
        <div className="relative w-full h-full max-w-md mx-auto">
          {/* Barras de progreso */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {avances.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: i < indiceActual ? '100%' : i === indiceActual ? `${progreso}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header con info del autor */}
          <div className="absolute top-6 left-0 right-0 z-20 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border-2 border-white">
                {avanceActual.autor_avatar ? (
                  <img
                    src={avanceActual.autor_avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {avanceActual.autor_nombre.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {avanceActual.autor_nombre}
                </p>
                <p className="text-white/70 text-xs">
                  {formatearTiempo(avanceActual.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón ver vistas (solo el autor) */}
              {esPropio && (
                <button
                  onClick={cargarVistas}
                  className="p-2 text-white/80 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              )}

              {/* Botón eliminar (solo el autor) */}
              {esPropio && (
                <button
                  onClick={handleEliminar}
                  disabled={eliminando}
                  className="p-2 text-white/80 hover:text-red-400 transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {eliminando ? 'progress_activity' : 'delete'}
                  </span>
                </button>
              )}

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Media (foto o video) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            onMouseDown={() => setPausado(true)}
            onMouseUp={() => {
              setPausado(false);
              setMostrarVistas(false);
            }}
            onTouchStart={() => setPausado(true)}
            onTouchEnd={() => {
              setPausado(false);
              setMostrarVistas(false);
            }}
          >
            {avanceActual.tipo_media === 'foto' ? (
              <img
                src={avanceActual.media_url}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                src={avanceActual.media_url}
                className="max-w-full max-h-full object-contain"
                playsInline
                muted={false}
              />
            )}
          </div>

          {/* Zonas de navegación */}
          <div className="absolute inset-0 z-10 flex">
            {/* Zona izquierda - anterior */}
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={anteriorAvance}
            />
            {/* Zona central - pausa */}
            <div className="w-1/3 h-full" />
            {/* Zona derecha - siguiente */}
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={siguienteAvance}
            />
          </div>

          {/* Texto del avance */}
          {avanceActual.texto_opcional && (
            <div className={`absolute left-0 right-0 z-20 px-4 ${
              avanceActual.proyecto_id ? 'bottom-32' : 'bottom-12'
            }`}>
              <div className="bg-black/60 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
                <p className="text-white text-center text-base font-medium leading-relaxed">
                  {avanceActual.texto_opcional}
                </p>
              </div>
            </div>
          )}

          {/* Botón ver proyecto - Diseño llamativo */}
          {avanceActual.proyecto_id && avanceActual.proyecto_titulo && (
            <div className="absolute bottom-6 left-4 right-4 z-20">
              <button
                onClick={() => {
                  onVerProyecto?.(avanceActual.proyecto_id!);
                  onClose();
                }}
                className="w-full group relative overflow-hidden"
              >
                {/* Fondo con gradiente animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

                {/* Contenido */}
                <div className="relative flex items-center justify-center gap-3 py-4 px-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">folder_open</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
                      Ver proyecto
                    </p>
                    <p className="text-white font-bold text-base truncate">
                      {avanceActual.proyecto_titulo}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <span className="material-symbols-outlined text-white text-lg">arrow_forward</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Panel de vistas */}
          <AnimatePresence>
            {mostrarVistas && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl max-h-[60vh] overflow-hidden"
              >
                <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                  <h3 className="font-semibold text-surface-900">
                    Vistas ({vistas.length})
                  </h3>
                  <button
                    onClick={() => {
                      setMostrarVistas(false);
                      setPausado(false);
                    }}
                    className="p-2 text-surface-400 hover:text-surface-600"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(60vh-60px)]">
                  {cargandoVistas ? (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-3xl text-surface-400 animate-spin">
                        progress_activity
                      </span>
                    </div>
                  ) : vistas.length === 0 ? (
                    <div className="p-8 text-center text-surface-500">
                      Nadie ha visto este avance aún
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-100">
                      {vistas.map((vista) => (
                        <div
                          key={vista.id}
                          className="flex items-center gap-3 p-4"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-100">
                            {vista.usuario_avatar ? (
                              <img
                                src={vista.usuario_avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-primary text-white font-bold">
                                {vista.usuario_nombre.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-surface-900">
                              {vista.usuario_nombre}
                            </p>
                            <p className="text-xs text-surface-500">
                              {formatearTiempo(vista.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
