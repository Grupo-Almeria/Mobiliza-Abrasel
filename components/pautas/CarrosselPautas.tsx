'use client'

import { useEffect, useRef, useState } from 'react'

import { CardPauta } from '@/components/pautas/CardPauta'
import type { Pauta } from '@/lib/conteudo'

/**
 * Carrossel das pautas no celular.
 *
 * A rolagem é scroll-snap do CSS: swipe nativo, com a inércia do sistema, sem
 * biblioteca e sem JavaScript no caminho crítico. Se o script não carregar, o
 * carrossel continua funcionando — só os indicadores param de acompanhar a
 * posição, que é degradação aceitável.
 *
 * O JS existe para duas coisas: manter os pontinhos em sincronia e permitir
 * pular para um card específico pelo teclado.
 */

type Props = {
  pautas: Pauta[]
}

export function CarrosselPautas({ pautas }: Props) {
  const trilhaRef = useRef<HTMLUListElement>(null)
  const [ativo, setAtivo] = useState(0)

  useEffect(() => {
    const trilha = trilhaRef.current
    if (!trilha) return

    // Descobre qual card está mais ao centro a cada parada da rolagem.
    let agendado = false
    function aoRolar() {
      if (agendado) return
      agendado = true

      requestAnimationFrame(() => {
        agendado = false
        const t = trilhaRef.current
        if (!t) return

        const centro = t.scrollLeft + t.clientWidth / 2
        let maisProximo = 0
        let menorDistancia = Number.POSITIVE_INFINITY

        Array.from(t.children).forEach((filho, indice) => {
          const elemento = filho as HTMLElement
          const centroDoCard = elemento.offsetLeft + elemento.offsetWidth / 2
          const distancia = Math.abs(centroDoCard - centro)
          if (distancia < menorDistancia) {
            menorDistancia = distancia
            maisProximo = indice
          }
        })

        setAtivo(maisProximo)
      })
    }

    trilha.addEventListener('scroll', aoRolar, { passive: true })
    return () => trilha.removeEventListener('scroll', aoRolar)
  }, [])

  function irPara(indice: number) {
    const trilha = trilhaRef.current
    const destino = trilha?.children[indice] as HTMLElement | undefined
    if (!trilha || !destino) return

    trilha.scrollTo({
      left: destino.offsetLeft - trilha.offsetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <div>
      <ul
        ref={trilhaRef}
        // -mx-5 + px-5 fazem o primeiro e o último card respirarem na borda da
        // tela sem quebrar o alinhamento do container.
        className="-mx-5 flex snap-x snap-mandatory gap-ma-2 overflow-x-auto scroll-smooth px-5 pb-ma-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pautas.map((pauta) => (
          <li key={pauta.numero} className="w-[85%] shrink-0 snap-center">
            <CardPauta pauta={pauta} className="h-full" />
          </li>
        ))}
      </ul>

      <div className="mt-ma-1 flex items-center justify-center" role="tablist" aria-label="Eixos da Carta">
        {pautas.map((pauta, indice) => {
          const estaAtivo = indice === ativo
          return (
            <button
              key={pauta.numero}
              type="button"
              role="tab"
              aria-selected={estaAtivo}
              aria-label={`Eixo ${pauta.numero}: ${pauta.titulo}`}
              onClick={() => irPara(indice)}
              // 44×44 de área de toque, ainda que o ponto visível seja pequeno:
              // o alvo precisa caber no polegar, não no olho.
              className="ma-focus flex h-11 w-11 items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  estaAtivo ? 'w-6 bg-ma-green' : 'w-2 bg-ma-charcoal/25'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
