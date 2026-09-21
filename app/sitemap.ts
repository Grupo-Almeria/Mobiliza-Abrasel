import type { MetadataRoute } from 'next'

import { lerConfig } from '@/lib/conteudo'

/** Página única: o sitemap tem uma entrada só. */
export default function sitemap(): MetadataRoute.Sitemap {
  const { urlSite } = lerConfig()

  return [
    {
      url: urlSite,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
