/**
 * Gera a imagem da prévia do link — o arquivo apontado por CAMINHO_OG_IMAGE.
 *
 * É o item mais crítico da estratégia do site: a prévia é a primeira impressão
 * e acontece dentro da conversa do WhatsApp, antes de qualquer HTML carregar.
 *
 * ## Por que o Chromium e não o `sharp`
 *
 * A primeira versão desenhava a arte em SVG e rasterizava com `sharp`. Isso
 * funciona para formas, mas não para texto: o `sharp` desenha texto pela fonte
 * instalada no sistema, via fontconfig, e a Poppins não está instalada em lugar
 * nenhum — nem aqui, nem na máquina de quem rodar isto depois. O resultado
 * cairia em alguma fonte de fallback, diferente a cada máquina. Por causa disso
 * a arte original ficou só com o logotipo, sem uma palavra.
 *
 * Renderizar no Chromium resolve de forma definitiva: a Poppins entra embutida
 * na página, em base64, a partir dos mesmos .woff2 que o site serve. Nada
 * depende do sistema operacional, e a tipografia da peça passa a ser exatamente
 * a tipografia da marca.
 *
 * Tudo entra embutido (fonte e logotipo como data URI) de propósito: assim a
 * página é montada com `setContent` e o Chromium não precisa buscar nenhum
 * arquivo — some junto a restrição de CORS que `file://` impõe a `@font-face`.
 *
 * ## Isto NÃO roda no build
 *
 * O script é manual (`npm run og`) e a imagem vai versionada no git. A Vercel
 * nunca executa o Chromium: o `prebuild` roda só a validação de conteúdo. O que
 * a validação faz é conferir se o arquivo gerado aqui existe e está dentro das
 * medidas — se alguém mudar o texto e esquecer de rodar `npm run og`, o build
 * não quebra, mas o texto novo também não aparece na prévia. Rode o script
 * sempre que mexer em `ogFrase` ou `ogRodape`.
 */

import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

import { lerConfig } from '../lib/conteudo'
import { CORES } from '../lib/design-tokens'
import { CAMINHO_OG_IMAGE, OG_ALTURA, OG_LARGURA, OG_LIMITE_KB } from '../lib/og'

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

/**
 * Renderizar no dobro e reduzir dá texto visivelmente mais limpo do que
 * renderizar no tamanho final: a redução faz o antialiasing.
 */
const ESCALA = 2

const RAIZ_PUBLICA = path.join(process.cwd(), 'public')

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fonteEmbutida(peso: number): string {
  const arquivo = path.join(RAIZ_PUBLICA, 'fontes', `poppins-latin-${peso}.woff2`)
  const base64 = readFileSync(arquivo).toString('base64')

  return `@font-face{font-family:Poppins;font-style:normal;font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${base64}) format('woff2')}`
}

function logoEmbutido(): string {
  const arquivo = path.join(RAIZ_PUBLICA, 'marca', 'Mobiliza_Abrasel_02_Horizontal_Negativo_Cor.svg')
  return `data:image/svg+xml;base64,${readFileSync(arquivo).toString('base64')}`
}

/**
 * Os três arcos da marca, na mesma construção do símbolo, ancorados no pé da
 * peça para funcionarem como horizonte atrás do texto. Opacidade baixa: aqui
 * eles são textura, não elemento de leitura.
 */
function arcos(): string {
  return `<svg class="arcos" viewBox="0 0 ${OG_LARGURA} ${OG_ALTURA}" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke-linecap="round" stroke-width="18" transform="translate(0,312)">
        <path d="M 60 470 A 420 420 0 0 1 1140 470" stroke="${CORES.white}" opacity="0.07"/>
        <path d="M 195 530 A 315 315 0 0 1 1005 530" stroke="${CORES.lime}" opacity="0.14"/>
        <path d="M 330 588 A 215 215 0 0 1 870 588" stroke="${CORES.orange}" opacity="0.22"/>
      </g>
    </svg>`
}

