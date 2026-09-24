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
  /** Só é lido quando o endereço não declara o formato. Ver `dadosDoVideo`. */
  vertical?: boolean
}

/**
 * Extrai o id do vídeo e a orientação, das formas usuais de endereço do YouTube.
 *
 * A orientação vem do próprio caminho quando ele declara: `/shorts/` é sempre
 * vertical (9:16), por definição da plataforma. Derivar daí significa que trocar
 * um Short por um 16:9 comum devolve o bloco ao formato tradicional sozinho, sem
 * interruptor que alguém precise lembrar de mexer.
 *
 * O que essa derivação NÃO cobre: `youtu.be/ID` — a forma que o botão
 * "Compartilhar" do YouTube entrega com mais frequência — é muda quanto ao
 * formato, e o mesmo vale para `watch?v=`. Nesses casos a informação não existe
 * no endereço e não há derivação possível; quem responde é o campo
 * `videoVertical` do config.json.
 *
 * Por isso o campo abaixo se chama `verticalPelaUrl` e não `vertical`: `false`
 * aqui significa "o endereço não disse", e não "é horizontal". Só o `true` pode
 * vencer o config.
 */
function dadosDoVideo(url: string): { id: string; verticalPelaUrl: boolean } | null {
  try {
    const endereco = new URL(url)
    const host = endereco.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = endereco.pathname.slice(1)
      return id ? { id, verticalPelaUrl: false } : null
    }

    if (endereco.searchParams.has('v')) {
      const id = endereco.searchParams.get('v')
      return id ? { id, verticalPelaUrl: false } : null
    }

    const partes = endereco.pathname.split('/').filter(Boolean)
    if (partes[0] === 'embed' && partes[1]) return { id: partes[1], verticalPelaUrl: false }
    if (partes[0] === 'shorts' && partes[1]) return { id: partes[1], verticalPelaUrl: true }

    return null
  } catch {
    return null
  }
}

export function VideoFacade({ url, titulo, vertical: verticalPeloConfig = false }: Props) {
  const [tocando, setTocando] = useState(false)
  const dados = dadosDoVideo(url)

  // Nesta ordem de propósito: o endereço manda quando declara, e o config só
  // responde pelo silêncio. Assim um `/shorts/` nunca é desligado por engano.
  const vertical = dados?.verticalPelaUrl || verticalPeloConfig

  /**
   * Um 9:16 ocupando a largura inteira da coluna ficaria mais alto que a tela no
   * celular. A largura máxima mantém o vídeo em tamanho confortável e centrado,
   * nas duas telas.
   */
  const proporcao = vertical
    ? 'aspect-[9/16] mx-auto w-full max-w-[min(340px,100%)]'
    : 'aspect-video'

  if (!dados) {
    return (
      <div className={`ma-card flex items-center justify-center bg-ma-cream text-center ${proporcao}`}>
        <p className="ma-body max-w-[32ch] px-ma-3 text-ma-charcoal/60">
          O vídeo institucional entra aqui assim que estiver pronto.
        </p>
      </div>
    )
  }

  const { id } = dados

  if (tocando) {
    return (
      <div className={`overflow-hidden rounded-ma-md shadow-ma-card ${proporcao}`}>
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
      className={`ma-focus group relative block overflow-hidden rounded-ma-md bg-ma-charcoal shadow-ma-card ${proporcao}`}
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
