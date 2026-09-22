/**
 * Imagem da prévia do link — o único lugar onde o caminho dela é escrito.
 *
 * É importado por `app/layout.tsx` (que publica a URL nos metadados), por
 * `scripts/gerar-og-image.ts` (que grava o arquivo) e pela trava de validação
 * (que confere se o arquivo existe e está dentro das medidas). Os três nunca
 * divergem porque leem daqui.
 *
 * **O número no nome do arquivo é proposital.** O WhatsApp guarda a imagem da
 * prévia pela URL, no aparelho de quem envia. Trocar só o conteúdo do arquivo
 * não garante que ele busque de novo — trocar o nome garante. Ao redesenhar a
 * arte, suba o número aqui e rode `npm run og`; nada mais precisa mudar.
 */
export const CAMINHO_OG_IMAGE = '/og-image-v2.jpg'

/** 1200×630 é a medida que o WhatsApp renderiza como cartão grande. */
export const OG_LARGURA = 1200
export const OG_ALTURA = 630

/** Acima disso o WhatsApp desiste da imagem e mostra o cartão só com texto. */
export const OG_LIMITE_KB = 300
