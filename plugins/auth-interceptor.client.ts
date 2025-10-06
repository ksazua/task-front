export default defineNuxtPlugin(() => {
  // Solo ejecutar en el cliente
  if (process.server) return

  let isRefreshing = false
  let failedQueue: Array<{
    resolve: (result: any) => void
    reject: (error: any) => void
    request: any
  }> = []

  const processQueue = (error: any) => {
    failedQueue.forEach(({ resolve, reject, request }) => {
      if (error) {
        reject(error)
      } else {
        // Reintentar cada petición de la cola
        $fetch(request)
          .then(resolve)
          .catch(reject)
      }
    })
    
    failedQueue = []
  }

  const handleTokenRefresh = async (originalRequest: any) => {
    if (isRefreshing) {
      // Si ya estamos refrescando, agregar a la cola
      return new Promise((resolve, reject) => {
        failedQueue.push({ 
          resolve, 
          reject, 
          request: originalRequest 
        })
      })
    }

    isRefreshing = true

    try {
      // Intentar renovar el token
      await $fetch('/api/auth/refresh', { 
        method: 'POST',
        retry: false // No reintentar el refresh
      })
      
      // Procesar cola de peticiones pendientes
      processQueue(null)
      
      // Reintentar la petición original
      return await $fetch(originalRequest)
      
    } catch (refreshError) {
      // Procesar cola con error
      processQueue(refreshError)
      
      // Si falla el refresh, cerrar sesión usando el composable
      try {
        const { clearSession } = useAuth()
        await clearSession()
      } catch (authError) {
        // Fallback: limpiar manualmente y redireccionar
        if (typeof localStorage !== 'undefined') {
          localStorage.clear()
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear()
        }
        await navigateTo('/login')
      }
      
      throw refreshError
    } finally {
      isRefreshing = false
    }
  }

  // Crear interceptor global para $fetch
  const originalFetch = globalThis.$fetch
  
  globalThis.$fetch = $fetch.create({
    async onResponseError({ response, request }) {
      // Solo procesar errores 401 no autorizados
      if (response.status !== 401) {
        return
      }

      // No procesar endpoints de auth para evitar loops
      let requestUrl = ''

      if (typeof request === 'string') {
        requestUrl = request
      } else if (request instanceof Request) {
        requestUrl = request.url
      } else if (request && typeof request === 'object' && 'url' in request) {
        // @ts-expect-error - ofetch internal request object
        requestUrl = request.url as string
      }

      let url = requestUrl
      try {
        if (requestUrl) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
          url = new URL(requestUrl, origin).pathname
        }
      } catch (error) {
        // Si no es un URL absoluto, mantener valor original
        url = requestUrl
      }

      const bypassPaths = [
        '/api/auth/refresh',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/session',
        '/auth/refresh',
        '/auth/login',
        '/auth/logout',
        '/auth/session'
      ]

      if (bypassPaths.some(path => url.includes(path))) {
        return
      }

      try {
        // Intentar renovar token y reintentar petición
        await handleTokenRefresh(request)
      } catch (error) {
        // Si todo falla, propagar el error
        throw error
      }
    }
  })
})