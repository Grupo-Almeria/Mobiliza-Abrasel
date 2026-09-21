'use client'

import { track } from '@vercel/analytics'

/**
 * Eventos do site, tipados.
 *
 * São exatamente os sete nomes exigidos pelo briefing. Tipar aqui evita que um
 * nome divirja por erro de digitação e deixe de aparecer no painel.
 *
 * O Vercel Web Analytics não usa cookies, o que dispensa banner de consentimento
 * e mantém a superfície de LGPD em zero — não há dado pessoal coletado em lugar
 * nenhum deste site.
 *
 * Eventos personalizados exigem plano Pro na Vercel. No plano Hobby as chamadas
 * simplesmente não registram, sem quebrar nada, e passam a funcionar no dia do
 * upgrade.
 */

export type CanalDeCompartilhamento = 'nativo' | 'whatsapp' | 'email' | 'sms' | 'copiar'

/** De onde partiu a ação: hero, card de candidato, fechamento, barra fixa. */
export type OrigemDeCompartilhamento =
  | 'hero'
  | 'candidato'
  | 'bloco_candidatos'
  | 'fechamento'
  | 'barra_fixa'

type Eventos = {
  cta_conheca_candidatos: { origem: string }
  compartilhar: { origem: OrigemDeCompartilhamento; canal: CanalDeCompartilhamento }
  filtro_cargo: { cargo: string }
  clique_instagram_candidato: { candidato: string; cargo: string }
  play_video: Record<string, never>
  abrir_carta_pdf: Record<string, never>
  abrir_mural_lightbox: { foto: number }
}

export function evento<N extends keyof Eventos>(
  nome: N,
  ...parametros: Eventos[N] extends Record<string, never> ? [] : [Eventos[N]]
): void {
  try {
    const propriedades = parametros[0] as Record<string, string | number | boolean> | undefined
    track(nome, propriedades)
  } catch {
    // Analytics nunca pode quebrar a interface. Se falhar, o clique segue normal.
  }
}
