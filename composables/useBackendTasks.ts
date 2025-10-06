import type { ApiTasksResponse, CreateTaskPayload, TaskFilters } from '~/types/api'

export const useBackendTasks = () => {
  const { user } = useAuth()

  // Obtener todas las tareas del usuario autenticado
  const fetchTasks = async (filters?: TaskFilters): Promise<ApiTasksResponse> => {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value))
          }
        })
      }
      
      const queryString = queryParams.toString()
      const url = `/api/tasks${queryString ? '?' + queryString : ''}`
      
      const response = await $fetch<ApiTasksResponse>(url, {
        method: 'GET',
        credentials: 'include'
      })
      
      return response
    } catch (error) {
      throw error
    }
  }

  // Crear una nueva tarea
  const createTask = async (payload: CreateTaskPayload): Promise<ApiTasksResponse> => {
    try {
      const response = await $fetch<ApiTasksResponse>('/api/tasks', {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })
      
      return response
    } catch (error) {
      throw error
    }
  }

  // Actualizar una tarea existente
  const updateTask = async (id: number, payload: Partial<CreateTaskPayload>): Promise<ApiTasksResponse> => {
    try {
      const response = await $fetch<ApiTasksResponse>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: payload,
        credentials: 'include'
      })
      
      return response
    } catch (error) {
      throw error
    }
  }

  // Eliminar una tarea
  const deleteTask = async (id: number): Promise<ApiTasksResponse> => {
    try {
      const response = await $fetch<ApiTasksResponse>(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      return response
    } catch (error) {
      throw error
    }
  }

  return {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask
  }
}
