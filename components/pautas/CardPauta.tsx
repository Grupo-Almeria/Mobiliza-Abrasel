import { IconePauta } from '@/components/pautas/IconePauta'
import { paragrafosDeMarkdown } from '@/lib/markdown'
import type { Pauta } from '@/lib/conteudo'

/**
 * Card de um eixo da Carta.
 *
 * A expansão usa <details>/<summary> nativo em vez de estado em JavaScript:
 * abre e fecha sem JS, já vem acessível por teclado e é anunciado corretamente
 * por leitor de tela. Num WebView de WhatsApp em 4G, isso significa que o
 * conteúdo é navegável antes de qualquer script carregar.
 *
 * O número do eixo tem destaque tipográfico, em laranja sobre fundo claro —
 * laranja como acento, nunca como fundo de texto branco.
 */

type Props = {
  pauta: Pauta
  className?: string
}

export function CardPauta({ pauta, className = '' }: Props) {
  return (
    <details
      className={`ma-card group flex h-full flex-col bg-ma-white [&_summary::-webkit-details-marker]:hidden ${className}`.trim()}
    >
      <summary className="ma-focus flex flex-1 cursor-pointer list-none flex-col gap-ma-2">
        <div className="flex items-start justify-between gap-ma-2">
          <span
            aria-hidden="true"
            className="font-sans text-5xl font-bold leading-none text-ma-orange md:text-6xl"
          >
            {pauta.numero}
          </span>
          <IconePauta nome={pauta.icone} className="h-9 w-9 shrink-0 text-ma-green" />
        </div>

        {/*
          O token .ma-h3 da marca é clamp(1.375rem, 2vw, 1.75rem). No grid de
          cinco colunas, 1.75rem estoura a largura do card, então fixamos o
          limite INFERIOR da própria faixa — continua dentro do que a marca
          define, sem inventar tamanho novo.
        */}
        <h3 className="ma-h3 mt-ma-1 text-balance text-ma-charcoal xl:text-[1.375rem]">
          <span className="sr-only">Eixo {pauta.numero}: </span>
          {pauta.titulo}
        </h3>

        <p className="ma-body text-ma-charcoal/75">{pauta.resumo}</p>

        <span className="ma-eyebrow mt-auto inline-flex items-center gap-1 pt-ma-2 text-ma-green">
          <span className="group-open:hidden">Ler o detalhe</span>
          <span className="hidden group-open:inline">Fechar</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="transition-transform group-open:rotate-180"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>

      <div className="mt-ma-3 space-y-ma-2 border-t border-ma-borda pt-ma-3">
        {paragrafosDeMarkdown(pauta.detalhe)}
      </div>
    </details>
  )
}
