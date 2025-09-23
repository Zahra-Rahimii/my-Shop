module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        body: ['iran_yekan', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f8ff',
          100: '#e6f3ff',
          200: '#c3e6ff',
          300: '#99d6ff',
          400: '#66c2ff',
          500: '#40adff', // آبی آسمانی ملایم
          600: '#3399e6',
          700: '#2677cc',
          800: '#1a5fb3',
          900: '#0f4780',
        },
        danger: {
          50: '#fff5f5',
          100: '#ffeaea',
          200: '#ffd4d4',
          300: '#ffb3b3',
          400: '#ff9999',
          500: '#ff8080', // قرمز صورتی نرم
          600: '#e66666',
          700: '#cc4d4d',
          800: '#b33333',
          900: '#801a1a',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          400: '#86efac',
          500: '#4ade80',
          600: '#22c55e',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'scale-up': 'scaleUp 0.3s ease-in-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'soft-fade': 'softFade 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        softFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 1px 4px rgba(0, 0, 0, 0.08)',
        'soft-dark': '0 2px 6px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      transitionDuration: {
        400: '400ms',
      },
      scale: {
        102: '1.02', // اضافه کردن scale-102
      },
    },
  },
  plugins: [],
};