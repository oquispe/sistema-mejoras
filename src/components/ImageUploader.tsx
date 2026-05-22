/**
 * ImageUploader.tsx - Componente para subir imágenes con drag & drop
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { subirImagen } from '../lib/storage';
import { useAuth } from '../context/AuthContext';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
}

export default function ImageUploader({ onImageUploaded, currentImage }: ImageUploaderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Manejar archivo seleccionado
  async function handleFile(file: File) {
    if (!user) {
      setError('Debes iniciar sesión');
      return;
    }

    setError(null);
    setUploading(true);

    // Mostrar preview local mientras sube
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a Supabase
    const { url, error: uploadError } = await subirImagen(file, user.id);

    setUploading(false);

    if (uploadError) {
      setError(uploadError);
      setPreview(null);
      return;
    }

    if (url) {
      setPreview(url);
      onImageUploaded(url);
    }
  }

  // Drag events
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  // Input change
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  // Eliminar imagen
  function handleRemove() {
    setPreview(null);
    onImageUploaded('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-on-surface mb-2">
        Imagen del proyecto
      </label>

      {/* Preview de imagen */}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden mb-2">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-white">
                progress_activity
              </span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      ) : (
        /* Zona de drop */
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-[#cfd2d9] hover:border-primary hover:bg-[#f8f9ff]'
          }`}
        >
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            cloud_upload
          </span>
          <p className="text-sm text-on-surface-variant">
            {isDragging ? (
              'Suelta la imagen aquí'
            ) : (
              <>
                Arrastra una imagen o{' '}
                <span className="text-primary font-semibold">haz clic para seleccionar</span>
              </>
            )}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            JPG, PNG, GIF o WebP. Máximo 5MB.
          </p>
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
