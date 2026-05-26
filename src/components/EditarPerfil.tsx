/**
 * EditarPerfil - Modal para editar datos del usuario
 */

import { useState, useRef, FormEvent } from 'react';
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
    // OVERLAY: fixed, cubre toda la pantalla, centra el contenido
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
      onClick={handleClose}
    >
      {/* MODAL: caja blanca centrada */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2510b4', margin: 0 }}>
            Editar perfil
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="material-symbols-outlined"
            style={{ fontSize: '1.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            close
          </button>
        </div>

        {/* Contenido del formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-100 bg-gray-100 shadow-lg">
                    {avatarActual ? (
                      <img
                        src={avatarActual}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-4xl font-bold">
                        {nombre.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Icono cámara en esquina */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 border-2 border-white"
                  >
                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Botón texto cambiar foto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="mt-3 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                  Cambiar foto
                </button>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={loading}
                  placeholder="Tu nombre completo"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Área de trabajo
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50"
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
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  backgroundColor: 'white',
                  color: '#4b5563',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !nombre.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  backgroundColor: '#2510b4',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: loading || !nombre.trim() ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '1.125rem' }}>progress_activity</span>
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
