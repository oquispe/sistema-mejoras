/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { ProyectoConStats, AREAS_EJEMPLO } from "./types";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import Comentarios from "./components/Comentarios";
import ImageUploader from "./components/ImageUploader";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./context/AuthContext";
import { useProyectos } from "./hooks/useProyectos";

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

  // Formulario de nuevo proyecto
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formCategoria, setFormCategoria] = useState<"proyecto" | "mejora" | "innovacion">("mejora");
  const [formArea, setFormArea] = useState(profile?.area || "Producción");
  const [formTipo, setFormTipo] = useState<"produccion" | "calidad" | "seguridad">("produccion");
  const [formImagenUrl, setFormImagenUrl] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Actualizar área cuando cargue el perfil
  useEffect(() => {
    if (profile?.area) {
      setFormArea(profile.area);
    }
  }, [profile?.area]);

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
    setFormImagenUrl("");
    setEditingProjectId(null);
  };

  // Abrir modal de edición
  const openEditModal = (proyecto: ProyectoConStats) => {
    setFormTitulo(proyecto.titulo);
    setFormDescripcion(proyecto.descripcion);
    setFormCategoria(proyecto.categoria);
    setFormArea(proyecto.area);
    setFormTipo(proyecto.tipo);
    setFormImagenUrl(proyecto.imagen_url || "");
    setEditingProjectId(proyecto.id);
    setShowEditModal(true);
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
      // Editar
      const { success, error } = await editarProyecto(editingProjectId, {
        titulo: formTitulo,
        descripcion: formDescripcion,
        categoria: formCategoria,
        area: formArea,
        tipo: formTipo,
        imagen_url: formImagenUrl || null,
      });

      if (success) {
        resetForm();
        setShowEditModal(false);
        triggerToast("Proyecto actualizado");
      } else {
        triggerToast(error || "Error al actualizar");
      }
    } else {
      // Crear
      const { success, error } = await crearProyecto({
        titulo: formTitulo,
        descripcion: formDescripcion,
        categoria: formCategoria,
        area: formArea,
        tipo: formTipo,
        imagen_url: formImagenUrl || undefined,
      });

      if (success) {
        resetForm();
        setShowPublishModal(false);
        setShowSuccessOverlay(true);
      } else {
        triggerToast(error || "Error al crear");
      }
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
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="material-symbols-outlined text-white text-3xl">lightbulb</span>
          </div>
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-on-surface flex flex-col antialiased">
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
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-8 flex-grow w-full">
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
              {/* Sidebar */}
              <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl p-5 border border-[#eff4ff] shadow-sm sticky top-24">
                  {/* Búsqueda */}
                  <div className="mb-4">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar proyectos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-[#cfd2d9] rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                      {busqueda && (
                        <button
                          onClick={() => setBusqueda("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-on-surface mb-3 text-sm">Categorías</h3>

                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl mb-2 text-sm font-medium transition-colors ${
                      !selectedCategory ? "bg-primary text-white" : "hover:bg-[#f8f9ff] text-on-surface-variant"
                    }`}
                  >
                    Todas
                  </button>

                  {[
                    { id: "proyecto", icon: "folder", label: "Proyectos" },
                    { id: "mejora", icon: "trending_up", label: "Mejoras" },
                    { id: "innovacion", icon: "lightbulb", label: "Innovaciones" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl mb-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedCategory === cat.id ? "bg-primary text-white" : "hover:bg-[#f8f9ff] text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </aside>

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
                  {proyectosFiltrados.map((proyecto) => (
                    <ProyectoCard
                      key={proyecto.id}
                      proyecto={proyecto}
                      isOwner={proyecto.autor_id === user.id}
                      onSelect={() => handleSelectProject(proyecto.id)}
                      onLike={() => handleLikeWithToast(proyecto.id)}
                      onEdit={() => openEditModal(proyecto)}
                      onDelete={() => handleDeleteProject(proyecto.id)}
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
                {proyectoActivo.imagen_url && (
                  <img src={proyectoActivo.imagen_url} alt={proyectoActivo.titulo} className="w-full h-64 object-cover" />
                )}

                <div className="p-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
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

                  <h1 className="text-2xl font-bold text-on-surface mb-2">{proyectoActivo.titulo}</h1>
                  <p className="text-on-surface-variant leading-relaxed mb-6 whitespace-pre-wrap">
                    {proyectoActivo.descripcion}
                  </p>

                  {/* Autor */}
                  <div className="flex items-center justify-between pb-6 border-b border-[#eff4ff]">
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(proyectoActivo)}
                          className="px-3 py-1.5 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proyectoActivo.id)}
                          className="px-3 py-1.5 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50 flex items-center gap-1"
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
            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-[#eff4ff] shadow-sm">
              <h2 className="text-xl font-bold text-primary border-b border-[#eff4ff] pb-4 mb-6">Notificaciones</h2>
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-3">notifications_none</span>
                <p>No tienes notificaciones nuevas</p>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* PROFILE */}
          {/* ============================================================ */}
          {currentTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-8 border border-[#eff4ff] shadow-sm mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.nombre_completo?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-on-surface">{profile?.nombre_completo}</h1>
                    <p className="text-on-surface-variant">{profile?.area} • {profile?.rol === "jurado" ? "Jurado" : "Usuario"}</p>
                  </div>
                </div>
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
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eff4ff] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] h-16 flex items-center justify-around z-50">
        <button onClick={() => handleChangeTab("feed")} className={`flex flex-col items-center gap-1 ${currentTab === "feed" ? "text-primary" : "text-on-surface-variant"}`}>
          <span className="material-symbols-outlined text-[22px]">home</span>
          <span className="text-[10px] font-semibold">Inicio</span>
        </button>
        <button onClick={() => { resetForm(); setShowPublishModal(true); }} className="bg-primary text-white w-12 h-12 rounded-full -mt-6 shadow-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
        <button onClick={() => handleChangeTab("profile")} className={`flex flex-col items-center gap-1 ${currentTab === "profile" ? "text-primary" : "text-on-surface-variant"}`}>
          <span className="material-symbols-outlined text-[22px]">person</span>
          <span className="text-[10px] font-semibold">Perfil</span>
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

      {/* Modal de Nuevo/Editar Proyecto */}
      <AnimatePresence>
        {(showPublishModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-[#eff4ff]">
                <h3 className="text-lg font-bold text-primary">
                  {editingProjectId ? "Editar Proyecto" : "Nueva Publicación"}
                </h3>
                <button onClick={() => { setShowPublishModal(false); setShowEditModal(false); resetForm(); }} className="material-symbols-outlined text-xl text-on-surface-variant hover:text-on-surface">close</button>
              </div>

              <form onSubmit={handleSubmitProyecto} className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Título *</label>
                  <input type="text" required placeholder="Ej: Mejora en proceso de costura" className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm" value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Descripción *</label>
                  <textarea required rows={4} placeholder="Describe tu proyecto o mejora..." className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm resize-none" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">Categoría</label>
                    <select className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm" value={formCategoria} onChange={(e) => setFormCategoria(e.target.value as any)}>
                      <option value="mejora">Mejora</option>
                      <option value="proyecto">Proyecto</option>
                      <option value="innovacion">Innovación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">Tipo</label>
                    <select className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm" value={formTipo} onChange={(e) => setFormTipo(e.target.value as any)}>
                      <option value="produccion">Producción</option>
                      <option value="calidad">Calidad</option>
                      <option value="seguridad">Seguridad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Área</label>
                  <select className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm" value={formArea} onChange={(e) => setFormArea(e.target.value)}>
                    {AREAS_EJEMPLO.map((area) => (<option key={area} value={area}>{area}</option>))}
                  </select>
                </div>

                {/* Subida de imagen */}
                <ImageUploader
                  currentImage={formImagenUrl}
                  onImageUploaded={(url) => setFormImagenUrl(url)}
                />

                <div className="flex gap-3 pt-4 border-t border-[#eff4ff]">
                  <button type="button" onClick={() => { setShowPublishModal(false); setShowEditModal(false); resetForm(); }} className="flex-1 py-3 border border-[#cfd2d9] text-on-surface-variant rounded-xl font-semibold text-sm">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-secondary text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? (<><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>{editingProjectId ? "Guardando..." : "Publicando..."}</>) : (editingProjectId ? "Guardar cambios" : "Publicar")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 right-4 bg-on-surface text-white px-5 py-3 rounded-xl shadow-xl z-[120] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#89f5e7]">info</span>
            <span className="text-sm">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Componente ProyectoCard
// ============================================================
function ProyectoCard({
  proyecto,
  isOwner,
  onSelect,
  onLike,
  onEdit,
  onDelete,
}: {
  proyecto: ProyectoConStats;
  isOwner: boolean;
  onSelect: () => void;
  onLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#eff4ff] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {proyecto.imagen_url && (
        <img src={proyecto.imagen_url} alt={proyecto.titulo} className="w-full h-48 object-cover cursor-pointer" onClick={onSelect} />
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{proyecto.categoria}</span>
            <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">{proyecto.tipo}</span>
          </div>

          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-[#eff4ff] py-1 w-36 z-50">
                    <button onClick={() => { setShowMenu(false); onEdit(); }} className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8f9ff] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">edit</span>Editar
                    </button>
                    <button onClick={() => { setShowMenu(false); onDelete(); }} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">delete</span>Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <h3 onClick={onSelect} className="text-lg font-bold text-on-surface mb-2 cursor-pointer hover:text-primary transition-colors">{proyecto.titulo}</h3>
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{proyecto.descripcion}</p>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {proyecto.autor_nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface">{proyecto.autor_nombre}</p>
            <p className="text-xs text-on-surface-variant">{proyecto.autor_area}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-[#eff4ff]">
          <button onClick={onLike} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${proyecto.usuario_dio_like ? "text-red-500" : "text-on-surface-variant hover:text-red-500"}`}>
            <span className="material-symbols-outlined text-lg">{proyecto.usuario_dio_like ? "favorite" : "favorite_border"}</span>
            {proyecto.likes_count}
          </button>
          <button onClick={onSelect} className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
            {proyecto.comentarios_count}
          </button>
        </div>
      </div>
    </div>
  );
}
