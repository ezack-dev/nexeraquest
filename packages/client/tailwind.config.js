/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#0A0B0E',
        surface: '#13151B',
        'surface-hover': '#191C24',
        'surface-inset': '#0E1015',
        tg: {
          DEFAULT: '#3390EC',
          dark: '#2481CC',
        },
      },
    },
  },
  plugins: [],
};
