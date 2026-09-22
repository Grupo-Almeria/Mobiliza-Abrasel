import { ListaCandidatos } from '@/components/candidatos/ListaCandidatos'
import { ORDEM_CARGOS, CARGOS } from '@/lib/cargos'
import { Secao } from '@/components/ui/Secao'
import { embaralharNoBuild } from '@/lib/embaralhar'
import type { Candidato } from '@/lib/conteudo'

/**
 * Bloco 3 — Candidatos. O coração do site.
 *
 * A ordem dentro de cada cargo é aleatória, e isso é regra, não enfeite: a
 * lista não pode ser lida como ranking de preferência da associação. O
 * embaralhamento acontece no build, com semente do commit, e de novo no cliente
 * a cada visita — ver lib/embaralhar.ts.
 *
 * A ordem dos CARGOS, ao contrário, é fixa e definida pelo cliente.
 *
 * O filtro em pílulas e a sincronia com a URL (?cargo=distrital) entram depois.
 */

type Props = {
  candidatos: Candidato[]
  url: string
}

export function Candidatos({ candidatos, url }: Props) {
  return (
    <Secao id="candidatos" fundo="creme" rotulo="Candidatos que assinaram a Carta">
      <div className="max-w-[46ch]">
        <p className="ma-eyebrow">Quem assinou</p>
        <h2 className="ma-h2 mt-ma-2 text-balance">
          Os candidatos que assinaram a Carta de Compromisso.
        </h2>
        <p className="ma-body mt-ma-3 text-ma-charcoal/75">
          A ordem de exibição é aleatória e muda a cada acesso. Nenhum candidato recebe destaque
          sobre os demais.
        </p>
      </div>

      {ORDEM_CARGOS.map((cargo, indiceDoCargo) => {
        const doCargo = candidatos.filter((candidato) => candidato.cargo === cargo)
        if (doCargo.length === 0) return null

        // O desvio faz cada cargo sortear diferente dentro do mesmo build; sem
        // ele, listas de tamanho igual sairiam com a mesma permutação.
        const embaralhados = embaralharNoBuild(doCargo, indiceDoCargo)

        return (
          <div key={cargo} className="mt-ma-6">
            <h3 className="ma-h3 text-ma-green">
              {CARGOS[cargo].rotulo}
              <span className="ml-2 text-base font-normal text-ma-charcoal/50">
                {doCargo.length}
              </span>
            </h3>

            <ListaCandidatos candidatos={embaralhados} url={url} />
          </div>
        )
      })}

      {candidatos.length === 0 && (
        <p className="ma-body mt-ma-5 text-ma-charcoal/70">
          A lista de candidatos será publicada em breve.
        </p>
      )}
    </Secao>
  )
}
