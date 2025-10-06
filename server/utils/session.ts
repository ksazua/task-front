import { H3Event, getCookie, setCookie, deleteCookie } from 'h3'
import { sealData, unsealData } from 'iron-session'

const SESSION_COOKIE_NAME = 'task-auth-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

interface Session {
  user: {
    id: number
    name: string
    email: string
    created_at?: string
  }
  accessToken: string
  refreshToken: string
  expiresAt: number
}

/**
 * Encripta la sesión usando iron-session (AES-256-GCM)
 */
async function encryptSession(session: Session): Promise<string> {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret
  
  if (!secret || secret === 'default-secret-key-change-in-production') {
    console.warn('⚠️ WARNING: Usando SESSION_SECRET por defecto. Configura SESSION_SECRET en producción!')
  }

  try {
    const sealed = await sealData(session, { password: secret, ttl: SESSION_MAX_AGE })
    return sealed
  } catch (error) {
    console.error('Error encriptando sesión:', error)
    throw new Error('Error al encriptar sesión')
  }
}

/**
 * Desencripta la sesión usando iron-session
 */
async function decryptSession(encrypted: string): Promise<Session | null> {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret

  try {
    const unsealed = await unsealData<Session>(encrypted, { password: secret, ttl: SESSION_MAX_AGE })
    return unsealed
  } catch (error) {
    console.error('Error desencriptando sesión:', error)
    return null
  }
}

/**
 * Guarda la sesión en una cookie httpOnly encriptada
 */
export async function setUserSession(event: H3Event, session: Session) {
  try {
    const encrypted = await encryptSession(session)
    
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true, // No accesible desde JavaScript
      secure: isProduction, // Solo HTTPS en producción
      sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' para cross-site en producción
      maxAge: SESSION_MAX_AGE,
      path: '/',
      // Agregar domain solo si es necesario
      ...(isProduction && { domain: undefined }) // No especificar domain, usar default
    }
    
    console.log('🍪 Configuración de cookie:', {
      name: SESSION_COOKIE_NAME,
      options: cookieOptions,
      environment: isProduction ? 'production' : 'development'
    })
    
    setCookie(event, SESSION_COOKIE_NAME, encrypted, cookieOptions)
    
    console.log('✅ Sesión guardada (encriptada con iron-session AES-256-GCM)')
  } catch (error) {
    console.error('Error guardando sesión:', error)
    throw error
  }
}

/**
 * Obtiene la sesión desde la cookie
 */
export async function getUserSession(event: H3Event): Promise<Session | null> {
  try {
    console.log('🔍 Diagnóstico de sesión:')
    console.log('  - URL:', event.node.req.url)
    console.log('  - Method:', event.node.req.method)
    console.log('  - User-Agent:', event.node.req.headers['user-agent'])
    console.log('  - Cookie header:', event.node.req.headers.cookie)
    
    const encrypted = getCookie(event, SESSION_COOKIE_NAME)
    console.log('  - Session cookie found:', !!encrypted)
    console.log('  - Cookie name looking for:', SESSION_COOKIE_NAME)
    
    if (!encrypted) {
      console.log('❌ No se encontró cookie de sesión')
      return null
    }
    
    console.log('🔓 Desencriptando sesión...')
    const session = await decryptSession(encrypted)
    
    if (!session) {
      console.log('❌ No se pudo desencriptar la sesión')
      return null
    }
    
    console.log('✅ Sesión encontrada:', {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: new Date(session.expiresAt),
      hasToken: !!session.accessToken
    })
    
    // Verificar si la sesión ha expirado
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('⚠️ Sesión expirada')
      clearUserSession(event)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }
}

/**
 * Limpia la sesión
 */
export function clearUserSession(event: H3Event) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  deleteCookie(event, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/'
  })
  console.log('✅ Sesión eliminada')
}

/**
 * Verifica si hay una sesión válida
 */
export async function requireUserAuth(event: H3Event): Promise<Session> {
  const session = await getUserSession(event)
  
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autorizado - Sesión inválida o expirada'
    })
  }
  
  return session
}
