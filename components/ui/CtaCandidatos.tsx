'use client'

import { evento } from '@/lib/analytics'
import { Botao } from '@/components/ui/Botao'

/**
 * CTA primário do site: "Conheça os Candidatos".
 *
 * É uma âncora real para #candidatos, não um botão com scroll por JavaScript.
 * Com o JS desligado ou ainda não carregado, o clique continua funcionando — o
 * que importa num WebView de WhatsApp em 4G, onde o HTML chega bem antes do JS.
 *
 * O componente é client apenas para registrar o evento no clique; o link em si
 * já vem pronto no HTML do servidor.
 */

type Props = {
  origem: string
  variante?: 'primario' | 'destaque' | 'contorno'
  rotulo?: string
  className?: string
}

export function CtaCandidatos({
  origem,
  variante = 'primario',
  rotulo = 'Conheça os Candidatos',
  className = '',
}: Props) {
  return (
    <Botao
      como="a"
      href="#candidatos"
      variante={variante}
      className={className}
      onClick={() => evento('cta_conheca_candidatos', { origem })}
    >
      {rotulo}
    </Botao>
  )
}
