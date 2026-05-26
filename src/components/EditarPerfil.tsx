/**
 * EditarPerfil - Modal para editar datos del usuario
 */

import { useState, useRef, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Profile, AREAS_EJEMPLO } from '../types';
import { subirAvatar } from '../lib/storage';
import { actualizarPerfil } from '../lib/database';
import { useAuth } from '../context/AuthContext';

interface EditarPerfilProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditarPerfil({ isOpen, onClose }: EditarPerfilProps) {
  const { user, profile, refreshProfile } = useAuth();

  // Estados del formulario
  const [nombre, setNombre] = useState(profile?.nombre_completo || '');
  const [area, setArea] = useState(profile?.area || 'Producción');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetear formulario cuando se abre
  const resetForm = () => {
    setNombre(profile?.nombre_completo || '');
    setArea(profile?.area || 'Producción');
    setAvatarPreview(null);
    setAvatarFile(null);
    setError(null);
    setSuccess(false);
  };

  // Manejar selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Usa una imagen JPG, PNG, GIF o WebP.');
      return;
    }

    // Validar tamaño
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 2MB.');
      return;
    }

    setError(null);
    setAvatarFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Enviar formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let newAvatarUrl = profile.avatar_url;

      // Si hay nueva imagen, subirla
      if (avatarFile) {
        const { url, error: uploadError } = await subirAvatar(avatarFile, user.id);
        if (uploadError) {
          setError(uploadError);
          setLoading(false);
          return;
        }
        newAvatarUrl = url;
      }

      // Actualizar perfil en BD
      const cambios: Partial<Profile> = {
        nombre_completo: nombre.trim(),
        area,
      };

      if (newAvatarUrl !== profile.avatar_url) {
        cambios.avatar_url = newAvatarUrl;
      }

      const { error: updateError } = await actualizarPerfil(user.id, cambios);

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Refrescar perfil en el contexto
      await refreshProfile();

      setSuccess(true);
      setAvatarFile(null);
      setAvatarPreview(null);

      // Cerrar después de un momento
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);

    } catch (err) {
      setError('Error inesperado al guardar');
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  const avatarActual = avatarPreview || profile?.avatar_url;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#eff4ff]">
          <h2 className="text-lg font-bold text-primary">Editar perfil</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="material-symbols-outlined text-xl text-on-surface-variant hover:text-on-surface disabled:opacity-50"
          >
            close
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary-100 bg-gray-100 shadow-lg">
                {avatarActual ? (
                  <img
                    src={avatarActual}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                    {nombre.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Botón cambiar foto - siempre visible */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 border-2 border-white"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">photo_camera</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Botón cambiar foto */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              Cambiar foto
            </button>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              placeholder="Tu nombre completo"
              className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Área */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Área de trabajo
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              disabled={loading}
              className="w-full p-3 border border-[#cfd2d9] rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50"
            >
              {AREAS_EJEMPLO.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Éxito */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Perfil actualizado correctamente
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 border border-[#cfd2d9] text-on-surface-variant rounded-xl font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-[#1e0fa3] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
