# TaskFront – Sistema de Gestión de Tareas

TaskFront es una plataforma web construida con Nuxt 3 que centraliza la planificación de proyectos en tres vistas especializadas (Kanban, To-Do y Calendario). El foco del proyecto es demostrar arquitectura limpia, autenticación segura y una UX moderna basada en shadcn-vue.

## 📚 Índice

1. [Instalación rápida](#instalación-rápida)
2. [Scripts disponibles](#scripts-disponibles)
3. [Variables de entorno](#variables-de-entorno)
4. [Arquitectura del proyecto](#arquitectura-del-proyecto)
   - [Stack tecnológico](#stack-tecnológico)
   - [Estructura de carpetas](#estructura-de-carpetas)
   - [Patrones y convenciones](#patrones-y-convenciones)
5. [Seguridad y autenticación](#seguridad-y-autenticación)
6. [API interna (Nitro server)](#api-interna-nitro-server)
   - [Salud](#salud)
   - [Autenticación](#autenticación)
   - [Tareas](#tareas)
   - [Calendario](#calendario)
   - [Categorías](#categorías)
7. [Estado y lógica de negocio](#estado-y-lógica-de-negocio)
8. [Funcionalidades destacadas](#funcionalidades-destacadas)
   - [Kanban Board](#kanban-board)
   - [To-Do List](#to-do-list)
   - [Vista Calendario](#vista-calendario)
   - [Carga masiva por CSV](#carga-masiva-por-csv)
9. [Buenas prácticas de desarrollo](#buenas-prácticas-de-desarrollo)
10. [Backlog y próximos pasos](#backlog-y-próximos-pasos)
11. [Recursos y documentación](#recursos-y-documentación)

---

## 🚀 Instalación rápida

Requisitos previos:

- Node.js 18+ (se recomienda 20 LTS)
- npm, pnpm, yarn o bun instalado globalmente

Clona el repositorio e instala dependencias:

```bash
git clone https://github.com/ksazua/task-front.git
cd task-front
npm install        # también puedes usar pnpm/yarn/bun
```

Arranca el servidor de desarrollo en `http://localhost:3000`:

```bash
npm run dev
```

Compila para producción y genera una vista previa:

```bash
npm run build
npm run preview
```

> TIP: tras cada cambio relevante se recomienda ejecutar `npm run build` para validar que no existan errores de tipo o compilación.

## 🧰 Scripts disponibles

| Script         | Descripción                                                     |
| -------------- | ---------------------------------------------------------------- |
| `npm run dev`  | Levanta Nuxt en modo desarrollo con HMR.                         |
| `npm run build`| Compila el proyecto para producción (nitro + client build).      |
| `npm run preview` | Sirve la build generada localmente para pruebas finales.   |
| `npm run generate` | Genera contenido estático (SSG) si se requiere.           |

## ⚙️ Variables de entorno

Archivo `.env` sugerido:

```env
# Dominio del backend (se usa tanto en cliente como en server routes)
NUXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api/v1

# Nombre amigable que se muestra en la UI
NUXT_PUBLIC_APP_NAME=TaskFront

# Secret usado por utilidades de sesión (iron-session)
API_SECRET=change_me_later
```

En producción apunta `NUXT_PUBLIC_API_BASE` al dominio público de la API.

---

## 🏗️ Arquitectura del proyecto

### Stack tecnológico

- **Nuxt 3 + Nitro**: SSR/SSG híbrido, rutas de servidor y composición modular.
- **Vue 3 (Composition API)**: componentes reactivos y reutilizables.
- **Tailwind CSS v4 + shadcn-vue**: diseño consistente, theming rápido.
- **Pinia**: estado global tipado para tareas.
- **Day.js**: manipulación de fechas ligera.
- **vue-sonner & lucide-vue-next**: feedback visual y sistema de iconos.

### Estructura de carpetas

```
task-front/
├── components/           # UI atómica y layouts específicos
│   ├── auth/             # Formularios de login/registro
│   ├── calendario/       # Grid, header y sheet del calendario
│   ├── kanban/           # Columnas, diálogos, carga masiva
│   └── ui/               # Librería adaptada a Nuxt
├── composables/          # Acceso a auth y tareas remotas
├── middleware/           # Guard global de autenticación
├── pages/                # Rutas de aplicación (Nuxt file-based routing)
├── plugins/              # Interceptores de $fetch y bootstrap de sesión
├── server/api/           # Endpoints Nitro (BFF) hacia el backend REST
├── stores/               # Pinia stores (ej. `tasks.ts`)
├── types/                # Tipado compartido de API
└── nuxt.config.ts        # Configuración principal
```

### Patrones y convenciones

- **BFF (Backend for Frontend)**: todas las peticiones a la API externa pasan por `/server/api`. Se añaden headers, se manejan errores y se gestionan cookies httpOnly.
- **Composición + Pinia**: la lógica de negocio reside en `stores/tasks.ts` y composables (`useAuth`, `useBackendTasks`). Los componentes solo invocan métodos bien tipados.
- **Design**: cada elemento UI tiene su propia carpeta con índice para importaciones limpias.
- **Autenticación defensiva**: middleware global + plugin cliente para refrescar sesión + interceptor para renovar tokens.
- **Convenciones de naming**: archivos kebab-case, componentes PascalCase, estados en inglés (`planned`, `in_progress`, `done`) y mapeo al español para la API.

---

## 🔐 Seguridad y autenticación

- **`middleware/auth.global.ts`** restringe el acceso a rutas privadas. Verifica la sesión llamando a `/api/auth/session`. Redirige a `/login` cuando no hay sesión y evita que un usuario autenticado reingrese a `/login`, `/registro` o `/`.
- **Cookies httpOnly**: las rutas Nitro (`/api/auth/login` y `/api/auth/register`) guardan tokens en cookies seguras mediante `setUserSession` (`server/utils/session.ts`). El frontend nunca manipula tokens directamente.
- **Renovación de tokens**: `plugins/auth-interceptor.client.ts` envuelve `$fetch` para capturar respuestas 401, invoca `/api/auth/refresh` y reprocesa peticiones fallidas.
- **Bootstrap de sesión**: `plugins/auth.client.ts` ejecuta `fetchSession()` al cargar la app en cliente para hidratar el estado de usuario.
- **Zod + validaciones**: los formularios validan lado cliente (por ejemplo `RegisterForm.vue`) antes de contactar al backend.

---

## 🧩 API interna (Nitro server)

La carpeta `server/api` implementa endpoints que actúan como capa intermedia hacia el backend REST (`NUXT_PUBLIC_API_BASE`).

### Salud

| Método | Ruta              | Descripción                         |
| ------ | ----------------- | ----------------------------------- |
| GET    | `/api/_health`    | Ping básico usado por despliegues. |

### Autenticación

| Método | Ruta                     | Descripción                                                                 |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| POST   | `/api/auth/login`        | Valida credenciales, guarda tokens en cookie httpOnly y retorna usuario.    |
| POST   | `/api/auth/register`     | Registra usuario en el backend y crea sesión inmediata (`setUserSession`).  |
| POST   | `/api/auth/logout`       | Limpia la cookie de sesión.                                                 |
| POST   | `/api/auth/refresh`      | Renueva tokens usando el refresh token almacenado.                          |
| GET    | `/api/auth/session`      | Devuelve el usuario autenticado y estado de sesión.                         |

### Tareas

| Método | Ruta                     | Descripción                                                                 |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/tasks`             | Lista tareas del usuario con filtros opcionales (`TaskFilters`).            |
| POST   | `/api/tasks`             | Crea una tarea usando `CreateTaskPayload`.                                  |
| POST   | `/api/tasks/bulk`        | Punto de entrada para creación masiva (utilizado por `BulkTaskDialog`).     |
| PUT    | `/api/tasks/:id`         | Actualiza una tarea existente.                                              |
| DELETE | `/api/tasks/:id`         | Elimina una tarea.                                                          |

### Calendario

| Método | Ruta                                   | Descripción                                                                   |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/tasks/calendar/:year/:month`     | Devuelve tareas agregadas por día para la vista mensual.                      |

### Categorías

| Método | Ruta               | Descripción                                 |
| ------ | ------------------ | ------------------------------------------- |
| GET    | `/api/categories`  | Recupera categorías/tags disponibles.       |

Cada endpoint atrapa errores (`try/catch`) y normaliza respuestas (`success`, `message`, `data`). En caso de error se lanza `createError` con el mensaje del backend.

---

## 🧠 Estado y lógica de negocio

- **`stores/tasks.ts`**: Store Pinia central que mantiene la lista de tareas, filtros y helpers (`byStatus`, `bulkCreate`, `move`, etc.). Convierte entre el formato local (`Task`) y el formato de la API (`CreateTaskPayload`), además de manejar seeds para escenario offline.
- **`composables/useBackendTasks.ts`**: Capa de acceso a la API de tareas (fetch, create, update, delete). Permite reutilizar lógica desde componentes o stores.
- **`composables/useAuth.ts`**: Expone `login`, `logout`, `fetchSession`, `checkAuth` y mantiene el estado reactivo del usuario (`useState`).

---

## ✨ Funcionalidades destacadas

### Kanban Board

- Ruta `/inicio` con columna por estado (`planned`, `in_progress`, `done`).
- Drag & drop con `vuedraggable` para reordenar.
- Filtros por estado, fecha, categoría y búsqueda textual.
- Acciones rápidas: crear, editar, eliminar, mover tareas.
- `KanbanHeader.vue` incluye búsqueda inteligente y acceso a la carga masiva.

### To-Do List

- Ruta `/todo` enfocada en productividad personal.
- Checkboxes que cambian el estado secuencialmente con animaciones.
- Misma capa de filtros que Kanban para mantener coherencia.

### Vista Calendario

- Ruta `/calendario` con grid mensual.
- Las tareas se colorean según estado (azul/ámbar/verde).
- `TaskDetailSheet.vue` muestra detalle al seleccionar un día/tarea.
- Navegación por mes/año y botón “Hoy”.

### Carga masiva por CSV

- `BulkTaskDialog.vue` ofrece dos opciones: formulario tabular editable y carga de archivo CSV.
- Plantilla descargable con encabezados aceptados (`title,description,category,status,start_date,deadline`).
- Parser personalizado que soporta campos entrecomillados y normaliza fechas.
- Al guardar, cada fila válida se transforma en `Task` y se envía a través del store (o endpoint bulk). Se muestran toasts de éxito/fallo parciales.

---

## 🧑‍💻 Buenas prácticas de desarrollo

- **Validaciones progresivas**: formularios estratégicos (`LoginForm`, `RegisterForm`) usan reglas expresivas (regex, zod) antes de contactar al backend.
- **Feedback inmediato**: se emplea `vue-sonner` para comunicar estados de carga, éxito o error.
- **Formateo en vivo**: el formulario de registro formatea nombres capitalizando palabras y rechazando números, asegurando consistencia antes de enviarse.
- **Intercepción de red**: `$fetch` global con reintento de tokens evita fugas de sesión.
- **Lazy loading de componentes**: Nuxt genera componentes auto-registrados (`.nuxt/components.d.ts`) que facilitan imports dinámicos.

---

---

## 📎 Recursos y documentación

- [Nuxt Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Pinia](https://pinia.vuejs.org/)
- [Day.js](https://day.js.org/)

---
