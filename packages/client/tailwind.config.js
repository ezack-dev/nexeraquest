/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#09090B',
        surface: '#111216',
        'surface-elevated': '#171920',
        'surface-inset': '#0B0C0F',
        border: '#22242C',
        azure: {
          DEFAULT: '#2481CC',
          light: '#2AABEE',
          hover: '#1D74BB',
        },
      },
    },
  },
  plugins: [],
};
