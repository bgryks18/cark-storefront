import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // cark-next design token'ları ile birebir uyumlu
        primary: {
          DEFAULT: '#3d5bdf',
          dark: '#2141d0',
          light: '#a3c6fb',
          hover: '#e1ebf6',
        },
        gray: {
          DEFAULT: '#999',
          dark: '#777',
          light: '#ededed',
          'light-hover': '#f8fcff',
        },
        black: {
          DEFAULT: '#444',
          dark: '#464545',
        },
        background: '#eee',
        red: {
          DEFAULT: '#e74747',
          light: '#e06868',
          dark: '#971c1c',
        },
        green: {
          DEFAULT: '#3a9a3f',
          dark: '#339c38',
        },
      },
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
