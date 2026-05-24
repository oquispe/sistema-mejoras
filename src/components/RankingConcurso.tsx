/**
 * RankingConcurso - Muestra el ranking de proyectos de un concurso finalizado
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { RankingProyecto, ConcursoConStats } from '../types';
import { getRankingConcurso } from '../lib/database';

interface RankingConcursoProps {
  concurso: ConcursoConStats;
  onVerProyecto?: (proyectoId: string) => void;
}

export default function RankingConcurso({ concurso, onVerProyecto }: RankingConcursoProps) {
  const [ranking, setRanking] = useState<RankingProyecto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  useEffect(() => {
    cargarRanking();
  }, [concurso.id]);

  async function cargarRanking() {
    setLoading(true);
    const data = await getRankingConcurso(concurso.id);
    setRanking(data);
    setLoading(false);
  }

  // Obtener áreas únicas del ranking
  const areasDisponibles = useMemo(() => {
    const areas = new Set(ranking.map(r => r.autor_area));
    return Array.from(areas).sort();
  }, [ranking]);

  // Aplicar filtros
  const rankingFiltrado = useMemo(() => {
    let filtrado = [...ranking];

    if (filtroArea !== 'todas') {
      filtrado = filtrado.filter(r => r.autor_area === filtroArea);
    }

    if (filtroCategoria !== 'todas') {
      filtrado = filtrado.filter(r => r.proyecto_categoria === filtroCategoria);
    }

    // Recalcular posiciones después del filtro
    return filtrado.map((r, index) => ({
      ...r,
      posicion: index + 1,
    }));
  }, [ranking, filtroArea, filtroCategoria]);

  // Verificar si es resultado final o preliminar
  const esFinal = concurso.fase_actual === 'finalizado';

  // Configuración visual para las posiciones
  const getMedalConfig = (posicion: number) => {
    switch (posicion) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
          text: 'text-yellow-700',
          border: 'border-yellow-400',
          shadow: 'shadow-yellow-200',
          icon: 'emoji_events',
          label: 'Primer Lugar',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
          text: 'text-gray-600',
          border: 'border-gray-300',
          shadow: 'shadow-gray-200',
          icon: 'workspace_premium',
          label: 'Segundo Lugar',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-orange-300 to-orange-500',
          text: 'text-orange-700',
          border: 'border-orange-400',
          shadow: 'shadow-orange-200',
          icon: 'military_tech',
          label: 'Tercer Lugar',
        };
      default:
        return {
          bg: 'bg-surface-100',
          text: 'text-surface-600',
          border: 'border-surface-200',
          shadow: '',
          icon: '',
          label: '',
        };
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
          progress_activity
        </span>
        <p className="text-surface-500 mt-2">Cargando resultados...</p>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-surface-300 mb-3">
          leaderboard
        </span>
        <h3 className="text-lg font-semibold text-surface-700 mb-2">
          Sin evaluaciones
        </h3>
        <p className="text-surface-500 text-sm">
          Los proyectos aún no han sido evaluados por el jurado.
        </p>
      </div>
    );
  }

  // Podio (top 3) del ranking filtrado
  const podio = rankingFiltrado.slice(0, 3);
  const resto = rankingFiltrado.slice(3);

  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtroArea !== 'todas' || filtroCategoria !== 'todas';

  return (
    <div className="space-y-6">
      {/* Banner de celebración */}
      <div className={`rounded-2xl p-6 sm:p-8 text-center text-white relative overflow-hidden shadow-lg ${
        esFinal
          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400'
          : 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500'
      }`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-4 text-4xl">🏆</div>
          <div className="absolute top-4 right-8 text-3xl">⭐</div>
          <div className="absolute bottom-3 left-12 text-2xl">🎉</div>
          <div className="absolute bottom-4 right-4 text-3xl">🥇</div>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined text-5xl sm:text-6xl mb-3 drop-shadow-lg">
            {esFinal ? 'emoji_events' : 'leaderboard'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2 drop-shadow">
            {esFinal ? '¡Resultados Finales!' : 'Ranking Preliminar'}
          </h2>
          <p className="text-base sm:text-lg opacity-95 font-medium">{concurso.nombre}</p>
          {!esFinal && (
            <p className="text-sm opacity-80 mt-2">
              El ranking puede cambiar hasta que finalice el concurso
            </p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-soft p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 text-sm text-surface-600">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            <span className="font-medium">Filtros:</span>
          </div>

          <div className="flex flex-wrap gap-3 flex-1">
            {/* Filtro por Área */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="todas">Todas las áreas</option>
                {areasDisponibles.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Categoría */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="todas">Todas las categorías</option>
                <option value="proyecto">Proyecto</option>
                <option value="mejora">Mejora</option>
                <option value="innovacion">Innovación</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            {hayFiltrosActivos && (
              <button
                onClick={() => {
                  setFiltroArea('todas');
                  setFiltroCategoria('todas');
                }}
                className="px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Indicador de resultados filtrados */}
        {hayFiltrosActivos && (
          <p className="mt-3 text-sm text-surface-500">
            Mostrando {rankingFiltrado.length} de {ranking.length} proyectos
          </p>
        )}
      </div>

      {/* Podio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:pt-8">
        {/* Reordenar para mostrar: 2do, 1ro, 3ro en desktop */}
        {[podio[1], podio[0], podio[2]].filter(Boolean).map((proyecto, visualIndex) => {
          if (!proyecto) return null;
          const posicion = proyecto.posicion || visualIndex + 1;
          const config = getMedalConfig(posicion);
          const esGanador = posicion === 1;

          // Orden visual en desktop: 2do, 1ro, 3ro
          const orderClass = esGanador ? 'md:order-2' : (posicion === 2 ? 'md:order-1' : 'md:order-3');

          return (
            <motion.div
              key={proyecto.proyecto_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: posicion * 0.1 }}
              onClick={() => onVerProyecto?.(proyecto.proyecto_id)}
              className={`relative bg-white rounded-2xl border-2 ${config.border} shadow-lg p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${orderClass} ${
                esGanador ? 'md:-mt-6 md:scale-105 z-10' : ''
              }`}
            >
              {/* Medalla */}
              <div className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 shadow-lg`}>
                {posicion <= 3 ? (
                  <span className="material-symbols-outlined text-white text-3xl">
                    {config.icon}
                  </span>
                ) : (
                  <span className="text-white text-2xl font-bold">{posicion}</span>
                )}
              </div>

              {/* Posición */}
              <p className={`text-center text-sm font-semibold ${config.text} mb-3`}>
                {config.label || `${posicion}° Lugar`}
              </p>

              {/* Proyecto */}
              <h3 className="text-lg font-bold text-surface-900 text-center mb-2 line-clamp-2">
                {proyecto.proyecto_titulo}
              </h3>

              {/* Autor */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-100">
                  {proyecto.autor_avatar ? (
                    <img src={proyecto.autor_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-primary text-white text-sm font-bold">
                      {proyecto.autor_nombre?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-surface-800">{proyecto.autor_nombre}</p>
                  <p className="text-xs text-surface-500">{proyecto.autor_area}</p>
                </div>
              </div>

              {/* Puntaje */}
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">
                  {proyecto.puntaje_promedio.toFixed(1)}
                </p>
                <p className="text-xs text-surface-500">
                  de 10 puntos • {proyecto.total_evaluaciones} evaluaciones
                </p>
              </div>

              {/* Desglose */}
              <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-surface-400">Innovación</p>
                  <p className="font-semibold text-surface-700">{proyecto.promedio_innovacion.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-surface-400">Impacto</p>
                  <p className="font-semibold text-surface-700">{proyecto.promedio_impacto.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-surface-400">Factibilidad</p>
                  <p className="font-semibold text-surface-700">{proyecto.promedio_factibilidad.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-surface-400">Presentación</p>
                  <p className="font-semibold text-surface-700">{proyecto.promedio_presentacion.toFixed(1)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resto del ranking */}
      {resto.length > 0 && (
        <div>
          <h3 className="text-lg font-display font-bold text-surface-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-surface-400">format_list_numbered</span>
            Otros participantes
          </h3>

          <div className="bg-white rounded-xl border border-surface-200 shadow-soft overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Pos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Proyecto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden sm:table-cell">Autor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider">Puntaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {resto.map((proyecto) => (
                  <tr
                    key={proyecto.proyecto_id}
                    onClick={() => onVerProyecto?.(proyecto.proyecto_id)}
                    className="hover:bg-surface-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="w-8 h-8 bg-surface-100 rounded-full flex items-center justify-center text-sm font-semibold text-surface-600">
                        {proyecto.posicion}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-surface-900">{proyecto.proyecto_titulo}</p>
                      <p className="text-xs text-surface-500 sm:hidden">{proyecto.autor_nombre}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-surface-700">{proyecto.autor_nombre}</p>
                      <p className="text-xs text-surface-500">{proyecto.autor_area}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-bold text-primary-600">
                        {proyecto.puntaje_promedio.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
