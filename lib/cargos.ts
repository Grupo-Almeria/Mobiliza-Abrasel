/**
 * Cargos em disputa e a quantidade de dígitos do número de urna de cada um.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ ATENÇÃO — esta é a regra mais sensível do sistema.                        │
 * │                                                                           │
 * │ O briefing original pedia 2 dígitos para governador E senador. Está       │
 * │ errado para senador: o número de senador tem 3 dígitos (os dois do        │
 * │ partido mais um sequencial — 133, 155, 250). Governador e presidente é    │
 * │ que usam 2.                                                               │
 * │                                                                           │
 * │ Mantida a regra errada, a trava rejeitaria o número CORRETO de um         │
 * │ senador e aceitaria um errado de 2 dígitos — invertendo a proteção no     │
 * │ cargo mais visível do pleito.                                             │
 * │                                                                           │
 * │ Antes da publicação, confira os números reais no DivulgaCandContas do     │
 * │ TSE. O registro de candidaturas de 2026 encerrou em 15/08, então os       │
 * │ dados já são públicos.                                                    │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

export const CARGOS = {
  governador: { rotulo: 'Governador', rotuloPlural: 'Governador', digitos: 2 },
  senador: { rotulo: 'Senador', rotuloPlural: 'Senador', digitos: 3 },
  federal: { rotulo: 'Deputado Federal', rotuloPlural: 'Deputado Federal', digitos: 4 },
  distrital: { rotulo: 'Deputado Distrital', rotuloPlural: 'Deputado Distrital', digitos: 5 },
} as const

export type Cargo = keyof typeof CARGOS

/** Ordem de exibição do filtro. Não é ranking — é a ordem da cédula. */
export const ORDEM_CARGOS: readonly Cargo[] = [
  'governador',
  'senador',
  'federal',
  'distrital',
] as const

export const CARGOS_VALIDOS = ORDEM_CARGOS as readonly string[]

export function ehCargo(valor: unknown): valor is Cargo {
  return typeof valor === 'string' && valor in CARGOS
}

export function rotuloCargo(cargo: Cargo): string {
  return CARGOS[cargo].rotulo
}

export function digitosDoCargo(cargo: Cargo): number {
  return CARGOS[cargo].digitos
}
