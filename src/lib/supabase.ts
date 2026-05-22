/**
 * Cliente de Supabase
 *
 * Este archivo crea una única instancia del cliente de Supabase
 * que usaremos en toda la aplicación para:
 * - Leer datos de la base de datos
 * - Guardar datos en la base de datos
 * - Autenticación de usuarios (en el futuro)
 */

import { createClient } from '@supabase/supabase-js'

// Lee las credenciales desde las variables de entorno
// En Vite, las variables deben empezar con VITE_ para estar disponibles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificación: asegura que las credenciales existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las credenciales de Supabase. ' +
    'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
  )
}

// Crea y exporta el cliente de Supabase
// Este cliente es el que usaremos para todas las operaciones con la base de datos
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Función simple para probar la conexión a Supabase
 * Retorna true si la conexión es exitosa, false si falla
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Intenta hacer una consulta simple al servidor
    // Esto verifica que las credenciales son válidas
    const { error } = await supabase.from('_test_connection').select('*').limit(1)

    // Si el error es "relation does not exist", ¡la conexión funciona!
    // Solo significa que la tabla no existe, pero el servidor respondió
    if (error && error.code === '42P01') {
      return {
        success: true,
        message: '✅ Conexión exitosa a Supabase (la tabla de prueba no existe, pero la conexión funciona)'
      }
    }

    // Si hay otro tipo de error, puede ser problema de credenciales
    if (error && error.code !== '42P01') {
      return {
        success: false,
        message: `❌ Error de conexión: ${error.message}`
      }
    }

    // Si no hay error, la conexión funciona perfectamente
    return {
      success: true,
      message: '✅ Conexión exitosa a Supabase'
    }
  } catch (err) {
    return {
      success: false,
      message: `❌ Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`
    }
  }
}
