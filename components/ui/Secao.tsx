import type { ReactNode } from 'react'

/**
 * Faixa de conteúdo com fundo próprio e o container da marca por dentro.
 *
 * O ritmo da página vem da alternância de fundos: verde e carvão nas faixas
 * escuras, branco e creme nas claras. Os quatro tons são tokens oficiais.
 */

type Fundo = 'branco' | 'creme' | 'verde' | 'carvao'

const FUNDOS: Record<Fundo, string> = {
  branco: 'bg-ma-white text-ma-charcoal',
  creme: 'bg-ma-cream text-ma-charcoal',
  // Branco sobre verde: 7.24:1.
  verde: 'bg-ma-green text-ma-white',
  // Branco sobre carvão: 16.30:1.
  carvao: 'bg-ma-charcoal text-ma-white',
}

type Props = {
  id?: string
  fundo?: Fundo
  children: ReactNode
  className?: string
  /** Remove o padding vertical padrão, para seções que controlam o próprio ritmo. */
  semEspacamento?: boolean
  rotulo?: string
}

export function Secao({
  id,
  fundo = 'branco',
  children,
  className = '',
  semEspacamento = false,
  rotulo,
}: Props) {
  // Respiro generoso, como pede a marca: 64px no celular, 96px a partir do tablet.
  const espacamento = semEspacamento ? '' : 'py-ma-6 md:py-ma-7'

  return (
    <section
      id={id}
      aria-label={rotulo}
      className={`relative overflow-hidden ${FUNDOS[fundo]} ${espacamento} ${className}`.trim()}
    >
      <div className="relative z-10 mx-auto w-full max-w-ma-container px-5 md:px-8 lg:px-12">
        {children}
      </div>
    </section>
  )
}
