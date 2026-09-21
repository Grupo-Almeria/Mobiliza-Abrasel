'use client'

import Image from 'next/image'

import { BotaoCompartilhar } from '@/components/compartilhar/BotaoCompartilhar'
import { CARGOS } from '@/lib/cargos'
import { NumeroUrna } from '@/components/candidatos/NumeroUrna'
import { evento } from '@/lib/analytics'
import { textoDoCandidato } from '@/lib/compartilhar'
import type { Candidato } from '@/lib/conteudo'

/**
 * Card de candidato.
 *
 * Todos os cards têm o mesmo tamanho e o mesmo tratamento visual. Nenhum tem
 * destaque sobre outro — é proteção reputacional e jurídica: a lista não pode
 * ser lida como ranking de preferência da associação.
 *
 * O texto evita qualquer verbo de pedido de voto. A formulação é sempre
 * "assinou a Carta de Compromisso".
 */

type Props = {
  candidato: Candidato
  url: string
}

export function CardCandidato({ candidato, url }: Props) {
  const cargo = CARGOS[candidato.cargo].rotulo

  return (
    <article className="ma-card flex h-full w-full min-w-0 flex-col p-0 transition-shadow md:hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden rounded-t-ma-md bg-ma-cream">
        <Image
          src={candidato.foto}
          alt={`Retrato de ${candidato.nomeUrna}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-ma-2 md:p-ma-3">
        <p className="ma-eyebrow text-ma-green">{cargo}</p>

        <h3 className="ma-h3 mt-ma-1 text-balance text-[1.15rem] leading-tight text-ma-charcoal">
          {candidato.nomeUrna}
        </h3>

        <p className="ma-body mt-0.5 text-sm text-ma-charcoal/60">{candidato.partido}</p>

        <NumeroUrna numero={candidato.numero} className="mt-ma-2" />

        <div className="mt-ma-3 flex flex-col gap-ma-1 pt-ma-1">
          <a
            href={candidato.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              evento('clique_instagram_candidato', {
                candidato: candidato.nomeUrna,
                cargo: candidato.cargo,
              })
            }
            className="ma-focus ma-btn ma-btn--primary w-full !min-h-[44px] !px-3 text-center text-sm leading-tight"
          >
            Ver no Instagram
            <span className="sr-only"> de {candidato.nomeUrna}, abre em nova aba</span>
          </a>

          <BotaoCompartilhar
            texto={textoDoCandidato(candidato, url)}
            url={url}
            origem="candidato"
            variante="destaque"
            compacto
          />
        </div>
      </div>
    </article>
  )
}
