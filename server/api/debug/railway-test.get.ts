// Endpoint para probar directamente la conexión con Railway
export default defineEventHandler(async (event): Promise<any> => {
  const config = useRuntimeConfig()
  
  try {
    // Obtener token de la query o headers para testing
    const query = getQuery(event)
    const testToken = query.token as string || 
                     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzU5NzI0ODU1LCJ0eXBlIjoiYWNjZXNzIn0.Jc-z5Oc0l7kKEuf3TnKsCRx1sKuhuPhc20drA-XoLtI'
    
    if (!testToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token requerido en query ?token=...'
      })
    }

    const apiUrl = `${config.public.apiBase}/tasks`
    
    console.log('🧪 Testing Railway connection...')
    console.log('API URL:', apiUrl)
    console.log('Token:', testToken)
    
    // Probar con diferentes configuraciones de headers
    const headerConfigs: Array<{name: string, headers: Record<string, string>}> = [
      {
        name: 'Postman-like',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PostmanRuntime/7.29.2'
        }
      },
      {
        name: 'Browser-like',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Origin': 'https://task-front-hdcjcjlfz-ksazuas-projects.vercel.app',
          'Referer': 'https://task-front-hdcjcjlfz-ksazuas-projects.vercel.app/'
        }
      },
      {
        name: 'Minimal',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      }
    ]

    const results = []
    
    for (const config of headerConfigs) {
      try {
        console.log(`\n🔍 Probando configuración: ${config.name}`)
        console.log('Headers:', config.headers)
        
        const response = await $fetch<any>(apiUrl, {
          method: 'GET',
          headers: config.headers,
          timeout: 10000
        })
        
        results.push({
          config: config.name,
          success: true,
          response: {
            success: response?.success || false,
            taskCount: response?.data?.length || 0
          }
        })
        
        console.log(`✅ ${config.name} - Success!`)
        
      } catch (error: any) {
        console.log(`❌ ${config.name} - Error:`, error.statusCode, error.message)
        
        results.push({
          config: config.name,
          success: false,
          error: {
            statusCode: error.statusCode || error.response?.status,
            message: error.message,
            data: error.data || error.response?._data
          }
        })
      }
    }
    
    return {
      success: true,
      apiUrl,
      token: testToken.substring(0, 20) + '...', // Mostrar solo parte del token
      results
    }
    
  } catch (error: any) {
    console.error('Test error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error en test'
    })
  }
})