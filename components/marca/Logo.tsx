import Image from 'next/image'

/**
 * Logotipo do Mobiliza Abrasel.
 *
 * Os SVGs vêm do pacote oficial da marca e são usados como estão — o logotipo
 * nunca é redesenhado em texto ou CSS, nem tem letra recolorida. Cada variante
 * tem um contexto de uso definido pelo guia:
 *
 *  - `principal`  fundo claro
 *  - `negativo`   fundo verde ou carvão
 *  - `compacta`   cabeçalhos de pouca altura
 *  - `simbolo`    favicon, avatar e usos muito reduzidos
 *
 * `unoptimized` porque SVG já é vetorial: passar pelo otimizador de imagem só
 * adicionaria uma requisição sem reduzir byte nenhum.
 */

const VARIANTES = {
  principal: {
    arquivo: '/marca/Mobiliza_Abrasel_01_Principal_Horizontal_Cor.svg',
    largura: 1200,
    altura: 390,
  },
  negativo: {
    arquivo: '/marca/Mobiliza_Abrasel_02_Horizontal_Negativo_Cor.svg',
    largura: 1200,
    altura: 390,
  },
  compacta: {
    arquivo: '/marca/Mobiliza_Abrasel_11_Compacta_Cor.svg',
    largura: 1000,
    altura: 260,
  },
  simbolo: {
    arquivo: '/marca/Mobiliza_Abrasel_08_Simbolo_Cor.svg',
    largura: 520,
    altura: 520,
  },
  simboloBranco: {
    arquivo: '/marca/Mobiliza_Abrasel_10_Simbolo_Branco.svg',
    largura: 520,
    altura: 520,
  },
} as const

export type VarianteLogo = keyof typeof VARIANTES

type Props = {
  variante?: VarianteLogo
  /** Altura renderizada em pixels. A largura acompanha a proporção original. */
  altura?: number
  className?: string
  prioridade?: boolean
}

export function Logo({
  variante = 'principal',
  altura = 64,
  className,
  prioridade = false,
}: Props) {
  const { arquivo, largura: larguraOriginal, altura: alturaOriginal } = VARIANTES[variante]
  const largura = Math.round((larguraOriginal / alturaOriginal) * altura)

  return (
    <Image
      src={arquivo}
      alt="Mobiliza Abrasel"
      width={largura}
      height={altura}
      className={className}
      priority={prioridade}
      unoptimized
    />
  )
}
