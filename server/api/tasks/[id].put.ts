import { getUserSession } from '~/server/utils/session'
import type { ApiTasksResponse, CreateTaskPayload } from '~/types/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const taskId = getRouterParam(event, 'id')
  const body = await readBody(event) as Partial<CreateTaskPayload>
  
  try {
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    // Preparar datos en el formato que espera el backend
    const updateData = {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category && { category: body.category }),
      ...(body.status && { status: body.status }),
      ...(body.start_date && { start_date: body.start_date }),
      ...(body.deadline && { deadline: body.deadline })
    }

    const apiUrl = `${config.public.apiBase}/tasks/${taskId}`
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'User-Agent': 'Nuxt-Task-Frontend',
      'X-Requested-With': 'XMLHttpRequest',
    }
    
    const response = await $fetch<ApiTasksResponse>(apiUrl, {
      method: 'PUT',
      headers,
      body: updateData
    })

    return response
  } catch (error: any) {
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al actualizar tarea'
    
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