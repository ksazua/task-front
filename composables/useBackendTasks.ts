import type { ApiTasksResponse, CreateTaskPayload } from '~/types/api'

export const useBackendTasks = () => {
  const { user } = useAuth()

  // Obtener todas las tareas del usuario autenticado
  const fetchTasks = async (): Promise<ApiTasksResponse> => {
    console.log('🔗 Fetching tasks from API...')
    
    try {
      const response = await $fetch<ApiTasksResponse>('/api/tasks', {
        method: 'GET',
        credentials: 'include'
      })
      
      console.log('✅ Tasks fetched successfully:', response)
      return response
    } catch (error) {
      console.error('❌ Error fetching tasks:', error)
      throw error
    }
  }

  // Crear una nueva tarea
  const createTask = async (payload: CreateTaskPayload): Promise<ApiTasksResponse> => {
    console.log('🔗 Creating task:', payload)
    
    try {
      const response = await $fetch<ApiTasksResponse>('/api/tasks', {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })
      
      console.log('✅ Task created successfully:', response)
      return response
    } catch (error) {
      console.error('❌ Error creating task:', error)
      throw error
    }
  }

  // Actualizar una tarea existente
  const updateTask = async (id: number, payload: Partial<CreateTaskPayload>): Promise<ApiTasksResponse> => {
    console.log('🔗 Updating task:', id, payload)
    
    try {
      const response = await $fetch<ApiTasksResponse>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: payload,
        credentials: 'include'
      })
      
      console.log('✅ Task updated successfully:', response)
      return response
    } catch (error) {
      console.error('❌ Error updating task:', error)
      throw error
    }
  }

  // Eliminar una tarea
  const deleteTask = async (id: number): Promise<ApiTasksResponse> => {
    console.log('🔗 Deleting task:', id)
    
    try {
      const response = await $fetch<ApiTasksResponse>(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      console.log('✅ Task deleted successfully:', response)
      return response
    } catch (error) {
      console.error('❌ Error deleting task:', error)
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
