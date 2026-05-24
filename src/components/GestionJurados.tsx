/**
 * GestionJurados - Panel de administración para gestionar jurados
 * Permite asignar roles de jurado y asignar jurados a concursos
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, ConcursoConStats } from '../types';
import {
  getTodosUsuarios,
  cambiarRolUsuario,
  getConcursos,
  getJuradosDeConcurso,
  asignarJuradoAConcurso,
  removerJuradoDeConcurso,
  getResumenEvaluacionesConcurso,
  getEvaluacionesDeJuradoEnConcurso,
} from '../lib/database';

interface GestionJuradosProps {
  adminId: string;
}

export default function GestionJurados({ adminId }: GestionJuradosProps) {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [concursos, setConcursos] = useState<ConcursoConStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [tabActual, setTabActual] = useState<'usuarios' | 'asignaciones' | 'evaluaciones'>('usuarios');

  // Modal de asignación
  const [concursoParaAsignar, setConcursoParaAsignar] = useState<ConcursoConStats | null>(null);
  const [juradosDelConcurso, setJuradosDelConcurso] = useState<Profile[]>([]);
  const [loadingJurados, setLoadingJurados] = useState(false);

  // Modal de evaluaciones
  const [concursoParaVer, setConcursoParaVer] = useState<ConcursoConStats | null>(null);
  const [resumenEvaluaciones, setResumenEvaluaciones] = useState<any[]>([]);
  const [juradoSeleccionado, setJuradoSeleccionado] = useState<string | null>(null);
  const [evaluacionesJurado, setEvaluacionesJurado] = useState<any[]>([]);

  // Filtros
  const [filtroRol, setFiltroRol] = useState<'todos' | 'jurado' | 'usuario'>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    const [usuariosData, concursosData] = await Promise.all([
      getTodosUsuarios(),
      getConcursos(),
    ]);
    setUsuarios(usuariosData);
    setConcursos(concursosData);
    setLoading(false);
  }

  async function handleCambiarRol(userId: string, nuevoRol: 'usuario' | 'jurado') {
    const { error } = await cambiarRolUsuario(userId, nuevoRol);
    if (!error) {
      setUsuarios(prev => prev.map(u =>
        u.id === userId ? { ...u, rol: nuevoRol } : u
      ));
    }
  }

  async function abrirModalAsignacion(concurso: ConcursoConStats) {
    setConcursoParaAsignar(concurso);
    setLoadingJurados(true);
    const jurados = await getJuradosDeConcurso(concurso.id);
    setJuradosDelConcurso(jurados);
    setLoadingJurados(false);
  }

  async function handleAsignarJurado(juradoId: string) {
    if (!concursoParaAsignar) return;
    const { error } = await asignarJuradoAConcurso(concursoParaAsignar.id, juradoId, adminId);
    if (!error) {
      const jurados = await getJuradosDeConcurso(concursoParaAsignar.id);
      setJuradosDelConcurso(jurados);
    }
  }

  async function handleRemoverJurado(juradoId: string) {
    if (!concursoParaAsignar) return;
    const { error } = await removerJuradoDeConcurso(concursoParaAsignar.id, juradoId);
    if (!error) {
      setJuradosDelConcurso(prev => prev.filter(j => j.id !== juradoId));
    }
  }

  async function abrirModalEvaluaciones(concurso: ConcursoConStats) {
    setConcursoParaVer(concurso);
    const resumen = await getResumenEvaluacionesConcurso(concurso.id);
    setResumenEvaluaciones(resumen);
  }

  async function verEvaluacionesJurado(juradoId: string) {
    if (!concursoParaVer) return;
    setJuradoSeleccionado(juradoId);
    const evaluaciones = await getEvaluacionesDeJuradoEnConcurso(concursoParaVer.id, juradoId);
    setEvaluacionesJurado(evaluaciones);
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    if (busqueda && !u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Jurados disponibles para asignar (que no estén ya asignados)
  const juradosDisponibles = usuarios.filter(u =>
    u.rol === 'jurado' && !juradosDelConcurso.some(j => j.id === u.id)
  );

  // Concursos en evaluación o finalizados
  const concursosConEvaluacion = concursos.filter(c =>
    c.fase_actual === 'evaluacion' || c.fase_actual === 'finalizado'
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
          progress_activity
        </span>
        <p className="text-surface-500 mt-2">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-3xl">gavel</span>
          <h2 className="text-2xl font-display font-bold">Gestión de Jurados</h2>
        </div>
        <p className="text-white/80">
          Asigna roles de jurado y gestiona quién evalúa cada concurso
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
        {[
          { id: 'usuarios', label: 'Usuarios', icon: 'people' },
          { id: 'asignaciones', label: 'Asignaciones', icon: 'assignment_ind' },
          { id: 'evaluaciones', label: 'Ver Evaluaciones', icon: 'rate_review' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActual(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tabActual === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Usuarios */}
      {tabActual === 'usuarios' && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-soft overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-surface-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value as any)}
              className="px-4 py-2 border border-surface-200 rounded-lg text-sm bg-white"
            >
              <option value="todos">Todos los roles</option>
              <option value="jurado">Solo jurados</option>
              <option value="usuario">Solo usuarios</option>
            </select>
          </div>

          {/* Lista de usuarios */}
          <div className="divide-y divide-surface-100 max-h-[400px] overflow-y-auto">
            {usuariosFiltrados.map(usuario => (
              <div
                key={usuario.id}
                className="p-4 flex items-center gap-4 hover:bg-surface-50"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-100 flex-shrink-0">
                  {usuario.avatar_url ? (
                    <img src={usuario.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-primary text-white font-bold">
                      {usuario.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 truncate">{usuario.nombre_completo}</p>
                  <p className="text-sm text-surface-500">{usuario.area}</p>
                </div>

                {/* Rol actual */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  usuario.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                  usuario.rol === 'jurado' ? 'bg-amber-100 text-amber-700' :
                  'bg-surface-100 text-surface-600'
                }`}>
                  {usuario.rol}
                </span>

                {/* Botón cambiar rol */}
                {usuario.rol !== 'admin' && (
                  <button
                    onClick={() => handleCambiarRol(usuario.id, usuario.rol === 'jurado' ? 'usuario' : 'jurado')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      usuario.rol === 'jurado'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    {usuario.rol === 'jurado' ? 'Quitar jurado' : 'Hacer jurado'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="p-4 bg-surface-50 border-t border-surface-100 flex gap-4 text-sm">
            <span className="text-surface-600">
              <strong className="text-amber-600">{usuarios.filter(u => u.rol === 'jurado').length}</strong> jurados
            </span>
            <span className="text-surface-600">
              <strong className="text-surface-700">{usuarios.filter(u => u.rol === 'usuario').length}</strong> usuarios
            </span>
          </div>
        </div>
      )}

      {/* Tab: Asignaciones */}
      {tabActual === 'asignaciones' && (
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Selecciona un concurso para asignar los jurados que lo evaluarán
          </p>

          <div className="grid gap-4">
            {concursos.filter(c => c.fase_actual !== 'cancelado' && c.fase_actual !== 'finalizado').map(concurso => (
              <div
                key={concurso.id}
                className="bg-white rounded-xl border border-surface-200 shadow-soft p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-surface-900">{concurso.nombre}</h3>
                    <p className="text-sm text-surface-500">
                      {concurso.total_postulaciones} proyectos • Fase: {concurso.fase_actual}
                    </p>
                  </div>
                  <button
                    onClick={() => abrirModalAsignacion(concurso)}
                    className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">assignment_ind</span>
                    Asignar jurados
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Ver Evaluaciones */}
      {tabActual === 'evaluaciones' && (
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Ve el resumen de evaluaciones y puntajes de cada jurado
          </p>

          {concursosConEvaluacion.length === 0 ? (
            <div className="bg-white rounded-xl border border-surface-200 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-surface-300 mb-2">rate_review</span>
              <p className="text-surface-500">No hay concursos con evaluaciones aún</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {concursosConEvaluacion.map(concurso => (
                <div
                  key={concurso.id}
                  className="bg-white rounded-xl border border-surface-200 shadow-soft p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-surface-900">{concurso.nombre}</h3>
                      <p className="text-sm text-surface-500">
                        {concurso.total_postulaciones} proyectos • {concurso.fase_actual === 'finalizado' ? 'Finalizado' : 'En evaluación'}
                      </p>
                    </div>
                    <button
                      onClick={() => abrirModalEvaluaciones(concurso)}
                      className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      Ver evaluaciones
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Asignar Jurados a Concurso */}
      <AnimatePresence>
        {concursoParaAsignar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConcursoParaAsignar(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900">Asignar Jurados</h3>
                  <p className="text-sm text-surface-500">{concursoParaAsignar.nombre}</p>
                </div>
                <button
                  onClick={() => setConcursoParaAsignar(null)}
                  className="p-2 text-surface-400 hover:text-surface-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {/* Jurados asignados */}
                <div className="mb-6">
                  <h4 className="font-semibold text-surface-700 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-green-500">check_circle</span>
                    Jurados asignados ({juradosDelConcurso.length})
                  </h4>
                  {loadingJurados ? (
                    <p className="text-sm text-surface-500">Cargando...</p>
                  ) : juradosDelConcurso.length === 0 ? (
                    <p className="text-sm text-surface-500 italic">Ningún jurado asignado</p>
                  ) : (
                    <div className="space-y-2">
                      {juradosDelConcurso.map(jurado => (
                        <div
                          key={jurado.id}
                          className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-green-200">
                            {jurado.avatar_url ? (
                              <img src={jurado.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-green-700 font-bold text-sm">
                                {jurado.nombre_completo.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-surface-900 text-sm">{jurado.nombre_completo}</p>
                            <p className="text-xs text-surface-500">{jurado.area}</p>
                          </div>
                          <button
                            onClick={() => handleRemoverJurado(jurado.id)}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-lg">remove_circle</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jurados disponibles */}
                <div>
                  <h4 className="font-semibold text-surface-700 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-surface-400">person_add</span>
                    Jurados disponibles ({juradosDisponibles.length})
                  </h4>
                  {juradosDisponibles.length === 0 ? (
                    <p className="text-sm text-surface-500 italic">
                      No hay más jurados disponibles. Asigna el rol de jurado a más usuarios.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {juradosDisponibles.map(jurado => (
                        <div
                          key={jurado.id}
                          className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-200">
                            {jurado.avatar_url ? (
                              <img src={jurado.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-surface-600 font-bold text-sm">
                                {jurado.nombre_completo.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-surface-900 text-sm">{jurado.nombre_completo}</p>
                            <p className="text-xs text-surface-500">{jurado.area}</p>
                          </div>
                          <button
                            onClick={() => handleAsignarJurado(jurado.id)}
                            className="p-1.5 text-green-500 hover:bg-green-100 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Ver Evaluaciones de Concurso */}
      <AnimatePresence>
        {concursoParaVer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setConcursoParaVer(null);
              setJuradoSeleccionado(null);
              setEvaluacionesJurado([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900">Evaluaciones del Concurso</h3>
                  <p className="text-sm text-surface-500">{concursoParaVer.nombre}</p>
                </div>
                <button
                  onClick={() => {
                    setConcursoParaVer(null);
                    setJuradoSeleccionado(null);
                  }}
                  className="p-2 text-surface-400 hover:text-surface-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {!juradoSeleccionado ? (
                  // Resumen por jurado
                  <>
                    <h4 className="font-semibold text-surface-700 mb-4">Resumen por Jurado</h4>
                    {resumenEvaluaciones.length === 0 ? (
                      <p className="text-sm text-surface-500 italic">No hay evaluaciones registradas</p>
                    ) : (
                      <div className="space-y-3">
                        {resumenEvaluaciones.map(item => (
                          <div
                            key={item.jurado_id}
                            className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl hover:bg-surface-100 cursor-pointer transition-colors"
                            onClick={() => verEvaluacionesJurado(item.jurado_id)}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-200">
                              {item.jurado_avatar ? (
                                <img src={item.jurado_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-primary text-white font-bold">
                                  {item.jurado_nombre.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-surface-900">{item.jurado_nombre}</p>
                              <p className="text-sm text-surface-500">
                                {item.total_evaluaciones} evaluaciones realizadas
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary-600">
                                {item.promedio_dado.toFixed(1)}
                              </p>
                              <p className="text-xs text-surface-500">promedio dado</p>
                            </div>
                            <span className="material-symbols-outlined text-surface-400">chevron_right</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Detalle de evaluaciones del jurado
                  <>
                    <button
                      onClick={() => setJuradoSeleccionado(null)}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_back</span>
                      Volver al resumen
                    </button>

                    <h4 className="font-semibold text-surface-700 mb-4">
                      Evaluaciones de {resumenEvaluaciones.find(r => r.jurado_id === juradoSeleccionado)?.jurado_nombre}
                    </h4>

                    <div className="space-y-3">
                      {evaluacionesJurado.map((ev, i) => (
                        <div key={i} className="bg-surface-50 rounded-xl p-4">
                          <h5 className="font-medium text-surface-900 mb-3">{ev.proyecto_titulo}</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-lg font-bold text-blue-600">{ev.puntaje_innovacion}</p>
                              <p className="text-[10px] text-surface-500">Innovación</p>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-lg font-bold text-green-600">{ev.puntaje_impacto}</p>
                              <p className="text-[10px] text-surface-500">Impacto</p>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-lg font-bold text-amber-600">{ev.puntaje_factibilidad}</p>
                              <p className="text-[10px] text-surface-500">Factibilidad</p>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-lg font-bold text-purple-600">{ev.puntaje_presentacion}</p>
                              <p className="text-[10px] text-surface-500">Presentación</p>
                            </div>
                            <div className="bg-primary-50 rounded-lg p-2 col-span-2 sm:col-span-1">
                              <p className="text-lg font-bold text-primary-600">{ev.puntaje_total.toFixed(1)}</p>
                              <p className="text-[10px] text-primary-500">TOTAL</p>
                            </div>
                          </div>
                          {ev.comentario && (
                            <p className="mt-3 text-sm text-surface-600 italic bg-white p-2 rounded-lg">
                              "{ev.comentario}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
