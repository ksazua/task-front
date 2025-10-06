# TaskFront - Sistema de Gestión de Tareas

TaskFront es una aplicación web completa de gestión de tareas y proyectos construida con Nuxt 3, Vue 3 y Tailwind CSS. Ofrece tres vistas diferentes para organizar y visualizar tus tareas: Kanban Board, To-Do List y Calendar.

## 🚀 Características Principales

### 📋 **Kanban Board** (`/inicio`)
- Vista de tablero con 3 columnas de estado: Planned, In Progress, Done
- Drag & drop para mover tareas entre columnas
- Filtros avanzados:
  - Por estado (tabs)
  - Por fecha límite (date picker)
  - Por categoría/tags
  - Búsqueda por texto
- Creación masiva de tareas:
  - Formulario dinámico con filas editables
  - Importación por CSV con plantilla descargable
- Cards con información completa: título, descripción, fecha límite y tags

### ✅ **To-Do List** (`/todo`)
- Vista de lista organizada por estados
- Checkboxes interactivos con transición visual:
  - Planned → In Progress (al marcar)
  - In Progress → Done (al marcar)
  - Done → In Progress (al desmarcar)
- Efecto de tachado durante la transición (500ms)
- Mismos filtros que el Kanban Board
- Botones de edición y eliminación en hover

### 📅 **Calendar** (`/calendario`)
- Vista mensual con grid de 7 días
- Visualización de tareas en los días correspondientes
- Colores por estado:
  - Azul: Planned
  - Ámbar: In Progress
  - Verde: Done
- Navegación por meses con selectores de mes/año
- Botón "Hoy" para volver rápidamente al mes actual
- Sheet lateral con detalles completos de cada tarea
- Tareas visibles en su rango de fechas (startDate → dueDate)

### 🎨 **Características Generales**
- **Sidebar retráctil** con tooltips en modo colapsado
- **Componentes shadcn-vue** para UI consistente y moderna
- **Gestión de categorías/tags** con colores personalizados
- **Fechas de inicio y límite** para cada tarea
- **Modo responsive** para móvil, tablet y desktop
- **Animaciones suaves** con transitions CSS
- **Tema configurable** con variables CSS

## 🌐 Dominios

### **Frontend (Producción)**
```
https://task-front-hdcjcjlfz-ksazuas-projects.vercel.app/
```

### **Backend API**
```
Development: http://127.0.0.1:8000/api/v1/
Production: [Configurar en variables de entorno]
```

## 📦 Tecnologías Utilizadas

- **Framework**: Nuxt 3
- **Frontend**: Vue 3 (Composition API)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn-vue
- **State Management**: Pinia
- **Date Management**: Day.js
- **Icons**: Lucide Vue Next
- **Drag & Drop**: VueDraggable
- **Deployment**: Vercel

## 🛠️ Setup

Instalar dependencias:

```bash
npm install
# o
pnpm install
# o
yarn install
# o
bun install
```

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Frontend público
NUXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NUXT_PUBLIC_APP_NAME=TaskFront

# Backend privado (solo server)
API_SECRET=change_me_later
```

Para producción, configurar:
```env
NUXT_PUBLIC_API_BASE=https://tu-api-backend.com/api/v1
```

## 🚀 Development Server

Iniciar servidor de desarrollo en `http://localhost:3000`:

```bash
npm run dev
# o
pnpm dev
# o
yarn dev
# o
bun run dev
```

## 📦 Production

Construir la aplicación para producción:

```bash
npm run build
# o
pnpm build
# o
yarn build
# o
bun run build
```

Preview de producción localmente:

```bash
npm run preview
# o
pnpm preview
# o
yarn preview
# o
bun run preview
```

## 📁 Estructura del Proyecto

```
task-front/
├── components/
│   ├── auth/              # Componentes de autenticación
│   ├── calendario/        # Componentes de calendario
│   │   ├── CalendarGrid.vue
│   │   ├── CalendarHeader.vue
│   │   └── TaskDetailSheet.vue
│   ├── kanban/            # Componentes de Kanban
│   │   ├── AppSidebar.vue
│   │   ├── BoardColumn.vue
│   │   ├── BulkTaskDialog.vue
│   │   ├── KanbanHeader.vue
│   │   ├── TagChip.vue
│   │   ├── TaskCard.vue
│   │   └── TaskDialog.vue
│   └── ui/                # Componentes shadcn-vue
├── pages/
│   ├── inicio.vue         # Kanban Board
│   ├── todo.vue           # To-Do List
│   └── calendario.vue     # Calendar View
├── stores/
│   └── tasks.ts           # Pinia store para tareas
├── assets/
│   └── css/
│       ├── tailwind.css
│       └── theme.css
└── nuxt.config.ts
```

## 🎯 Funcionalidades por Implementar

- [ ] Autenticación de usuarios
- [ ] Sincronización con backend API
- [ ] Colaboración en tiempo real
- [ ] Notificaciones push
- [ ] Exportación de reportes
- [ ] Vista de tabla
- [ ] Asignación de usuarios a tareas
- [ ] Comentarios y archivos adjuntos funcionales

## 📚 Documentación

- [Nuxt Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [Pinia](https://pinia.vuejs.org/)

## 🚢 Deployment

La aplicación está desplegada en Vercel. Para más información sobre deployment:

- [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment)
- [Vercel Documentation](https://vercel.com/docs)

## 📄 Licencia

Este proyecto es privado y propietario.

---

**Desarrollado con ❤️ usando Nuxt 3 y Vue 3**