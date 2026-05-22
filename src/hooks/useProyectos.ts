/**
 * useProyectos - Hook para manejar proyectos
 *
 * Este hook facilita:
 * - Cargar proyectos desde Supabase
 * - Crear, editar y eliminar proyectos
 * - Dar/quitar likes
 * - Filtrar y buscar
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProyectoConStats, Proyecto } from '../types';
import {
  getProyectos,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
  toggleLike
} from '../lib/database';
import { useAuth } from '../context/AuthContext';

export function useProyectos() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoConStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Cargar proyectos
  const cargarProyectos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getProyectos(user?.id);
      setProyectos(data);
    } catch (err) {
      setError('Error cargando proyectos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar al montar y cuando cambie el usuario
  useEffect(() => {
    if (user) {
      cargarProyectos();
    }
  }, [user, cargarProyectos]);

  // Crear proyecto
  const crear = async (datos: {
    titulo: string;
    descripcion: string;
    categoria: 'proyecto' | 'mejora' | 'innovacion';
    area: string;
    tipo: 'produccion' | 'calidad' | 'seguridad';
    imagen_url?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { data, error } = await crearProyecto({
      ...datos,
      autor_id: user.id,
    });

    if (error) {
      return { success: false, error };
    }

    // Recargar proyectos
    await cargarProyectos();

    return { success: true };
  };

  // Editar proyecto
  const editar = async (
    id: string,
    cambios: Partial<Proyecto>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    // Verificar que el usuario es el autor
    const proyecto = proyectos.find(p => p.id === id);
    if (!proyecto || proyecto.autor_id !== user.id) {
      return { success: false, error: 'No tienes permiso para editar este proyecto' };
    }

    const { error } = await actualizarProyecto(id, cambios);

    if (error) {
      return { success: false, error };
    }

    // Actualizar localmente
    setProyectos(prev =>
      prev.map(p => p.id === id ? { ...p, ...cambios } : p)
    );

    return { success: true };
  };

  // Eliminar proyecto
  const eliminar = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    // Verificar que el usuario es el autor
    const proyecto = proyectos.find(p => p.id === id);
    if (!proyecto || proyecto.autor_id !== user.id) {
      return { success: false, error: 'No tienes permiso para eliminar este proyecto' };
    }

    const { error } = await eliminarProyecto(id);

    if (error) {
      return { success: false, error };
    }

    // Eliminar localmente
    setProyectos(prev => prev.filter(p => p.id !== id));

    return { success: true };
  };

  // Toggle like
  const handleLike = async (proyectoId: string): Promise<void> => {
    if (!user) return;

    // Optimistic update
    setProyectos((prev) =>
      prev.map((p) => {
        if (p.id === proyectoId) {
          const nuevoEstado = !p.usuario_dio_like;
          return {
            ...p,
            usuario_dio_like: nuevoEstado,
            likes_count: nuevoEstado ? p.likes_count + 1 : p.likes_count - 1,
          };
        }
        return p;
      })
    );

    // Enviar a Supabase
    const { error } = await toggleLike(proyectoId, user.id);

    if (error) {
      await cargarProyectos();
    }
  };

  // Proyectos filtrados por búsqueda
  const proyectosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return proyectos;

    const termino = busqueda.toLowerCase();
    return proyectos.filter(p =>
      p.titulo.toLowerCase().includes(termino) ||
      p.descripcion.toLowerCase().includes(termino) ||
      p.autor_nombre.toLowerCase().includes(termino) ||
      p.area.toLowerCase().includes(termino) ||
      p.categoria.toLowerCase().includes(termino)
    );
  }, [proyectos, busqueda]);

  // Filtrar por categoría
  const filtrarPorCategoria = useCallback((categoria: string | null): ProyectoConStats[] => {
    const base = busqueda.trim() ? proyectosFiltrados : proyectos;
    if (!categoria) return base;
    return base.filter((p) => p.categoria === categoria);
  }, [proyectos, proyectosFiltrados, busqueda]);

  // Filtrar por área
  const filtrarPorArea = useCallback((area: string | null): ProyectoConStats[] => {
    if (!area) return proyectos;
    return proyectos.filter((p) => p.area === area);
  }, [proyectos]);

  // Filtrar por tipo
  const filtrarPorTipo = useCallback((tipo: string | null): ProyectoConStats[] => {
    if (!tipo) return proyectos;
    return proyectos.filter((p) => p.tipo === tipo);
  }, [proyectos]);

  // Obtener proyecto por ID
  const obtenerPorId = useCallback((id: string): ProyectoConStats | undefined => {
    return proyectos.find((p) => p.id === id);
  }, [proyectos]);

  // Proyectos del usuario actual
  const misProyectos = useMemo(() => {
    if (!user) return [];
    return proyectos.filter(p => p.autor_id === user.id);
  }, [proyectos, user]);

  return {
    proyectos,
    proyectosFiltrados,
    misProyectos,
    loading,
    error,
    busqueda,
    setBusqueda,
    cargarProyectos,
    crear,
    editar,
    eliminar,
    handleLike,
    filtrarPorCategoria,
    filtrarPorArea,
    filtrarPorTipo,
    obtenerPorId,
  };
}
