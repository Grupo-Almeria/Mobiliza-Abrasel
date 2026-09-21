/**
 * Tokens de design do Mobiliza Abrasel.
 *
 * Espelha `content/.tokens-marca.json`, que é o arquivo oficial entregue pela
 * marca. Os valores NÃO devem ser editados aqui à mão: se a marca publicar um
 * token novo, atualize o JSON oficial e ajuste este arquivo — o passo de
 * validação do build compara os dois e falha se divergirem.
 *
 * Este módulo alimenta o `tailwind.config.ts`. As mesmas cores também existem
 * como custom properties `--ma-*` em `styles/tokens-marca.css`, que é o arquivo
 * da marca servido intacto.
 */

export const CORES = {
  green: '#00652E',
  orange: '#F58220',
  lime: '#8DC63F',
  charcoal: '#231F20',
  cream: '#F7F4EE',
  blue: '#25408F',
  red: '#B11116',
  white: '#FFFFFF',
} as const

/** Borda de 1px de card sobre fundo branco. */
export const BORDA = 'rgba(35,31,32,0.10)'

/** Base 8px. Os nomes seguem os tokens `--ma-space-N` da marca. */
export const ESPACO = {
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '48px',
  6: '64px',
  7: '96px',
} as const

export const RAIO = {
  btn: '14px',
  sm: '12px',
  md: '20px',
  lg: '32px',
} as const

export const SOMBRA = {
  card: '0 14px 40px rgba(35,31,32,0.10)',
} as const

export const FONTE_SANS = 'Poppins, Inter, Arial, system-ui, sans-serif'

/**
 * Pares texto/fundo autorizados pela marca, com a razão de contraste medida.
 * Serve de referência ao escrever componentes — nunca use uma combinação que
 * não esteja aqui. Branco sobre laranja (2.59) e branco sobre lima (2.04) são
 * proibidos e por isso não aparecem nesta lista.
 */
export const CONTRASTE_AUTORIZADO = {
  'branco-sobre-verde': 7.24,
  'branco-sobre-carvao': 16.3,
  'carvao-sobre-laranja': 6.28,
  'carvao-sobre-lima': 7.98,
  'branco-sobre-azul': 9.51,
} as const
