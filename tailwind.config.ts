import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',                // Busca en la raíz (App.tsx, index.tsx)
    './components/**/*.{js,ts,jsx,tsx}', // Busca en components
    './context/**/*.{js,ts,jsx,tsx}',    // Busca en context
    './lib/**/*.{js,ts,jsx,tsx}',        // Busca en lib
    './types/**/*.{js,ts,jsx,tsx}'       // Busca en types
  ],
  theme: {
    extend: {
      colors: {
        'void-black': '#000000',
        'void-gray': '#0A0A0A',
        'void-border': '#1F1F1F',
        'tech-green': '#00FF41',
        
        // Rarity Tiers
        'rank-dust': '#4A4A4A', 
        'rank-common': '#FFFFFF', 
        'rank-uncommon': '#00D1FF', 
        'rank-rare': '#BC13FE', 
        'rank-legendary': '#FFD700', 
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'shake-glitch': {
          '0%, 100%': { transform: 'translateX(0)', borderColor: 'transparent' },
          '10%, 90%': { transform: 'translateX(-4px)', borderColor: '#FF003C' },
          '20%, 80%': { transform: 'translateX(4px)', borderColor: '#FF003C' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)', borderColor: '#FF003C' },
          '40%, 60%': { transform: 'translateX(4px)', borderColor: '#FF003C' },
        }
      },
      animation: {
        'shake-glitch': 'shake-glitch 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;