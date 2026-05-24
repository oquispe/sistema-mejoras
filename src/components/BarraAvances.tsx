/**
 * BarraAvances - Barra horizontal de stories/avances estilo WhatsApp
 * Cuadrados con preview del contenido y avatar pequeño en la esquina
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { AvanceConDetalles } from '../types';
import { getAvancesVigentes } from '../lib/database';

interface BarraAvancesProps {
  userId?: string;
  userAvatar?: string | null;
  userName?: string;
  onCrearAvance: () => void;
  onVerAvances: (autorId: string, avances: AvanceConDetalles[]) => void;
}

interface AvanceAgrupado {
  autorId: string;
  autorNombre: string;
  autorAvatar: string | null;
  avances: AvanceConDetalles[];
  todosVistos: boolean;
  ultimoAvance: AvanceConDetalles;
}

export default function BarraAvances({
  userId,
  userAvatar,
  userName,
  onCrearAvance,
  onVerAvances,
}: BarraAvancesProps) {
  const [avances, setAvances] = useState<AvanceConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarAvances();
  }, [userId]);

  async function cargarAvances() {
    setLoading(true);
    const data = await getAvancesVigentes(userId);
    setAvances(data);
    setLoading(false);
  }

  // Agrupar avances por autor
  const avancesAgrupados = useMemo(() => {
    const grupos = new Map<string, AvanceAgrupado>();

    for (const avance of avances) {
      const existing = grupos.get(avance.autor_id);
      if (existing) {
        existing.avances.push(avance);
        if (!avance.visto_por_mi) {
          existing.todosVistos = false;
        }
        // Mantener el más reciente como preview
        if (new Date(avance.created_at) > new Date(existing.ultimoAvance.created_at)) {
          existing.ultimoAvance = avance;
        }
      } else {
        grupos.set(avance.autor_id, {
          autorId: avance.autor_id,
          autorNombre: avance.autor_nombre,
          autorAvatar: avance.autor_avatar,
          avances: [avance],
          todosVistos: avance.visto_por_mi === true,
          ultimoAvance: avance,
        });
      }
    }

    // Ordenar: usuario actual primero, luego no vistos, luego vistos
    const resultado = Array.from(grupos.values());
    resultado.sort((a, b) => {
      if (a.autorId === userId) return -1;
      if (b.autorId === userId) return 1;
      if (!a.todosVistos && b.todosVistos) return -1;
      if (a.todosVistos && !b.todosVistos) return 1;
      return 0;
    });

    return resultado;
  }, [avances, userId]);

  // Verificar si el usuario actual tiene avances
  const misAvances = avancesAgrupados.find(g => g.autorId === userId);

  if (loading) {
    return (
      <div className="bg-white border-b border-surface-200 px-4 py-4">
        <div className="flex gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-20 h-28 rounded-xl bg-surface-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si no hay avances y el usuario no está autenticado, no mostrar nada
  if (avancesAgrupados.length === 0 && !userId) {
    return null;
  }

  return (
    <div className="bg-gradient-to-b from-white to-surface-50 border-b border-surface-200">
      <div
        ref={scrollRef}
        className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Botón "Tu avance" - siempre primero si está autenticado */}
        {userId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="relative group">
              {/* Tarjeta principal - ver avances o crear si no hay */}
              <button
                onClick={misAvances ? () => onVerAvances(userId, misAvances.avances) : onCrearAvance}
                className="block"
              >
                {/* Contenedor con preview */}
                <div className={`w-20 h-28 rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02] ${
                  misAvances
                    ? ''
                    : 'bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-100 border-2 border-dashed border-primary-300'
                }`}>
                  {misAvances ? (
                    // Preview del último avance
                    <>
                      {misAvances.ultimoAvance.tipo_media === 'foto' ? (
                        <img
                          src={misAvances.ultimoAvance.media_url}
                          alt="Tu avance"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={misAvances.ultimoAvance.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      {/* Overlay con gradiente */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl" />

                      {/* Anillo de color indicando estado */}
                      <div className="absolute inset-0 rounded-xl ring-[3px] ring-inset ring-primary-500" />
                    </>
                  ) : (
                    // Estado vacío - crear nuevo
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg mb-1">
                        <span className="material-symbols-outlined text-white text-xl">add</span>
                      </div>
                      <span className="text-[10px] font-medium text-primary-600">Crear</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Botón "+" para agregar más avances (solo si ya tiene algunos) */}
              {misAvances && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrearAvance();
                  }}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform z-10"
                >
                  <span className="material-symbols-outlined text-white text-sm">add</span>
                </button>
              )}

              {/* Avatar pequeño en la esquina */}
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[3px] border-white shadow-md overflow-hidden ${
                !misAvances ? 'ring-2 ring-primary-500' : ''
              }`}>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">
                    {userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Indicador de cantidad */}
              {misAvances && misAvances.avances.length > 1 && (
                <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {misAvances.avances.length}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-surface-700 truncate max-w-[80px]">
              Tu avance
            </span>
          </motion.div>
        )}

        {/* Avances de otros usuarios */}
        {avancesAgrupados
          .filter(g => g.autorId !== userId)
          .map((grupo, index) => (
            <motion.div
              key={grupo.autorId}
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <button
                onClick={() => onVerAvances(grupo.autorId, grupo.avances)}
                className="relative group"
              >
                {/* Contenedor con preview */}
                <div className={`w-20 h-28 rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02] ${
                  !grupo.todosVistos ? 'ring-[3px] ring-emerald-500' : 'ring-[3px] ring-surface-300'
                }`}>
                  {/* Preview del último avance */}
                  {grupo.ultimoAvance.tipo_media === 'foto' ? (
                    <img
                      src={grupo.ultimoAvance.media_url}
                      alt={grupo.autorNombre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <video
                      src={grupo.ultimoAvance.media_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}

                  {/* Overlay con gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Texto del avance si existe */}
                  {grupo.ultimoAvance.texto_opcional && (
                    <div className="absolute bottom-7 left-1 right-1">
                      <p className="text-[9px] text-white/90 line-clamp-2 leading-tight px-1">
                        {grupo.ultimoAvance.texto_opcional}
                      </p>
                    </div>
                  )}

                  {/* Indicador de proyecto enlazado */}
                  {grupo.ultimoAvance.proyecto_id && (
                    <div className="absolute top-1 left-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1 rounded-md shadow-sm">
                      <span className="material-symbols-outlined text-xs">folder</span>
                    </div>
                  )}
                </div>

                {/* Avatar pequeño en la esquina con borde de color */}
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[3px] border-white shadow-md overflow-hidden ${
                  !grupo.todosVistos ? 'ring-2 ring-emerald-500' : ''
                }`}>
                  {grupo.autorAvatar ? (
                    <img
                      src={grupo.autorAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">
                      {grupo.autorNombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Indicador de cantidad de avances */}
                {grupo.avances.length > 1 && (
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                    {grupo.avances.length}
                  </div>
                )}

                {/* Badge de nuevo si no está visto */}
                {!grupo.todosVistos && (
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
              <span className={`text-xs truncate max-w-[80px] ${
                !grupo.todosVistos ? 'font-semibold text-surface-900' : 'font-medium text-surface-600'
              }`}>
                {grupo.autorNombre.split(' ')[0]}
              </span>
            </motion.div>
          ))}

        {/* Mensaje si no hay avances */}
        {avancesAgrupados.length === 0 && userId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl ml-2 border border-primary-100"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-800">
                Comparte tu primer avance
              </p>
              <p className="text-xs text-surface-500">
                Muestra el progreso de tus proyectos
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
