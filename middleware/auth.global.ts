export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicRoutes = ['/login', '/registro', '/']
  const isPublicRoute = publicRoutes.includes(to.path)

  try {
    let session

    if (process.server) {
      // ✅ En SSR: usa los headers del request, para incluir cookies reales
      const headers = useRequestHeaders(['cookie'])
      console.log('🔍 Middleware SSR - Headers:', headers)
      console.log('🔍 Middleware SSR - Route:', to.path)
      
      session = await $fetch('/api/auth/session', {
        headers,
        credentials: 'include'
      })
      
      console.log('🔍 Middleware SSR - Session result:', {
        success: session?.success,
        isAuthenticated: session?.isAuthenticated,
        hasUser: !!session?.user
      })
    } else {
      // ✅ En cliente: solo intenta si ya está montado
      console.log('🔍 Middleware Client - Route:', to.path)
      
      session = await $fetch('/api/auth/session', {
        credentials: 'include'
      })
      
      console.log('🔍 Middleware Client - Session result:', {
        success: session?.success,
        isAuthenticated: session?.isAuthenticated,
        hasUser: !!session?.user
      })
    }

    const isAuthenticated = session?.success && session?.isAuthenticated

    // ✅ Redirecciones
    if (isAuthenticated && isPublicRoute) {
      return navigateTo('/inicio', { replace: true })
    }

    if (!isAuthenticated && !isPublicRoute) {
      return navigateTo('/login', { replace: true })
    }

    // ✅ Renovación si falta poco
    if (isAuthenticated && session.expiresAt) {
      const timeUntilExpiry = session.expiresAt - Date.now()
      const oneDay = 24 * 60 * 60 * 1000
      if (timeUntilExpiry < oneDay) {
        try {
          await $fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
        } catch (err) {
          console.error('Error renovando token', err)
        }
      }
    }
  } catch (error: any) {
    // Si el servidor retorna 401 u otro error
    if (!isPublicRoute) {
      return navigateTo('/login', { replace: true })
    }
  }
})
