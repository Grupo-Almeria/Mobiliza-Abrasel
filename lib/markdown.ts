import { Fragment, createElement, type ReactNode } from 'react'

/**
 * Renderizador mínimo de markdown para o campo `detalhe` das pautas.
 *
 * Trata só o que o conteúdo realmente usa: parágrafos separados por linha em
 * branco e **negrito**. Uma biblioteca completa custaria dezenas de kilobytes
 * para entregar recursos que ninguém vai escrever num JSON de cinco eixos.
 *
 * Constrói elementos React diretamente, sem `dangerouslySetInnerHTML` — não há
 * caminho de injeção de HTML mesmo que alguém cole conteúdo estranho no JSON.
 */

/** Divide um texto em pedaços, alternando trecho comum e trecho em negrito. */
function comNegrito(texto: string): ReactNode[] {
  const pedacos = texto.split(/\*\*(.+?)\*\*/g)

  return pedacos.map((pedaco, indice) =>
    // Índices ímpares são o que estava entre os asteriscos.
    indice % 2 === 1
      ? createElement('strong', { key: indice, className: 'font-semibold' }, pedaco)
      : createElement(Fragment, { key: indice }, pedaco),
  )
}

export function paragrafosDeMarkdown(texto: string): ReactNode[] {
  return texto
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
    .map((paragrafo, indice) =>
      createElement(
        'p',
        { key: indice, className: 'ma-body text-ma-charcoal/85' },
        ...comNegrito(paragrafo),
      ),
    )
}
