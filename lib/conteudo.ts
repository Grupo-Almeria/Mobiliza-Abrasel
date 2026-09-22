import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

import {
  EsquemaCandidatos,
  EsquemaConfig,
  EsquemaMural,
  EsquemaPautas,
  partesDaMensagem,
  type Candidato,
  type Config,
  type ForcaAbrasel,
  type FotoMural,
  type Pauta,
} from './schema'

/**
 * Leitura e validação do conteúdo, em build time.
 *
 * Tudo aqui roda no servidor, durante o build. Se qualquer arquivo estiver
 * inválido, lançamos ErroDeConteudo e o build morre — que é exatamente o
 * comportamento desejado: a Vercel mantém a versão anterior no ar e o erro
 * nunca chega ao visitante.
 */

export type Problema = {
  arquivo: string
  caminho: string
  problema: string
  correcao: string | null
  /** Nome do candidato ou identificação legível do item, quando aplicável. */
  contexto: string | null
}

export class ErroDeConteudo extends Error {
  readonly problemas: Problema[]

  constructor(problemas: Problema[]) {
    super(`${problemas.length} problema(s) no conteúdo`)
    this.name = 'ErroDeConteudo'
    this.problemas = problemas
  }
}

const PASTA_CONTEUDO = path.join(process.cwd(), 'content')

/**
 * Traduz o caminho técnico do Zod (`['candidatos', 3, 'numero']`) para algo que
 * um editor entende, e tenta recuperar o nome do candidato para dar contexto.
 */
function descreverCaminho(caminho: (string | number)[]): string {
  if (caminho.length === 0) return 'arquivo'

  return caminho
    .map((parte) => (typeof parte === 'number' ? `item ${parte + 1}` : parte))
    .join(' → ')
}

function acharContexto(dadosBrutos: unknown, caminho: (string | number)[]): string | null {
  if (caminho.length < 2 || typeof dadosBrutos !== 'object' || dadosBrutos === null) return null

  // Sobe até o objeto que contém o campo com erro e procura um nome legível.
  let atual: unknown = dadosBrutos
  for (const parte of caminho.slice(0, -1)) {
    if (typeof atual !== 'object' || atual === null) return null
    atual = (atual as Record<string | number, unknown>)[parte]
  }

  if (typeof atual !== 'object' || atual === null) return null
  const objeto = atual as Record<string, unknown>

  for (const campo of ['nomeUrna', 'titulo', 'imagem']) {
    const valor = objeto[campo]
    if (typeof valor === 'string' && valor.trim() !== '') return valor
  }

  return null
}

/** Converte a posição absoluta de um SyntaxError em linha e coluna. */
function linhaEColuna(texto: string, posicao: number): { linha: number; coluna: number } {
  const antes = texto.slice(0, posicao)
  const linhas = antes.split('\n')
  return { linha: linhas.length, coluna: linhas[linhas.length - 1].length + 1 }
}

/** Monta o trecho do arquivo ao redor da linha com erro, com a linha marcada. */
export function trechoDoArquivo(texto: string, linhaErro: number, contexto = 2): string {
  const linhas = texto.split('\n')
  const inicio = Math.max(0, linhaErro - 1 - contexto)
  const fim = Math.min(linhas.length, linhaErro + contexto)
  const larguraNumero = String(fim).length

  const saida: string[] = []
  for (let i = inicio; i < fim; i++) {
    const numero = String(i + 1).padStart(larguraNumero, ' ')
    const marcador = i + 1 === linhaErro ? '→ ' : '  '
    saida.push(`${marcador}${numero} | ${linhas[i]}`)
  }

  return saida.join('\n')
}

