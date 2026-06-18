/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-blue': {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#b9d3ff',
          300: '#7aa8ff',
          400: '#3a7bff',
          500: '#0F172A',
          600: '#0a0f1c',
          700: '#070a14',
          800: '#04060c',
          900: '#020306',
        },
        'risk': {
          high: '#EF4444',
          medium: '#F97316',
          low: '#EAB308',
          resolved: '#10B981',
        },
        'tech-blue': '#3B82F6',
        'card-bg': '#1E293B',
        'card-border': '#334155',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
      fontFamily: {
        'sans': ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll-up': 'scrollUp 20s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-up': 'slideInUp 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'count-up': 'countUp 1s ease-out forwards',
      },
      keyframes: {
        scrollUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.5)',
        'glow-orange': '0 0 15px rgba(249, 115, 22, 0.5)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  plugins: [],
};
