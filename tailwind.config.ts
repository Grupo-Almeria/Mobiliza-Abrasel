import type { Config } from 'tailwindcss'
import { BORDA, CORES, ESPACO, FONTE_SANS, RAIO, SOMBRA } from './lib/design-tokens'

/**
 * O Tailwind cobre layout, espaçamento e responsividade — o que o design system
 * da marca não define. Cor, tipografia, raio e sombra vêm de `design-tokens.ts`,
 * que espelha o `tokens.json` oficial, para que utilitário e classe `.ma-*`
 * nunca pintem cores diferentes.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ma: { ...CORES, borda: BORDA },
      },
      fontFamily: {
        sans: [FONTE_SANS],
      },
      spacing: {
        'ma-1': ESPACO[1],
        'ma-2': ESPACO[2],
        'ma-3': ESPACO[3],
        'ma-4': ESPACO[4],
        'ma-5': ESPACO[5],
        'ma-6': ESPACO[6],
        'ma-7': ESPACO[7],
      },
      borderRadius: {
        'ma-btn': RAIO.btn,
        'ma-sm': RAIO.sm,
        'ma-md': RAIO.md,
        'ma-lg': RAIO.lg,
      },
      boxShadow: {
        'ma-card': SOMBRA.card,
      },
      maxWidth: {
        'ma-container': '1280px',
      },
    },
  },
  plugins: [],
}

export default config
