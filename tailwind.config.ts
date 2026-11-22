import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5fa',
          100: '#dfe7f2',
          700: '#1b4379',
          800: '#12305a',
          900: '#0b1f3a',
          950: '#071426',
        },
        ink: '#23272e',
        muted: '#5d6673',
        rule: '#dcdfe4',
        wash: '#f6f7f9',
        signal: '#9a2b1f',
        paper: '#ffffff',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
