/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sika: {
          red:        '#C8102E',
          'red-dark': '#A00D24',
          'red-light':'#E8314F',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.1),  0 4px 8px rgba(0,0,0,0.04)',
        'red':     '0 4px 14px rgba(200,16,46,0.25)',
        'red-sm':  '0 2px 8px  rgba(200,16,46,0.2)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'hero-gradient':   'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'red-gradient':    'linear-gradient(135deg, #C8102E 0%, #E8314F 100%)',
        'card-gradient':   'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        'subtle-grid':     'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
      },
      animation: {
        'fade-in':   'fadeIn 0.35s ease-out both',
        'slide-up':  'slideUp 0.4s ease-out both',
        'scale-in':  'scaleIn 0.25s ease-out both',
        'float':     'float 3s ease-in-out infinite',
        'shimmer':   'shimmer 1.4s infinite',
        'pulse-ring':'pulse-ring 1.5s ease-out infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.96)' },      to: { opacity: '1', transform: 'scale(1)' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer:    { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(200,16,46,0.25)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(200,16,46,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(200,16,46,0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
