/**
 * `postcss-import` roda antes do Tailwind para inlinar o @import do
 * styles/tokens-marca.css. Sem ele, o arquivo chegaria ao navegador como import
 * separado e a diretiva `@layer components` de dentro dele nunca seria
 * processada pelo Tailwind — que é justamente o que coloca as classes da marca
 * na posição certa da cascata.
 */
const config = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
