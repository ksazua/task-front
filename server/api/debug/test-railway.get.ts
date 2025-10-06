// Endpoint simple para probar Railway rápidamente
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzU5NzI0ODU1LCJ0eXBlIjoiYWNjZXNzIn0.Jc-z5Oc0l7kKEuf3TnKsCRx1sKuhuPhc20drA-XoLtI'
  
  try {
    console.log('🧪 Test directo a Railway...')
    
    const { fetchFromRailway } = await import('~/server/utils/railway')
    const apiUrl = `${config.public.apiBase}/tasks`
    
    const response = await fetchFromRailway(apiUrl, testToken, 'GET')
    
    return {
      success: true,
      message: 'Test exitoso',
      data: response
    }
    
  } catch (error: any) {
    console.error('❌ Test falló:', error)
    
    return {
      success: false,
      error: {
        statusCode: error.statusCode,
        message: error.message,
        details: error.data
      }
    }
  }
})