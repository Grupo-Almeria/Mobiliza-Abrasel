/**
 * Trava de validação do conteúdo — roda como `prebuild`, antes do Next iniciar.
 *
 * Se algum arquivo de content/ estiver inválido, este script imprime o que está
 * errado, em português, e sai com código 1. O build para, a Vercel mantém a
 * versão anterior no ar e o erro nunca chega ao visitante.
 *
 * A mensagem é escrita para quem edita o JSON pela interface web do GitHub e lê
 * o log da Vercel — não para quem programa.
 */

import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp, { type Metadata } from 'sharp'

import { ARQUIVOS_DE_CONTEUDO, verificarArquivo, type Problema } from '../lib/conteudo'
import { BORDA, CORES, ESPACO, RAIO, SOMBRA } from '../lib/design-tokens'
import { CAMINHO_OG_IMAGE, OG_ALTURA, OG_LARGURA, OG_LIMITE_KB } from '../lib/og'

const usarCor = process.env.NO_COLOR === undefined && process.env.TERM !== 'dumb'

const c = {
  vermelho: (t: string) => (usarCor ? `\u001b[31m${t}\u001b[0m` : t),
  verde: (t: string) => (usarCor ? `\u001b[32m${t}\u001b[0m` : t),
  amarelo: (t: string) => (usarCor ? `\u001b[33m${t}\u001b[0m` : t),
  forte: (t: string) => (usarCor ? `\u001b[1m${t}\u001b[0m` : t),
  fraco: (t: string) => (usarCor ? `\u001b[2m${t}\u001b[0m` : t),
}

/** Indenta as linhas seguintes de um texto multilinha, preservando a primeira. */
function indentar(texto: string, espacos: number): string {
  const prefixo = ' '.repeat(espacos)
  return texto.split('\n').join(`\n${prefixo}`)
}

/**
 * Confere que lib/design-tokens.ts continua espelhando o tokens.json oficial da
 * marca. Se a marca publicar uma versão nova e alguém trocar só o JSON, o build
 * avisa em vez de deixar o site pintar cores divergentes.
 */
function verificarTokens(): Problema[] {
  const caminho = path.join(process.cwd(), 'content', '.tokens-marca.json')

  let oficial: {
    color: Record<string, { value: string }>
    spacing: Record<string, string>
    radius: Record<string, string>
    shadow: Record<string, string>
  }

  try {
    oficial = JSON.parse(readFileSync(caminho, 'utf8'))
  } catch {
    return [
      {
        arquivo: 'content/.tokens-marca.json',
        caminho: 'arquivo',
        problema: 'o arquivo oficial de tokens da marca não foi encontrado ou não é um JSON válido',
        correcao: 'Restaure o arquivo a partir do pacote de identidade do Mobiliza Abrasel.',
        contexto: null,
      },
    ]
  }

  const problemas: Problema[] = []

  const registrar = (token: string, noCodigo: string, noOficial: string) => {
    if (noCodigo.toLowerCase() !== noOficial.toLowerCase()) {
      problemas.push({
        arquivo: 'lib/design-tokens.ts',
        caminho: token,
        problema: `o código usa ${noCodigo}, mas o tokens.json oficial da marca diz ${noOficial}`,
        correcao:
          'Os dois precisam bater. Atualize lib/design-tokens.ts para o valor oficial — nunca o contrário.',
        contexto: null,
      })
    }
  }

  const paraCor: Record<string, string> = {
    green: 'brand-green',
    orange: 'accent-orange',
    lime: 'accent-lime',
    charcoal: 'charcoal',
    cream: 'cream',
    blue: 'info-blue',
    red: 'danger-red',
    white: 'white',
  }

  for (const [nomeNoCodigo, nomeOficial] of Object.entries(paraCor)) {
    const oficialValor = oficial.color?.[nomeOficial]?.value
    if (oficialValor) registrar(`cor ${nomeNoCodigo}`, CORES[nomeNoCodigo as keyof typeof CORES], oficialValor)
  }

  if (oficial.color?.border?.value) {
    // O JSON escreve sem espaços; normalizamos antes de comparar.
    const normalizar = (v: string) => v.replace(/\s+/g, '')
    registrar('borda', normalizar(BORDA), normalizar(oficial.color.border.value))
  }

  for (const [chave, valor] of Object.entries(ESPACO)) {
    const oficialValor = oficial.spacing?.[`space-${chave}`]
    if (oficialValor) registrar(`espaço ${chave}`, valor, oficialValor)
  }

  for (const [chave, valor] of Object.entries(RAIO)) {
    const oficialValor = oficial.radius?.[`radius-${chave}`]
    if (oficialValor) registrar(`raio ${chave}`, valor, oficialValor)
  }

  if (oficial.shadow?.['shadow-card']) {
    const normalizar = (v: string) => v.replace(/\s*,\s*/g, ',')
    registrar('sombra de card', normalizar(SOMBRA.card), normalizar(oficial.shadow['shadow-card']))
  }

  return problemas
}

