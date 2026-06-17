import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg': '#0A0F0C',
        'surface': '#111814',
        'surface-2': '#18221C',
        'surface-3': '#203227',
        'border': '#1E2B22',
        'text-primary': '#FFFFFF',
        'text-secondary': '#92A89B',
        'accent': '#10B981',
        'accent-soft': '#182C22',
        'success': '#10B981',
        'error': '#EF4444',
        'code-bg': '#0F1411',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
        sans: ['Geist', 'Outfit', 'sans-serif'],
        logo: ['Playfair Display', 'serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      fontSize: {
        'xs': ['0.75rem', '1.4'],
        'sm': ['0.875rem', '1.5'],
        'base': ['1rem', '1.6'],
        'lg': ['1.125rem', '1.5'],
        'xl': ['1.25rem', '1.4'],
        '2xl': ['1.5rem', '1.3'],
        '3xl': ['1.875rem', '1.2'],
        '4xl': ['2.25rem', '1.1'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
        'full': '0px',
      },
      maxWidth: {
        'content': '1120px',
      },
      backdropBlur: {
        'sm': '8px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config