function montarHtml(frase: string, rodape: string, endereco: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>
  ${fonteEmbutida(700)}
  ${fonteEmbutida(500)}

  *{margin:0;padding:0;box-sizing:border-box}

  body{
    width:${OG_LARGURA}px;height:${OG_ALTURA}px;
    background:${CORES.green};
    font-family:Poppins;
    position:relative;overflow:hidden;
    -webkit-font-smoothing:antialiased;
  }

  .arcos{position:absolute;inset:0;width:100%;height:100%}

  /*
    Coluna centralizada e estreita de propósito. O WhatsApp mostra os 1200×630
    inteiros no cartão grande, mas corta num quadrado central em alguns
    contextos — manter a composição no miolo é o que sobrevive aos dois.
  */
  main{
    position:relative;
    height:100%;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    /* Recuo maior no pé para o bloco central subir e abrir espaço à assinatura. */
    padding:56px 180px 128px;
    text-align:center;
  }

  .logo{width:284px;height:auto;display:block}

  .frase{
    margin-top:42px;
    max-width:760px;
    font-weight:700;font-size:64px;line-height:1.1;letter-spacing:-0.015em;
    color:${CORES.white};
    /* Branco sobre verde: 7,24 de contraste, par autorizado pela marca. */
    text-wrap:balance;
  }

  /*
    Fora do fluxo do <main> de propósito: no fluxo, o justify-content:center
    dividia a sobra entre o bloco central e o pé e abria um vazio no meio da
    peça. Ancorado embaixo, o miolo fica compacto e a assinatura fica firme
    acima do filete.
  */
  .pe{
    position:absolute;left:0;right:0;bottom:46px;
    display:flex;flex-direction:column;gap:6px;
    text-align:center;
    font-weight:500;font-size:22px;line-height:1.3;letter-spacing:0.01em;
  }
  .pe .contexto{color:${CORES.lime}}
  .pe .endereco{color:${CORES.white};opacity:0.78}

  .filete{position:absolute;left:0;right:0;bottom:0;height:10px;background:${CORES.orange}}
</style></head>
<body>
  ${arcos()}
  <main>
    <img class="logo" src="${logoEmbutido()}" alt="">
    <p class="frase">${escapar(frase)}</p>
  </main>
  <div class="pe">
    <span class="contexto">${escapar(rodape)}</span>
    <span class="endereco">${escapar(endereco)}</span>
  </div>
  <div class="filete"></div>
</body></html>`
}

async function main() {
  const config = lerConfig()
  const endereco = new URL(config.urlSite).host

  const html = montarHtml(config.ogFrase, config.ogRodape, endereco)

  const navegador = await chromium.launch({ executablePath: CHROME })

  let png: Buffer
  try {
    const pagina = await navegador.newPage({
      viewport: { width: OG_LARGURA, height: OG_ALTURA },
      deviceScaleFactor: ESCALA,
    })

    await pagina.setContent(html, { waitUntil: 'load' })

    // Sem esperar aqui, a foto sai com a fonte de fallback: o Chromium pinta o
    // primeiro quadro antes de terminar de decodificar o woff2.
    await pagina.evaluate(() => document.fonts.ready)

    // Guarda contra o texto estourar a arte em silêncio. A trava de validação
    // já limita o número de caracteres, mas o que decide de fato é a medida
    // renderizada — uma palavra muito longa cabe na contagem e não na largura.
    const estouro = await pagina.evaluate(() => {
      const principal = document.querySelector('main')!
      return {
        altura: principal.scrollHeight > principal.clientHeight,
        largura: Array.from(
          document.querySelectorAll<HTMLElement>('main *, .pe *'),
        ).some((el) => el.scrollWidth > el.clientWidth + 1),
      }
    })

    if (estouro.altura || estouro.largura) {
      console.error('  ✖  o texto não coube na arte.')
      console.error('      Encurte "ogFrase" ou "ogRodape" em content/config.json.')
      process.exit(1)
    }

    png = await pagina.screenshot({ type: 'png' })
  } finally {
    await navegador.close()
  }

  const destino = path.join(RAIZ_PUBLICA, CAMINHO_OG_IMAGE.replace(/^\//, ''))

  await sharp(png)
    .resize(OG_LARGURA, OG_ALTURA, { fit: 'fill', kernel: 'lanczos3' })
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(destino)

  const kb = statSync(destino).size / 1024
  const metadados = await sharp(destino).metadata()

  console.log(
    `  ✓  ${CAMINHO_OG_IMAGE} — ${metadados.width}×${metadados.height}, ${kb.toFixed(0)} KB`,
  )

  if (metadados.width !== OG_LARGURA || metadados.height !== OG_ALTURA) {
    console.error(`  ✖  dimensões erradas: o WhatsApp espera ${OG_LARGURA}×${OG_ALTURA}.`)
    process.exit(1)
  }

  if (kb > OG_LIMITE_KB) {
    console.error(`  ✖  ${kb.toFixed(0)} KB passa do limite de ${OG_LIMITE_KB} KB.`)
    console.error('      Acima disso o WhatsApp não renderiza a prévia. Reduza a qualidade do JPEG.')
    process.exit(1)
  }
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
