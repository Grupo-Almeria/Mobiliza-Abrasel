'use client'

import { useEffect, useRef, useState } from 'react'

import { evento, type OrigemDeCompartilhamento } from '@/lib/analytics'
import { linkEmail, linkSms, linkWhatsApp } from '@/lib/compartilhar'
import { Botao } from '@/components/ui/Botao'

/**
 * Botão de compartilhar.
 *
 * No celular usa `navigator.share()`, que abre a bandeja nativa do sistema com
 * WhatsApp, SMS e e-mail — exatamente o comportamento desejado, já que mais de
 * 85% do tráfego vem do WhatsApp.
 *
 * Onde a API não existe (desktop e navegadores antigos), abre um menu com os
 * canais explícitos e a opção de copiar o link.
 *
 * O botão só aparece depois da montagem no cliente saber qual caminho seguir,
 * mas o conteúdo em volta não depende dele: sem JavaScript, a página continua
 * legível e o CTA principal (âncora para os candidatos) continua funcionando.
 */

type Props = {
  texto: string
  url: string
  origem: OrigemDeCompartilhamento
  rotulo?: string
  variante?: 'primario' | 'destaque' | 'contorno'
  className?: string
  /** Versão compacta, usada dentro do card de candidato. */
  compacto?: boolean
}

export function BotaoCompartilhar({
  texto,
  url,
  origem,
  rotulo = 'Compartilhar',
  variante = 'contorno',
  className = '',
  compacto = false,
}: Props) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha o menu ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!menuAberto) return

    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAberto(false)
    }

    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [menuAberto])

  async function aoCompartilhar() {
    // A checagem fica aqui, no clique, e não na renderização: assim o botão sai
    // igual no HTML do servidor e no cliente, sem divergência de hidratação.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: texto, url })
        evento('compartilhar', { origem, canal: 'nativo' })
        return
      } catch (erro) {
        // O usuário fechar a bandeja cai aqui. Não é erro: não abrimos o menu.
        if (erro instanceof Error && erro.name === 'AbortError') return
      }
    }

    setMenuAberto((aberto) => !aberto)
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      evento('compartilhar', { origem, canal: 'copiar' })
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      setCopiado(false)
    }
  }

  const itens = [
    {
      chave: 'whatsapp' as const,
      rotulo: 'WhatsApp',
      href: linkWhatsApp(texto),
    },
    {
      chave: 'email' as const,
      rotulo: 'E-mail',
      href: linkEmail('Mobiliza Abrasel', texto),
    },
    {
      chave: 'sms' as const,
      rotulo: 'SMS',
      href: linkSms(texto),
    },
  ]

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <Botao
        variante={variante}
        onClick={aoCompartilhar}
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        className={compacto ? 'w-full !min-h-[44px] px-4 text-sm' : ''}
      >
        <IconeCompartilhar />
        <span className="ml-2">{rotulo}</span>
      </Botao>

      {menuAberto && (
        <div
          role="menu"
          aria-label="Escolha por onde compartilhar"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-ma-md border border-ma-borda bg-ma-white text-left shadow-ma-card"
        >
          {itens.map((item) => (
            <a
              key={item.chave}
              role="menuitem"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                evento('compartilhar', { origem, canal: item.chave })
                setMenuAberto(false)
              }}
              className="ma-focus block px-4 py-3 text-ma-charcoal transition-colors hover:bg-ma-cream"
            >
              {item.rotulo}
            </a>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={copiarLink}
            className="ma-focus block w-full border-t border-ma-borda px-4 py-3 text-left text-ma-charcoal transition-colors hover:bg-ma-cream"
          >
            {copiado ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>
      )}

      {/* Confirmação anunciada para leitores de tela. */}
      <span aria-live="polite" className="sr-only">
        {copiado ? 'Link copiado para a área de transferência.' : ''}
      </span>
    </div>
  )
}

function IconeCompartilhar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}
