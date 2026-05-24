/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde principal - Crecimiento/Mejora
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Principal
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
        },
        // Azul de apoyo - Confianza/Profesionalismo
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Principal
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
        },
        // Coral/Naranja de acento - Energía/Acción
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Principal
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#f97316',
        },
        // Superficies y texto
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        // Colores semánticos para etiquetas
        tag: {
          proyecto: '#8b5cf6',    // Violeta
          mejora: '#10b981',      // Verde
          innovacion: '#f59e0b',  // Ámbar
          produccion: '#3b82f6',  // Azul
          calidad: '#ec4899',     // Rosa
          seguridad: '#ef4444',   // Rojo
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'glow-primary': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-accent': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        'hero-mesh': 'radial-gradient(at 40% 20%, hsla(160, 84%, 39%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(160, 84%, 39%, 0.2) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
