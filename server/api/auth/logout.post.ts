import { clearUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  try {
    // Limpiar la sesión (eliminar cookie httpOnly)
    clearUserSession(event)

    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al cerrar sesión'
    }
  }
})
