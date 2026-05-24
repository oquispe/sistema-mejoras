# Sistema de Mejoras - Documentación del Proyecto

## Descripción General
Aplicación web para gestión de proyectos de mejora empresarial con sistema de concursos, evaluación por jurado y rankings.

**Stack tecnológico:**
- Frontend: React + TypeScript + Vite
- Backend: Supabase (Auth, Database, Storage, RLS)
- Estilos: Tailwind CSS
- Animaciones: Framer Motion (motion/react)

---

## FASE 1: Base del Sistema ✅ COMPLETADA

### Funcionalidades implementadas:
- **Autenticación**: Login/registro con Supabase Auth
- **Perfiles de usuario**: nombre, área, avatar, rol
- **Proyectos/Mejoras**: CRUD completo
  - Título, descripción, categoría (proyecto/mejora/innovación)
  - Área, tipo (producción/calidad/seguridad)
  - Estado (en_progreso/completado)
- **Interacciones sociales**:
  - Likes (reacciones)
  - Comentarios
  - Notificaciones (like, comentario)
- **Feed principal**: Lista de proyectos con búsqueda y filtros
- **Vista detalle**: Proyecto completo con galería y comentarios

### Archivos principales:
- `src/App.tsx` - Componente principal
- `src/context/AuthContext.tsx` - Contexto de autenticación
- `src/lib/database.ts` - Funciones de base de datos
- `src/lib/supabase.ts` - Cliente Supabase
- `src/types.ts` - Tipos TypeScript

---

## FASE 2: Sistema de Archivos ✅ COMPLETADA

### Funcionalidades implementadas:
- **Múltiples archivos por proyecto**: Hasta 10 archivos
- **Tipos soportados**:
  - Imágenes: JPG, PNG, GIF, WebP (max 5MB)
  - Documentos: PDF, Excel, Word (max 10MB)
- **Componentes**:
  - `FileUploader.tsx` - Drag & drop múltiple, preview
  - `GaleriaArchivos.tsx` - Visualización con lightbox
- **Storage**: Bucket `proyecto-archivos` en Supabase

### Tabla de archivos:
```sql
proyecto_archivos (
  id, proyecto_id, nombre, tipo, mime_type,
  tamanio, storage_path, url, subido_por, created_at
)
```

---

## FASE 3: Sistema de Concursos ✅ COMPLETADA

### Diseño del sistema:

#### Roles de usuario:
| Rol | Permisos |
|-----|----------|
| `usuario` | Crear proyectos, postular a concursos, ver rankings |
| `jurado` | Todo lo anterior + calificar proyectos (no los propios) |
| `admin` | Todo lo anterior + crear/editar/cerrar concursos |

#### Concursos:
- **Solo admin puede crear** concursos
- **Varios concursos activos** simultáneamente
- **Fechas editables**: inicio postulación, fin postulación, fin evaluación
- **Cierre manual** disponible en cualquier momento
- **Fases automáticas** basadas en fechas:
  - `proximamente` → `postulacion` → `en_proceso` → `evaluacion` → `finalizado`

#### Al crear concurso:
- Se genera **publicación destacada** (banner) en el feed
- Se envía **notificación a todos** los usuarios
- Al finalizar, otra notificación con resultados

#### Postulación de proyectos:
- Desde el formulario de publicar (opcional)
- Desde proyectos ya publicados (botón "Postular a concurso")
- Un proyecto solo puede estar en **un concurso a la vez**
- Solo durante fase de postulación

#### Calificación del jurado:
- Escala **1-10** por criterio (innovación, impacto, factibilidad, presentación)
- **No puede calificar su propio proyecto**
- Puede **editar** su calificación mientras el concurso esté activo
- Cada jurado califica **una vez** por proyecto

#### Puntaje final:
- **Promedio** de todas las calificaciones del jurado
- Desglose por criterio disponible

#### Rankings públicos:
- Por concurso (elegir cuál ver)
- Filtros: **general / por área / por categoría**
- Muestra: posición, proyecto, autor, área, categoría, puntaje promedio
- **Podio visual** (top 3 con medallas)
- **Notas individuales PRIVADAS** (solo se muestra el promedio)
- Indicador de **preliminar vs final**

