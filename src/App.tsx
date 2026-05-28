/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useCallback } from "react";
import { ProyectoConStats, ProyectoArchivo, ArchivoLocal, AREAS_EJEMPLO, ConcursoConStats, AvanceConDetalles } from "./types";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import Comentarios from "./components/Comentarios";
import FileUploader from "./components/FileUploader";
import GaleriaArchivos, { PortadaProyecto } from "./components/GaleriaArchivos";
import AdminPanel from "./components/AdminPanel";
import PostularModal from "./components/PostularModal";
import ConcursosView from "./components/ConcursosView";
import EvaluacionJurado from "./components/EvaluacionJurado";
import ConcursoBanner from "./components/ConcursoBanner";
import SeleccionarProyectoModal from "./components/SeleccionarProyectoModal";
import NotificacionesPanel from "./components/NotificacionesPanel";
import BarraAvances from "./components/BarraAvances";
import CrearAvanceModal from "./components/CrearAvanceModal";
import VisorAvance from "./components/VisorAvance";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./context/AuthContext";
import { useProyectos } from "./hooks/useProyectos";
import { subirArchivoProyecto } from "./lib/storage";
import { crearArchivoProyecto, eliminarArchivoDeProyecto, getArchivosProyecto, getConcursosActivos, postularProyecto } from "./lib/database";

