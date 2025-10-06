import { getUserSession } from '~/server/utils/session'
import type { ApiTasksResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    const session = await getUserSession(event)

    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido',
      })
    }

    // Extraer query parameters del request
    const query = getQuery(event)
    const queryParams = new URLSearchParams()
    
    // Agregar filtros disponibles
    if (query.sort_by) queryParams.append('sort_by', String(query.sort_by))
    if (query.order) queryParams.append('order', String(query.order))
    if (query.status) queryParams.append('status', String(query.status))
    if (query.category) queryParams.append('category', String(query.category))
    if (query.start_date_from) queryParams.append('start_date_from', String(query.start_date_from))
    if (query.start_date_to) queryParams.append('start_date_to', String(query.start_date_to))
    if (query.deadline_from) queryParams.append('deadline_from', String(query.deadline_from))
    if (query.deadline_to) queryParams.append('deadline_to', String(query.deadline_to))
    if (query.created_from) queryParams.append('created_from', String(query.created_from))
    if (query.created_to) queryParams.append('created_to', String(query.created_to))
    if (query.search) queryParams.append('search', String(query.search))

    const queryString = queryParams.toString()
    const apiUrl = `${config.public.apiBase}/tasks/${queryString ? '?' + queryString : ''}`
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'User-Agent': 'Nuxt-Task-Frontend',
      'X-Requested-With': 'XMLHttpRequest',
    }

    const response = await $fetch<ApiTasksResponse>(apiUrl, {
      method: 'GET',
      headers,
    })

    return response
  } catch (error: any) {
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al obtener tareas'

    throw createError({
      statusCode,
      statusMessage: errorMessage,
      data: {
        success: false,
        message: errorMessage,
      },
    })
  }
})
