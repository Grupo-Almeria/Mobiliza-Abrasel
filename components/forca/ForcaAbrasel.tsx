import { Indicador } from '@/components/forca/Indicador'
import type { ForcaAbrasel as DadosForca } from '@/lib/conteudo'

/**
 * Faixa "A Força da Abrasel-DF".
 *
 * Além de informar, é a transição entre dois blocos claros — o Sobre e as
 * Pautas. Fundo escuro de largura total, altura contida e muito respiro: uma
 * pausa visual no ritmo da página.
 *
 * É a única seção construída sobre números. Três indicadores de manchete pedem
 * uma fileira de destaques, não visualização de dados: não há série, não há
 * eixo, não há gráfico. O número é o herói; o rótulo o acompanha.
 */

type Props = {
  dados: DadosForca
}

export function ForcaAbrasel({ dados }: Props) {
  return (
    <section
      aria-label={dados.titulo}
      className="bg-ma-charcoal px-5 py-ma-6 text-ma-white md:px-8 md:py-ma-7 lg:px-12"
    >
      <div className="mx-auto max-w-ma-container">
        <div className="text-center">
          <h2 className="ma-h2 text-balance text-ma-white">{dados.titulo}</h2>
          <p className="ma-body mx-auto mt-ma-3 max-w-[52ch] text-balance text-ma-white/70">
            {dados.subtitulo}
          </p>
        </div>

        {/*
          Separadores só a partir do tablet: no celular os indicadores empilham e
          o espaçamento já separa. `divide-x` desenha o filete entre as colunas
          sem precisar de elemento extra.
        */}
        <ul className="mt-ma-6 grid gap-ma-5 md:grid-cols-3 md:gap-0 md:divide-x md:divide-ma-white/15">
          {dados.indicadores.map((indicador) => (
            <li key={indicador.rotulo} className="md:px-ma-5 md:first:pl-0 md:last:pr-0">
              <Indicador
                prefixo={indicador.prefixo}
                valor={indicador.valor}
                rotulo={indicador.rotulo}
              />
            </li>
          ))}
        </ul>

        {/*
          A linha de pilares é conceitual, não numérica: corpo pequeno, caixa
          alta e espaçamento largo entre letras. Sem ícone nenhum — nada de
          pictograma genérico de emprego, dinheiro, cultura ou segurança.
        */}
        <div className="mt-ma-6 border-t border-ma-white/15 pt-ma-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-ma-3 gap-y-ma-1">
            {dados.pilares.map((pilar, indice) => (
              <li key={pilar} className="flex items-center gap-x-ma-3">
                {indice > 0 && (
                  <span aria-hidden="true" className="text-ma-white/30">
                    ·
                  </span>
                )}
                <span className="font-sans text-sm font-medium uppercase tracking-[0.22em] text-ma-white/85">
                  {pilar}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
