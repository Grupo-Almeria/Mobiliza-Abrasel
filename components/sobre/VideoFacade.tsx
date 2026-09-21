'use client'

import { useState } from 'react'

import { evento } from '@/lib/analytics'

/**
 * Vídeo institucional com *facade*.
 *
 * O embed do YouTube custa cerca de 700 KB no carregamento inicial e derruba a
 * performance no celular. Aqui mostramos só a miniatura; o iframe só é criado
 * quando alguém clica no play. Antes do clique, o custo é o de uma imagem.
 *
 * Enquanto o vídeo definitivo não estiver gravado, `urlVideo` fica vazio em
 * config.json e o componente reserva o espaço com um aviso — assim o layout já
 * está resolvido quando o vídeo chegar, e não há link para conteúdo de terceiros
 * num site institucional em período eleitoral.
 */

type Props = {
  url: string
  titulo: string
}

/** Extrai o id do vídeo das formas usuais de endereço do YouTube. */
function idDoVideo(url: string): string | null {
  try {
    const endereco = new URL(url)
    const host = endereco.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') return endereco.pathname.slice(1) || null
    if (endereco.searchParams.has('v')) return endereco.searchParams.get('v')

    // /embed/ID e /shorts/ID
    const partes = endereco.pathname.split('/').filter(Boolean)
    if (partes[0] === 'embed' || partes[0] === 'shorts') return partes[1] ?? null

    return null
  } catch {
    return null
  }
}

export function VideoFacade({ url, titulo }: Props) {
  const [tocando, setTocando] = useState(false)
  const id = idDoVideo(url)

  if (!id) {
    return (
      <div className="ma-card flex aspect-video items-center justify-center bg-ma-cream text-center">
        <p className="ma-body max-w-[32ch] px-ma-3 text-ma-charcoal/60">
          O vídeo institucional entra aqui assim que estiver pronto.
        </p>
      </div>
    )
  }

  if (tocando) {
    return (
      <div className="aspect-video overflow-hidden rounded-ma-md shadow-ma-card">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        evento('play_video')
        setTocando(true)
      }}
      aria-label={`Assistir ao vídeo: ${titulo}`}
      className="ma-focus group relative block aspect-video w-full overflow-hidden rounded-ma-md bg-ma-charcoal shadow-ma-card"
    >
      {/*
        Miniatura servida pelo próprio YouTube. É a única requisição externa da
        página antes do clique, e custa alguns kilobytes em vez de 700.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        width={480}
        height={360}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-95"
      />

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ma-orange transition-transform group-hover:scale-110">
          {/* Triângulo em carvão: branco sobre laranja seria 2.59:1, reprovado. */}
          <svg
            width="22"
            height="24"
            viewBox="0 0 22 24"
            fill="#231F20"
            aria-hidden="true"
            focusable="false"
            className="ml-1"
          >
            <path d="M0 0l22 12L0 24z" />
          </svg>
        </span>
      </span>
    </button>
  )
}
