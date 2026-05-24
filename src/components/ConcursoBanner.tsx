/**
 * ConcursoBanner - Banner destacado de concurso activo para el feed
 * Muestra un diseño llamativo y diferente a los proyectos normales
 */

import { motion } from 'motion/react';
import { ConcursoConStats } from '../types';

interface ConcursoBannerProps {
  concurso: ConcursoConStats;
  onPostular: () => void;
  onVerDetalles: () => void;
}

export default function ConcursoBanner({ concurso, onPostular, onVerDetalles }: ConcursoBannerProps) {
  // Calcular días restantes
  const calcularDiasRestantes = (): string => {
    const ahora = new Date();
    const cierre = new Date(concurso.fecha_fin_postulacion);
    const diff = cierre.getTime() - ahora.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (dias <= 0) return 'Cierra hoy';
    if (dias === 1) return '1 día restante';
    return `${dias} días restantes`;
  };

  // Formatear fecha de cierre
  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl shadow-lg"
    >
      {/* Fondo con gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Contenido */}
      <div className="relative p-6 sm:p-8">
        {/* Badge de concurso */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wide">
              <span className="material-symbols-outlined text-sm">emoji_events</span>
              Concurso Activo
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
              <span className="material-symbols-outlined text-sm animate-pulse">schedule</span>
              {calcularDiasRestantes()}
            </span>
          </div>

          {/* Decoración de trofeo */}
          <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl">
            <span className="material-symbols-outlined text-white text-4xl">emoji_events</span>
          </div>
        </div>

        {/* Título del concurso */}
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 drop-shadow-lg">
          {concurso.nombre}
        </h2>

        {/* Descripción */}
        {concurso.descripcion && (
          <p className="text-white/90 text-sm sm:text-base mb-4 line-clamp-2 max-w-2xl">
            {concurso.descripcion}
          </p>
        )}

        {/* Info de fechas y participantes */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-white/80 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            <span>Cierra el {formatearFecha(concurso.fecha_fin_postulacion)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">group</span>
            <span>{concurso.total_postulaciones} proyectos postulados</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onPostular}
            className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:bg-orange-50 hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined">send</span>
            Postular mi proyecto
          </button>
          <button
            onClick={onVerDetalles}
            className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all"
          >
            <span className="material-symbols-outlined">visibility</span>
            Ver detalles
          </button>
        </div>

        {/* Decoración de confeti/estrellas */}
        <div className="absolute top-4 right-4 flex gap-1 opacity-60">
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>✨</span>
          <span className="text-xl animate-bounce" style={{ animationDelay: '100ms' }}>⭐</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '200ms' }}>✨</span>
        </div>
      </div>
    </motion.div>
  );
}
