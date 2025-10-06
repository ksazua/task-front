// Tipos para la API de tareas del backend

export interface ApiTask {
  id: number
  title: string
  description?: string
  category: string
  status: 'planificado' | 'en_progreso' | 'completado'
  start_date: string // ISO string
  deadline: string // ISO string
  user_id: number
  created_at: string // ISO string
  updated_at: string | null // ISO string
}

export interface ApiTasksResponse {
  success: boolean
  message: string
  data: ApiTask[]
}

// Tipo para crear/actualizar tareas
export interface CreateTaskPayload {
  title: string
  description?: string
  category?: string
  status?: 'planificado' | 'en_progreso' | 'completado'
  start_date?: string
  deadline?: string
}

// Mapeo de estados de la API a nuestros estados locales
export const STATUS_MAP = {
  'planificado': 'planned',
  'en_progreso': 'in_progress', 
  'completado': 'done'
} as const

export const REVERSE_STATUS_MAP = {
  'planned': 'planificado',
  'in_progress': 'en_progreso',
  'done': 'completado'
} as const

export type ApiStatus = keyof typeof STATUS_MAP
export type LocalStatus = typeof STATUS_MAP[ApiStatus]