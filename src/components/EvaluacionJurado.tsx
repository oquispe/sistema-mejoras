/**
 * EvaluacionJurado - Panel para que el jurado evalúe proyectos de un concurso
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConcursoConStats, PostulacionConDetalles, Evaluacion, CRITERIOS_EVALUACION, ProyectoArchivo } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getConcursos,
  getConcursosAsignadosAJurado,
  getPostulacionesParaEvaluar,
  guardarEvaluacion,
  getArchivosProyecto,
} from '../lib/database';
import GaleriaArchivos from './GaleriaArchivos';

export default function EvaluacionJurado() {
  const { user, profile } = useAuth();
  const [concursos, setConcursos] = useState<ConcursoConStats[]>([]);
  const [concursoSeleccionado, setConcursoSeleccionado] = useState<ConcursoConStats | null>(null);
  const [postulaciones, setPostulaciones] = useState<(PostulacionConDetalles & { mi_evaluacion?: Evaluacion })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPostulaciones, setLoadingPostulaciones] = useState(false);

  // Modal de evaluación
  const [postulacionActiva, setPostulacionActiva] = useState<PostulacionConDetalles | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal de detalle del proyecto
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [proyectoDetalle, setProyectoDetalle] = useState<{
    postulacion: PostulacionConDetalles;
    archivos: ProyectoArchivo[];
  } | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Formulario de evaluación
  const [puntajes, setPuntajes] = useState({
    innovacion: 5,
    impacto: 5,
    factibilidad: 5,
    presentacion: 5,
  });
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const esJurado = profile?.rol === 'jurado' || profile?.rol === 'admin';

  // Cargar concursos asignados al jurado en evaluación
  useEffect(() => {
    if (esJurado && user) {
      cargarConcursos();
    }
  }, [esJurado, user]);

  async function cargarConcursos() {
    if (!user) return;
    setLoading(true);

    // Si es admin, mostrar todos los concursos en evaluación
    // Si es jurado, mostrar solo los concursos asignados
    if (profile?.rol === 'admin') {
      const data = await getConcursos();
      const enEvaluacion = data.filter(c => c.fase_actual === 'evaluacion');
      setConcursos(enEvaluacion);
    } else {
      // Jurado: solo concursos asignados
      const data = await getConcursosAsignadosAJurado(user.id);
      setConcursos(data);
    }

    setLoading(false);
  }

  // Cargar postulaciones de un concurso
  async function handleSeleccionarConcurso(concurso: ConcursoConStats) {
    setConcursoSeleccionado(concurso);
    setLoadingPostulaciones(true);
    const posts = await getPostulacionesParaEvaluar(concurso.id, user!.id);
    setPostulaciones(posts);
    setLoadingPostulaciones(false);
  }

  // Abrir modal de detalle del proyecto
  async function handleVerDetalle(postulacion: PostulacionConDetalles) {
    setLoadingDetalle(true);
    setShowDetalleModal(true);

    // Cargar archivos del proyecto
    const archivos = await getArchivosProyecto(postulacion.proyecto_id);

    setProyectoDetalle({
      postulacion,
      archivos,
    });
    setLoadingDetalle(false);
  }

  // Abrir modal de evaluación
  function handleEvaluar(postulacion: PostulacionConDetalles & { mi_evaluacion?: Evaluacion }) {
    setPostulacionActiva(postulacion);

    // Si ya tiene evaluación, cargar los valores
    if (postulacion.mi_evaluacion) {
      setPuntajes({
        innovacion: postulacion.mi_evaluacion.puntaje_innovacion,
        impacto: postulacion.mi_evaluacion.puntaje_impacto,
        factibilidad: postulacion.mi_evaluacion.puntaje_factibilidad,
        presentacion: postulacion.mi_evaluacion.puntaje_presentacion,
      });
      setComentario(postulacion.mi_evaluacion.comentario || '');
    } else {
      setPuntajes({ innovacion: 5, impacto: 5, factibilidad: 5, presentacion: 5 });
      setComentario('');
    }

    setShowModal(true);
    setMensaje(null);
  }

  // Guardar evaluación
  async function handleGuardarEvaluacion() {
    if (!postulacionActiva || !user) return;

    setGuardando(true);

    const { error } = await guardarEvaluacion({
      postulacion_id: postulacionActiva.id,
      jurado_id: user.id,
      puntaje_innovacion: puntajes.innovacion,
      puntaje_impacto: puntajes.impacto,
      puntaje_factibilidad: puntajes.factibilidad,
      puntaje_presentacion: puntajes.presentacion,
      comentario: comentario.trim() || undefined,
    });

    if (error) {
      setMensaje({ tipo: 'error', texto: error });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Evaluación guardada correctamente' });
      // Recargar postulaciones
      if (concursoSeleccionado) {
        const posts = await getPostulacionesParaEvaluar(concursoSeleccionado.id, user.id);
        setPostulaciones(posts);
      }
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    }

    setGuardando(false);
  }

  // Calcular puntaje total
  const puntajeTotal = ((puntajes.innovacion + puntajes.impacto + puntajes.factibilidad + puntajes.presentacion) / 4).toFixed(1);

  // Contar evaluadas (excluyendo proyectos propios que no puede calificar)
  const proyectosEvaluables = postulaciones.filter(p => p.proyecto_autor_id !== user?.id);
  const evaluadas = proyectosEvaluables.filter(p => p.mi_evaluacion).length;
  const pendientes = proyectosEvaluables.length - evaluadas;
  const proyectosPropios = postulaciones.length - proyectosEvaluables.length;

  if (!esJurado) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-surface-200 shadow-soft text-center">
        <span className="material-symbols-outlined text-6xl text-amber-400 mb-4">
          gavel
        </span>
        <h2 className="text-xl font-bold text-surface-900 mb-2">Acceso Restringido</h2>
        <p className="text-surface-500">
          Esta sección es solo para miembros del jurado.
        </p>
      </div>
    );
  }

  // Vista de detalle de concurso (proyectos a evaluar)
  if (concursoSeleccionado) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => setConcursoSeleccionado(null)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-surface-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 mb-6 text-sm font-medium transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver a concursos
        </button>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 mb-3">
                <span className="material-symbols-outlined text-sm">rate_review</span>
                En Evaluación
              </span>
              <h1 className="text-2xl font-display font-bold text-surface-900">
                {concursoSeleccionado.nombre}
              </h1>
            </div>

            {/* Progreso */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-surface-500">Progreso:</span>
                <span className="font-bold text-primary-600">{evaluadas}/{proyectosEvaluables.length}</span>
              </div>
              <div className="w-32 h-2 bg-surface-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${proyectosEvaluables.length > 0 ? (evaluadas / proyectosEvaluables.length) * 100 : 0}%` }}
                />
              </div>
              {pendientes > 0 && (
                <p className="text-xs text-surface-500 mt-1">{pendientes} pendientes</p>
              )}
              {proyectosPropios > 0 && (
                <p className="text-xs text-amber-600 mt-1">{proyectosPropios} proyecto(s) propio(s)</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de proyectos a evaluar */}
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
              No hay proyectos para evaluar
            </h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {postulaciones.map((post, index) => {
              const evaluado = !!post.mi_evaluacion;
              const esProyectoPropio = post.proyecto_autor_id === user?.id;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl border shadow-soft p-5 transition-all ${
                    esProyectoPropio
                      ? 'border-amber-200 bg-amber-50/50 opacity-75'
                      : evaluado
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-surface-200 hover:border-primary-200 hover:shadow-soft-lg'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Número */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                      evaluado ? 'bg-green-500' : 'bg-gradient-primary'
                    }`}>
                      {evaluado ? (
                        <span className="material-symbols-outlined">check</span>
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-900 mb-1">
                        {post.proyecto_titulo}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-surface-500 mb-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {post.proyecto_autor_nombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">apartment</span>
                          {post.proyecto_area}
                        </span>
                      </div>
                      <span className={`tag ${
                        post.proyecto_categoria === 'proyecto' ? 'tag-proyecto' :
                        post.proyecto_categoria === 'mejora' ? 'tag-mejora' : 'tag-innovacion'
                      }`}>
                        {post.proyecto_categoria}
                      </span>

                      {/* Puntaje si ya evaluó */}
                      {evaluado && post.mi_evaluacion && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="font-semibold text-green-700">
                            Tu puntaje: {post.mi_evaluacion.puntaje_total.toFixed(1)}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerDetalle(post)}
                        className="px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 bg-surface-100 text-surface-600 hover:bg-surface-200"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        Ver detalles
                      </button>
                      {esProyectoPropio ? (
                        <span className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-100 text-amber-700 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">block</span>
                          Tu proyecto
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEvaluar(post)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                            evaluado
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'btn-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {evaluado ? 'edit' : 'rate_review'}
                          </span>
                          {evaluado ? 'Modificar' : 'Evaluar'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal de Evaluación */}
        <AnimatePresence>
          {showModal && postulacionActiva && (
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-2xl rounded-2xl shadow-soft-lg overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-4 p-6 border-b border-surface-100 flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">rate_review</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-bold text-surface-900 truncate">
                      {postulacionActiva.proyecto_titulo}
                    </h3>
                    <p className="text-sm text-surface-500">
                      {postulacionActiva.proyecto_autor_nombre} • {postulacionActiva.proyecto_area}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-surface-400">close</span>
                  </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Mensaje */}
                  <AnimatePresence>
                    {mensaje && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                          mensaje.tipo === 'exito'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {mensaje.tipo === 'exito' ? 'check_circle' : 'error'}
                        </span>
                        {mensaje.texto}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Detalle del proyecto */}
                  <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                    <h4 className="font-semibold text-surface-800 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-500">description</span>
                      Descripción del Proyecto
                    </h4>
                    <p className="text-sm text-surface-600 whitespace-pre-wrap leading-relaxed">
                      {postulacionActiva.proyecto_descripcion || 'Sin descripción disponible'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`tag ${
                        postulacionActiva.proyecto_categoria === 'proyecto' ? 'tag-proyecto' :
                        postulacionActiva.proyecto_categoria === 'mejora' ? 'tag-mejora' : 'tag-innovacion'
                      }`}>
                        {postulacionActiva.proyecto_categoria}
                      </span>
                      <span className="tag tag-area">
                        {postulacionActiva.proyecto_area}
                      </span>
                    </div>
                  </div>

                  {/* Criterios de evaluación */}
                  <div>
                    <h4 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">stars</span>
                      Calificación por Criterios
                    </h4>
                    <div className="space-y-4">
                      {CRITERIOS_EVALUACION.map((criterio) => (
                        <SliderCriterio
                          key={criterio.id}
                          criterio={criterio}
                          valor={puntajes[criterio.id as keyof typeof puntajes]}
                          onChange={(nuevoValor) => setPuntajes(prev => ({
                            ...prev,
                            [criterio.id]: nuevoValor
                          }))}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Puntaje total */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-5 text-center text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Puntaje Promedio</p>
                    <p className="text-5xl font-bold">{puntajeTotal}</p>
                    <p className="text-sm opacity-75 mt-1">de 10 puntos</p>
                  </div>

                  {/* Comentario */}
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">
                      Comentario (opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Agrega observaciones o retroalimentación para el proyecto..."
                      className="input-modern resize-none"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-surface-100 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarEvaluacion}
                    disabled={guardando}
                    className="btn-primary flex-1"
                  >
                    {guardando ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Guardar Evaluación
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal de Detalle del Proyecto */}
        <AnimatePresence>
          {showDetalleModal && (
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-3xl rounded-2xl shadow-soft-lg overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-4 p-6 border-b border-surface-100 flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">visibility</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-bold text-surface-900 truncate">
                      {proyectoDetalle?.postulacion.proyecto_titulo || 'Cargando...'}
                    </h3>
                    <p className="text-sm text-surface-500">
                      Detalles del proyecto
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetalleModal(false);
                      setProyectoDetalle(null);
                    }}
                    className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-surface-400">close</span>
                  </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {loadingDetalle ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
                        progress_activity
                      </span>
                      <p className="text-surface-500 mt-2">Cargando detalles...</p>
                    </div>
                  ) : proyectoDetalle ? (
                    <>
                      {/* Galería de imágenes */}
                      {proyectoDetalle.archivos.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary-500">photo_library</span>
                            Archivos del Proyecto
                          </h4>
                          <GaleriaArchivos archivos={proyectoDetalle.archivos} modo="completo" />
                        </div>
                      ) : proyectoDetalle.postulacion.proyecto_imagen_url ? (
                        <div>
                          <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary-500">image</span>
                            Imagen del Proyecto
                          </h4>
                          <img
                            src={proyectoDetalle.postulacion.proyecto_imagen_url}
                            alt={proyectoDetalle.postulacion.proyecto_titulo}
                            className="w-full rounded-xl max-h-96 object-contain bg-surface-100"
                          />
                        </div>
                      ) : null}

                      {/* Información del autor */}
                      <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                        <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-500">person</span>
                          Autor
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                            {proyectoDetalle.postulacion.proyecto_autor_nombre?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900">
                              {proyectoDetalle.postulacion.proyecto_autor_nombre}
                            </p>
                            <p className="text-sm text-surface-500">
                              {proyectoDetalle.postulacion.proyecto_area}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                        <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-500">description</span>
                          Descripción
                        </h4>
                        <p className="text-surface-600 whitespace-pre-wrap leading-relaxed">
                          {proyectoDetalle.postulacion.proyecto_descripcion ||
                           'Sin descripción disponible'}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`tag ${
                          proyectoDetalle.postulacion.proyecto_categoria === 'proyecto' ? 'tag-proyecto' :
                          proyectoDetalle.postulacion.proyecto_categoria === 'mejora' ? 'tag-mejora' : 'tag-innovacion'
                        }`}>
                          {proyectoDetalle.postulacion.proyecto_categoria}
                        </span>
                        <span className="tag tag-area">
                          {proyectoDetalle.postulacion.proyecto_area}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-surface-100 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowDetalleModal(false);
                      setProyectoDetalle(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Volver a la lista
                  </button>
                  <button
                    onClick={() => {
                      setShowDetalleModal(false);
                      if (proyectoDetalle) {
                        handleEvaluar(proyectoDetalle.postulacion as any);
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    <span className="material-symbols-outlined">rate_review</span>
                    Evaluar proyecto
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Vista de lista de concursos en evaluación
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="material-symbols-outlined text-white text-3xl">gavel</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-surface-900">
          Panel del Jurado
        </h1>
        <p className="text-surface-500 mt-2">
          Evalúa los proyectos de los concursos activos
        </p>
      </div>

      {/* Lista de concursos */}
      {loading ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-primary-500 animate-spin">
            progress_activity
          </span>
          <p className="text-surface-500 mt-2">Cargando concursos...</p>
        </div>
      ) : concursos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-surface-300 mb-3">
            hourglass_empty
          </span>
          <h3 className="text-lg font-semibold text-surface-700 mb-2">
            No tienes concursos asignados para evaluar
          </h3>
          <p className="text-surface-500 text-sm">
            {profile?.rol === 'admin'
              ? 'No hay concursos en fase de evaluación actualmente.'
              : 'El administrador debe asignarte a un concurso para que puedas evaluar sus proyectos.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {concursos.map((concurso, index) => (
            <motion.div
              key={concurso.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSeleccionarConcurso(concurso)}
              className="bg-white rounded-2xl border border-surface-200 shadow-soft p-5 hover:shadow-soft-lg hover:border-amber-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 mb-3">
                    <span className="material-symbols-outlined text-sm">rate_review</span>
                    En Evaluación
                  </span>

                  <h3 className="text-lg font-bold text-surface-900 group-hover:text-amber-600 transition-colors mb-1">
                    {concurso.nombre}
                  </h3>

                  {concurso.descripcion && (
                    <p className="text-sm text-surface-500 line-clamp-2">
                      {concurso.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {concurso.total_postulaciones}
                    </p>
                    <p className="text-xs text-surface-500">proyectos</p>
                  </div>
                  <span className="material-symbols-outlined text-surface-300 group-hover:text-amber-500 transition-colors">
                    chevron_right
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente SliderCriterio con soporte para arrastrar
interface SliderCriterioProps {
  criterio: {
    id: string;
    label: string;
    descripcion: string;
    icon: string;
  };
  valor: number;
  onChange: (valor: number) => void;
}

function SliderCriterio({ criterio, valor, onChange }: SliderCriterioProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const porcentaje = ((valor - 1) / 9) * 100;

  // Calcular valor desde posición del mouse/touch
  const calcularValor = useCallback((clientX: number) => {
    if (!sliderRef.current) return valor;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const porcentajePos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const nuevoValor = Math.round((porcentajePos / 100) * 9 + 1);
    return Math.max(1, Math.min(10, nuevoValor));
  }, [valor]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const nuevoValor = calcularValor(e.clientX);
    onChange(nuevoValor);
  }, [calcularValor, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const nuevoValor = calcularValor(e.clientX);
    onChange(nuevoValor);
  }, [isDragging, calcularValor, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const nuevoValor = calcularValor(e.touches[0].clientX);
    onChange(nuevoValor);
  }, [calcularValor, onChange]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const nuevoValor = calcularValor(e.touches[0].clientX);
    onChange(nuevoValor);
  }, [isDragging, calcularValor, onChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Agregar/remover event listeners globales
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Colores según valor
  const getColor = (v: number) => {
    if (v <= 3) return '#ef4444';
    if (v <= 6) return '#f59e0b';
    return '#10b981';
  };

  const getGradient = (v: number) => {
    if (v <= 3) return 'linear-gradient(to right, #ef4444, #f87171)';
    if (v <= 6) return 'linear-gradient(to right, #f59e0b, #fbbf24)';
    return 'linear-gradient(to right, #10b981, #34d399)';
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary-500">
            {criterio.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-surface-900">{criterio.label}</p>
          <p className="text-xs text-surface-500">{criterio.descripcion}</p>
        </div>
        <div className="text-center">
          <span
            className="text-3xl font-bold transition-colors"
            style={{ color: getColor(valor) }}
          >
            {valor}
          </span>
          <span className="text-sm text-surface-400">/10</span>
        </div>
      </div>

      {/* Barra de puntuación visual - ARRASTRABLE */}
      <div className="relative pt-2 select-none">
        {/* Barra de progreso con color */}
        <div
          ref={sliderRef}
          className={`relative h-6 rounded-full overflow-visible cursor-pointer ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ backgroundColor: '#e5e7eb' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${porcentaje}%`,
              background: getGradient(valor),
              transitionDuration: isDragging ? '0ms' : '150ms'
            }}
          />

          {/* Thumb (bolita) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white shadow-lg transition-all ${
              isDragging ? 'scale-125 shadow-xl' : 'hover:scale-110'
            }`}
            style={{
              left: `calc(${porcentaje}% - 16px)`,
              backgroundColor: getColor(valor),
              transitionDuration: isDragging ? '0ms' : '150ms'
            }}
          />
        </div>

        {/* Escala de números debajo */}
        <div className="flex justify-between mt-3 px-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                n === valor
                  ? 'text-white shadow-md scale-110'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: n === valor ? getColor(n) : 'transparent'
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Leyenda de colores */}
        <div className="flex justify-between mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></span>
            Bajo (1-3)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></span>
            Medio (4-6)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
            Alto (7-10)
          </span>
        </div>
      </div>
    </div>
  );
}
