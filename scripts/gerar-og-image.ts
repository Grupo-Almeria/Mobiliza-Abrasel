/**
 * Gera public/og-image.jpg — a imagem da prévia do link.
 *
 * É o item mais crítico da estratégia do site: a prévia é a primeira impressão
 * e acontece dentro da conversa do WhatsApp, antes de qualquer HTML carregar.
 *
 * Restrições que a arte precisa respeitar:
 *  - 1200×630 e abaixo de 300 KB; acima disso o WhatsApp não renderiza a prévia;
 *  - funcionar no corte quadrado que o WhatsApp aplica em alguns contextos, o
 *    que significa manter tudo que importa no miolo e nada colado nas bordas.
 *
 * A composição é só marca: verde institucional, os arcos do símbolo e o
 * logotipo negativo, centralizado, com respiro largo. Sem texto renderizado —
 * o título e a descrição já aparecem como texto na própria prévia, e depender
 * de fonte instalada no sistema para rasterizar tornaria o resultado imprevisível
 * de máquina para máquina.
 *
 * Rode com `npm run og`.
 */

import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

import { CORES } from '../lib/design-tokens'

const LARGURA = 1200
const ALTURA = 630
const LIMITE_KB = 300

/** Área segura: nada de essencial fora do quadrado central de 630×630. */
const LADO_SEGURO = ALTURA

async function main() {
  const raizPublica = path.join(process.cwd(), 'public')

  // Fundo verde com os arcos da marca, na mesma construção do símbolo.
  const fundo = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}">
  <rect width="${LARGURA}" height="${ALTURA}" fill="${CORES.green}"/>
  <g fill="none" stroke-linecap="round" stroke-width="16">
    <path d="M 210 470 A 300 300 0 0 1 990 470" stroke="${CORES.white}" opacity="0.10"/>
    <path d="M 300 530 A 220 220 0 0 1 900 530" stroke="${CORES.lime}" opacity="0.22"/>
    <path d="M 390 585 A 150 150 0 0 1 810 585" stroke="${CORES.orange}" opacity="0.26"/>
  </g>
  <rect x="0" y="${ALTURA - 10}" width="${LARGURA}" height="10" fill="${CORES.orange}"/>
</svg>`

  // Logotipo negativo, dimensionado para caber com folga na área segura.
  const logoSvg = readFileSync(
    path.join(raizPublica, 'marca', 'Mobiliza_Abrasel_02_Horizontal_Negativo_Cor.svg'),
  )
  const larguraLogo = Math.round(LADO_SEGURO * 0.78)
  const logo = await sharp(logoSvg, { density: 300 })
    .resize({ width: larguraLogo })
    .png()
    .toBuffer()

  const { height: alturaLogo = 0 } = await sharp(logo).metadata()

  const destino = path.join(raizPublica, 'og-image.jpg')

  await sharp(Buffer.from(fundo))
    .composite([
      {
        input: logo,
        left: Math.round((LARGURA - larguraLogo) / 2),
        // Levemente acima do centro geométrico: o filete inferior equilibra.
        top: Math.round((ALTURA - alturaLogo) / 2 - 20),
      },
    ])
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(destino)

  const kb = statSync(destino).size / 1024
  const metadados = await sharp(destino).metadata()

  console.log(`  ✓  og-image.jpg — ${metadados.width}×${metadados.height}, ${kb.toFixed(0)} KB`)

  if (metadados.width !== LARGURA || metadados.height !== ALTURA) {
    console.error(`  ✖  dimensões erradas: o WhatsApp espera ${LARGURA}×${ALTURA}.`)
    process.exit(1)
  }

  if (kb > LIMITE_KB) {
    console.error(`  ✖  ${kb.toFixed(0)} KB passa do limite de ${LIMITE_KB} KB.`)
    console.error('      Acima disso o WhatsApp não renderiza a prévia. Reduza a qualidade do JPEG.')
    process.exit(1)
  }
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
