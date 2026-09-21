import Image from 'next/image'

import { Arcos } from '@/components/ui/Arcos'
import { BotaoCompartilhar } from '@/components/compartilhar/BotaoCompartilhar'
import { Logo } from '@/components/marca/Logo'
import { CtaCandidatos } from '@/components/ui/CtaCandidatos'

/**
 * Bloco 0 — Hero.
 *
 * O topo é do setor, não dos candidatos: nenhuma foto de político aparece aqui.
 *
 * Contraste: sobre a imagem de fundo aplicamos verde da marca e, por cima, um
 * véu de carvão de no mínimo 30%. No pior caso possível — uma foto inteiramente
 * branca — o fundo resultante ainda dá 6,8:1 com texto branco, acima do mínimo
 * AA de 4,5:1. Isso significa que qualquer foto que a Abrasel enviar continua
 * legível, sem precisar de tratamento.
 *
 * O CTA principal é uma âncora de verdade: funciona com o JavaScript desligado.
 */

type Props = {
  frase: string
  linhaApoio: string
  textoCompartilhamento: string
  url: string
}

export function Hero({ frase, linhaApoio, textoCompartilhamento, url }: Props) {
  return (
    <section
      aria-label="Mobiliza Abrasel"
      className="relative isolate flex min-h-[85svh] items-center overflow-hidden bg-ma-green"
    >
      {/* Fundo do setor. `priority` porque é o LCP da página. */}
      <Image
        src="/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-20"
        aria-hidden="true"
      />

      {/* Véu que garante o contraste do texto sobre qualquer foto. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ma-charcoal/45 via-ma-charcoal/30 to-ma-charcoal/55"
      />

      <Arcos
        tom="claro"
        className="pointer-events-none absolute -right-1/4 top-0 h-full w-[150%] md:-right-[10%] md:w-[80%]"
      />

      <div className="relative z-10 mx-auto w-full max-w-ma-container px-5 py-ma-6 md:px-8 md:py-ma-7 lg:px-12">
        <Logo variante="negativo" altura={56} prioridade className="h-12 w-auto md:h-16" />

        {/*
          pb-[0.06em] dá folga ao descendente: o token .ma-h1 usa line-height
          0.98, menor que 1, então em Poppins o glifo é mais alto que a caixa de
          linha. O padding resolve sem tocar no token da marca.
        */}
        <h1 className="ma-h1 mt-ma-4 max-w-[20ch] text-balance pb-[0.06em] text-ma-white md:mt-ma-5">
          {frase}
        </h1>

        <p className="ma-body mt-ma-4 max-w-[46ch] text-ma-white/90 md:mt-ma-5 md:text-xl lg:mt-ma-6">
          {linhaApoio}
        </p>

        <div className="mt-ma-5 flex flex-col gap-ma-2 sm:flex-row sm:items-center md:mt-ma-6">
          <CtaCandidatos origem="hero" variante="destaque" />
          <BotaoCompartilhar
            texto={textoCompartilhamento}
            url={url}
            origem="hero"
            variante="claro"
          />
        </div>
      </div>
    </section>
  )
}
