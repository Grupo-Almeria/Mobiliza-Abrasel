import { Arcos } from '@/components/ui/Arcos'
import { BotaoCompartilhar } from '@/components/compartilhar/BotaoCompartilhar'
import { ContagemRegressiva } from '@/components/fechamento/ContagemRegressiva'
import { CtaCandidatos } from '@/components/ui/CtaCandidatos'
import { Secao } from '@/components/ui/Secao'

/**
 * Bloco 5 — Fechamento.
 *
 * Última chance de gerar um compartilhamento, que é a métrica que importa: o
 * vetor deste site são as pessoas encaminhando o link, não o site em si.
 */

type Props = {
  textoCompartilhamento: string
  url: string
  dataPleito: string
}

export function Fechamento({ textoCompartilhamento, url, dataPleito }: Props) {
  return (
    <Secao fundo="verde" rotulo="Compartilhe">
      <Arcos
        tom="claro"
        className="pointer-events-none absolute -right-1/3 -top-1/2 h-[200%] w-[120%] md:-right-[5%] md:w-[55%]"
      />

      <div className="max-w-[40ch]">
        <h2 className="ma-h2 text-balance text-ma-white">
          Quanto mais gente souber, melhor.
        </h2>

        <p className="ma-body mt-ma-3 text-ma-white/85">
          Encaminhe para quem trabalha no setor, para a sua equipe e para os seus clientes.
        </p>

        <div className="mt-ma-5 flex flex-col gap-ma-2 sm:flex-row sm:items-center">
          <CtaCandidatos origem="fechamento" variante="destaque" />
          <BotaoCompartilhar
            texto={textoCompartilhamento}
            url={url}
            origem="fechamento"
            variante="contorno"
          />
        </div>

        <div className="mt-ma-5">
          <ContagemRegressiva dataPleito={dataPleito} />
        </div>
      </div>
    </Secao>
  )
}
