import Image from 'next/image'

import { Secao } from '@/components/ui/Secao'
import type { FotoMural } from '@/lib/conteudo'

/**
 * Bloco 4 — Mural de encontros.
 *
 * Posiciona o movimento como trabalho feito, não como peça de campanha: são os
 * almoços e as reuniões que antecederam a Carta.
 *
 * Versão desta fase: grade com alturas variadas. O lightbox com navegação por
 * teclado e swipe entra na próxima.
 */

type Props = {
  fotos: FotoMural[]
  abertura: string
}

export function Mural({ fotos, abertura }: Props) {
  if (fotos.length === 0) return null

  return (
    <Secao id="mural" fundo="carvao" rotulo="Mural de encontros">
      <div className="max-w-[46ch]">
        <p className="ma-eyebrow text-ma-lime">Prova de trabalho</p>
        <h2 className="ma-h2 mt-ma-2 text-balance text-ma-white">{abertura}</h2>
      </div>

      <ul className="mt-ma-5 grid grid-cols-2 gap-ma-1 md:grid-cols-3 md:gap-ma-2 lg:grid-cols-4">
        {fotos.map((foto, indice) => (
          <li key={foto.imagem} className="relative aspect-[4/3] overflow-hidden rounded-ma-sm bg-ma-white/5">
            <Image
              src={foto.imagem}
              alt={foto.legenda?.trim() || 'Encontro do Mobiliza Abrasel'}
              width={800}
              height={600}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px"
              loading={indice < 4 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
            />
          </li>
        ))}
      </ul>
    </Secao>
  )
}
