import { Arcos } from '@/components/ui/Arcos'
import { Contador } from '@/components/sobre/Contador'
import { CtaCandidatos } from '@/components/ui/CtaCandidatos'
import { Secao } from '@/components/ui/Secao'
import { VideoFacade } from '@/components/sobre/VideoFacade'

/**
 * Bloco 1 — Sobre o Mobiliza.
 *
 * Tom institucional, no máximo três parágrafos, sem jargão e sem tom de comício.
 *
 * Os números do setor só aparecem quando `associados` e `empregos` estiverem
 * preenchidos em config.json. Enquanto estiverem null, o bloco inteiro de
 * números some — nunca publicamos estimativa como se fosse dado confirmado.
 */

type Props = {
  paragrafos: string[]
  associados: number | null
  empregos: number | null
  frasePosicionamento: string
  urlVideo: string
}

export function Sobre({
  paragrafos,
  associados,
  empregos,
  frasePosicionamento,
  urlVideo,
}: Props) {
  const temNumeros = associados !== null || empregos !== null

  return (
    <Secao id="sobre" fundo="creme" rotulo="Sobre o Mobiliza">
      <Arcos
        tom="cor"
        className="pointer-events-none absolute -left-1/3 -top-1/4 h-[130%] w-[110%] opacity-70 md:-left-[15%] md:w-[60%]"
      />

      <div className="grid gap-ma-6 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-ma-7">
        <div>
          <p className="ma-eyebrow">O movimento</p>

          <h2 className="ma-h2 mt-ma-2 max-w-[20ch] text-balance">
            Uma pauta organizada, assinada e pública.
          </h2>

          <div className="mt-ma-4 space-y-ma-3">
            {paragrafos.map((paragrafo) => (
              <p key={paragrafo.slice(0, 48)} className="ma-body max-w-[62ch] text-ma-charcoal/85">
                {paragrafo}
              </p>
            ))}
          </div>

          {temNumeros && (
            <div className="ma-callout mt-ma-5 bg-ma-white">
              <div className="flex flex-wrap gap-ma-5">
                {associados !== null && (
                  <Contador valor={associados} rotulo="empresas associadas" />
                )}
                {empregos !== null && <Contador valor={empregos} rotulo="empregos gerados" />}
              </div>
              <p className="ma-body mt-ma-3 max-w-[40ch] text-ma-charcoal/75">
                {frasePosicionamento}
              </p>
            </div>
          )}

          <div className="mt-ma-5">
            <CtaCandidatos origem="sobre" variante="primario" />
          </div>
        </div>

        <div className="lg:sticky lg:top-ma-5">
          <VideoFacade url={urlVideo} titulo="Mobiliza Abrasel — vídeo institucional" />
        </div>
      </div>
    </Secao>
  )
}
