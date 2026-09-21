/**
 * Montagem dos textos e endereços de compartilhamento.
 *
 * O compartilhamento é a métrica central deste site: o vetor da campanha são as
 * pessoas encaminhando o link, não o site em si. Por isso o texto é editável em
 * config.json e todo canal leva a mesma mensagem.
 *
 * Nenhum texto daqui pode conter pedido direto de voto ("vote em", "eleja",
 * "seu voto") — é regra de conformidade eleitoral. A formulação é sempre
 * "assinaram", "se comprometeram com", "conheça".
 */

import { CARGOS, type Cargo } from './cargos'

/** Troca o marcador [link] pelo endereço. A validação garante que ele existe. */
export function montarTexto(modelo: string, url: string): string {
  return modelo.replace(/\[link\]/g, url)
}

/**
 * Texto de compartilhamento de um candidato específico. Leva nome, cargo e
 * número — o número é o dado que o eleitor precisa levar na cabeça.
 */
export function textoDoCandidato(
  candidato: { nomeUrna: string; numero: string; cargo: Cargo },
  url: string,
): string {
  const cargo = CARGOS[candidato.cargo].rotulo
  return (
    `${candidato.nomeUrna}, ${cargo}, número ${candidato.numero}. ` +
    `Assinou a Carta de Compromisso do setor de bares e restaurantes do DF: ${url}`
  )
}

/** Endereço do site já com o filtro de cargo aplicado, para compartilhar. */
export function urlComCargo(urlBase: string, cargo: Cargo | null): string {
  if (!cargo) return urlBase
  const url = new URL(urlBase)
  url.searchParams.set('cargo', cargo)
  url.hash = 'candidatos'
  return url.toString()
}

export function linkWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}

export function linkEmail(assunto: string, corpo: string): string {
  return `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
}

export function linkSms(texto: string): string {
  // `?&body=` é a forma que funciona tanto no iOS quanto no Android.
  return `sms:?&body=${encodeURIComponent(texto)}`
}
