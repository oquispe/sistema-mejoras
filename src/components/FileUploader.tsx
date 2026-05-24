/**
 * FileUploader - Componente para subir múltiples archivos
 * Soporta imágenes (JPG, PNG, GIF, WebP) y documentos (PDF, Excel, Word)
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  ArchivoLocal,
  ProyectoArchivo,
  MAX_ARCHIVOS_POR_PROYECTO,
} from '../types';
import {
  validarArchivo,
  getTipoArchivo,
  getIconoArchivo,
  getColorIconoArchivo,
  formatearTamanio,
} from '../lib/storage';

interface FileUploaderProps {
  archivosExistentes?: ProyectoArchivo[];
  archivosNuevos: ArchivoLocal[];
  onArchivosNuevosChange: (archivos: ArchivoLocal[]) => void;
  onEliminarExistente?: (archivoId: string) => void;
  maxArchivos?: number;
  disabled?: boolean;
}

export default function FileUploader({
  archivosExistentes = [],
  archivosNuevos,
  onArchivosNuevosChange,
  onEliminarExistente,
  maxArchivos = MAX_ARCHIVOS_POR_PROYECTO,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalArchivos = archivosExistentes.length + archivosNuevos.length;
  const puedeAgregarMas = totalArchivos < maxArchivos;

  // Generar ID único para archivos locales
  const generarId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Procesar archivos seleccionados
  const procesarArchivos = (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    const espacioDisponible = maxArchivos - totalArchivos;

    if (fileArray.length > espacioDisponible) {
      setError(`Solo puedes agregar ${espacioDisponible} archivo(s) más. Máximo ${maxArchivos} por proyecto.`);
      return;
    }

    const nuevosArchivos: ArchivoLocal[] = [];
    const errores: string[] = [];

    for (const file of fileArray) {
      const validacion = validarArchivo(file);
      if (!validacion.valido) {
        errores.push(validacion.error!);
        continue;
      }

      const tipo = getTipoArchivo(file.type);
      if (!tipo) continue;

      const archivoLocal: ArchivoLocal = {
        id: generarId(),
        file,
        tipo,
        nombre: file.name,
        tamanio: file.size,
      };

      // Crear preview para imágenes
      if (tipo === 'imagen') {
        const reader = new FileReader();
        reader.onloadend = () => {
          archivoLocal.preview = reader.result as string;
          // Forzar actualización
          onArchivosNuevosChange([...archivosNuevos, ...nuevosArchivos]);
        };
        reader.readAsDataURL(file);
      }

      nuevosArchivos.push(archivoLocal);
    }

    if (errores.length > 0) {
      setError(errores.join('\n'));
    }

    if (nuevosArchivos.length > 0) {
      onArchivosNuevosChange([...archivosNuevos, ...nuevosArchivos]);
    }
  };

  // Handlers de drag & drop
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && puedeAgregarMas) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !puedeAgregarMas) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      procesarArchivos(files);
    }
  };

  // Handler para input file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivos(e.target.files);
    }
    // Reset input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  // Quitar archivo nuevo (antes de subir)
  const quitarArchivoNuevo = (id: string) => {
    const archivo = archivosNuevos.find(a => a.id === id);
    if (archivo?.preview) {
      URL.revokeObjectURL(archivo.preview);
    }
    onArchivosNuevosChange(archivosNuevos.filter(a => a.id !== id));
  };

  // Click en zona de drop
  const handleClick = () => {
    if (!disabled && puedeAgregarMas) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-on-surface">
        Archivos ({totalArchivos}/{maxArchivos})
      </label>

      {/* Zona de drop */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${isDragging ? 'border-primary bg-primary/5' : 'border-[#cfd2d9] hover:border-primary/50'}
          ${!puedeAgregarMas && !disabled ? 'opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || !puedeAgregarMas}
        />

        <span className={`material-symbols-outlined text-4xl mb-2 ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>
          {isDragging ? 'file_download' : 'cloud_upload'}
        </span>

        <p className="text-sm text-on-surface-variant">
          {puedeAgregarMas ? (
            <>
              <span className="font-semibold text-primary">Haz click</span> o arrastra archivos aquí
            </>
          ) : (
            <span className="text-orange-600">Límite de archivos alcanzado</span>
          )}
        </p>

        <p className="text-xs text-on-surface-variant mt-1">
          Imágenes (JPG, PNG, GIF, WebP) hasta 5MB | Documentos (PDF, Excel, Word) hasta 10MB
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        </div>
      )}

      {/* Preview de archivos existentes */}
      {archivosExistentes.length > 0 && (
        <div>
          <p className="text-xs text-on-surface-variant mb-2">Archivos guardados:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {archivosExistentes.map((archivo) => (
              <div
                key={archivo.id}
                className="relative group bg-white border border-[#eff4ff] rounded-xl overflow-hidden"
              >
                {archivo.tipo === 'imagen' ? (
                  <img
                    src={archivo.url}
                    alt={archivo.nombre}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="h-24 flex flex-col items-center justify-center bg-gray-50 p-2">
                    <span className={`material-symbols-outlined text-3xl ${getColorIconoArchivo(archivo.mime_type)}`}>
                      {getIconoArchivo(archivo.mime_type)}
                    </span>
                    <p className="text-xs text-on-surface-variant truncate w-full text-center mt-1">
                      {archivo.nombre}
                    </p>
                  </div>
                )}

                {/* Botón eliminar - siempre visible en móvil */}
                {onEliminarExistente && (
                  <button
                    type="button"
                    onClick={() => onEliminarExistente(archivo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview de archivos nuevos */}
      {archivosNuevos.length > 0 && (
        <div>
          <p className="text-xs text-on-surface-variant mb-2">Archivos por subir:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {archivosNuevos.map((archivo) => (
              <div
                key={archivo.id}
                className="relative group bg-white border border-[#eff4ff] rounded-xl overflow-hidden"
              >
                {archivo.tipo === 'imagen' && archivo.preview ? (
                  <img
                    src={archivo.preview}
                    alt={archivo.nombre}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="h-24 flex flex-col items-center justify-center bg-gray-50 p-2">
                    <span className={`material-symbols-outlined text-3xl ${getColorIconoArchivo(archivo.file.type)}`}>
                      {getIconoArchivo(archivo.file.type)}
                    </span>
                    <p className="text-xs text-on-surface-variant truncate w-full text-center mt-1">
                      {archivo.nombre}
                    </p>
                  </div>
                )}

                {/* Indicador de tamaño */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-0.5 px-2 truncate">
                  {formatearTamanio(archivo.tamanio)}
                </div>

                {/* Botón quitar - siempre visible en móvil */}
                <button
                  type="button"
                  onClick={() => quitarArchivoNuevo(archivo.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                  title="Quitar"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>

                {/* Badge "nuevo" */}
                <div className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  nuevo
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
