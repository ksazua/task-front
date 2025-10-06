import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import type { ApiTask, CreateTaskPayload } from '~/types/api'
import { STATUS_MAP, REVERSE_STATUS_MAP } from '~/types/api'

export type TaskStatus = 'planned' | 'in_progress' | 'done'
export type Tag = { id: string; name: string; color?: string }

export interface Task {
  id: string
  title: string
  description?: string
  startDate?: string  // ISO - fecha de inicio
  dueDate?: string  // ISO
  tags: Tag[]
  status: TaskStatus
  createdAt: string // ISO
  category?: string
  progress?: number
  comments?: number
  links?: number
  attachments?: number
}

const seedTags: Tag[] = [
  { id: 't1', name: 'UI', color: '#0ea5e9' },
  { id: 't2', name: 'Bug', color: '#ef4444' },
  { id: 't3', name: 'Docs', color: '#22c55e' },
]

// Función para convertir ApiTask a Task local
function apiTaskToLocal(apiTask: ApiTask): Task {
  return {
    id: String(apiTask.id), // Convertir number a string para consistencia
    title: apiTask.title,
    description: apiTask.description || '',
    startDate: apiTask.start_date,
    dueDate: apiTask.deadline,
    category: apiTask.category,
    status: STATUS_MAP[apiTask.status] || 'planned',
    createdAt: apiTask.created_at,
    tags: [], // Por ahora vacío, agregar lógica de tags después
    progress: 0, // Valores por defecto
    comments: 0,
    links: 0,
    attachments: 0,
  }
}

// Función para convertir Task local a CreateTaskPayload
function localTaskToPayload(task: Partial<Task>): CreateTaskPayload {
  return {
    title: task.title!,
    description: task.description || undefined,
    category: task.category || undefined,
    status: task.status ? REVERSE_STATUS_MAP[task.status] : undefined,
    start_date: task.startDate || undefined,
    deadline: task.dueDate || undefined,
  }
}

