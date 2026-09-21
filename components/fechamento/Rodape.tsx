import Image from 'next/image'

import { Logo } from '@/components/marca/Logo'

/**
 * Rodapé com o aviso institucional.
 *
 * O texto vem de config.json justamente para ser ajustado rápido depois do
 * parecer do advogado eleitoral, sem tocar em código. Ele declara quem mantém o
 * site, a natureza associativa do movimento, a ausência de vínculo partidário e
 * que a apresentação dos candidatos decorre exclusivamente da adesão à Carta.
 */

type Props = {
  aviso: string
}

export function Rodape({ aviso }: Props) {
  return (
    <footer className="bg-ma-charcoal px-5 py-ma-6 text-ma-white md:px-8 lg:px-12">
      <div className="mx-auto max-w-ma-container">
        <div className="flex flex-wrap items-center gap-ma-4">
          <Logo variante="negativo" altura={40} className="h-9 w-auto" />
        </div>

        <p className="ma-body mt-ma-4 max-w-[80ch] text-sm leading-relaxed text-ma-white/65">
          {aviso}
        </p>

        <p className="ma-body mt-ma-3 text-sm text-ma-white/45">
          © {new Date().getFullYear()} Abrasel-DF — Associação Brasileira de Bares e Restaurantes,
          Seccional Distrito Federal.
        </p>
      </div>
    </footer>
  )
}
