/**
 * Gera as imagens provisórias — cinza, com as iniciais — nas proporções exatas
 * que os assets reais terão. A troca por fotos de verdade não muda o layout em
 * nada: mesmo arquivo, mesmo nome, mesma proporção.
 *
 * O script lê content/candidatos.json e content/mural.json e gera apenas as
 * imagens que ainda NÃO existem. Ou seja: continua útil depois que as fotos
 * reais chegarem — basta subir a foto de verdade e rodar de novo que ele não
 * mexe nela, só preenche o que falta.
 *
 * Rode com `npm run placeholders`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ_PUBLICA = path.join(process.cwd(), 'public')

/** Cinzas neutros: não competem com a paleta da marca nem sugerem cor real. */
const FUNDO = '#DEDBD6'
const TRACO = '#B4AFA8'
const TEXTO = '#7D7772'

/**
 * Primeira e última palavra relevantes. Usar as duas primeiras faria os doze
 * placeholders saírem todos como "CE" ("Candidato Exemplo"), o que atrapalha
 * justamente o teste de layout que eles existem para permitir.
 */
function iniciais(nome: string): string {
  const partes = nome.split(/\s+/).filter((parte) => parte.length > 2)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0][0].toUpperCase()

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function svgPlaceholder(largura: number, altura: number, texto: string): string {
  const menorLado = Math.min(largura, altura)
  const tamanhoFonte = Math.round(menorLado * 0.22)
  const raioArco = menorLado * 0.34

  // O arco ecoa o símbolo da marca sem usar o logotipo, que nunca deve ser
  // redesenhado nem aplicado sobre imagem provisória.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
  <rect width="${largura}" height="${altura}" fill="${FUNDO}"/>
  <path d="M ${largura / 2 - raioArco} ${altura / 2 + raioArco * 0.55}
           A ${raioArco} ${raioArco} 0 0 1 ${largura / 2 + raioArco} ${altura / 2 + raioArco * 0.55}"
        fill="none" stroke="${TRACO}" stroke-width="${Math.round(menorLado * 0.035)}" stroke-linecap="round"/>
  <text x="50%" y="50%" dy="0.08em" text-anchor="middle" dominant-baseline="middle"
        font-family="Poppins, Inter, Arial, sans-serif" font-weight="600"
        font-size="${tamanhoFonte}" fill="${TEXTO}">${texto}</text>
</svg>`
}

/** Gera o arquivo só se ele ainda não existir. Nunca sobrescreve foto real. */
async function gerarSeFaltar(
  destino: string,
  largura: number,
  altura: number,
  texto: string,
): Promise<boolean> {
  if (existsSync(destino)) return false

  mkdirSync(path.dirname(destino), { recursive: true })
  const svg = svgPlaceholder(largura, altura, texto)
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(destino)
  return true
}

function lerJsonDeConteudo<T>(nome: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'content', nome), 'utf8'))
}

async function main() {
  // Candidatos: 1000×1000, a mesma especificação das fotos reais.
  const { candidatos } = lerJsonDeConteudo<{
    candidatos: { nomeUrna: string; foto: string }[]
  }>('candidatos.json')

  let novosCandidatos = 0
  for (const candidato of candidatos) {
    const destino = path.join(RAIZ_PUBLICA, candidato.foto.replace(/^\//, ''))
    if (await gerarSeFaltar(destino, 1000, 1000, iniciais(candidato.nomeUrna))) {
      novosCandidatos += 1
    }
  }
  console.log(
    `  ✓  candidatos: ${novosCandidatos} provisória(s) gerada(s), ` +
      `${candidatos.length - novosCandidatos} já existia(m)`,
  )

  // Mural: alterna horizontal (4:3) e vertical (3:4), como os assets reais, para
  // que o grid já seja testado com alturas diferentes desde o começo.
  const { fotos } = lerJsonDeConteudo<{ fotos: { imagem: string }[] }>('mural.json')

  let novasDoMural = 0
  for (const [indice, foto] of fotos.entries()) {
    const vertical = (indice + 1) % 3 === 0
    const destino = path.join(RAIZ_PUBLICA, foto.imagem.replace(/^\//, ''))
    const rotulo = String(indice + 1).padStart(2, '0')
    if (await gerarSeFaltar(destino, vertical ? 1500 : 2000, vertical ? 2000 : 1500, rotulo)) {
      novasDoMural += 1
    }
  }
  console.log(
    `  ✓  mural: ${novasDoMural} provisória(s) gerada(s), ` +
      `${fotos.length - novasDoMural} já existia(m)`,
  )

  // Fundo do hero: 2400×1600, substituído por foto real do setor depois.
  if (await gerarSeFaltar(path.join(RAIZ_PUBLICA, 'hero.jpg'), 2400, 1600, '')) {
    console.log('  ✓  fundo do hero gerado em public/hero.jpg')
  }

  // Carta de Compromisso provisória, só para o botão ter destino válido.
  const pastaDocs = path.join(RAIZ_PUBLICA, 'docs')
  if (!existsSync(pastaDocs)) mkdirSync(pastaDocs, { recursive: true })
  const caminhoPdf = path.join(pastaDocs, 'carta-compromisso.pdf')
  if (!existsSync(caminhoPdf)) {
    writeFileSync(caminhoPdf, PDF_PROVISORIO, 'binary')
    console.log('  ✓  PDF provisório da Carta gerado em public/docs')
  }
}

/**
 * PDF mínimo de uma página, com um aviso de que é provisório. Existe só para o
 * botão "Ler a Carta" ter um destino válido antes do arquivo real chegar.
 */
const PDF_PROVISORIO = (() => {
  const texto = 'Carta de Compromisso - documento provisorio. Substituir por public/docs/carta-compromisso.pdf real.'
  const conteudo = `BT /F1 12 Tf 50 750 Td (${texto}) Tj ET`
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const posicoes: number[] = []
  objetos.forEach((objeto, i) => {
    posicoes.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`
  })

  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  for (const posicao of posicoes) pdf += `${String(posicao).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`

  return pdf
})()

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
