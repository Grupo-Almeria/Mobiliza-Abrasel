'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Número que conta até o valor final quando entra na tela, uma vez só.
 *
 * O valor final já vem no HTML do servidor: quem estiver sem JavaScript, ou com
 * "reduzir movimento" ligado, vê o número certo imediatamente. A animação é
 * aprimoramento, nunca pré-requisito para ler o dado.
 */

type Props = {
  valor: number
  rotulo: string
}

const DURACAO_MS = 1400

export function Contador({ valor, rotulo }: Props) {
  const [exibido, setExibido] = useState(valor)
  const referencia = useRef<HTMLDivElement>(null)
  const jaAnimou = useRef(false)

  useEffect(() => {
    const elemento = referencia.current
    if (!elemento || jaAnimou.current) return

    const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefereMenosMovimento) return

    // Só zera quando temos certeza de que vamos animar — evita piscar o número.
    setExibido(0)

    const observador = new IntersectionObserver(
      (entradas) => {
        const entrada = entradas[0]
        if (!entrada?.isIntersecting || jaAnimou.current) return

        jaAnimou.current = true
        observador.disconnect()

        const inicio = performance.now()
        function passo(agora: number) {
          const progresso = Math.min((agora - inicio) / DURACAO_MS, 1)
          // easeOutCubic: rápido no começo, assenta no fim.
          const suavizado = 1 - Math.pow(1 - progresso, 3)
          setExibido(Math.round(valor * suavizado))
          if (progresso < 1) requestAnimationFrame(passo)
        }
        requestAnimationFrame(passo)
      },
      { threshold: 0.4 },
    )

    observador.observe(elemento)
    return () => observador.disconnect()
  }, [valor])

  return (
    <div ref={referencia}>
      <div className="ma-h2 tabular-nums text-ma-green">{exibido.toLocaleString('pt-BR')}</div>
      <div className="ma-body mt-ma-1 text-ma-charcoal/75">{rotulo}</div>
    </div>
  )
}