function lerJson(nomeArquivo: string): { dados: unknown; texto: string } {
  const caminhoCompleto = path.join(PASTA_CONTEUDO, nomeArquivo)

  let texto: string
  try {
    texto = readFileSync(caminhoCompleto, 'utf8')
  } catch {
    throw new ErroDeConteudo([
      {
        arquivo: `content/${nomeArquivo}`,
        caminho: 'arquivo',
        problema: 'o arquivo não foi encontrado',
        correcao: `O site precisa de content/${nomeArquivo}. Confira se o arquivo foi apagado ou renomeado por engano.`,
        contexto: null,
      },
    ])
  }

  try {
    return { dados: JSON.parse(texto), texto }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)

    // Node informa "at position N (line L column C)" — tentamos nessa ordem.
    const comLinha = mensagem.match(/line (\d+) column (\d+)/)
    const comPosicao = mensagem.match(/position (\d+)/)

    let linha: number | null = null
    let coluna: number | null = null

    if (comLinha) {
      linha = Number(comLinha[1])
      coluna = Number(comLinha[2])
    } else if (comPosicao) {
      const calculado = linhaEColuna(texto, Number(comPosicao[1]))
      linha = calculado.linha
      coluna = calculado.coluna
    }

    const localizacao = linha ? `Erro na linha ${linha}, coluna ${coluna}.` : ''
    const trecho = linha ? `\n\n${trechoDoArquivo(texto, linha)}` : ''

    throw new ErroDeConteudo([
      {
        arquivo: `content/${nomeArquivo}`,
        caminho: 'arquivo',
        problema: `o arquivo não é um JSON válido. ${localizacao}${trecho}`,
        correcao:
          'Quase sempre é vírgula a mais depois do último item de uma lista, ou vírgula faltando entre dois itens. Confira a linha indicada e a de cima.',
        contexto: null,
      },
    ])
  }
}

function validar<T extends z.ZodTypeAny>(
  esquema: T,
  dados: unknown,
  nomeArquivo: string,
): z.infer<T> {
  const resultado = esquema.safeParse(dados)
  if (resultado.success) return resultado.data

  const problemas: Problema[] = resultado.error.issues.map((issue) => {
    const { problema, correcao } = partesDaMensagem(issue.message)
    return {
      arquivo: `content/${nomeArquivo}`,
      caminho: descreverCaminho(issue.path),
      problema,
      correcao,
      contexto: acharContexto(dados, issue.path),
    }
  })

  throw new ErroDeConteudo(problemas)
}

/** Lê e valida um arquivo, devolvendo os problemas em vez de lançá-los. */
export function verificarArquivo<T extends z.ZodTypeAny>(
  esquema: T,
  nomeArquivo: string,
): Problema[] {
  try {
    const { dados } = lerJson(nomeArquivo)
    validar(esquema, dados, nomeArquivo)
    return []
  } catch (erro) {
    if (erro instanceof ErroDeConteudo) return erro.problemas
    throw erro
  }
}

export const ARQUIVOS_DE_CONTEUDO = [
  { nome: 'config.json', esquema: EsquemaConfig },
  { nome: 'pautas.json', esquema: EsquemaPautas },
  { nome: 'candidatos.json', esquema: EsquemaCandidatos },
  { nome: 'mural.json', esquema: EsquemaMural },
] as const

/* ── Leitura usada pelas páginas ─────────────────────────────────────────── */

export function lerConfig(): Config {
  const { dados } = lerJson('config.json')
  return validar(EsquemaConfig, dados, 'config.json')
}

export function lerPautas(): Pauta[] {
  const { dados } = lerJson('pautas.json')
  const validado = validar(EsquemaPautas, dados, 'pautas.json')
  return [...validado.pautas].sort((a, b) => a.numero - b.numero)
}

/** Só os candidatos com `ativo: true`. Quem está com false some do site. */
export function lerCandidatos(): Candidato[] {
  const { dados } = lerJson('candidatos.json')
  const validado = validar(EsquemaCandidatos, dados, 'candidatos.json')
  return validado.candidatos.filter((candidato) => candidato.ativo)
}

/** Só as fotos com `ativo: true`. */
export function lerMural(): FotoMural[] {
  const { dados } = lerJson('mural.json')
  const validado = validar(EsquemaMural, dados, 'mural.json')
  return validado.fotos.filter((foto) => foto.ativo)
}

export type { Candidato, Config, ForcaAbrasel, FotoMural, Pauta }
