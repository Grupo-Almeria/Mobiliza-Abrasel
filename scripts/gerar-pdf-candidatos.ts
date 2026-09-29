/**
 * Gera o PDF com os candidatos que assinaram a Carta de Compromisso.
 *
 * É uma peça para circular fora do site — encaminhada por WhatsApp, anexada em
 * e-mail, impressa numa reunião. Isso muda duas coisas em relação à página.
 *
 * ## A ordem
 *
 * No site, a ordem dentro de cada cargo é sorteada no build e sorteada de novo
 * no navegador a cada visita, para que a lista não seja lida como ranking de
 * preferência da associação. **Um PDF não recarrega.** Congelar um sorteio
 * deixaria uma ordem arbitrária para sempre, sem que quem recebe tenha como
 * saber que foi sorteio.
 *
 * Por isso aqui a ordem é **alfabética** dentro de cada cargo: neutra e, o que
 * importa mais no papel, verificável — o leitor confere sozinho que não há
 * ranking. A ordem dos CARGOS é a mesma do site, que é fixa.
 *
 * ## O texto sobre a ordem
 *
 * O site afirma "a ordem de exibição é aleatória e muda a cada acesso". Essa
 * frase **não é reproduzida aqui**, porque neste documento seria falsa.
 *
 * O aviso institucional do rodapé vai verbatim, sem uma vírgula alterada — é
 * texto jurídico aprovado. Como ele termina falando da ordem aleatória, que vale
 * para o site e não para este arquivo, vai rotulado como "Aviso institucional do
 * site", e a regra de ordenação do PDF é declarada à parte, no cabeçalho.
 *
 * ## Fonte e peso
 *
 * A Poppins entra embutida em base64, como em `gerar-og-image.ts`: rasterizar
 * pela fonte instalada no sistema daria resultado diferente a cada máquina.
 *
 * As fotos são reduzidas antes de embutir. Em 1000×1000 as 17 somam 1,8 MB, e no
 * papel cada uma ocupa cerca de 40 mm — resolução jogada fora num arquivo que
 * precisa ser leve para ser encaminhado.
 *
 * Rode com `npm run pdf`.
 */

import { readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

import { CARGOS, ORDEM_CARGOS } from '../lib/cargos'
import { CORES } from '../lib/design-tokens'
import { lerCandidatos, lerConfig } from '../lib/conteudo'
import type { Candidato } from '../lib/conteudo'

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const RAIZ_PUBLICA = path.join(process.cwd(), 'public')

/** 360px cobre com folga os ~40 mm que a foto ocupa impressa. */
const LADO_FOTO = 360
const QUALIDADE_FOTO = 72

const DESTINO = process.env.SAIDA_PDF ?? path.join(process.cwd(), 'candidatos-mobiliza-abrasel.pdf')

/**
 * Nomes de urna a deixar de fora desta tiragem, separados por vírgula.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ LEIA ANTES DE USAR.                                                       │
 * │                                                                           │
 * │ O título da peça é "Os candidatos que assinaram a Carta de Compromisso".   │
 * │ Excluindo alguém que assinou, o documento passa a afirmar uma completude   │
 * │ que não tem — num material construído inteiro sobre tratamento igual       │
 * │ entre candidatos: cards do mesmo tamanho, ordem neutra, e a frase          │
 * │ "nenhum candidato recebe destaque sobre os demais".                        │
 * │                                                                           │
 * │ Se duas tiragens circularem lado a lado, a diferença é visível.            │
 * │                                                                           │
 * │ A chave existe porque foi pedida, com essa ressalva registrada. Use com    │
 * │ decisão consciente de quem responde pela peça, e considere ajustar o       │
 * │ título antes de distribuir.                                                │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const EXCLUIR = (process.env.EXCLUIR ?? '')
  .split(',')
  .map((n) => n.trim())
  .filter(Boolean)

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fonteEmbutida(peso: number): string {
  const base64 = readFileSync(path.join(RAIZ_PUBLICA, 'fontes', `poppins-latin-${peso}.woff2`)).toString('base64')
  return `@font-face{font-family:Poppins;font-style:normal;font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${base64}) format('woff2')}`
}

async function fotoEmbutida(caminhoNoSite: string): Promise<string> {
  const arquivo = path.join(RAIZ_PUBLICA, caminhoNoSite.replace(/^\//, ''))
  const buf = await sharp(arquivo)
    .resize(LADO_FOTO, LADO_FOTO, { fit: 'cover' })
    .jpeg({ quality: QUALIDADE_FOTO, mozjpeg: true })
    .toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

/** O @ do perfil, a partir do endereço completo guardado no conteúdo. */
function arrobaDoInstagram(url: string): string | null {
  try {
    const usuario = new URL(url).pathname.replace(/\//g, '')
    return usuario ? `@${usuario}` : null
  } catch {
    return null
  }
}

/**
 * Ordem alfabética de verdade: `localeCompare` em pt-BR trata acento como o
 * leitor espera, e sem ele "Júlia" cairia depois de "Múcio".
 */
function porNome(a: Candidato, b: Candidato): number {
  return a.nomeUrna.localeCompare(b.nomeUrna, 'pt-BR', { sensitivity: 'base' })
}

async function cardHtml(c: Candidato): Promise<string> {
  const foto = await fotoEmbutida(c.foto)
  const arroba = arrobaDoInstagram(c.instagram)

  return `<li><div class="card">
      <img class="retrato" src="${foto}" alt="">
      <div class="dados">
        <p class="cargo">${escapar(CARGOS[c.cargo].rotulo)}</p>
        <p class="nome">${escapar(c.nomeUrna)}</p>
        ${c.partido ? `<p class="partido">${escapar(c.partido)}</p>` : ''}
        <p class="numero">${escapar(c.numero)}</p>
        ${arroba ? `<p class="perfil">${escapar(arroba)}</p>` : ''}
      </div>
    </div></li>`
}

/**
 * Aplica o EXCLUIR, **falhando se algum nome não casar com ninguém**.
 *
 * A guarda é o ponto principal desta função. Sem ela, um erro de digitação
 * — "Leando Grass" em vez de "Leandro Grass" — geraria em silêncio o PDF
 * completo, justamente com o nome que deveria ter saído. Quem pediu a tiragem
 * enviaria o arquivo errado sem nenhum sinal de que algo falhou.
 */
function aplicarExclusoes(candidatos: Candidato[]): Candidato[] {
  if (EXCLUIR.length === 0) return candidatos

  const naLista = new Set(candidatos.map((c) => c.nomeUrna))
  const semCorrespondencia = EXCLUIR.filter((nome) => !naLista.has(nome))

  if (semCorrespondencia.length > 0) {
    console.error(`  ✖  EXCLUIR não encontrou: ${semCorrespondencia.join(', ')}`)
    console.error('      O nome precisa ser o nomeUrna exato, como está em content/candidatos.json.')
    console.error(`      Na lista: ${[...naLista].join(', ')}`)
    process.exit(1)
  }

  const restantes = candidatos.filter((c) => !EXCLUIR.includes(c.nomeUrna))
  console.log(`  !  tiragem parcial: ${EXCLUIR.join(', ')} fora — ${restantes.length} de ${candidatos.length}`)
  return restantes
}

async function montarHtml(): Promise<string> {
  const config = lerConfig()
  const candidatos = aplicarExclusoes(lerCandidatos())
  const endereco = new URL(config.urlSite).host

  const blocos: string[] = []
  for (const cargo of ORDEM_CARGOS) {
    const doCargo = candidatos.filter((c) => c.cargo === cargo).sort(porNome)
    if (doCargo.length === 0) continue

    const cards = await Promise.all(doCargo.map(cardHtml))
    blocos.push(`<section class="grupo">
      <h2 class="titulo-cargo">${escapar(CARGOS[cargo].rotulo)}<span class="conta">${doCargo.length}</span></h2>
      <ul class="grade">${cards.join('')}</ul>
    </section>`)
  }

  const logo = readFileSync(
    path.join(RAIZ_PUBLICA, 'marca', 'Mobiliza_Abrasel_01_Principal_Horizontal_Cor.svg'),
  ).toString('base64')

  const plural = candidatos.length === 1 ? 'candidato' : 'candidatos'

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>
  ${fonteEmbutida(700)}
  ${fonteEmbutida(600)}
  ${fonteEmbutida(500)}
  ${fonteEmbutida(400)}

  *{margin:0;padding:0;box-sizing:border-box}

  @page{size:A4;margin:14mm 12mm 16mm}

  body{font-family:Poppins;color:${CORES.charcoal};font-size:9pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  header{border-bottom:2pt solid ${CORES.green};padding-bottom:3mm;margin-bottom:4.5mm}
  header img{height:9.5mm;width:auto;display:block}
  h1{font-weight:700;font-size:15pt;line-height:1.15;letter-spacing:-0.01em;color:${CORES.green};margin-top:3mm;max-width:150mm}
  .resumo{margin-top:2.5mm;font-weight:500;font-size:8.5pt;color:rgba(35,31,32,0.65)}

  /* Um grupo nunca começa no pé da página só para deixar o título órfão. */
  .grupo{margin-bottom:4.5mm;break-inside:auto}
  .titulo-cargo{font-weight:700;font-size:11.5pt;color:${CORES.green};
    padding-bottom:1.5mm;border-bottom:0.6pt solid rgba(0,101,46,0.25);
    break-after:avoid;margin-bottom:3mm}
  .conta{font-weight:500;font-size:9pt;color:rgba(35,31,32,0.45);margin-left:2mm}

  /*
    Caixas em linha, e não CSS grid, de propósito: o Chromium não fragmenta um
    container de grid entre páginas de impressão — trata a grade inteira como
    bloco indivisível. Com 5 cards por fileira isso empurrava um cargo inteiro
    para a página seguinte e deixava meia página em branco. Em inline-block a
    quebra acontece entre cards, e a página fecha cheia.

    Largura fixa em vez de porcentagem para a conta fechar exata: área útil de
    186mm = 5 cards de 34,8mm + 4 vãos de 3mm.
  */
  .grade{list-style:none;display:block;font-size:0}
  /*
    Altura fixa, e não automática: sem ela um nome que quebra em duas linhas
    ("Michelle Bolsonaro") deixa o card mais alto que os vizinhos. No site os
    cards de uma fileira se esticam juntos; aqui, em caixas em linha, cada um
    teria a altura do próprio conteúdo. Card maior que o do lado é tratamento
    desigual entre candidatos, que é justamente o que esta peça não pode fazer.
  */
  .grade > li{display:inline-block;vertical-align:top;width:34.8mm;height:66mm;margin:0 3mm 3mm 0;font-size:9pt}
  .grade > li:nth-child(5n){margin-right:0}

  /* Card inteiro em uma página só: cortar um candidato ao meio seria tratá-lo
     diferente dos demais, que é justamente o que a peça não pode fazer. */
  .card{break-inside:avoid;border:0.6pt solid rgba(35,31,32,0.14);border-radius:2.5mm;overflow:hidden;background:#fff;height:100%}
  .retrato{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:${CORES.cream}}
  .dados{padding:2.2mm 2.4mm 2.2mm}

  .cargo{font-weight:600;font-size:6pt;letter-spacing:0.09em;text-transform:uppercase;color:${CORES.green}}
  .nome{font-weight:700;font-size:9pt;line-height:1.18;margin-top:1mm}
  .partido{font-weight:400;font-size:7pt;color:rgba(35,31,32,0.6);margin-top:0.5mm}
  /* Laranja sobre branco é o mesmo destaque do número no site. */
  .numero{font-weight:700;font-size:14pt;line-height:1;color:${CORES.orange};margin-top:1.6mm;letter-spacing:-0.02em}
  .perfil{font-weight:400;font-size:6pt;color:rgba(35,31,32,0.45);margin-top:1mm;word-break:break-all}

  footer{margin-top:4mm;padding-top:4mm;border-top:0.6pt solid rgba(35,31,32,0.18);
    font-size:6.5pt;line-height:1.5;color:rgba(35,31,32,0.6)}
  footer .rotulo{font-weight:600;color:rgba(35,31,32,0.75)}
  footer .site{margin-top:2.5mm;font-weight:600;color:${CORES.green};font-size:7.5pt}
</style></head>
<body>
  <header>
    <img src="data:image/svg+xml;base64,${logo}" alt="Mobiliza Abrasel">
    <h1>Os candidatos que assinaram a Carta de Compromisso</h1>
    <p class="resumo">${candidatos.length} ${plural} &middot; Ordem alfabética dentro de cada cargo &middot; nenhum candidato recebe destaque sobre os demais</p>
  </header>

  ${blocos.join('')}

  <footer>
    <p><span class="rotulo">Aviso institucional do site:</span> ${escapar(config.avisoRodape)}</p>
    <p class="site">${escapar(endereco)}</p>
  </footer>
</body></html>`
}

async function main() {
  const html = await montarHtml()

  // Válvula de inspeção: com DUMP_HTML apontando para um caminho, o HTML da
  // peça é gravado lá antes da impressão. Serve para medir a paginação no
  // navegador sem ter que reconstruir a página por fora.
  if (process.env.DUMP_HTML) writeFileSync(process.env.DUMP_HTML, html)

  const navegador = await chromium.launch({ executablePath: CHROME })

  try {
    const pagina = await navegador.newPage()
    await pagina.setContent(html, { waitUntil: 'load' })

    // Sem isto o PDF sai com a fonte de fallback: o Chromium imprime antes de
    // terminar de decodificar o woff2.
    await pagina.evaluate(() => document.fonts.ready)

    await pagina.pdf({
      path: DESTINO,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;padding:0 12mm;font-family:sans-serif;font-size:7pt;color:#8a8a8a;text-align:right">
        <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
      margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
    })
  } finally {
    await navegador.close()
  }

  const kb = statSync(DESTINO).size / 1024
  console.log(`  ✓  ${path.basename(DESTINO)} — ${kb.toFixed(0)} KB`)
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