const seed = (): Task[] => ([
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().subtract(2, 'day').toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[0]],
    status: 'planned', createdAt: dayjs().subtract(2, 'day').toISOString(),
    progress: 0, comments: 2, links: 2, attachments: 2,
  },
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().subtract(1, 'day').toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[0]],
    status: 'planned', createdAt: dayjs().subtract(1, 'day').toISOString(),
    progress: 0, comments: 2, links: 2, attachments: 2,
  },
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().subtract(3, 'day').toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[1]],
    status: 'in_progress', createdAt: dayjs().subtract(3, 'day').toISOString(),
    progress: 50, comments: 2, links: 2, attachments: 2,
  },
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().subtract(2, 'day').toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[2]],
    status: 'in_progress', createdAt: dayjs().subtract(2, 'day').toISOString(),
    progress: 80, comments: 2, links: 2, attachments: 2,
  },
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().subtract(1, 'day').toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[0]],
    status: 'in_progress', createdAt: dayjs().subtract(1, 'day').toISOString(),
    progress: 75, comments: 2, links: 2, attachments: 2,
  },
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[2]],
    status: 'done', createdAt: dayjs().toISOString(),
    progress: 100, comments: 2, links: 2, attachments: 2,
  },
  {
    id: nanoid(), title: 'Research landing page trends.',
    description: 'Compile competitor landing page designs for inspiration. G...',
    startDate: dayjs().subtract(1, 'day').toISOString(),
    dueDate: dayjs().set('date', 12).set('month', 10).toISOString(),
    tags: [seedTags[1]],
    status: 'done', createdAt: dayjs().subtract(1, 'day').toISOString(),
    progress: 100, comments: 2, links: 2, attachments: 2,
  },
])

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[], // Comenzar con array vacío, se cargarán de la API
    tags: seedTags as Tag[],
    q: '' as string,
    sort: 'created-desc' as 'created-desc'|'created-asc'|'due-asc'|'due-desc',
    statusFilter: 'all' as 'all' | TaskStatus,
    dateFilter: '' as string, // Fecha específica en formato YYYY-MM-DD
    tagFilter: 'all' as 'all' | string, // ID del tag o 'all'
    loading: false as boolean,
    error: null as string | null,
  }),
  getters: {
    filtered(state) {
      const q = state.q.trim().toLowerCase()
      let list = state.tasks

      // Filtrar por búsqueda
      if (q) {
        list = list.filter(t =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          t.tags.some(tag => tag.name.toLowerCase().includes(q))
        )
      }

      // Filtrar por estado
      if (state.statusFilter !== 'all') {
        list = list.filter(t => t.status === state.statusFilter)
      }

      // Filtrar por fecha específica
      if (state.dateFilter) {
        list = list.filter(t => {
          if (!t.dueDate) return false
          const dueDate = dayjs(t.dueDate).format('YYYY-MM-DD')
          return dueDate === state.dateFilter
        })
      }

      // Filtrar por tag
      if (state.tagFilter !== 'all') {
        list = list.filter(t => t.tags.some(tag => tag.id === state.tagFilter))
      }

      // Ordenar
      const sorters: Record<string, (a: Task,b: Task)=>number> = {
        'created-desc': (a,b)=> dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
        'created-asc' : (a,b)=> dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
        'due-asc'     : (a,b)=> (dayjs(a.dueDate).valueOf()||1e14) - (dayjs(b.dueDate).valueOf()||1e14),
        'due-desc'    : (a,b)=> (dayjs(b.dueDate).valueOf()||-1)   - (dayjs(a.dueDate).valueOf()||-1),
      }
      return list.sort(sorters[state.sort])
    },
    byStatus(): (s: TaskStatus)=> Task[] {
      return (s) => this.filtered.filter(t => t.status === s)
    }
  },
  actions: {
    // Cargar tareas desde la API
    async fetchTasks() {
      this.loading = true
      this.error = null
      
      try {
        const { fetchTasks } = useBackendTasks()
        const response = await fetchTasks()
        
        if (response.success && response.data) {
          this.tasks = response.data.map(apiTaskToLocal)
          console.log('📋 Tasks loaded from API:', this.tasks.length)
        }
      } catch (error: any) {
        console.error('❌ Error loading tasks:', error)
        this.error = error.message || 'Error al cargar tareas'
        // En caso de error, usar datos seed para desarrollo
        this.tasks = seed()
      } finally {
        this.loading = false
      }
    },

    // Crear tarea usando la API
    async create(input: Partial<Task> & { title: string }) {
      try {
        const { createTask } = useBackendTasks()
        const payload = localTaskToPayload(input)
        
        const response = await createTask(payload)
        
        if (response.success && response.data && response.data.length > 0) {
          const newTask = apiTaskToLocal(response.data[0])
          this.tasks.unshift(newTask)
          console.log('✅ Task created:', newTask)
          return newTask
        }
      } catch (error: any) {
        console.error('❌ Error creating task:', error)
        this.error = error.message || 'Error al crear tarea'
        
        // Fallback: crear tarea local
        const t: Task = {
          id: nanoid(),
          title: input.title,
          description: input.description ?? '',
          dueDate: input.dueDate,
          tags: input.tags ?? [],
          status: (input.status ?? 'planned'),
          createdAt: new Date().toISOString(),
        }
        this.tasks.unshift(t)
        return t
      }
    },

    bulkCreate(titles: string, base: Partial<Task> = {}) {
      const taskPromises = titles
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(title => this.create({ title, ...base }))
      
      return Promise.allSettled(taskPromises)
    },

    // Actualizar tarea usando la API
    async update(id: string, patch: Partial<Task>) {
      try {
        const { updateTask } = useBackendTasks()
        const taskId = parseInt(id, 10)
        
        if (isNaN(taskId)) {
          throw new Error('ID de tarea inválido')
        }

        const payload = localTaskToPayload(patch)
        const response = await updateTask(taskId, payload)
        
        if (response.success) {
          // Actualizar en el estado local
          const i = this.tasks.findIndex(t => t.id === id)
          if (i !== -1) {
            this.tasks[i] = { ...this.tasks[i], ...patch }
          }
          console.log('✅ Task updated:', id)
        }
      } catch (error: any) {
        console.error('❌ Error updating task:', error)
        this.error = error.message || 'Error al actualizar tarea'
        
        // Fallback: actualizar solo local
        const i = this.tasks.findIndex(t => t.id === id)
        if (i !== -1) this.tasks[i] = { ...this.tasks[i], ...patch }
      }
    },

    // Eliminar tarea usando la API
    async remove(id: string) {
      try {
        const { deleteTask } = useBackendTasks()
        const taskId = parseInt(id, 10)
        
        if (isNaN(taskId)) {
          throw new Error('ID de tarea inválido')
        }

        const response = await deleteTask(taskId)
        
        if (response.success) {
          // Eliminar del estado local
          this.tasks = this.tasks.filter(t => t.id !== id)
          console.log('✅ Task deleted:', id)
        }
      } catch (error: any) {
        console.error('❌ Error deleting task:', error)
        this.error = error.message || 'Error al eliminar tarea'
        
        // Fallback: eliminar solo local
        this.tasks = this.tasks.filter(t => t.id !== id)
      }
    },

    // Mover tarea (actualizar status)
    async move(id: string, to: TaskStatus, index?: number) {
      const task = this.tasks.find(x => x.id === id)
      if (!task) return

      const oldStatus = task.status
      task.status = to // Actualizar optimísticamente

      try {
        await this.update(id, { status: to })
      } catch (error) {
        // Revertir en caso de error
        task.status = oldStatus
        throw error
      }
    },

    setOrder(status: TaskStatus, orderedIds: string[]) {
      // cuando soltamos una columna completa desde vuedraggable
      const map = new Map(this.tasks.map(t => [t.id, t]))
      const kept = orderedIds.map(id => map.get(id)!).filter(Boolean)
      const others = this.tasks.filter(t => t.status !== status)
      this.tasks = [...others, ...kept]
    },

    // Limpiar errores
    clearError() {
      this.error = null
    }
  }
})
