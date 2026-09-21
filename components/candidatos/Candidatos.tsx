import { CardCandidato } from '@/components/candidatos/CardCandidato'
import { ORDEM_CARGOS, CARGOS } from '@/lib/cargos'
import { Secao } from '@/components/ui/Secao'
import type { Candidato } from '@/lib/conteudo'

/**
 * Bloco 3 — Candidatos. O coração do site.
 *
 * Versão desta fase: lista completa, agrupada por cargo, com o card definitivo.
 * O filtro em pílulas, a sincronia com a URL (?cargo=distrital) e a ordenação
 * aleatória entram na próxima fase.
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

      {ORDEM_CARGOS.map((cargo) => {
        const doCargo = candidatos.filter((candidato) => candidato.cargo === cargo)
        if (doCargo.length === 0) return null

        return (
          <div key={cargo} className="mt-ma-6">
            <h3 className="ma-h3 text-ma-green">
              {CARGOS[cargo].rotulo}
              <span className="ml-2 text-base font-normal text-ma-charcoal/50">
                {doCargo.length}
              </span>
            </h3>

            <ul className="mt-ma-3 grid grid-cols-1 gap-ma-2 min-[380px]:grid-cols-2 md:grid-cols-3 md:gap-ma-3 lg:grid-cols-4 xl:grid-cols-5">
              {doCargo.map((candidato) => (
                <li key={`${candidato.cargo}-${candidato.numero}`} className="flex">
                  <CardCandidato candidato={candidato} url={url} />
                </li>
              ))}
            </ul>
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
