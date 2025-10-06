import { getUserSession } from '~/server/utils/session'
import type { ApiTasksResponse, CreateTaskPayload } from '~/types/api'

interface BulkTaskPayload {
  tasks: CreateTaskPayload[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) as BulkTaskPayload
  
  try {
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    // Validar que se enviaron tareas
    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Se requiere un array de tareas no vacío'
      })
    }

    // Preparar datos en el formato que espera el backend
    const bulkData = {
      tasks: body.tasks.map(task => ({
        title: task.title,
        description: task.description || "",
        category: task.category || "General",
        status: task.status || "planificado",
        start_date: task.start_date || new Date().toISOString(),
        deadline: task.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
    }

    const apiUrl = `${config.public.apiBase}/tasks/bulk`
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'User-Agent': 'Nuxt-Task-Frontend',
      'X-Requested-With': 'XMLHttpRequest',
    }
    
    const response = await $fetch<ApiTasksResponse>(apiUrl, {
      method: 'POST',
      headers,
      body: bulkData
    })

    return response
  } catch (error: any) {
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al crear tareas en masa'
    
    throw createError({
      statusCode,
      statusMessage: errorMessage,
      data: {
        success: false,
        message: errorMessage
      }
    })
  }
})