### Componentes implementados:
- `AdminPanel.tsx` - Gestión de concursos (solo admin)
- `ConcursoBanner.tsx` - Banner destacado en el feed
- `ConcursosView.tsx` - Vista de concursos para usuarios
- `PostularModal.tsx` - Postular proyecto existente
- `SeleccionarProyectoModal.tsx` - Seleccionar proyecto desde banner
- `EvaluacionJurado.tsx` - Panel de evaluación (jurado/admin)
- `RankingConcurso.tsx` - Ranking con filtros y podio
- `NotificacionesPanel.tsx` - Panel de notificaciones real

### Tablas de base de datos:
```sql
-- Concursos
concursos (
  id, nombre, descripcion,
  fecha_inicio_postulacion, fecha_fin_postulacion, fecha_fin_evaluacion,
  estado, creado_por, created_at
)

-- Postulaciones
postulaciones (
  id, concurso_id, proyecto_id, fecha_postulacion
)

-- Evaluaciones
evaluaciones (
  id, postulacion_id, jurado_id,
  puntaje_innovacion, puntaje_impacto, puntaje_factibilidad, puntaje_presentacion,
  puntaje_total, comentario, created_at, updated_at
)
```

### Funciones de BD (SECURITY DEFINER):
```sql
notificar_nuevo_concurso(p_concurso_id, p_nombre_concurso, p_creado_por)
notificar_resultados_concurso(p_concurso_id, p_nombre_concurso, p_creado_por)
```

### Completado en esta fase:
- [x] Opción de postular al crear proyecto (en el formulario)
- [x] Bloqueo para que jurado no califique su propio proyecto
- [x] Filtros en ranking (por área y categoría)
- [x] Indicador de ranking preliminar vs final
- [x] Notificaciones automáticas al crear/finalizar concurso

### Pendiente (SQL en Supabase):
- [ ] Ejecutar políticas RLS para tabla evaluaciones (ver abajo)

```sql
-- POLÍTICAS RLS PARA EVALUACIONES
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver evaluaciones" ON evaluaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insertar evaluaciones" ON evaluaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('jurado', 'admin'))
    AND NOT EXISTS (
      SELECT 1 FROM postulaciones p
      JOIN proyectos proj ON p.proyecto_id = proj.id
      WHERE p.id = postulacion_id AND proj.autor_id = auth.uid()
    )
    AND jurado_id = auth.uid()
  );

CREATE POLICY "Actualizar evaluaciones" ON evaluaciones
  FOR UPDATE TO authenticated
  USING (jurado_id = auth.uid())
  WITH CHECK (jurado_id = auth.uid());

CREATE POLICY "Eliminar evaluaciones" ON evaluaciones
  FOR DELETE TO authenticated
  USING (jurado_id = auth.uid());
```

---

## Estructura de carpetas

```
src/
├── components/
│   ├── AdminPanel.tsx        # Gestión concursos (admin)
│   ├── Comentarios.tsx       # Sistema de comentarios
│   ├── ConcursoBanner.tsx    # Banner de concurso en feed
│   ├── ConcursosView.tsx     # Vista de concursos
│   ├── EvaluacionJurado.tsx  # Panel de evaluación
│   ├── FileUploader.tsx      # Subida de archivos
│   ├── GaleriaArchivos.tsx   # Galería de imágenes/docs
│   ├── Header.tsx            # Navegación principal
│   ├── LoginPage.tsx         # Página de login
│   ├── NotificacionesPanel.tsx # Notificaciones
│   ├── PostularModal.tsx     # Modal postular proyecto
│   ├── RankingConcurso.tsx   # Rankings con filtros
│   └── SeleccionarProyectoModal.tsx
├── context/
│   └── AuthContext.tsx       # Contexto de auth
├── hooks/
│   └── useProyectos.ts       # Hook de proyectos
├── lib/
│   ├── database.ts           # Funciones de BD
│   ├── storage.ts            # Funciones de storage
│   └── supabase.ts           # Cliente Supabase
├── types.ts                  # Tipos TypeScript
├── App.tsx                   # Componente principal
└── main.tsx                  # Entry point
```

---

## Configuración de Supabase

### Variables de entorno (.env):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### RLS (Row Level Security):
- Todas las tablas tienen RLS habilitado
- Políticas específicas por tabla y operación
- Funciones con SECURITY DEFINER para operaciones masivas (notificaciones)

---

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Type check
npx tsc --noEmit
```
