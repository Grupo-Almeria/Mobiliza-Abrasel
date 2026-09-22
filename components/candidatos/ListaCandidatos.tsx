'use client'

import { useEffect, useState } from 'react'

import { CardCandidato } from '@/components/candidatos/CardCandidato'
import { embaralhar } from '@/lib/embaralhar'
import type { Candidato } from '@/lib/conteudo'

/**
 * A lista de um cargo, reembaralhada a cada visita.
 *
 * O servidor já entrega a lista embaralhada com a semente do build. Aqui ela é
 * renderizada nessa mesma ordem no primeiro render — sem isso, servidor e
 * cliente produziriam HTML diferente e a hidratação quebraria — e só depois,
 * num efeito, a ordem é sorteada de novo.
 *
 * Na prática: quem chega vê uma ordem; quem recarrega vê outra. E como todos os
 * cards têm o mesmo tamanho, a troca não desloca nada na tela.
 */

type Props = {
  candidatos: Candidato[]
  url: string
}

export function ListaCandidatos({ candidatos, url }: Props) {
  const [ordem, setOrdem] = useState(candidatos)

  useEffect(() => {
    // Só depois da hidratação. Com um candidato só não há o que sortear.
    if (candidatos.length < 2) return
    setOrdem(embaralhar(candidatos))
  }, [candidatos])

  return (
    <ul className="mt-ma-3 grid grid-cols-1 gap-ma-2 min-[380px]:grid-cols-2 md:grid-cols-3 md:gap-ma-3 lg:grid-cols-4 xl:grid-cols-5">
      {ordem.map((candidato) => (
        <li key={`${candidato.cargo}-${candidato.numero}`} className="flex">
          <CardCandidato candidato={candidato} url={url} />
        </li>
      ))}
    </ul>
  )
}
