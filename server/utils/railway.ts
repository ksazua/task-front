// Función helper para generar headers consistentes para Railway
export function createRailwayHeaders(accessToken: string): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; Nuxt-Task-Frontend/1.0)',
    'X-Requested-With': 'XMLHttpRequest',
    ...(isProduction && {
      'Origin': 'https://task-front-hdcjcjlfz-ksazuas-projects.vercel.app',
      'Referer': 'https://task-front-hdcjcjlfz-ksazuas-projects.vercel.app/'
    })
  }
}

// Función para hacer peticiones a Railway con headers optimizados
export async function fetchFromRailway(
  url: string, 
  accessToken: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) {
  console.log(`🔄 ${method} ${url}`)
  
  const headers = createRailwayHeaders(accessToken)
  console.log('📋 Headers:', headers)

  const fetchOptions: any = {
    method,
    headers,
    timeout: 15000
  }

  if (body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = body
  }

  try {
    const response = await $fetch(url, fetchOptions)
    console.log(`✅ ${method} success`)
    return response
  } catch (error: any) {
    console.log(`❌ ${method} failed:`, {
      statusCode: error.statusCode || error.response?.status,
      message: error.message,
      data: error.data || error.response?._data
    })
    throw error
  }
}