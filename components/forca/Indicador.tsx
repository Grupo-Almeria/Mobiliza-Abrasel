'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Um indicador da faixa: número grande contando até o valor final, rótulo abaixo.
 *
 * O valor final já vem no HTML do servidor. Quem estiver sem JavaScript, ou com
 * "reduzir movimento" ligado, vê o número certo imediatamente — e leitor de tela
 * nunca anuncia um valor intermediário da contagem. A animação é aprimoramento,
 * nunca pré-requisito para ler o dado.
 *
 * O prefixo ("+") fica fora da contagem, parado ao lado do número.
 */

type Props = {
  prefixo?: string
  valor: number
  rotulo: string
}

const DURACAO_MS = 1200

export function Indicador({ prefixo, valor, rotulo }: Props) {
  const [exibido, setExibido] = useState(valor)
  const referencia = useRef<HTMLDivElement>(null)
  const jaAnimou = useRef(false)

  useEffect(() => {
    const elemento = referencia.current
    if (!elemento || jaAnimou.current) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Só zera quando temos certeza de que vamos animar — evita piscar o número.
    setExibido(0)

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0]?.isIntersecting || jaAnimou.current) return

        jaAnimou.current = true
        observador.disconnect()

        const inicio = performance.now()
        function passo(agora: number) {
          const progresso = Math.min((agora - inicio) / DURACAO_MS, 1)
          // easeOutCubic: parte rápido e assenta no fim.
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
    <div ref={referencia} className="text-center">
      {/*
        O número é o herói: laranja da marca sobre carvão dá 6,28:1, o mesmo par
        que a tabela oficial documenta. Sobre verde daria 2,75:1 e reprovaria —
        é a razão de a faixa ser carvão e não verde.
      */}
      <p className="font-sans text-[3.25rem] font-bold leading-none tracking-tight tabular-nums text-ma-orange md:text-[4rem] lg:text-[4.5rem]">
        {prefixo && <span aria-hidden="true">{prefixo}</span>}
        {exibido.toLocaleString('pt-BR')}
        {/* O valor exato para leitor de tela, sem depender do estado da contagem. */}
        <span className="sr-only">
          {prefixo === '+' ? 'mais de ' : ''}
          {valor.toLocaleString('pt-BR')}
        </span>
      </p>

      <p className="mx-auto mt-ma-2 max-w-[24ch] font-sans text-xs font-normal uppercase leading-snug tracking-[0.14em] text-ma-white/70 md:min-h-[2.6em] md:text-[0.8125rem]">
        {rotulo}
      </p>
    </div>
  )
}
