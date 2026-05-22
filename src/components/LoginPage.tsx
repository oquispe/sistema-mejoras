/**
 * LoginPage - Página de inicio de sesión y registro
 *
 * Muestra un formulario para:
 * - Iniciar sesión (si ya tienes cuenta)
 * - Registrarte (si eres nuevo)
 */

import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AREAS_EJEMPLO } from '../types';
import { motion } from 'motion/react';

export default function LoginPage() {
  // Estado: ¿Mostrar login o registro?
  const [isLogin, setIsLogin] = useState(true);

  // Estado del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [area, setArea] = useState('Producción');

  // Estado de la UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Funciones de autenticación
  const { signIn, signUp } = useAuth();

  // Manejar envío del formulario
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isLogin) {
      // INICIAR SESIÓN
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      }
    } else {
      // REGISTRARSE
      if (!nombreCompleto.trim()) {
        setError('El nombre completo es requerido');
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, nombreCompleto, area);
      if (error) {
        // Si es mensaje de confirmación, mostrarlo como éxito
        if (error.includes('confirmar')) {
          setSuccess(error);
        } else {
          setError(error);
        }
      }
    }

    setLoading(false);
  }

  // Cambiar entre login y registro
  function toggleMode() {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e8f5f3] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-[#e5eeff]"
      >
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-3xl">
              lightbulb
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            Sistema de Mejoras
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para participar'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Solo mostrar en registro */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  placeholder="Ej: Juan Pérez García"
                  className="w-full p-3 border border-[#cfd2d9] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-[#f8f9ff]"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Área de trabajo
                </label>
                <select
                  className="w-full p-3 border border-[#cfd2d9] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-[#f8f9ff]"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  {AREAS_EJEMPLO.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tu.correo@empresa.com"
              className="w-full p-3 border border-[#cfd2d9] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-[#f8f9ff]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
              className="w-full p-3 border border-[#cfd2d9] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-[#f8f9ff]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </motion.div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {success}
            </motion.div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-[#1e0fa3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
                {isLogin ? 'Iniciando sesión...' : 'Registrando...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  {isLogin ? 'login' : 'person_add'}
                </span>
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
              </>
            )}
          </button>
        </form>

        {/* Cambiar entre login y registro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-on-surface-variant">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {/* Info adicional */}
        <div className="mt-8 pt-6 border-t border-[#eff4ff]">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-lg">
              verified_user
            </span>
            <span>
              Tu información está protegida y solo será visible para tu equipo.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
