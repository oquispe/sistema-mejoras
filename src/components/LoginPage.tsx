/**
 * LoginPage - Página de inicio de sesión y registro
 * Diseño moderno con identidad visual fuerte
 */

import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AREAS_EJEMPLO } from '../types';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [area, setArea] = useState('Producción');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailSent(false);
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      }
    } else {
      if (!nombreCompleto.trim()) {
        setError('El nombre completo es requerido');
        setLoading(false);
        return;
      }

      const { error, needsEmailConfirmation } = await signUp(email, password, nombreCompleto, area);

      if (error) {
        setError(error);
      } else if (needsEmailConfirmation) {
        setEmailSent(true);
      }
    }

    setLoading(false);
  }

  function toggleMode() {
    setIsLogin(!isLogin);
    setError(null);
    setEmailSent(false);
  }

  // Pantalla de "revisa tu correo"
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-soft-lg p-8 w-full max-w-md border border-surface-200 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
            <span className="material-symbols-outlined text-white text-4xl">
              mark_email_read
            </span>
          </div>

          <h1 className="text-2xl font-display font-bold text-surface-900 mb-3">
            ¡Revisa tu correo!
          </h1>

          <p className="text-surface-500 mb-2">
            Enviamos un enlace de confirmación a:
          </p>

          <p className="font-semibold text-primary-600 mb-6">
            {email}
          </p>

          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-secondary-800 font-semibold">
              Pasos:
            </p>
            <ol className="text-sm text-secondary-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Abre tu correo electrónico</li>
              <li>Busca el email de confirmación</li>
              <li>Haz clic en el enlace</li>
              <li>Regresa e inicia sesión</li>
            </ol>
          </div>

          <button
            onClick={() => {
              setEmailSent(false);
              setIsLogin(true);
            }}
            className="w-full btn-primary"
          >
            <span className="material-symbols-outlined">login</span>
            Ya confirmé, iniciar sesión
          </button>

          <button
            onClick={() => setEmailSent(false)}
            className="mt-4 text-sm text-surface-500 hover:text-primary-600 transition-colors"
          >
            ← Volver al registro
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col lg:flex-row">
      {/* Panel izquierdo - Branding (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          {/* Logo grande */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg border border-white/30">
              <span className="material-symbols-outlined text-5xl">
                trending_up
              </span>
            </div>

            <h1 className="text-4xl font-display font-bold mb-4">
              Mejora Continua
            </h1>

            <p className="text-xl text-white/80 mb-8 max-w-md">
              Transforma ideas en resultados. Comparte, colabora y celebra los logros de tu equipo.
            </p>

            {/* Stats decorativos */}
            <div className="flex justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold">+150</div>
                <div className="text-sm text-white/70">Mejoras activas</div>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-white/70">Áreas participando</div>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-white/70">Satisfacción</div>
              </div>
            </div>
          </motion.div>

          {/* Footer del panel */}
          <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-sm">
            Sistema de Gestión de Mejoras © 2024
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
              <span className="material-symbols-outlined text-white text-3xl">
                trending_up
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-surface-900">
              Mejora Continua
            </h1>
          </div>

          {/* Card del formulario */}
          <div className="bg-white rounded-3xl shadow-soft-lg p-6 sm:p-8 border border-surface-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-surface-900">
                {isLogin ? '¡Bienvenido!' : 'Únete al equipo'}
              </h2>
              <p className="text-surface-500 mt-2">
                {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para participar'}
              </p>
            </div>

            {/* Toggle Login/Register */}
            <div className="flex p-1 bg-surface-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  isLogin
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                Registrarse
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xl">
                        person
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Juan Pérez García"
                        className="input-modern"
                        style={{ paddingLeft: '2.75rem' }}
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">
                      Área de trabajo
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xl">
                        business
                      </span>
                      <select
                        className="input-modern appearance-none cursor-pointer"
                        style={{ paddingLeft: '2.75rem' }}
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      >
                        {AREAS_EJEMPLO.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 text-xl pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xl">
                    email
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="tu.correo@empresa.com"
                    className="input-modern"
                    style={{ paddingLeft: '2.75rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xl">
                    lock
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="input-modern"
                    style={{ paddingLeft: '2.75rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-base mt-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      {isLogin ? 'login' : 'person_add'}
                    </span>
                    {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-surface-100">
              <div className="flex items-center gap-3 text-sm text-surface-500">
                <span className="material-symbols-outlined text-primary-500 text-xl">
                  verified_user
                </span>
                <span>
                  Tu información está protegida y solo será visible para tu equipo.
                </span>
              </div>
            </div>
          </div>

          {/* Copyright móvil */}
          <p className="lg:hidden text-center text-sm text-surface-400 mt-6">
            Sistema de Gestión de Mejoras © 2024
          </p>
        </motion.div>
      </div>
    </div>
  );
}
