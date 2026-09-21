import type { IconePauta as NomeIcone } from '@/lib/schema'

/**
 * Ícones dos cinco eixos.
 *
 * São traços geométricos construídos com os mesmos arcos de ponta arredondada
 * do símbolo da marca. O briefing proíbe ilustração vetorial genérica de garçom,
 * prato ou chapéu de chef — e o guia pede linhas finas e arcos como camada de
 * identidade. Cada ícone é uma leitura abstrata do eixo, não um pictograma.
 */

type Props = {
  nome: NomeIcone
  className?: string
}

const DESENHOS: Record<NomeIcone, React.ReactNode> = {
  // Alcance: arcos concêntricos irradiando de um ponto, a mesma construção do
  // símbolo da marca. Divulgar Brasília é fazer a mensagem chegar longe.
  turismo: (
    <>
      <circle cx="24" cy="38" r="2.6" fill="currentColor" stroke="none" />
      <path d="M14.5 33.5a13 13 0 0 1 19 0" />
      <path d="M7.5 26.5a23 23 0 0 1 33 0" />
      <path d="M4 19a30 30 0 0 1 40 0" />
    </>
  ),
  // Proteção: escudo de contorno único, sem selo nem marca de verificação, que
  // puxariam a leitura para software de antivírus.
  seguranca: <path d="M24 6l14 6v10.5c0 9-5.8 14.6-14 17.5-8.2-2.9-14-8.5-14-17.5V12l14-6z" />,
  // Via em perspectiva com faixa central: transporte, sem desenhar veículo.
  mobilidade: (
    <>
      <path d="M14 40L20 10M34 40L28 10" />
      <path d="M24 16v5M24 26v5M24 36v3" />
    </>
  ),
  // Ordem: módulos delimitados dentro de um perímetro.
  ordenamento: (
    <>
      <rect x="6" y="10" width="36" height="28" rx="3" />
      <path d="M6 20h36M20 20v18" />
    </>
  ),
  // Crescimento: arco ascendente com ponta, na mesma família de traço dos demais.
  investidor: (
    <>
      <path d="M7 37a30 30 0 0 1 33-25" />
      <path d="M31 10.5l9 1.5-1.5 9" />
    </>
  ),
}

export function IconePauta({ nome, className = 'h-10 w-10' }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {DESENHOS[nome]}
    </svg>
  )
}
