import type { MetadataRoute } from 'next'

import { lerConfig } from '@/lib/conteudo'

/**
 * Os deploys de preview da Vercel já vêm com `x-robots-tag: noindex` por
 * padrão, então nada indexa antes do domínio ser apontado.
 */
export default function robots(): MetadataRoute.Robots {
  const { urlSite } = lerConfig()

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', urlSite).toString(),
  }
}
