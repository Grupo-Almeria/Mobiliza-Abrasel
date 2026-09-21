/**
 * Camada gráfica de fundo.
 *
 * São os três arcos do símbolo da marca — verde, laranja e lima, traço
 * arredondado — ampliados e em opacidade baixa. É o elemento gráfico que o guia
 * chama de "molduras e arcos", derivado da geometria do próprio logotipo.
 *
 * Substitui as texturas de papel, madeira e linho que o briefing sugeria: a
 * identidade pede "institucional, clara e confiável" e alerta contra excesso de
 * elementos gráficos, então a camada de fundo vem da marca, não de material.
 *
 * Puramente decorativo — `aria-hidden`, sem alt, invisível para leitor de tela.
 */

type Props = {
  /** `claro` para fundo escuro (arcos brancos), `cor` para fundo claro. */
  tom?: 'claro' | 'cor'
  className?: string
}

export function Arcos({ tom = 'claro', className }: Props) {
  const claro = tom === 'claro'

  return (
    <svg
      viewBox="0 0 800 800"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Mesma construção do símbolo: arcos concêntricos, pontas arredondadas. */}
      <g strokeLinecap="round" fill="none" strokeWidth="26">
        <path
          d="M 60 520 A 360 360 0 0 1 400 236"
          stroke={claro ? '#FFFFFF' : '#00652E'}
          opacity={claro ? 0.16 : 0.055}
        />
        <path
          d="M 400 236 A 360 360 0 0 1 740 520"
          stroke={claro ? '#FFFFFF' : '#F58220'}
          opacity={claro ? 0.12 : 0.06}
        />
        <path
          d="M 150 620 A 280 280 0 0 1 650 620"
          stroke={claro ? '#FFFFFF' : '#8DC63F'}
          opacity={claro ? 0.09 : 0.07}
        />
        <path
          d="M 250 700 A 190 190 0 0 1 550 700"
          stroke={claro ? '#FFFFFF' : '#00652E'}
          opacity={claro ? 0.06 : 0.045}
        />
      </g>
    </svg>
  )
}
