import type { NextConfig } from 'next'

/**
 * Geração estática (SSG). Não usamos `output: 'export'` de propósito:
 * o export estático força `images.unoptimized`, o que elimina WebP e srcset
 * responsivo — exatamente o que o briefing exige. Com SSG padrão, a Vercel
 * serve o mesmo HTML estático pelo CDN e mantém a otimização de imagem.
 * Nenhuma chamada de rede acontece em runtime: todo conteúdo vem dos JSON
 * lidos em build time.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp'],
    // Larguras alinhadas aos pontos de quebra reais do site, para não gerar
    // variantes que nunca serão pedidas.
    deviceSizes: [360, 414, 640, 828, 1080, 1280, 1920],
    imageSizes: [96, 128, 200, 256, 384],
  },
}

export default nextConfig
