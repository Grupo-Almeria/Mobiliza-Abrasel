/**
 * Verificação visual automatizada.
 *
 * Roda a página num Chromium de verdade e checa o que um teste de unidade não
 * pega: layout estourando, alvo de toque pequeno demais, e — a razão pela qual
 * este script existe — **utilitário do Tailwind anulado silenciosamente pelo
 * CSS da marca**.
 *
 * Esse último caso produziu três defeitos que chegaram ao cliente na Fase 1:
 * margens zeradas, botão sem borda e card com largura errada. Nenhum deles
 * quebrava o build nem aparecia como erro. A varredura abaixo pega todos.
 *
 * Uso:
 *   npx next build && npx next start -p 3100 &
 *   node scripts/verificar-visual.mjs                 → verifica
 *   node scripts/verificar-visual.mjs --salvar base   → grava a linha de base
 *   node scripts/verificar-visual.mjs --comparar base → compara com a linha de base
 */

import { chromium, devices } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const URL_BASE = process.env.URL_TESTE ?? 'http://localhost:3100'
const CHROME =
  process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PASTA = '/tmp/verificacao'

const args = process.argv.slice(2)
const salvarEm = args.includes('--salvar') ? args[args.indexOf('--salvar') + 1] : null
const compararCom = args.includes('--comparar') ? args[args.indexOf('--comparar') + 1] : null

const LARGURAS = [
  { nome: '320px', ctx: devices['iPhone SE'] },
  { nome: '390px', ctx: devices['iPhone 13'] },
  { nome: '1280px', ctx: { viewport: { width: 1280, height: 900 } } },
]

/**
 * Estilos que definem a aparência da identidade. Se algum destes mudar entre
 * duas execuções, a marca mudou de cara — o que nunca deve acontecer por efeito
 * colateral de uma mudança de cascata.
 */
async function assinaturaDaIdentidade(pg) {
  return pg.evaluate(() => {
    // Elementos de prova injetados, com a classe da marca e NADA mais. Medir um
    // elemento real da página não serve: ele carrega utilitários do Tailwind por
    // cima, e é justamente isso que queremos que volte a funcionar. Aqui o que
    // se mede é a classe pura.
    const laboratorio = document.createElement('div')
    laboratorio.id = 'prova-identidade'
    laboratorio.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px'
    laboratorio.innerHTML = `
      <button class="ma-btn ma-btn--primary">primário</button>
      <button class="ma-btn ma-btn--accent">destaque</button>
      <div class="ma-card">card</div>
      <div class="ma-callout">callout</div>
      <h1 class="ma-h1">h1</h1>
      <h2 class="ma-h2">h2</h2>
      <h3 class="ma-h3">h3</h3>
      <p class="ma-body">body</p>
      <span class="ma-eyebrow">eyebrow</span>
    `
    document.body.appendChild(laboratorio)

    const ler = (seletor, props) => {
      const e = laboratorio.querySelector(seletor)
      if (!e) return null
      const cs = getComputedStyle(e)
      return Object.fromEntries(props.map((p) => [p, cs[p]]))
    }

    const caixa = ['backgroundColor', 'color', 'borderRadius', 'minHeight', 'padding']
    const texto = ['fontSize', 'fontWeight', 'lineHeight', 'fontFamily', 'letterSpacing']

    const medidas = {
      botaoPrimario: ler('.ma-btn--primary', [...caixa, ...texto]),
      botaoDestaque: ler('.ma-btn--accent', [...caixa, ...texto]),
      card: ler('.ma-card', ['backgroundColor', 'borderRadius', 'boxShadow', 'borderWidth', 'borderColor']),
      h1: ler('.ma-h1', texto),
      h2: ler('.ma-h2', texto),
      h3: ler('.ma-h3', texto),
      body: ler('.ma-body', texto),
      eyebrow: ler('.ma-eyebrow', [...texto, 'textTransform', 'color']),
      callout: ler('.ma-callout', ['backgroundColor', 'borderRadius', 'padding']),
      raiz: (() => {
        const cs = getComputedStyle(document.documentElement)
        return Object.fromEntries(
          ['--ma-green', '--ma-orange', '--ma-lime', '--ma-charcoal', '--ma-cream', '--ma-radius-btn', '--ma-space-4']
            .map((v) => [v, cs.getPropertyValue(v).trim()]),
        )
      })(),
    }

    laboratorio.remove()
    return medidas
  })
}

