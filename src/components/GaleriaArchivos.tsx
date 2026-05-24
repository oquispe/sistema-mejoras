/**
 * GaleriaArchivos - Componente para mostrar galería de imágenes y documentos
 */

import { useState } from 'react';
import { ProyectoArchivo } from '../types';
import { getIconoArchivo, getColorIconoArchivo, formatearTamanio } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';

interface GaleriaArchivosProps {
  archivos: ProyectoArchivo[];
  modo?: 'compacto' | 'completo';
}

export default function GaleriaArchivos({
  archivos,
  modo = 'completo',
}: GaleriaArchivosProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  const imagenes = archivos.filter(a => a.tipo === 'imagen');
  const documentos = archivos.filter(a => a.tipo === 'documento');

  if (archivos.length === 0) return null;

  // Modo compacto para las tarjetas del feed
  if (modo === 'compacto') {
    return (
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        {imagenes.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">photo_library</span>
            {imagenes.length} foto{imagenes.length !== 1 ? 's' : ''}
          </span>
        )}
        {documentos.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">folder</span>
            {documentos.length} doc{documentos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  // Modo completo para vista de detalle
  return (
    <>
      {/* Galería de imágenes */}
      {imagenes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">photo_library</span>
            Imágenes ({imagenes.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imagenes.map((imagen) => (
              <div
                key={imagen.id}
                onClick={() => setImagenAmpliada(imagen.url)}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-[#eff4ff] hover:border-primary transition-colors"
              >
                <img
                  src={imagen.url}
                  alt={imagen.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    zoom_in
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {documentos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">folder</span>
            Documentos ({documentos.length})
          </h4>
          <div className="space-y-2">
            {documentos.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  doc.mime_type === 'application/pdf' ? 'bg-red-100' :
                  doc.mime_type.includes('spreadsheet') ? 'bg-green-100' :
                  'bg-blue-100'
                }`}>
                  <span className={`material-symbols-outlined text-xl ${getColorIconoArchivo(doc.mime_type)}`}>
                    {getIconoArchivo(doc.mime_type)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                    {doc.nombre}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {formatearTamanio(doc.tamanio)}
                  </p>
                </div>

                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  download
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Modal de imagen ampliada */}
      <AnimatePresence>
        {imagenAmpliada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImagenAmpliada(null)}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={imagenAmpliada}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-white text-xl">close</span>
            </button>

            {/* Botón descargar */}
            <a
              href={imagenAmpliada}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 text-white text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Descargar
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Componente para mostrar primera imagen como portada
 */
export function PortadaProyecto({
  archivos,
  imagenLegacy,
  titulo,
  onClick,
}: {
  archivos?: ProyectoArchivo[];
  imagenLegacy?: string | null;
  titulo: string;
  onClick?: () => void;
}) {
  const imagenes = archivos?.filter(a => a.tipo === 'imagen') || [];
  const primeraImagen = imagenes[0]?.url || imagenLegacy;

  if (!primeraImagen) return null;

  return (
    <div className="relative">
      <img
        src={primeraImagen}
        alt={titulo}
        className="w-full h-48 object-cover cursor-pointer"
        onClick={onClick}
      />

      {/* Indicador de más imágenes */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">photo_library</span>
          +{imagenes.length - 1}
        </div>
      )}
    </div>
  );
}
