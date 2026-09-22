import { Arcos } from '@/components/ui/Arcos'
import { CtaCandidatos } from '@/components/ui/CtaCandidatos'
import { Secao } from '@/components/ui/Secao'
import { VideoFacade } from '@/components/sobre/VideoFacade'

/**
 * Bloco 1 — Sobre o Mobiliza.
 *
 * Tom institucional, no máximo três parágrafos, sem jargão e sem tom de comício.
 *
 * Os números do setor vivem na faixa "A Força da Abrasel-DF", logo abaixo deste
 * bloco. Ficam só lá para não haver repetição: aqui é texto e vídeo.
 */

type Props = {
  paragrafos: string[]
  urlVideo: string
}

export function Sobre({ paragrafos, urlVideo }: Props) {
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