/** Utilitários do Tailwind que o CSS da marca está anulando. */
async function utilitariosAnulados(pg) {
  return pg.evaluate(() => {
    const achados = []
    for (const e of document.querySelectorAll('[class*="ma-"]')) {
      const cls = e.className.toString()
      if (!/\bma-(h1|h2|h3|body|eyebrow|btn|card|callout)\b/.test(cls)) continue
      const cs = getComputedStyle(e)
      const anulou = []

      if (/\bmt-(?!auto)/.test(cls) && cs.marginTop === '0px') anulou.push('margin-top')
      if (/\bmb-/.test(cls) && cs.marginBottom === '0px') anulou.push('margin-bottom')
      if (/\bp-0\b/.test(cls) && cs.padding !== '0px') anulou.push(`padding=${cs.padding}`)
      // Um tamanho declarado com variante responsiva (md:text-…) muda de
      // propósito conforme a largura. Acusar isso seria falso positivo: o que
      // interessa é o CSS da marca engolindo o utilitário, não o breakpoint.
      const temVarianteDeTamanho = /\b(sm|md|lg|xl|2xl):text-/.test(cls)
      if (!temVarianteDeTamanho) {
        if (/\btext-sm\b/.test(cls) && cs.fontSize !== '14px') anulou.push(`font-size=${cs.fontSize}`)
        if (/\btext-xs\b/.test(cls) && cs.fontSize !== '12px') anulou.push(`font-size=${cs.fontSize}`)
      }
      if (/\bborder-2\b/.test(cls) && parseFloat(cs.borderTopWidth) === 0) anulou.push('border-width')
      // `inline-flex` num filho de flex container é blockificado para `flex`
      // pelo próprio CSS. Não é anulação: é comportamento correto da spec.
      if (/\binline-flex\b/.test(cls) && cs.display !== 'inline-flex') {
        const paiEhFlex = e.parentElement && /flex|grid/.test(getComputedStyle(e.parentElement).display)
        if (!(paiEhFlex && cs.display === 'flex')) anulou.push(`display=${cs.display}`)
      }

      if (anulou.length) {
        achados.push({
          ma: (cls.match(/\bma-(h1|h2|h3|body|eyebrow|btn|card|callout)\b/) || [])[0],
          el: e.tagName.toLowerCase(),
          txt: (e.textContent || '').trim().slice(0, 32),
          anulou: anulou.join(', '),
        })
      }
    }
    return achados
  })
}

async function medirLayout(pg) {
  return pg.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    estouro: [...document.querySelectorAll('article,.ma-card,button,a,h1,h2,h3')]
      .filter((e) => e.parentElement && e.getBoundingClientRect().width > e.parentElement.getBoundingClientRect().width + 2)
      .slice(0, 5)
      .map((e) => `${e.tagName.toLowerCase()} "${(e.textContent || '').trim().slice(0, 20)}"`),
    // Ícone espremido a zero por falta de shrink-0 num botão estreito. Não
    // quebra layout, não gera erro: só some da tela sem avisar ninguém.
    iconesColapsados: [...document.querySelectorAll('button svg, a svg')]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        const alvo = parseFloat(e.getAttribute('width') || '0')
        return alvo > 0 && r.height > 0 && r.width < alvo * 0.6
      })
      .map((e) => {
        const b = e.closest('button, a')
        return `"${(b?.textContent || '').trim().slice(0, 22)}" → ${Math.round(e.getBoundingClientRect().width)}px de ${e.getAttribute('width')}px`
      }),
    toquePequeno: [...document.querySelectorAll('a,button,summary')]
      .map((e) => ({ txt: (e.textContent || '').trim().slice(0, 24), r: e.getBoundingClientRect(), t: e.tagName.toLowerCase() }))
      .filter(({ r, txt }) => r.width > 2 && r.height > 2 && r.height < 44 && txt !== 'Pular para os candidatos')
      .map(({ t, txt, r }) => `${t} "${txt}" ${Math.round(r.width)}×${Math.round(r.height)}`),
  }))
}

/** Pontos específicos que o cliente apontou como defeito na Fase 1. */
async function pontosCriticos(pg) {
  return pg.evaluate(() => {
    const h1 = document.querySelector('h1')
    const apoio = h1?.nextElementSibling
    const vao = h1 && apoio
      ? Math.round(apoio.getBoundingClientRect().top - h1.getBoundingClientRect().bottom)
      : null

    const compartilharTopo = [...document.querySelectorAll('button')]
      .find((e) => e.textContent.includes('Compartilhar'))
    const cs = compartilharTopo ? getComputedStyle(compartilharTopo) : null

    const card = document.querySelector('#candidatos article')
    const insta = card?.querySelector('a[href*="instagram"]')
    const share = card?.querySelector('div.relative button')
    const larg = (e) => (e ? Math.round(e.getBoundingClientRect().width) : null)

    // Largura interna do card, já descontado o padding do corpo.
    const corpo = insta?.closest('div')?.parentElement
    const util = corpo
      ? Math.round(
          corpo.getBoundingClientRect().width -
            parseFloat(getComputedStyle(corpo).paddingLeft) -
            parseFloat(getComputedStyle(corpo).paddingRight),
        )
      : null

    return {
      vaoTituloApoio: vao,
      compartilharTopo: cs ? { fundo: cs.backgroundColor, cor: cs.color } : null,
      card: {
        largura: larg(card),
        util,
        instagram: larg(insta),
        compartilhar: larg(share),
        fonteInstagram: insta ? getComputedStyle(insta).fontSize : null,
        fonteCompartilhar: share ? getComputedStyle(share).fontSize : null,
      },
    }
  })
}