/**
 * Confere a imagem da prévia do link.
 *
 * Existe por causa de um defeito real: a prévia quebrada não aparece em lugar
 * nenhum do site. O build fica verde, o site abre certo, e o erro só se revela
 * no primeiro compartilhamento no WhatsApp — que é exatamente o canal que este
 * site existe para alimentar. Nenhuma outra checagem pega isso.
 */
async function verificarImagemDaPrevia(): Promise<Problema[]> {
  const relativo = CAMINHO_OG_IMAGE.replace(/^\//, '')
  const caminho = path.join(process.cwd(), 'public', relativo)

  const problema = (texto: string, correcao: string): Problema => ({
    arquivo: `public/${relativo}`,
    caminho: 'imagem da prévia do link',
    problema: texto,
    correcao,
    contexto: null,
  })

  let bytes: number
  try {
    bytes = statSync(caminho).size
  } catch {
    return [
      problema(
        'o arquivo da imagem da prévia não existe',
        `É a imagem que aparece no cartão do WhatsApp quando alguém compartilha o site. Rode \`npm run og\` para gerá-la. O caminho é definido em lib/og.ts.`,
      ),
    ]
  }

  const problemas: Problema[] = []

  let metadados: Metadata
  try {
    metadados = await sharp(caminho).metadata()
  } catch {
    return [
      problema(
        'o arquivo da imagem da prévia existe, mas não é uma imagem válida',
        'Rode `npm run og` para gerá-la de novo.',
      ),
    ]
  }

  if (metadados.width !== OG_LARGURA || metadados.height !== OG_ALTURA) {
    problemas.push(
      problema(
        `a imagem da prévia está em ${metadados.width}×${metadados.height}, e não em ${OG_LARGURA}×${OG_ALTURA}`,
        'Fora dessa medida o WhatsApp deixa de mostrar o cartão grande. Rode `npm run og` para gerá-la de novo.',
      ),
    )
  }

  const kb = bytes / 1024
  if (kb > OG_LIMITE_KB) {
    problemas.push(
      problema(
        `a imagem da prévia está com ${kb.toFixed(0)} KB, acima do limite de ${OG_LIMITE_KB} KB`,
        'Acima desse peso o WhatsApp desiste da imagem e mostra o cartão só com texto. Rode `npm run og` para gerá-la de novo.',
      ),
    )
  }

  return problemas
}

function imprimirProblemas(problemas: Problema[]): void {
  console.error('')
  console.error(c.vermelho(c.forte('  ✖  CONTEÚDO INVÁLIDO — o site NÃO foi publicado.')))
  console.error('')
  console.error('     A versão anterior continua no ar. Corrija os itens abaixo,')
  console.error('     salve, e a publicação acontece sozinha em cerca de um minuto.')
  console.error('')

  const porArquivo = new Map<string, Problema[]>()
  for (const problema of problemas) {
    const lista = porArquivo.get(problema.arquivo) ?? []
    lista.push(problema)
    porArquivo.set(problema.arquivo, lista)
  }

  let n = 0
  for (const [arquivo, lista] of porArquivo) {
    console.error(`  ${c.forte(c.amarelo(arquivo))}`)
    console.error('')

    for (const problema of lista) {
      n += 1
      const identificacao = problema.contexto
        ? `${problema.caminho} ${c.fraco(`— "${problema.contexto}"`)}`
        : problema.caminho

      console.error(`   ${c.forte(`${n}.`)} ${identificacao}`)
      console.error(`      ${indentar(problema.problema, 6)}`)
      if (problema.correcao) {
        console.error(`      ${c.verde('→')} ${indentar(problema.correcao, 8)}`)
      }
      console.error('')
    }
  }

  const plural = problemas.length === 1 ? 'erro' : 'erros'
  console.error(c.vermelho(`  Nada foi publicado. ${problemas.length} ${plural}.`))
  console.error('')
}

async function main(): Promise<void> {
  const problemas: Problema[] = [...verificarTokens()]

  for (const { nome, esquema } of ARQUIVOS_DE_CONTEUDO) {
    problemas.push(...verificarArquivo(esquema, nome))
  }

  problemas.push(...(await verificarImagemDaPrevia()))

  if (problemas.length > 0) {
    imprimirProblemas(problemas)
    process.exit(1)
  }

  const nomes = ARQUIVOS_DE_CONTEUDO.map((a) => a.nome).join(', ')
  console.log(c.verde(`  ✓  Conteúdo validado: ${nomes}, imagem da prévia.`))
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