export default function App() {
  // Autenticación
  const { user, profile, loading: authLoading } = useAuth();

  // Proyectos desde Supabase
  const {
    proyectos,
    loading: proyectosLoading,
    busqueda,
    setBusqueda,
    crear: crearProyecto,
    editar: editarProyecto,
    eliminar: eliminarProyecto,
    handleLike,
    filtrarPorCategoria,
    cargarProyectos,
  } = useProyectos();

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>("feed");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modales
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modales móviles
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal de postulación
  const [showPostularModal, setShowPostularModal] = useState(false);
  const [proyectoAPostular, setProyectoAPostular] = useState<{ id: string; titulo: string } | null>(null);

  // Concursos activos para mostrar en el feed
  const [concursosActivos, setConcursosActivos] = useState<ConcursoConStats[]>([]);

  // Modal para seleccionar proyecto a postular
  const [showSeleccionarProyectoModal, setShowSeleccionarProyectoModal] = useState(false);
  const [concursoParaPostular, setConcursoParaPostular] = useState<ConcursoConStats | null>(null);

  // Estados para avances (stories)
  const [showCrearAvanceModal, setShowCrearAvanceModal] = useState(false);
  const [showVisorAvance, setShowVisorAvance] = useState(false);
  const [avancesParaVer, setAvancesParaVer] = useState<AvanceConDetalles[]>([]);
  const [avancesKey, setAvancesKey] = useState(0); // Para forzar recarga de la barra

  // Formulario de nuevo proyecto
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formCategoria, setFormCategoria] = useState<"proyecto" | "mejora" | "innovacion">("mejora");
  const [formArea, setFormArea] = useState(profile?.area || "Producción");
  const [formTipo, setFormTipo] = useState<"produccion" | "calidad" | "seguridad">("produccion");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formConcursoId, setFormConcursoId] = useState<string>("");

  // Archivos del formulario
  const [archivosNuevos, setArchivosNuevos] = useState<ArchivoLocal[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ProyectoArchivo[]>([]);
  const [archivosAEliminar, setArchivosAEliminar] = useState<string[]>([]);

  // Actualizar área cuando cargue el perfil
  useEffect(() => {
    if (profile?.area) {
      setFormArea(profile.area);
    }
  }, [profile?.area]);

  // Cargar concursos activos para mostrar en el feed
  useEffect(() => {
    if (user) {
      cargarConcursosActivos();
    }
  }, [user]);

  async function cargarConcursosActivos() {
    const data = await getConcursosActivos();
    setConcursosActivos(data);
  }

  // Funciones para avances (stories)
  const handleCrearAvance = useCallback(() => {
    setShowCrearAvanceModal(true);
  }, []);

  const handleVerAvances = useCallback((_autorId: string, avances: AvanceConDetalles[]) => {
    setAvancesParaVer(avances);
    setShowVisorAvance(true);
  }, []);

  const handleAvanceCreado = useCallback(() => {
    setAvancesKey(prev => prev + 1); // Forzar recarga de la barra
    triggerToast("¡Avance publicado!");
  }, []);

  const handleAvanceEliminado = useCallback(() => {
    setAvancesKey(prev => prev + 1);
    triggerToast("Avance eliminado");
  }, []);

  // Auto hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const triggerToast = (msg: string) => setToastMessage(msg);

  const handleChangeTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentTab("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Like con feedback
  const handleLikeWithToast = async (projectId: string) => {
    const proyecto = proyectos.find(p => p.id === projectId);
    if (!proyecto) return;
    const wasLiked = proyecto.usuario_dio_like;
    await handleLike(projectId);
    triggerToast(wasLiked ? `Quitaste tu like` : `¡Te gustó "${proyecto.titulo}"!`);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormTitulo("");
    setFormDescripcion("");
    setFormCategoria("mejora");
    setFormArea(profile?.area || "Producción");
    setFormTipo("produccion");
    setEditingProjectId(null);
    setFormConcursoId("");
    // Limpiar archivos
    setArchivosNuevos([]);
    setArchivosExistentes([]);
    setArchivosAEliminar([]);
  };

  // Abrir modal de edición
  const openEditModal = async (proyecto: ProyectoConStats) => {
    setFormTitulo(proyecto.titulo);
    setFormDescripcion(proyecto.descripcion);
    setFormCategoria(proyecto.categoria);
    setFormArea(proyecto.area);
    setFormTipo(proyecto.tipo);
    setEditingProjectId(proyecto.id);
    setArchivosNuevos([]);
    setArchivosAEliminar([]);

    // Cargar archivos existentes
    const archivos = await getArchivosProyecto(proyecto.id);
    setArchivosExistentes(archivos);

    setShowEditModal(true);
  };

  // Marcar archivo existente para eliminar
  const handleEliminarArchivoExistente = (archivoId: string) => {
    setArchivosAEliminar(prev => [...prev, archivoId]);
    setArchivosExistentes(prev => prev.filter(a => a.id !== archivoId));
  };

  // Subir archivos nuevos a un proyecto
  const subirArchivosAlProyecto = async (proyectoId: string): Promise<boolean> => {
    if (!user || archivosNuevos.length === 0) return true;

    let todosExitosos = true;

    for (const archivo of archivosNuevos) {
      // Subir al storage
      const { url, storagePath, tipo, error: uploadError } = await subirArchivoProyecto(
        archivo.file,
        user.id
      );

      if (uploadError || !url || !storagePath || !tipo) {
        console.error(`Error subiendo ${archivo.nombre}:`, uploadError);
        todosExitosos = false;
        continue;
      }

      // Registrar en la base de datos
      const { error: dbError } = await crearArchivoProyecto({
        proyecto_id: proyectoId,
        nombre: archivo.nombre,
        tipo,
        mime_type: archivo.file.type,
        tamanio: archivo.tamanio,
        storage_path: storagePath,
        url,
        subido_por: user.id,
      });

      if (dbError) {
        console.error(`Error registrando ${archivo.nombre}:`, dbError);
        todosExitosos = false;
      }
    }

    return todosExitosos;
  };

  // Crear o editar proyecto
  const handleSubmitProyecto = async (e: FormEvent) => {
    e.preventDefault();

    if (!formTitulo.trim() || !formDescripcion.trim()) {
      triggerToast("Completa todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);

    if (editingProjectId) {
      // Editar proyecto existente
      const { success, error } = await editarProyecto(editingProjectId, {
        titulo: formTitulo,
        descripcion: formDescripcion,
        categoria: formCategoria,
        area: formArea,
        tipo: formTipo,
      });

      if (!success) {
        triggerToast(error || "Error al actualizar");
        setIsSubmitting(false);
        return;
      }

      // Eliminar archivos marcados
      for (const archivoId of archivosAEliminar) {
        await eliminarArchivoDeProyecto(archivoId);
      }

      // Subir archivos nuevos
      await subirArchivosAlProyecto(editingProjectId);

      // Recargar proyectos para actualizar archivos
      await cargarProyectos();

      resetForm();
      setShowEditModal(false);
      triggerToast("Proyecto actualizado");
    } else {
      // Crear nuevo proyecto
      const { success, error, proyectoId } = await crearProyecto({
        titulo: formTitulo,
        descripcion: formDescripcion,
        categoria: formCategoria,
        area: formArea,
        tipo: formTipo,
      });

      if (!success || !proyectoId) {
        triggerToast(error || "Error al crear");
        setIsSubmitting(false);
        return;
      }

      // Subir archivos
      const archivosOk = await subirArchivosAlProyecto(proyectoId);
      if (!archivosOk) {
        triggerToast("Proyecto creado, pero algunos archivos no se pudieron subir");
      }

      // Postular a concurso si se seleccionó uno
      if (formConcursoId) {
        const { error: errorPostulacion } = await postularProyecto(formConcursoId, proyectoId);
        if (errorPostulacion) {
          triggerToast(`Proyecto creado, pero no se pudo postular: ${errorPostulacion}`);
        } else {
          // Recargar concursos activos para actualizar contador
          cargarConcursosActivos();
        }
      }

      // Recargar proyectos
      await cargarProyectos();

      resetForm();
      setShowPublishModal(false);
      setShowSuccessOverlay(true);
    }

    setIsSubmitting(false);
  };

  // Eliminar proyecto
  const handleDeleteProject = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.")) {
      return;
    }

    const { success, error } = await eliminarProyecto(id);

    if (success) {
      triggerToast("Proyecto eliminado");
      if (currentTab === "detail") {
        handleChangeTab("feed");
      }
    } else {
      triggerToast(error || "Error al eliminar");
    }
  };

  // Cambiar estado del proyecto (en_progreso <-> completado)
  const handleToggleEstado = async (proyecto: ProyectoConStats) => {
    const nuevoEstado = proyecto.estado === 'completado' ? 'en_progreso' : 'completado';
    const { success, error } = await editarProyecto(proyecto.id, { estado: nuevoEstado });

    if (success) {
      triggerToast(nuevoEstado === 'completado' ? '¡Proyecto marcado como completado!' : 'Proyecto marcado en progreso');
    } else {
      triggerToast(error || 'Error al cambiar estado');
    }
  };

  // Abrir modal de postulación
  const handleOpenPostular = (proyecto: ProyectoConStats) => {
    setProyectoAPostular({ id: proyecto.id, titulo: proyecto.titulo });
    setShowPostularModal(true);
  };

  // Proyectos filtrados
  const proyectosFiltrados = filtrarPorCategoria(selectedCategory);
  const proyectoActivo = proyectos.find(p => p.id === selectedProjectId) || proyectos[0];

  // ============================================================
  // PANTALLA DE CARGA
  // ============================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e8f5f3] flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.gif"
            alt="PROMEC"
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-display font-black text-surface-900 tracking-tight mb-1">PROMEC</h1>
          <p className="text-on-surface-variant text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PANTALLA DE LOGIN
  // ============================================================
  if (!user) {
    return <LoginPage />;
  }

  // ============================================================
  // APP PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-mesh pb-24 lg:pb-12 text-surface-900 flex flex-col antialiased">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onChangeTab={handleChangeTab}
        currentUser={{
          id: user.id,
          name: profile?.nombre_completo || "Usuario",
          role: profile?.area || "General",
          avatar: profile?.avatar_url || "",
          bio: "",
          stats: { innovations: 0, collabs: 0, followers: 0 },
        }}
        onOpenPublishModal={() => {
          resetForm();
          setShowPublishModal(true);
        }}
        onVerProyecto={handleSelectProject}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-8 flex-grow w-full">
        {/* Barra de Avances (Stories) - Solo en feed, dentro del contenedor centrado */}
        {currentTab === "feed" && (
          <div className="mb-6 -mx-4 md:-mx-10 lg:mx-0 lg:rounded-2xl lg:overflow-hidden lg:border lg:border-surface-200 lg:shadow-soft">
            <BarraAvances
              key={avancesKey}
              userId={user.id}
              userAvatar={profile?.avatar_url}
              userName={profile?.nombre_completo}
              onCrearAvance={handleCrearAvance}
              onVerAvances={handleVerAvances}
            />
          </div>
        )}
        <AnimatePresence mode="wait">
          {/* ============================================================ */}
          {/* FEED VIEW */}
          {/* ============================================================ */}
          {currentTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col lg:flex-row gap-6"
            >
              {/* Sidebar - Solo en desktop */}
              <aside className="hidden lg:block lg:w-72 flex-shrink-0">
                <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-soft sticky top-24">
                  {/* Búsqueda */}
                  <div className="mb-6">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-xl">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar proyectos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input-modern pl-11 pr-10"
                      />
                      {busqueda && (
                        <button
                          onClick={() => setBusqueda("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-surface-800 text-sm uppercase tracking-wide">Categorías</h3>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                        !selectedCategory
                          ? "bg-gradient-primary text-white shadow-sm"
                          : "hover:bg-surface-100 text-surface-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">apps</span>
                      Todas las categorías
                      {!selectedCategory && (
                        <span className="material-symbols-outlined ml-auto text-lg">check</span>
                      )}
                    </button>

                    {[
                      { id: "proyecto", icon: "folder", label: "Proyectos", color: "violet" },
                      { id: "mejora", icon: "trending_up", label: "Mejoras", color: "emerald" },
                      { id: "innovacion", icon: "lightbulb", label: "Innovaciones", color: "amber" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                          selectedCategory === cat.id
                            ? "bg-gradient-primary text-white shadow-sm"
                            : "hover:bg-surface-100 text-surface-600"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${
                          selectedCategory !== cat.id ? (
                            cat.color === 'violet' ? 'text-violet-500' :
                            cat.color === 'emerald' ? 'text-emerald-500' :
                            'text-amber-500'
                          ) : ''
                        }`}>{cat.icon}</span>
                        {cat.label}
                        {selectedCategory === cat.id && (
                          <span className="material-symbols-outlined ml-auto text-lg">check</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Stats rápidos */}
                  <div className="mt-6 pt-6 border-t border-surface-100">
                    <h4 className="font-display font-bold text-surface-800 text-sm uppercase tracking-wide mb-4">Resumen</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-primary-600">{proyectos.length}</p>
                        <p className="text-xs text-surface-500">Total</p>
                      </div>
                      <div className="bg-surface-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {proyectos.filter(p => p.estado === 'completado').length}
                        </p>
                        <p className="text-xs text-surface-500">Completados</p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Indicadores móviles de filtro activo */}
              {(selectedCategory || busqueda) && (
                <div className="lg:hidden flex flex-wrap gap-2 mb-4">
                  {busqueda && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-xl border border-primary-200">
                      <span className="material-symbols-outlined text-lg">search</span>
                      "{busqueda}"
                      <button onClick={() => setBusqueda("")} className="ml-1 hover:bg-primary-100 rounded-lg p-0.5 transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary-50 text-secondary-700 text-sm font-medium rounded-xl border border-secondary-200">
                      <span className="material-symbols-outlined text-sm">filter_list</span>
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory(null)} className="ml-1 hover:bg-secondary/20 rounded-full p-0.5">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Feed */}
              <div className="flex-grow">
                {proyectosLoading && (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-on-surface-variant mt-2">Cargando proyectos...</p>
                  </div>
                )}

                {!proyectosLoading && proyectosFiltrados.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-[#eff4ff]">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
                      {busqueda ? "search_off" : "inbox"}
                    </span>
                    <h3 className="text-lg font-semibold text-on-surface mb-2">
                      {busqueda ? "Sin resultados" : "No hay proyectos aún"}
                    </h3>
                    <p className="text-on-surface-variant text-sm mb-4">
                      {busqueda ? `No encontramos proyectos con "${busqueda}"` : "¡Sé el primero en publicar!"}
                    </p>
                    {!busqueda && (
                      <button
                        onClick={() => setShowPublishModal(true)}
                        className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-sm"
                      >
                        Crear proyecto
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Banners de concursos activos */}
                  {concursosActivos.length > 0 && !busqueda && !selectedCategory && (
                    <div className="space-y-4 mb-6">
                      {concursosActivos.map((concurso) => (
                        <ConcursoBanner
                          key={concurso.id}
                          concurso={concurso}
                          onPostular={() => {
                            setConcursoParaPostular(concurso);
                            setShowSeleccionarProyectoModal(true);
                          }}
                          onVerDetalles={() => handleChangeTab("concursos")}
                        />
                      ))}
                    </div>
                  )}

                  {proyectosFiltrados.map((proyecto) => (
                    <ProyectoCard
                      key={proyecto.id}
                      proyecto={proyecto}
                      isOwner={proyecto.autor_id === user.id}
                      onSelect={() => handleSelectProject(proyecto.id)}
                      onLike={() => handleLikeWithToast(proyecto.id)}
                      onEdit={() => openEditModal(proyecto)}
                      onDelete={() => handleDeleteProject(proyecto.id)}
                      onToggleEstado={() => handleToggleEstado(proyecto)}
                      onPostular={() => handleOpenPostular(proyecto)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* DETAIL VIEW */}
          {/* ============================================================ */}
          {currentTab === "detail" && proyectoActivo && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-3xl mx-auto"
            >
              <button
                onClick={() => handleChangeTab("feed")}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 text-sm font-medium"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Volver al feed
              </button>

              <div className="bg-white rounded-2xl border border-[#eff4ff] shadow-sm overflow-hidden">
                {/* Portada - primera imagen */}
                <PortadaProyecto
                  archivos={proyectoActivo.archivos}
                  imagenLegacy={proyectoActivo.imagen_url}
                  titulo={proyectoActivo.titulo}
                />

                <div className="p-4 sm:p-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {proyectoActivo.categoria}
                    </span>
                    <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">
                      {proyectoActivo.tipo}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-on-surface-variant text-xs font-semibold rounded-full">
                      {proyectoActivo.area}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      proyectoActivo.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {proyectoActivo.estado === 'completado' ? 'Completado' : 'En progreso'}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">{proyectoActivo.titulo}</h1>
                  <p className="text-on-surface-variant leading-relaxed mb-6 whitespace-pre-wrap">
                    {proyectoActivo.descripcion}
                  </p>

                  {/* Galería de archivos */}
                  {proyectoActivo.archivos && proyectoActivo.archivos.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-[#eff4ff]">
                      <GaleriaArchivos archivos={proyectoActivo.archivos} modo="completo" />
                    </div>
                  )}

                  {/* Autor */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#eff4ff]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {proyectoActivo.autor_nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-sm">{proyectoActivo.autor_nombre}</p>
                        <p className="text-xs text-on-surface-variant">{proyectoActivo.autor_area}</p>
                      </div>
                    </div>

                    {/* Acciones del autor */}
                    {proyectoActivo.autor_id === user.id && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleOpenPostular(proyectoActivo)}
                          className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm text-amber-600 border border-amber-500 rounded-lg hover:bg-amber-50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">emoji_events</span>
                          Postular
                        </button>
                        <button
                          onClick={() => handleToggleEstado(proyectoActivo)}
                          className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm border rounded-lg flex items-center justify-center gap-1 ${
                            proyectoActivo.estado === 'completado'
                              ? 'text-yellow-600 border-yellow-500 hover:bg-yellow-50'
                              : 'text-green-600 border-green-500 hover:bg-green-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {proyectoActivo.estado === 'completado' ? 'refresh' : 'check_circle'}
                          </span>
                          {proyectoActivo.estado === 'completado' ? 'Reabrir' : 'Completar'}
                        </button>
                        <button
                          onClick={() => openEditModal(proyectoActivo)}
                          className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proyectoActivo.id)}
                          className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-6 py-4 border-b border-[#eff4ff]">
                    <button
                      onClick={() => handleLikeWithToast(proyectoActivo.id)}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                        proyectoActivo.usuario_dio_like ? "text-red-500" : "text-on-surface-variant hover:text-red-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {proyectoActivo.usuario_dio_like ? "favorite" : "favorite_border"}
                      </span>
                      {proyectoActivo.likes_count} likes
                    </button>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-xl">chat_bubble_outline</span>
                      {proyectoActivo.comentarios_count} comentarios
                    </div>
                  </div>

                  {/* Comentarios */}
                  <Comentarios
                    proyectoId={proyectoActivo.id}
                    onComentarioCreado={cargarProyectos}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* NOTIFICATIONS */}
          {/* ============================================================ */}
          {currentTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <NotificacionesPanel
                onVerConcurso={() => handleChangeTab("concursos")}
                onVerProyecto={handleSelectProject}
              />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* PROFILE */}
          {/* ============================================================ */}
          {currentTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-4 sm:p-8 border border-[#eff4ff] shadow-sm mb-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Avatar con imagen o inicial */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-[#eff4ff] flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.nombre_completo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                        {profile?.nombre_completo?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface truncate">{profile?.nombre_completo}</h1>
                    <p className="text-sm sm:text-base text-on-surface-variant">
                      {profile?.area} • {profile?.rol === "admin" ? "Administrador" : profile?.rol === "jurado" ? "Jurado" : "Usuario"}
                    </p>
                  </div>
                </div>

                {/* Accesos rápidos para Admin y Jurado (visible en móvil) */}
                {(profile?.rol === "admin" || profile?.rol === "jurado") && (
                  <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-2 gap-3 lg:hidden">
                    {profile.rol === "admin" && (
                      <button
                        onClick={() => handleChangeTab("admin")}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-sm"
                      >
                        <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Panel Admin</p>
                          <p className="text-[10px] text-white/80">Gestionar concursos</p>
                        </div>
                      </button>
                    )}
                    {(profile.rol === "admin" || profile.rol === "jurado") && (
                      <button
                        onClick={() => handleChangeTab("jurado")}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-sm"
                      >
                        <span className="material-symbols-outlined text-2xl">gavel</span>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Panel Jurado</p>
                          <p className="text-[10px] text-white/80">Evaluar proyectos</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h2 className="text-lg font-bold text-on-surface mb-4">Mis proyectos</h2>

              {proyectos.filter(p => p.autor_id === user.id).length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-[#eff4ff]">
                  <p className="text-on-surface-variant">Aún no has publicado proyectos</p>
                  <button onClick={() => setShowPublishModal(true)} className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold">
                    Crear mi primer proyecto
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {proyectos.filter(p => p.autor_id === user.id).map(proyecto => (
                    <ProyectoCard
                      key={proyecto.id}
                      proyecto={proyecto}
                      isOwner={true}
                      onSelect={() => handleSelectProject(proyecto.id)}
                      onLike={() => handleLikeWithToast(proyecto.id)}
                      onEdit={() => openEditModal(proyecto)}
                      onDelete={() => handleDeleteProject(proyecto.id)}
                      onToggleEstado={() => handleToggleEstado(proyecto)}
                      onPostular={() => handleOpenPostular(proyecto)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* ADMIN PANEL */}
          {/* ============================================================ */}
          {currentTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <AdminPanel />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* PANEL DEL JURADO */}
          {/* ============================================================ */}
          {currentTab === "jurado" && (
            <motion.div
              key="jurado"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <EvaluacionJurado />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* CONCURSOS (Vista pública) */}
          {/* ============================================================ */}
          {currentTab === "concursos" && (
            <motion.div
              key="concursos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ConcursosView onVerProyecto={handleSelectProject} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - Diseño moderno */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-surface-200 h-[72px] flex items-center justify-around z-50 px-4 pb-safe">
        <button
          onClick={() => handleChangeTab("feed")}
          className={`flex flex-col items-center gap-1 min-w-[56px] py-2 rounded-xl transition-all ${
            currentTab === "feed"
              ? "text-primary-600"
              : "text-surface-400 hover:text-surface-600"
          }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${currentTab === "feed" ? "scale-110" : ""} transition-transform`}>
            {currentTab === "feed" ? "home" : "home"}
          </span>
          <span className="text-[11px] font-semibold">Inicio</span>
        </button>

        <button
          onClick={() => setShowMobileSearch(true)}
          className={`flex flex-col items-center gap-1 min-w-[56px] py-2 rounded-xl transition-all ${
            showMobileSearch ? "text-primary-600" : "text-surface-400 hover:text-surface-600"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">search</span>
          <span className="text-[11px] font-semibold">Buscar</span>
        </button>

        {/* Botón central de publicar */}
        <button
          onClick={() => { resetForm(); setShowPublishModal(true); }}
          className="bg-gradient-primary text-white w-14 h-14 rounded-2xl -mt-6 shadow-glow-primary flex items-center justify-center border-4 border-white transition-transform hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>

        <button
          onClick={() => handleChangeTab("concursos")}
          className={`flex flex-col items-center gap-1 min-w-[56px] py-2 rounded-xl transition-all ${
            currentTab === "concursos" ? "text-primary-600" : "text-surface-400 hover:text-surface-600"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">emoji_events</span>
          <span className="text-[11px] font-semibold">Concursos</span>
        </button>

        <button
          onClick={() => handleChangeTab("profile")}
          className={`flex flex-col items-center gap-1 min-w-[56px] py-2 rounded-xl transition-all relative ${
            currentTab === "profile" || currentTab === "admin" || currentTab === "jurado"
              ? "text-primary-600"
              : "text-surface-400 hover:text-surface-600"
          }`}
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[24px]">person</span>
            {/* Badge para admin/jurado */}
            {(profile?.rol === "admin" || profile?.rol === "jurado") && (
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                profile.rol === "admin" ? "bg-purple-500" : "bg-amber-500"
              }`} />
            )}
          </div>
          <span className="text-[11px] font-semibold">Perfil</span>
        </button>
      </nav>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface mb-2">¡Proyecto publicado!</h2>
              <p className="text-sm text-on-surface-variant mb-6">Tu proyecto ha sido publicado exitosamente.</p>
              <button onClick={() => setShowSuccessOverlay(false)} className="w-full py-3 bg-primary text-white rounded-xl font-semibold">Continuar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Nuevo/Editar Proyecto - Diseño moderno */}
      <AnimatePresence>
        {(showPublishModal || showEditModal) && (
          <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-soft-lg p-6 sm:p-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            >
              {/* Header con icono */}
              <div className="flex items-start gap-4 pb-6 border-b border-surface-100">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-2xl">
                    {editingProjectId ? "edit" : "add_circle"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl font-bold text-surface-900">
                    {editingProjectId ? "Editar Proyecto" : "Nueva Publicación"}
                  </h3>
                  <p className="text-sm text-surface-500 mt-0.5">
                    {editingProjectId ? "Actualiza los detalles de tu proyecto" : "Comparte tu idea con el equipo"}
                  </p>
                </div>
                <button
                  onClick={() => { setShowPublishModal(false); setShowEditModal(false); resetForm(); }}
                  className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-xl text-surface-400">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmitProyecto} className="space-y-5 pt-6">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">Título *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mejora en proceso de costura"
                    className="input-modern"
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">Descripción *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe tu proyecto o mejora en detalle..."
                    className="input-modern resize-none"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">Categoría</label>
                    <div className="relative">
                      <select
                        className="input-modern appearance-none cursor-pointer pr-10"
                        value={formCategoria}
                        onChange={(e) => setFormCategoria(e.target.value as any)}
                      >
                        <option value="mejora">Mejora</option>
                        <option value="proyecto">Proyecto</option>
                        <option value="innovacion">Innovación</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">Tipo</label>
                    <div className="relative">
                      <select
                        className="input-modern appearance-none cursor-pointer pr-10"
                        value={formTipo}
                        onChange={(e) => setFormTipo(e.target.value as any)}
                      >
                        <option value="produccion">Producción</option>
                        <option value="calidad">Calidad</option>
                        <option value="seguridad">Seguridad</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">Área</label>
                  <div className="relative">
                    <select
                      className="input-modern appearance-none cursor-pointer pr-10"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                    >
                      {AREAS_EJEMPLO.map((area) => (<option key={area} value={area}>{area}</option>))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Subida de archivos */}
                <FileUploader
                  archivosExistentes={archivosExistentes}
                  archivosNuevos={archivosNuevos}
                  onArchivosNuevosChange={setArchivosNuevos}
                  onEliminarExistente={editingProjectId ? handleEliminarArchivoExistente : undefined}
                  disabled={isSubmitting}
                />

                {/* Postular a concurso (solo al crear, no al editar) */}
                {!editingProjectId && concursosActivos.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-amber-600">emoji_events</span>
                      <label className="text-sm font-semibold text-amber-800">
                        Postular a concurso (opcional)
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        className="input-modern appearance-none cursor-pointer pr-10 bg-white"
                        value={formConcursoId}
                        onChange={(e) => setFormConcursoId(e.target.value)}
                      >
                        <option value="">No postular a ningún concurso</option>
                        {concursosActivos.map((concurso) => (
                          <option key={concurso.id} value={concurso.id}>
                            {concurso.nombre}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                        expand_more
                      </span>
                    </div>
                    {formConcursoId && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Tu proyecto será postulado automáticamente al publicarlo
                      </p>
                    )}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-6 border-t border-surface-100">
                  <button
                    type="button"
                    onClick={() => { setShowPublishModal(false); setShowEditModal(false); resetForm(); }}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                        {editingProjectId ? "Guardando..." : "Publicando..."}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">
                          {editingProjectId ? "save" : "publish"}
                        </span>
                        {editingProjectId ? "Guardar cambios" : "Publicar"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast - Diseño moderno */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 left-4 sm:left-auto sm:max-w-sm bg-surface-900 text-white px-5 py-4 rounded-2xl shadow-soft-lg z-[120] flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-400 text-lg">check_circle</span>
            </div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Overlay - Diseño moderno */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-surface-50 z-[60] flex flex-col"
          >
            {/* Header del buscador */}
            <div className="flex items-center gap-3 p-4 bg-white border-b border-surface-200">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-surface-600 text-xl">arrow_back</span>
              </button>
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar proyectos, mejoras..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  autoFocus
                  className="input-modern pl-11 pr-11"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Resultados o sugerencias */}
            <div className="flex-1 overflow-y-auto p-4">
              {busqueda ? (
                <>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {proyectosFiltrados.length} resultado{proyectosFiltrados.length !== 1 ? 's' : ''} para "{busqueda}"
                  </p>
                  <div className="space-y-3">
                    {proyectosFiltrados.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleSelectProject(p.id);
                          setShowMobileSearch(false);
                        }}
                        className="w-full text-left p-3 bg-[#f8f9ff] rounded-xl hover:bg-primary/10 transition-colors"
                      >
                        <p className="font-medium text-on-surface">{p.titulo}</p>
                        <p className="text-sm text-on-surface-variant line-clamp-1">{p.descripcion}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{p.categoria}</span>
                          <span className="text-xs text-on-surface-variant">{p.autor_nombre}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">search</span>
                  <p className="text-on-surface-variant">Escribe para buscar proyectos</p>
                </div>
              )}
            </div>

            {/* Botón buscar */}
            {busqueda && (
              <div className="p-4 border-t border-[#eff4ff]">
                <button
                  onClick={() => setShowMobileSearch(false)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold"
                >
                  Ver {proyectosFiltrados.length} resultado{proyectosFiltrados.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filters Panel (Bottom Sheet) */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-[60]"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[61] max-h-[70vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-[#eff4ff]">
                <h3 className="font-bold text-lg text-on-surface">Filtrar por categoría</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              {/* Categorías */}
              <div className="p-5 space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowMobileFilters(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${
                    !selectedCategory ? "bg-primary text-white" : "bg-[#f8f9ff] text-on-surface-variant hover:bg-primary/10"
                  }`}
                >
                  <span className="material-symbols-outlined">apps</span>
                  Todas las categorías
                  {!selectedCategory && <span className="material-symbols-outlined ml-auto">check</span>}
                </button>

                {[
                  { id: "proyecto", icon: "folder", label: "Proyectos", desc: "Iniciativas grandes" },
                  { id: "mejora", icon: "trending_up", label: "Mejoras", desc: "Optimizaciones de procesos" },
                  { id: "innovacion", icon: "lightbulb", label: "Innovaciones", desc: "Ideas creativas" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${
                      selectedCategory === cat.id ? "bg-primary text-white" : "bg-[#f8f9ff] text-on-surface-variant hover:bg-primary/10"
                    }`}
                  >
                    <span className="material-symbols-outlined">{cat.icon}</span>
                    <div className="flex-1">
                      <p>{cat.label}</p>
                      <p className={`text-xs ${selectedCategory === cat.id ? "text-white/70" : "text-on-surface-variant"}`}>{cat.desc}</p>
                    </div>
                    {selectedCategory === cat.id && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))}
              </div>

              {/* Espacio para el bottom nav */}
              <div className="h-20" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Postulación */}
      {proyectoAPostular && (
        <PostularModal
          isOpen={showPostularModal}
          onClose={() => {
            setShowPostularModal(false);
            setProyectoAPostular(null);
          }}
          proyectoId={proyectoAPostular.id}
          proyectoTitulo={proyectoAPostular.titulo}
        />
      )}

      {/* Modal de Seleccionar Proyecto para Postular (desde banner de concurso) */}
      {concursoParaPostular && (
        <SeleccionarProyectoModal
          isOpen={showSeleccionarProyectoModal}
          onClose={() => {
            setShowSeleccionarProyectoModal(false);
            setConcursoParaPostular(null);
          }}
          concurso={concursoParaPostular}
          proyectos={proyectos}
          onPostulacionExitosa={() => {
            cargarConcursosActivos();
            triggerToast("¡Proyecto postulado al concurso!");
          }}
          onCrearProyecto={() => {
            const concursoId = concursoParaPostular!.id;
            setShowSeleccionarProyectoModal(false);
            setConcursoParaPostular(null);
            resetForm();
            setFormConcursoId(concursoId);
            setShowPublishModal(true);
          }}
        />
      )}

      {/* Modal de Crear Avance (Story) */}
      <CrearAvanceModal
        isOpen={showCrearAvanceModal}
        onClose={() => setShowCrearAvanceModal(false)}
        userId={user.id}
        onAvanceCreado={handleAvanceCreado}
      />

      {/* Visor de Avances */}
      {showVisorAvance && avancesParaVer.length > 0 && (
        <VisorAvance
          avances={avancesParaVer}
          userId={user.id}
          onClose={() => {
            setShowVisorAvance(false);
            setAvancesParaVer([]);
            setAvancesKey(prev => prev + 1); // Refrescar para actualizar vistas
          }}
          onVerProyecto={handleSelectProject}
          onAvanceEliminado={handleAvanceEliminado}
        />
      )}
    </div>
  );
}

// ============================================================
// Componente ProyectoCard - Diseño moderno con micro-interacciones
// ============================================================
function ProyectoCard({
  proyecto,
  isOwner,
  onSelect,
  onLike,
  onEdit,
  onDelete,
  onToggleEstado,
  onPostular,
}: {
  proyecto: ProyectoConStats;
  isOwner: boolean;
  onSelect: () => void;
  onLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEstado: () => void;
  onPostular: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Obtener primera imagen para portada
  const imagenes = proyecto.archivos?.filter(a => a.tipo === 'imagen') || [];
  const documentos = proyecto.archivos?.filter(a => a.tipo === 'documento') || [];
  const primeraImagen = imagenes[0]?.url || proyecto.imagen_url;

  // Mapeo de colores por categoría
  const getCategoriaClass = (cat: string) => {
    switch (cat) {
      case 'proyecto': return 'tag-proyecto';
      case 'mejora': return 'tag-mejora';
      case 'innovacion': return 'tag-innovacion';
      default: return 'tag-area';
    }
  };

  const getTipoClass = (tipo: string) => {
    switch (tipo) {
      case 'produccion': return 'tag-produccion';
      case 'calidad': return 'tag-calidad';
      case 'seguridad': return 'tag-seguridad';
      default: return 'tag-area';
    }
  };

  const handleLike = async () => {
    setIsLiking(true);
    await onLike();
    setTimeout(() => setIsLiking(false), 300);
  };

  return (
    <div className="group bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden hover:shadow-soft-lg hover:border-surface-300 hover:-translate-y-1 transition-all duration-300">
      {/* Portada */}
      {primeraImagen ? (
        <div className="relative overflow-hidden">
          <img
            src={primeraImagen}
            alt={proyecto.titulo}
            className="w-full h-48 object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
            onClick={onSelect}
          />
          {/* Overlay con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Indicador de más imágenes */}
          {imagenes.length > 1 && (
            <div className="absolute bottom-3 right-3 glass-dark text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">photo_library</span>
              +{imagenes.length - 1}
            </div>
          )}

          {/* Indicador de documentos */}
          {documentos.length > 0 && (
            <div className="absolute bottom-3 left-3 glass-dark text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">description</span>
              {documentos.length}
            </div>
          )}
        </div>
      ) : (
        // Placeholder cuando no hay imagen
        <div
          className="w-full h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center cursor-pointer"
          onClick={onSelect}
        >
          <span className="material-symbols-outlined text-5xl text-primary-300">
            {proyecto.categoria === 'proyecto' ? 'folder' : proyecto.categoria === 'mejora' ? 'trending_up' : 'lightbulb'}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Tags y menú */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-1.5">
            <span className={`tag ${getCategoriaClass(proyecto.categoria)}`}>
              {proyecto.categoria}
            </span>
            <span className={`tag ${getTipoClass(proyecto.tipo)}`}>
              {proyecto.tipo}
            </span>
            {/* Área del proyecto - más visible */}
            <span className="tag tag-area inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">apartment</span>
              {proyecto.area}
            </span>
            <span className={`tag ${proyecto.estado === 'completado' ? 'tag-completado' : 'tag-en-progreso'}`}>
              {proyecto.estado === 'completado' ? 'Completado' : 'En progreso'}
            </span>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-surface-400 text-xl">more_vert</span>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-soft-lg border border-surface-200 py-1.5 w-48 z-50 animate-scale-in origin-top-right">
                    <button
                      onClick={() => { setShowMenu(false); onToggleEstado(); }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        proyecto.estado === 'completado'
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {proyecto.estado === 'completado' ? 'refresh' : 'check_circle'}
                      </span>
                      {proyecto.estado === 'completado' ? 'Reabrir proyecto' : 'Marcar completado'}
                    </button>
                    <div className="border-t border-surface-100 my-1" />
                    <button
                      onClick={() => { setShowMenu(false); onEdit(); }}
                      className="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-surface-400">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onDelete(); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Título */}
        <h3
          onClick={onSelect}
          className="font-display text-lg font-bold text-surface-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors line-clamp-2"
        >
          {proyecto.titulo}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-surface-500 line-clamp-2 mb-4 leading-relaxed">
          {proyecto.descripcion}
        </p>

        {/* Autor con avatar real y área destacada */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-surface-100">
          {/* Avatar - mostrar imagen real si existe */}
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-surface-100 flex-shrink-0">
            {proyecto.autor_avatar ? (
              <img
                src={proyecto.autor_avatar}
                alt={proyecto.autor_nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                {proyecto.autor_nombre?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-800 truncate">{proyecto.autor_nombre}</p>
            {/* Área con badge colorido */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-50 text-secondary-700 text-xs font-medium rounded-md mt-1">
              <span className="material-symbols-outlined text-xs">apartment</span>
              {proyecto.autor_area}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              proyecto.usuario_dio_like
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-surface-500 hover:bg-surface-100 hover:text-red-500"
            } ${isLiking ? 'scale-110' : ''}`}
          >
            <span className={`material-symbols-outlined text-xl transition-transform ${isLiking ? 'scale-125' : ''}`}>
              {proyecto.usuario_dio_like ? "favorite" : "favorite_border"}
            </span>
            {proyecto.likes_count}
          </button>

          <button
            onClick={onSelect}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-surface-500 hover:bg-surface-100 hover:text-primary-600 transition-all"
          >
            <span className="material-symbols-outlined text-xl">chat_bubble_outline</span>
            {proyecto.comentarios_count}
          </button>

          {/* Botón Postular - solo para el propietario */}
          {isOwner && (
            <button
              onClick={onPostular}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-all"
              title="Postular a concurso"
            >
              <span className="material-symbols-outlined text-lg">emoji_events</span>
              Postular
            </button>
          )}

          <button
            onClick={onSelect}
            className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-all"
          >
            Ver más
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