async function main() {
  mkdirSync(PASTA, { recursive: true })
  const nav = await chromium.launch({ executablePath: CHROME })
  const relatorio = { larguras: {}, identidade: null }
  let falhou = false

  for (const { nome, ctx: opcoes } of LARGURAS) {
    const ctx = await nav.newContext({ ...opcoes, locale: 'pt-BR' })
    const pg = await ctx.newPage()
    const errosJs = []
    pg.on('pageerror', (e) => errosJs.push(e.message))

    await pg.goto(URL_BASE, { waitUntil: 'networkidle' })
    await pg.evaluate(() => document.fonts.ready)
    await pg.waitForTimeout(900)

    const layout = await medirLayout(pg)
    const anulados = await utilitariosAnulados(pg)
    const criticos = await pontosCriticos(pg)
    if (!relatorio.identidade) relatorio.identidade = await assinaturaDaIdentidade(pg)
    relatorio.larguras[nome] = { layout, anulados: anulados.length, criticos }

    console.log(`\n──── ${nome} ────`)
    const rolagem = layout.doc > layout.win
    console.log(`  rolagem horizontal      ${rolagem ? `✖ estoura ${layout.doc - layout.win}px` : '✓'}`)
    console.log(`  estouro de coluna       ${layout.estouro.length ? '✖ ' + layout.estouro.join(', ') : '✓'}`)
    console.log(`  alvo de toque < 44px    ${layout.toquePequeno.length ? '✖ ' + layout.toquePequeno.join(', ') : '✓'}`)
    console.log(`  erro de JavaScript      ${errosJs.length ? '✖ ' + errosJs.join(', ') : '✓'}`)
    console.log(`  ícone colapsado         ${layout.iconesColapsados.length ? '✖ ' + layout.iconesColapsados.join(', ') : '✓'}`)
    console.log(`  utilitários anulados    ${anulados.length ? `✖ ${anulados.length} elementos` : '✓ nenhum'}`)
    if (anulados.length) {
      for (const a of anulados.slice(0, 6)) console.log(`      ${a.ma} <${a.el}> "${a.txt}" → ${a.anulou}`)
      if (anulados.length > 6) console.log(`      ... e mais ${anulados.length - 6}`)
    }
    console.log(`  vão título → apoio      ${criticos.vaoTituloApoio}px ${criticos.vaoTituloApoio > 0 ? '✓' : '✖ colado'}`)
    const botoesOk =
      criticos.card.instagram === criticos.card.compartilhar &&
      criticos.card.util > 0 &&
      criticos.card.instagram >= criticos.card.util - 2
    console.log(
      `  botões do card          ${criticos.card.instagram}px e ${criticos.card.compartilhar}px, ` +
        `útil do card ${criticos.card.util}px  ${botoesOk ? '✓ iguais e cheios' : '✖'}`,
    )

    if (rolagem || layout.estouro.length || layout.toquePequeno.length || errosJs.length || anulados.length) falhou = true
    if (layout.iconesColapsados.length) falhou = true
    if (!criticos.vaoTituloApoio || criticos.vaoTituloApoio <= 0) falhou = true
    if (!botoesOk) falhou = true

    await pg.screenshot({ path: path.join(PASTA, `${nome}-hero.png`) })
    const cand = await pg.$('#candidatos')
    if (cand) { await cand.scrollIntoViewIfNeeded(); await pg.waitForTimeout(500); await pg.screenshot({ path: path.join(PASTA, `${nome}-candidatos.png`) }) }
    await ctx.close()
  }

  console.log(`\n──── botão Compartilhar do topo ────`)
  const c = relatorio.larguras['1280px'].criticos.compartilharTopo
  console.log(`  fundo: ${c?.fundo}   texto: ${c?.cor}`)

  if (salvarEm) {
    writeFileSync(path.join(PASTA, `${salvarEm}.json`), JSON.stringify(relatorio.identidade, null, 2))
    console.log(`\n  ✓ linha de base da identidade salva em ${PASTA}/${salvarEm}.json`)
  }

  if (compararCom) {
    console.log(`\n──── A IDENTIDADE MUDOU DE APARÊNCIA? ────`)
    const antes = JSON.parse(readFileSync(path.join(PASTA, `${compararCom}.json`), 'utf8'))
    const depois = relatorio.identidade
    const difs = []
    for (const [grupo, props] of Object.entries(antes)) {
      if (!props) continue
      for (const [prop, valor] of Object.entries(props)) {
        const agora = depois[grupo]?.[prop]
        if (agora !== valor) difs.push(`${grupo}.${prop}: "${valor}" → "${agora}"`)
      }
    }
    if (difs.length) {
      console.log('  ✖ MUDOU — a refatoração alterou a aparência da marca:')
      difs.forEach((d) => console.log(`      ${d}`))
      falhou = true
    } else {
      console.log('  ✓ idêntica — cor, raio, sombra, peso e tamanho de fonte inalterados')
    }
  }

  await nav.close()
  console.log(falhou ? '\n✖ verificação reprovou\n' : '\n✓ verificação aprovada\n')
  process.exit(falhou ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
