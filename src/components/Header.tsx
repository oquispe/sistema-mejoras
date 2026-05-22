/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User } from "../types";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  currentUser: User;
  onOpenPublishModal: () => void;
}

export default function Header({ currentTab, onChangeTab, currentUser: _currentUser, onOpenPublishModal }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white border-b border-[#eff4ff] shadow-sm sticky top-0 z-50 h-16 flex items-center glass-header">
      <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-full">
        {/* Logo */}
        <div
          onClick={() => onChangeTab("feed")}
          className="font-bold text-2xl text-primary cursor-pointer tracking-tight hover:opacity-95 transition-opacity select-none"
          id="logo-innovatehub"
        >
          Mejora Continua
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 h-full">
          <button
            onClick={() => onChangeTab("feed")}
            className={`font-medium text-[15px] h-full flex items-center border-b-2 transition-colors duration-200 ${
              currentTab === "feed"
                ? "text-primary border-primary font-semibold"
                : "text-on-surface-variant border-transparent hover:text-primary"
            }`}
            id="nav-home"
          >
            Inicio
          </button>
          <button
            onClick={() => onChangeTab("detail")}
            className={`font-medium text-[15px] h-full flex items-center border-b-2 transition-colors duration-200 ${
              currentTab === "detail"
                ? "text-primary border-primary font-semibold"
                : "text-on-surface-variant border-transparent hover:text-primary"
            }`}
            id="nav-discover"
          >
            Explorar
          </button>
          <button
            onClick={() => onChangeTab("notifications")}
            className={`font-medium text-[15px] h-full flex items-center border-b-2 transition-colors duration-200 ${
              currentTab === "notifications"
                ? "text-primary border-primary font-semibold"
                : "text-on-surface-variant border-transparent hover:text-primary"
            }`}
            id="nav-notifications"
          >
            Alertas
          </button>
        </nav>

        {/* Right Section Actions */}
        <div className="flex items-center gap-4">
          {/* Publish Trigger */}
          <button
            onClick={onOpenPublishModal}
            className="flex items-center px-6 py-2 bg-secondary text-white hover:bg-[#005049] active:scale-95 text-sm font-semibold rounded-full shadow-sm transition-all duration-200"
            id="btn-publish-header"
          >
            Publicar
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 cursor-pointer select-none"
              id="avatar-header"
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                  currentTab === "profile" ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
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
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {profile?.nombre_completo?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {/* Nombre (solo desktop) */}
              <span className="hidden lg:block text-sm font-medium text-on-surface max-w-[120px] truncate">
                {profile?.nombre_completo || 'Usuario'}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-lg hidden lg:block">
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
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-[#eff4ff] py-2 w-56 z-50">
                  {/* Info del usuario */}
                  <div className="px-4 py-3 border-b border-[#eff4ff]">
                    <p className="font-semibold text-on-surface text-sm truncate">
                      {profile?.nombre_completo}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {profile?.area} • {profile?.rol === 'jurado' ? 'Jurado' : 'Usuario'}
                    </p>
                  </div>

                  {/* Opciones */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onChangeTab("profile");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-[#f8f9ff] flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">
                      person
                    </span>
                    Mi perfil
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onChangeTab("notifications");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-[#f8f9ff] flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">
                      notifications
                    </span>
                    Mis alertas
                  </button>

                  <div className="border-t border-[#eff4ff] my-1" />

                  {/* Cerrar sesión */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
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
    </header>
  );
}
