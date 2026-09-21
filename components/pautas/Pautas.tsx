import { CardPauta } from '@/components/pautas/CardPauta'
import { CarrosselPautas } from '@/components/pautas/CarrosselPautas'
import { CtaCandidatos } from '@/components/ui/CtaCandidatos'
import { LinkCarta } from '@/components/pautas/LinkCarta'
import { Secao } from '@/components/ui/Secao'
import type { Pauta } from '@/lib/conteudo'

/**
 * Bloco 2 — As cinco pautas.
 *
 * Mobile: carrossel com swipe, um card por vez, indicadores de progresso. A
 * rolagem é scroll-snap nativo do CSS, que dá inércia de verdade no iOS e no
 * Android e funciona sem JavaScript.
 *
 * Desktop: grid de cinco colunas com expansão ao clique — a alternativa que o
 * briefing prevê, escolhida no lugar da revelação progressiva para manter o
 * conteúdo todo alcançável de imediato.
 */

type Props = {
  pautas: Pauta[]
}

export function Pautas({ pautas }: Props) {
  return (
    <Secao id="pautas" fundo="branco" rotulo="As cinco pautas">
      <div className="max-w-[46ch]">
        <p className="ma-eyebrow">A Carta de Compromisso</p>
        <h2 className="ma-h2 mt-ma-2 text-balance">Cinco eixos, assinados por quem se comprometeu.</h2>
      </div>

      {/* Celular: carrossel. */}
      <div className="mt-ma-5 md:hidden">
        <CarrosselPautas pautas={pautas} />
      </div>

      {/* Tablet e desktop: grid. Cinco colunas a partir de 1280px. */}
      <ul className="mt-ma-5 hidden gap-ma-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {pautas.map((pauta) => (
          <li key={pauta.numero} className="flex">
            <CardPauta pauta={pauta} className="w-full" />
          </li>
        ))}
      </ul>

      <div className="mt-ma-5 flex flex-col gap-ma-2 sm:flex-row sm:items-center">
        <LinkCarta />
        <CtaCandidatos origem="pautas" variante="primario" />
      </div>
    </Secao>
  )
}
