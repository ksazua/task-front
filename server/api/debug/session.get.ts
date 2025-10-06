export default defineEventHandler(async (event) => {
  const headers = getHeaders(event)
  const cookies = parseCookies(event)
  
  console.log('🔍 DEBUG SESSION - Full Request Info:')
  console.log('Headers:', headers)
  console.log('Cookies:', cookies)
  console.log('URL:', event.node.req.url)
  console.log('Method:', event.node.req.method)
  console.log('NODE_ENV:', process.env.NODE_ENV)
  
  // Intentar obtener la sesión con logging detallado
  const { getUserSession } = await import('~/server/utils/session')
  
  try {
    const session = await getUserSession(event)
    
    return {
      success: true,
      debug: {
        hasSession: !!session,
        sessionInfo: session ? {
          userId: session.user?.id,
          email: session.user?.email,
          hasAccessToken: !!session.accessToken,
          expiresAt: session.expiresAt,
          expiresIn: session.expiresAt ? Math.floor((session.expiresAt - Date.now()) / 1000 / 60) + ' minutes' : null
        } : null,
        cookies: Object.keys(cookies),
        environment: process.env.NODE_ENV,
        userAgent: headers['user-agent']
      }
    }
  } catch (error: any) {
    console.error('Debug session error:', error)
    
    return {
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode
      },
      debug: {
        hasSession: false,
        cookies: Object.keys(cookies),
        environment: process.env.NODE_ENV,
        userAgent: headers['user-agent']
      }
    }
  }
})