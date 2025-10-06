import { getUserSession } from '~/server/utils/session'
import type { CategoryResponse } from '~/types/api'

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

    const apiUrl = `${config.public.apiBase}/tasks/categories`
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'User-Agent': 'Nuxt-Task-Frontend',
      'X-Requested-With': 'XMLHttpRequest',
    }

    const response = await $fetch<CategoryResponse>(apiUrl, {
      method: 'GET',
      headers,
    })

    return response
  } catch (error: any) {
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al obtener categorías'

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