/**
 * BarraAvances - Barra horizontal de stories/avances tipo Instagram
 * Muestra círculos con avatares de usuarios que tienen avances activos
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
      } else {
        grupos.set(avance.autor_id, {
          autorId: avance.autor_id,
          autorNombre: avance.autor_nombre,
          autorAvatar: avance.autor_avatar,
          avances: [avance],
          todosVistos: avance.visto_por_mi === true,
        });
      }
    }

    // Ordenar: usuario actual primero, luego no vistos, luego vistos
    const resultado = Array.from(grupos.values());
    resultado.sort((a, b) => {
      // Usuario actual siempre primero
      if (a.autorId === userId) return -1;
      if (b.autorId === userId) return 1;
      // Luego los no vistos
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
      <div className="bg-white border-b border-surface-200 px-4 py-3">
        <div className="flex gap-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-full bg-surface-200" />
              <div className="w-12 h-3 bg-surface-200 rounded" />
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
    <div className="bg-white border-b border-surface-200">
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Botón "Tu avance" - siempre primero si está autenticado */}
        {userId && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={misAvances ? () => onVerAvances(userId, misAvances.avances) : onCrearAvance}
              className="relative group"
            >
              {/* Anillo de gradiente si tiene avances */}
              <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center ${
                misAvances ? 'bg-gradient-to-tr from-primary-500 via-secondary-500 to-accent-500 p-[3px]' : 'bg-surface-200 p-[3px]'
              }`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface-100 flex items-center justify-center">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Tu avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-surface-400">
                        {userName?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón + para agregar si no tiene avances */}
              {!misAvances && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="material-symbols-outlined text-white text-sm">add</span>
                </div>
              )}
            </button>
            <span className="text-xs text-surface-600 truncate max-w-[70px]">
              {misAvances ? 'Tu avance' : 'Crear'}
            </span>
          </div>
        )}

        {/* Avances de otros usuarios */}
        {avancesAgrupados
          .filter(g => g.autorId !== userId)
          .map((grupo) => (
            <motion.div
              key={grupo.autorId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <button
                onClick={() => onVerAvances(grupo.autorId, grupo.avances)}
                className="relative group"
              >
                {/* Anillo de gradiente (verde si no visto, gris si visto) */}
                <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center p-[3px] ${
                  grupo.todosVistos
                    ? 'bg-surface-300'
                    : 'bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-500'
                }`}>
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-surface-100 flex items-center justify-center">
                      {grupo.autorAvatar ? (
                        <img
                          src={grupo.autorAvatar}
                          alt={grupo.autorNombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-surface-400">
                          {grupo.autorNombre.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Indicador de cantidad de avances */}
                {grupo.avances.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white text-[10px] font-bold text-white">
                    {grupo.avances.length}
                  </div>
                )}
              </button>
              <span className="text-xs text-surface-600 truncate max-w-[70px]">
                {grupo.autorNombre.split(' ')[0]}
              </span>
            </motion.div>
          ))}

        {/* Mensaje si no hay avances */}
        {avancesAgrupados.length === 0 && userId && (
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-50 rounded-xl ml-2">
            <span className="material-symbols-outlined text-surface-400">photo_camera</span>
            <p className="text-sm text-surface-500">
              Sé el primero en compartir un avance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
