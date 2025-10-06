import { getUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const year = getRouterParam(event, 'year')
  const month = getRouterParam(event, 'month')
  
  try {
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    if (!year || !month) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Year y month son requeridos'
      })
    }

    const apiUrl = `${config.public.apiBase}/tasks/calendar/${year}/${month}`
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'User-Agent': 'Nuxt-Task-Frontend',
      'X-Requested-With': 'XMLHttpRequest',
    }
    
    const response = await $fetch(apiUrl, {
      method: 'GET',
      headers,
    })

    return response
  } catch (error: any) {
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al obtener tareas del calendario'
    
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