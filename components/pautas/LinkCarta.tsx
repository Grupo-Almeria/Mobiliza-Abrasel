'use client'

import { evento } from '@/lib/analytics'
import { Botao } from '@/components/ui/Botao'

/** Abre o PDF da Carta em nova aba e registra o evento. */
export function LinkCarta() {
  return (
    <Botao
      como="a"
      href="/docs/carta-compromisso.pdf"
      target="_blank"
      rel="noopener noreferrer"
      variante="destaque"
      onClick={() => evento('abrir_carta_pdf')}
    >
      Ler a Carta de Compromisso na íntegra
    </Botao>
  )
}
