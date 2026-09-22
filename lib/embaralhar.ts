/**
 * Embaralhamento da lista de candidatos.
 *
 * Existe por uma razão que não é estética: a lista não pode ser lida como
 * ranking de preferência da associação. Se a ordem fosse a do arquivo, o
 * primeiro nome de cada cargo pareceria o preferido — e a Abrasel-DF não pode,
 * por limitação estatutária, declarar preferência. É proteção reputacional e
 * jurídica, e por isso vale tanto quanto qualquer regra de conteúdo.
 *
 * O embaralhamento acontece em duas camadas:
 *
 *  1. No build, com semente derivada do commit. Cada publicação sai com uma
 *     ordem diferente já no HTML estático.
 *  2. No cliente, depois da hidratação, para variar a cada visita.
 *
 * A primeira camada é a que costuma ser esquecida, e é a que importa no pior
 * caso: quem abre o site com JavaScript bloqueado — situação real no navegador
 * interno de alguns aplicativos — veria sempre a mesma ordem. Com a semente do
 * build, nem aí a ordem é a de cadastro.
 */

/**
 * Gerador pseudoaleatório semeado (mulberry32).
 *
 * Precisa ser determinístico para que servidor e cliente produzam o mesmo HTML
 * no primeiro render. `Math.random` não serve nessa etapa: daria ordens
 * diferentes nos dois lados e quebraria a hidratação.
 */
function geradorSemeado(semente: number): () => number {
  let estado = semente >>> 0

  return function proximo() {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Converte um texto qualquer (como o hash do commit) em semente numérica. */
export function sementeDeTexto(texto: string): number {
  let hash = 2166136261
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Fisher-Yates. Devolve uma lista nova — o array recebido não é tocado, o que
 * importa porque a lista de candidatos é compartilhada entre os cargos.
 */
export function embaralhar<T>(lista: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...lista]

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }

  return copia
}

/**
 * Semente desta publicação.
 *
 * Na Vercel vem do hash do commit, então cada deploy embaralha diferente e o
 * resultado é reproduzível — dois builds do mesmo commit geram a mesma ordem,
 * o que mantém o HTML estável entre regenerações.
 *
 * Fora da Vercel, cai no instante em que o módulo foi avaliado. Em `next build`
 * isso acontece uma vez só, então a ordem continua consistente dentro do build.
 */
export const SEMENTE_DO_BUILD = sementeDeTexto(
  process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now()),
)

/** Embaralha com a semente do build. Mesmo resultado no servidor e na hidratação. */
export function embaralharNoBuild<T>(lista: readonly T[], desvio = 0): T[] {
  return embaralhar(lista, geradorSemeado(SEMENTE_DO_BUILD + desvio))
}
