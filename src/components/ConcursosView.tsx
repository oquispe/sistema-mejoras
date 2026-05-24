/**
 * ConcursosView - Vista pública de concursos
 * Todos los usuarios pueden ver los concursos y sus proyectos postulados
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConcursoConStats, PostulacionConDetalles, FaseConcurso } from '../types';
import { getConcursos, getPostulacionesConcurso } from '../lib/database';
import RankingConcurso from './RankingConcurso';

interface ConcursosViewProps {
  onVerProyecto?: (proyectoId: string) => void;
}

export default function ConcursosView({ onVerProyecto }: ConcursosViewProps) {
  const [concursos, setConcursos] = useState<ConcursoConStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [concursoSeleccionado, setConcursoSeleccionado] = useState<ConcursoConStats | null>(null);
  const [postulaciones, setPostulaciones] = useState<PostulacionConDetalles[]>([]);
  const [loadingPostulaciones, setLoadingPostulaciones] = useState(false);
  const [filtroFase, setFiltroFase] = useState<'todos' | 'activos' | 'finalizados'>('todos');

  // Cargar concursos
  useEffect(() => {
    cargarConcursos();
  }, []);

  async function cargarConcursos() {
    setLoading(true);
    const data = await getConcursos();
    setConcursos(data);
    setLoading(false);
  }

  // Cargar postulaciones cuando se selecciona un concurso
  async function handleSeleccionarConcurso(concurso: ConcursoConStats) {
    setConcursoSeleccionado(concurso);
    setLoadingPostulaciones(true);
    const posts = await getPostulacionesConcurso(concurso.id);
    setPostulaciones(posts);
    setLoadingPostulaciones(false);
  }

  // Volver a la lista
  function handleVolver() {
    setConcursoSeleccionado(null);
    setPostulaciones([]);
  }

  // Filtrar concursos
  const concursosFiltrados = concursos.filter((c) => {
    if (filtroFase === 'todos') return true;
    if (filtroFase === 'activos') {
      return c.fase_actual === 'proximamente' ||
             c.fase_actual === 'postulacion' ||
             c.fase_actual === 'en_proceso' ||
             c.fase_actual === 'evaluacion';
    }
    if (filtroFase === 'finalizados') {
      return c.fase_actual === 'finalizado' || c.fase_actual === 'cancelado';
    }
    return true;
  });

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Configuración visual por fase
  const faseConfig: Record<FaseConcurso, { label: string; color: string; icon: string }> = {
    proximamente: { label: 'Próximamente', color: 'bg-blue-100 text-blue-700', icon: 'schedule' },
    postulacion: { label: 'Recibiendo Postulaciones', color: 'bg-green-100 text-green-700', icon: 'how_to_reg' },
    en_proceso: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-700', icon: 'hourglass_top' },
    evaluacion: { label: 'En Evaluación', color: 'bg-amber-100 text-amber-700', icon: 'rate_review' },
    finalizado: { label: 'Finalizado', color: 'bg-gray-100 text-gray-700', icon: 'emoji_events' },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: 'cancel' },
  };

  // Días restantes para postular
  function getDiasRestantesPostulacion(fechaFinPost: string): string {
    const ahora = new Date();
    const fin = new Date(fechaFinPost);
    const diff = fin.getTime() - ahora.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (dias < 0) return 'Postulación cerrada';
    if (dias === 0) return 'Cierra hoy';
    if (dias === 1) return '1 día para postular';
    return `${dias} días para postular`;
  }

  // Vista de detalle de concurso
  if (concursoSeleccionado) {
    const fase = concursoSeleccionado.fase_actual || 'proximamente';
    const config = faseConfig[fase];

    return (
      <div className="max-w-4xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={handleVolver}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-surface-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 mb-6 text-sm font-medium transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver a concursos
        </button>

        {/* Header del concurso */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.color} mb-3`}>
                <span className="material-symbols-outlined text-sm">{config.icon}</span>
                {config.label}
              </span>
              <h1 className="text-2xl font-display font-bold text-surface-900">
                {concursoSeleccionado.nombre}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">
                {concursoSeleccionado.total_postulaciones}
              </p>
              <p className="text-xs text-surface-500">proyectos</p>
            </div>
          </div>

          {concursoSeleccionado.descripcion && (
            <p className="text-surface-600 mb-4">{concursoSeleccionado.descripcion}</p>
          )}

          {/* Timeline de fases */}
          <div className="bg-surface-50 rounded-xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 ${fase === 'postulacion' ? 'text-green-600 font-semibold' : 'text-surface-500'}`}>
                <span className="material-symbols-outlined text-lg">how_to_reg</span>
                <div>
                  <p className="font-medium">Postulación</p>
                  <p className="text-xs">{formatearFecha(concursoSeleccionado.fecha_inicio_postulacion)} - {formatearFecha(concursoSeleccionado.fecha_fin_postulacion)}</p>
                </div>
              </div>

              <span className="hidden sm:block material-symbols-outlined text-surface-300">arrow_forward</span>

              <div className={`flex items-center gap-2 ${fase === 'evaluacion' || fase === 'en_proceso' ? 'text-amber-600 font-semibold' : 'text-surface-500'}`}>
                <span className="material-symbols-outlined text-lg">rate_review</span>
                <div>
                  <p className="font-medium">Evaluación</p>
                  <p className="text-xs">Hasta {formatearFecha(concursoSeleccionado.fecha_fin_evaluacion)}</p>
                </div>
              </div>

              <span className="hidden sm:block material-symbols-outlined text-surface-300">arrow_forward</span>

              <div className={`flex items-center gap-2 ${fase === 'finalizado' ? 'text-primary-600 font-semibold' : 'text-surface-500'}`}>
                <span className="material-symbols-outlined text-lg">emoji_events</span>
                <div>
                  <p className="font-medium">Resultados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje según la fase */}
          {fase === 'postulacion' && (
            <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span>{getDiasRestantesPostulacion(concursoSeleccionado.fecha_fin_postulacion)}</span>
            </div>
          )}

          {fase === 'evaluacion' && (
            <div className="flex items-center gap-2 text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-lg">
              <span className="material-symbols-outlined text-lg">rate_review</span>
              <span>El jurado está evaluando los proyectos</span>
            </div>
          )}

          {fase === 'finalizado' && (
            <div className="flex items-center gap-2 text-primary-600 font-medium bg-primary-50 px-4 py-2 rounded-lg">
              <span className="material-symbols-outlined text-lg">celebration</span>
              <span>¡Resultados disponibles!</span>
            </div>
          )}
        </div>

        {/* Si está finalizado, mostrar ranking */}
        {fase === 'finalizado' ? (
          <RankingConcurso concurso={concursoSeleccionado} onVerProyecto={onVerProyecto} />
        ) : (
          <>
            {/* Proyectos postulados */}
            <h2 className="text-lg font-display font-bold text-surface-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-500">folder_open</span>
              Proyectos Participantes
            </h2>

        {loadingPostulaciones ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
              progress_activity
            </span>
            <p className="text-surface-500 mt-2">Cargando proyectos...</p>
          </div>
        ) : postulaciones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-surface-300 mb-3">
              inbox
            </span>
            <h3 className="text-lg font-semibold text-surface-700 mb-2">
              Sin proyectos aún
            </h3>
            <p className="text-surface-500 text-sm">
              {fase === 'postulacion'
                ? 'Sé el primero en postular tu proyecto a este concurso.'
                : 'No se postularon proyectos a este concurso.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {postulaciones.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-surface-200 shadow-soft p-4 hover:shadow-soft-lg hover:border-surface-300 transition-all cursor-pointer"
                onClick={() => onVerProyecto?.(post.proyecto_id)}
              >
                <div className="flex items-center gap-4">
                  {/* Número de orden */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Info del proyecto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-900 truncate">
                      {post.proyecto_titulo}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {/* Avatar del autor */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary-100 flex items-center justify-center">
                          {post.proyecto_autor_avatar ? (
                            <img
                              src={post.proyecto_autor_avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-secondary-600">
                              {post.proyecto_autor_nombre?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-surface-600">
                          {post.proyecto_autor_nombre}
                        </span>
                      </div>
                      <span className="text-surface-300">•</span>
                      <span className="text-sm text-surface-500">{post.proyecto_area}</span>
                    </div>
                  </div>

                  {/* Categoría y flecha */}
                  <div className="flex items-center gap-3">
                    <span className={`tag ${
                      post.proyecto_categoria === 'proyecto' ? 'tag-proyecto' :
                      post.proyecto_categoria === 'mejora' ? 'tag-mejora' : 'tag-innovacion'
                    }`}>
                      {post.proyecto_categoria}
                    </span>
                    <span className="material-symbols-outlined text-surface-400">
                      chevron_right
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    );
  }

  // Vista de lista de concursos
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
          <span className="material-symbols-outlined text-white text-3xl">emoji_events</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-surface-900">
          Concursos
        </h1>
        <p className="text-surface-500 mt-2">
          Explora los concursos y descubre los proyectos participantes
        </p>
      </div>

      {/* Filtros */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'activos', label: 'Activos' },
          { id: 'finalizados', label: 'Finalizados' },
        ].map((filtro) => (
          <button
            key={filtro.id}
            onClick={() => setFiltroFase(filtro.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtroFase === filtro.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Lista de concursos */}
      {loading ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
            progress_activity
          </span>
          <p className="text-surface-500 mt-2">Cargando concursos...</p>
        </div>
      ) : concursosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-surface-300 mb-3">
            emoji_events
          </span>
          <h3 className="text-lg font-semibold text-surface-700 mb-2">
            {filtroFase === 'todos'
              ? 'No hay concursos'
              : filtroFase === 'activos'
              ? 'No hay concursos activos'
              : 'No hay concursos finalizados'}
          </h3>
          <p className="text-surface-500 text-sm">
            Los concursos aparecerán aquí cuando sean creados por los administradores.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {concursosFiltrados.map((concurso, index) => {
              const fase = concurso.fase_actual || 'proximamente';
              const config = faseConfig[fase];

              return (
                <motion.div
                  key={concurso.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSeleccionarConcurso(concurso)}
                  className="bg-white rounded-2xl border border-surface-200 shadow-soft p-5 hover:shadow-soft-lg hover:border-primary-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Estado */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.color} mb-3`}>
                        <span className="material-symbols-outlined text-sm">{config.icon}</span>
                        {config.label}
                      </span>

                      {/* Nombre */}
                      <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-600 transition-colors mb-1">
                        {concurso.nombre}
                      </h3>

                      {/* Descripción */}
                      {concurso.descripcion && (
                        <p className="text-sm text-surface-500 line-clamp-2 mb-3">
                          {concurso.descripcion}
                        </p>
                      )}

                      {/* Info de fechas según fase */}
                      <div className="flex flex-wrap gap-4 text-xs text-surface-500">
                        {fase === 'postulacion' && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {getDiasRestantesPostulacion(concurso.fecha_fin_postulacion)}
                          </span>
                        )}
                        {fase === 'proximamente' && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">event</span>
                            Inicia el {formatearFecha(concurso.fecha_inicio_postulacion)}
                          </span>
                        )}
                        {(fase === 'en_proceso' || fase === 'evaluacion') && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <span className="material-symbols-outlined text-sm">rate_review</span>
                            Evaluación hasta {formatearFecha(concurso.fecha_fin_evaluacion)}
                          </span>
                        )}
                        {fase === 'finalizado' && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">emoji_events</span>
                            Resultados disponibles
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats y flecha */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary-600">
                          {concurso.total_postulaciones}
                        </p>
                        <p className="text-xs text-surface-500">proyectos</p>
                      </div>
                      <span className="material-symbols-outlined text-surface-300 group-hover:text-primary-500 transition-colors">
                        chevron_right
                      </span>
                    </div>
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
