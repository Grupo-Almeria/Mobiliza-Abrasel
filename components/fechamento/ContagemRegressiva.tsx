'use client'

import { useEffect, useState } from 'react'

/**
 * Contagem regressiva discreta para o pleito.
 *
 * Calculada no cliente porque depende do "hoje" de quem visita — uma página
 * estática não sabe disso. Antes da hidratação não mostramos nada, para não
 * exibir por um instante um número calculado no horário do build.
 *
 * O fuso é fixado em -03:00 (Brasília) para que a contagem não mude conforme o
 * relógio do aparelho de quem abre o link de outro estado.
 */

type Props = {
  dataPleito: string
}

export function ContagemRegressiva({ dataPleito }: Props) {
  const [dias, setDias] = useState<number | null>(null)

  useEffect(() => {
    function calcular() {
      const pleito = new Date(`${dataPleito}T08:00:00-03:00`)
      const agora = new Date()
      const restante = pleito.getTime() - agora.getTime()
      setDias(Math.max(0, Math.ceil(restante / 86_400_000)))
    }

    calcular()
    // Recalcula de hora em hora: a página pode ficar aberta virando o dia.
    const intervalo = setInterval(calcular, 3_600_000)
    return () => clearInterval(intervalo)
  }, [dataPleito])

  if (dias === null) return null

  const data = new Date(`${dataPleito}T08:00:00-03:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })

  if (dias === 0) {
    return <p className="ma-body text-ma-white/75">A votação é hoje, {data}.</p>
  }

  return (
    <p className="ma-body text-ma-white/75">
      <span className="font-semibold text-ma-lime tabular-nums">{dias}</span>{' '}
      {dias === 1 ? 'dia' : 'dias'} para a votação, em {data}.
    </p>
  )
}
