import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'

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
    tasks: seed() as Task[],
    tags: seedTags as Tag[],
    q: '' as string,
    sort: 'created-desc' as 'created-desc'|'created-asc'|'due-asc'|'due-desc',
    statusFilter: 'all' as 'all' | TaskStatus,
    dateFilter: '' as string, // Fecha específica en formato YYYY-MM-DD
    tagFilter: 'all' as 'all' | string, // ID del tag o 'all'
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
    create(input: Partial<Task> & { title: string }) {
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
    },
    bulkCreate(titles: string, base: Partial<Task> = {}) {
      titles.split('\n').map(s => s.trim()).filter(Boolean).forEach(title => {
        this.create({ title, ...base })
      })
    },
    update(id: string, patch: Partial<Task>) {
      const i = this.tasks.findIndex(t => t.id === id)
      if (i !== -1) this.tasks[i] = { ...this.tasks[i], ...patch }
    },
    remove(id: string) {
      this.tasks = this.tasks.filter(t => t.id !== id)
    },
    move(id: string, to: TaskStatus, index?: number) {
      const t = this.tasks.find(x => x.id === id)
      if (!t) return
      t.status = to
      // opcional: reordenar en el array por índice si se pasa
    },
    setOrder(status: TaskStatus, orderedIds: string[]) {
      // cuando soltamos una columna completa desde vuedraggable
      const map = new Map(this.tasks.map(t => [t.id, t]))
      const kept = orderedIds.map(id => map.get(id)!).filter(Boolean)
      const others = this.tasks.filter(t => t.status !== status)
      this.tasks = [...others, ...kept]
    }
  }
})
