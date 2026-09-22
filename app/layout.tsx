import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'

import { lerConfig } from '@/lib/conteudo'
import { CAMINHO_OG_IMAGE, OG_ALTURA, OG_LARGURA } from '@/lib/og'

// O CSS da marca entra por dentro do globals.css, via postcss-import, para ficar
// na camada `components` do Tailwind. Ver o cabeçalho de styles/tokens-marca.css.
import './globals.css'

const config = lerConfig()

export const metadata: Metadata = {
  metadataBase: new URL(config.urlSite),
  title: config.ogTitle,
  description: config.ogDescription,
  applicationName: 'Mobiliza Abrasel',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: config.urlSite,
    siteName: 'Mobiliza Abrasel',
    title: config.ogTitle,
    description: config.ogDescription,
    images: [
      {
        url: CAMINHO_OG_IMAGE,
        width: OG_LARGURA,
        height: OG_ALTURA,
        // Parte dos rastreadores lê o og:image:type antes de baixar a imagem.
        type: 'image/jpeg',
        alt: 'Mobiliza Abrasel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.ogTitle,
    description: config.ogDescription,
    images: [CAMINHO_OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#00652E',
  width: 'device-width',
  initialScale: 1,
  // Nunca travar o zoom: é requisito de acessibilidade.
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/*
          Só os dois pesos do caminho crítico entram em preload: 700 é o título
          do hero (o LCP) e 400 é o texto corrido logo abaixo. Os pesos 500 e 600
          aparecem mais adiante na página e carregam por demanda.
        */}
        <link
          rel="preload"
          href="/fontes/poppins-latin-700.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fontes/poppins-latin-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <a
          href="#candidatos"
          className="ma-focus sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ma-btn focus:bg-ma-white focus:px-4 focus:py-3 focus:text-ma-charcoal"
        >
          Pular para os candidatos
        </a>

        {children}

        <Analytics />
      </body>
    </html>
  )
}
