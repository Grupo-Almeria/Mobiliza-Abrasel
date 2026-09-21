import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Botões do site.
 *
 * As duas primeiras variantes são as do design system, aplicadas pelas classes
 * `.ma-btn` de tokens.css. A terceira, `claro`, é o inverso exato do botão
 * primário — branco com texto verde — para uso sobre fundo verde ou carvão,
 * onde um botão verde desapareceria. Usa o mesmo par de cores da marca, só
 * trocado de lado, e dá o mesmo contraste de 7.24:1.
 *
 * Regra de contraste que nunca pode ser quebrada: o botão laranja leva texto
 * carvão, nunca branco (branco sobre laranja é 2.59:1, reprovado).
 */

type Variante = 'primario' | 'destaque' | 'claro'

const CLASSES: Record<Variante, string> = {
  // Verde com branco — 7.24:1.
  primario: 'ma-btn ma-btn--primary',
  // Laranja com carvão — 6.28:1. Jamais branco sobre laranja.
  destaque: 'ma-btn ma-btn--accent',
  // Branco com verde — 7.24:1, o primário invertido.
  claro: 'ma-btn bg-ma-white text-ma-green hover:bg-ma-cream transition-colors',
}

const BASE = 'ma-focus select-none text-center transition-transform active:scale-[0.98]'

type PropsComuns = {
  variante?: Variante
  children: ReactNode
  className?: string
}

type PropsBotao = PropsComuns &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    como?: 'button'
  }

type PropsLink = PropsComuns &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    como: 'a'
    href: string
  }

export function Botao(props: PropsBotao | PropsLink) {
  const { variante = 'primario', children, className = '', ...resto } = props
  const classes = `${BASE} ${CLASSES[variante]} ${className}`.trim()

  if (resto.como === 'a') {
    const { como: _como, ...atributos } = resto
    return (
      <a {...atributos} data-cta className={classes}>
        {children}
      </a>
    )
  }

  const { como: _como, ...atributos } = resto as PropsBotao
  return (
    <button type="button" {...atributos} className={classes}>
      {children}
    </button>
  )
}
