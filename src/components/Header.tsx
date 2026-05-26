/**
 * Header - Barra de navegación moderna
 */

import { useState } from "react";
import { User } from "../types";
import { useAuth } from "../context/AuthContext";
import EditarPerfil from "./EditarPerfil";
import Notificaciones from "./Notificaciones";

interface HeaderProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  currentUser: User;
  onOpenPublishModal: () => void;
  onVerProyecto?: (proyectoId: string) => void;
}

export default function Header({ currentTab, onChangeTab, currentUser: _currentUser, onOpenPublishModal, onVerProyecto }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-surface-200 sticky top-0 z-50 h-16 flex items-center">
      <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-7xl mx-auto h-full">
        {/* Logo PROMEC */}
        <div
          onClick={() => onChangeTab("feed")}
          className="flex items-center gap-2 cursor-pointer group"
          id="logo-promec"
        >
          <img
            src="/logo.gif"
            alt="PROMEC"
            className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300"
          />
          <span className="hidden sm:block font-display font-black text-lg text-surface-900 group-hover:text-primary-600 transition-colors tracking-tight">
            PROMEC
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          {[
            { id: "feed", icon: "home", label: "Inicio" },
            { id: "concursos", icon: "emoji_events", label: "Concursos" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative px-4 h-full flex items-center gap-2 font-medium text-sm transition-colors ${
                currentTab === item.id
                  ? "text-primary-600"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
              {currentTab === item.id && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-primary rounded-full" />
              )}
            </button>
          ))}

          {/* Panel Jurado - Para jurados y admin */}
          {(profile?.rol === 'jurado' || profile?.rol === 'admin') && (
            <button
              onClick={() => onChangeTab("jurado")}
              className={`relative px-4 h-full flex items-center gap-2 font-medium text-sm transition-colors ${
                currentTab === "jurado"
                  ? "text-primary-600"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              <span className="material-symbols-outlined text-xl">gavel</span>
              Jurado
              {currentTab === "jurado" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-primary rounded-full" />
              )}
            </button>
          )}

          {/* Admin Panel - Solo para administradores */}
          {profile?.rol === 'admin' && (
            <button
              onClick={() => onChangeTab("admin")}
              className={`relative px-4 h-full flex items-center gap-2 font-medium text-sm transition-colors ${
                currentTab === "admin"
                  ? "text-primary-600"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              Admin
              {currentTab === "admin" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-primary rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Right Section Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Publish Trigger - Solo en desktop */}
          <button
            onClick={onOpenPublishModal}
            className="hidden sm:flex btn-primary py-2 px-5 text-sm"
            id="btn-publish-header"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Publicar
          </button>

          {/* Notificaciones */}
          <Notificaciones onVerProyecto={onVerProyecto} />

          {/* User Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 transition-colors"
              id="avatar-header"
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl overflow-hidden transition-all duration-200 ${
                  currentTab === "profile"
                    ? "ring-2 ring-primary-500 ring-offset-2"
                    : "ring-1 ring-surface-200"
                }`}
                title="Menú de usuario"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.nombre_completo}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {profile?.nombre_completo?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {/* Nombre (solo desktop) */}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-surface-800 max-w-[100px] truncate">
                  {profile?.nombre_completo?.split(' ')[0] || 'Usuario'}
                </p>
                <p className="text-xs text-surface-500">{profile?.area}</p>
              </div>
              <span className="material-symbols-outlined text-surface-400 text-lg hidden lg:block">
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Overlay para cerrar el menú */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Menú */}
                <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-soft-lg border border-surface-200 py-2 w-64 z-50 animate-scale-in origin-top-right">
                  {/* Info del usuario */}
                  <div className="px-4 py-3 border-b border-surface-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-surface-200">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                            {profile?.nombre_completo?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-surface-900 text-sm truncate">
                          {profile?.nombre_completo}
                        </p>
                        <p className="text-xs text-surface-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">business</span>
                          {profile?.area}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onChangeTab("profile");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-3 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-surface-400">
                        person
                      </span>
                      Mi perfil
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowEditProfile(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-3 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-surface-400">
                        edit
                      </span>
                      Editar perfil
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onChangeTab("notifications");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-3 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-surface-400">
                        notifications
                      </span>
                      Mis notificaciones
                    </button>
                  </div>

                  <div className="border-t border-surface-100 my-1" />

                  {/* Cerrar sesión */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      logout
                    </span>
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Editar Perfil */}
      <EditarPerfil
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </header>
  );
}
