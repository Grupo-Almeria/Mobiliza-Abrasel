import { existsSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

import { CARGOS, CARGOS_VALIDOS, ORDEM_CARGOS, type Cargo } from './cargos'

/**
 * A trava de validação do conteúdo.
 *
 * Todo JSON de `content/` passa por aqui durante o build. Conteúdo inválido
 * derruba o build, a Vercel mantém a versão anterior no ar e o erro nunca
 * chega ao público. Essa é a proteção que justifica a arquitetura: o pior
 * defeito possível deste site é publicar um número de urna errado.
 *
 * As mensagens são escritas para quem edita o JSON pela interface web do
 * GitHub e lê o log da Vercel — não para quem programa. Toda mensagem diz o
 * que está errado E como corrigir. O separador `§` divide as duas partes; o
 * formatador em scripts/validar-conteudo.ts usa isso para indentar.
 */

const SEP = '§'

function erro(oQueEstaErrado: string, comoCorrigir: string): string {
  return `${oQueEstaErrado}${SEP}${comoCorrigir}`
}

export function partesDaMensagem(mensagem: string): {
  problema: string
  correcao: string | null
} {
  const [problema, correcao] = mensagem.split(SEP)
  return { problema, correcao: correcao ?? null }
}

/** Caminho real de um arquivo referenciado num JSON (`/mural/foto.jpg`). */
function caminhoPublico(caminhoNoJson: string): string {
  return path.join(process.cwd(), 'public', caminhoNoJson.replace(/^\//, ''))
}

function textoObrigatorio(campo: string, comoPreencher: string, minimo = 1) {
  return z
    .string({
      required_error: erro(`o campo "${campo}" não existe`, `Adicione o campo "${campo}". ${comoPreencher}`),
      invalid_type_error: erro(
        `o campo "${campo}" precisa ser um texto entre aspas`,
        `Escreva o valor entre aspas duplas. ${comoPreencher}`,
      ),
    })
    .trim()
    .min(
      minimo,
      erro(`o campo "${campo}" está vazio`, `Preencha o campo "${campo}". ${comoPreencher}`),
    )
}

/**
 * O Zod só aplica `required_error`/`invalid_type_error` a enums quando o campo
 * falta ou é de outro tipo. Quando o valor existe mas não está na lista, ele
 * emite a própria mensagem, em inglês. Este errorMap cobre os três casos para
 * que nada em inglês chegue ao log.
 */
function mapaDeErroDeEnum(campo: string, valores: readonly string[]) {
  const lista = valores.join(', ')

  return (issue: z.ZodIssueOptionalMessage, ctx: { defaultError: string; data: unknown }) => {
    if (issue.code === z.ZodIssueCode.invalid_type && ctx.data === undefined) {
      return {
        message: erro(`o campo "${campo}" não existe`, `Adicione "${campo}" com um destes valores: ${lista}.`),
      }
    }

    if (issue.code === z.ZodIssueCode.invalid_type) {
      return {
        message: erro(
          `o campo "${campo}" precisa ser um texto entre aspas`,
          `Use um destes valores, entre aspas: ${lista}.`,
        ),
      }
    }

    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return {
        message: erro(
          `"${String(ctx.data)}" não é um valor aceito para "${campo}"`,
          `Use exatamente um destes, em minúsculas e entre aspas: ${lista}.`,
        ),
      }
    }

    return { message: erro(ctx.defaultError, `Use um destes valores: ${lista}.`) }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   CANDIDATOS
   ────────────────────────────────────────────────────────────────────────── */

const EsquemaCandidato = z
  .object({
    cargo: z.enum(ORDEM_CARGOS as unknown as [Cargo, ...Cargo[]], {
      errorMap: mapaDeErroDeEnum('cargo', CARGOS_VALIDOS),
    }),

    nomeUrna: textoObrigatorio('nomeUrna', 'É o nome como aparece na urna eletrônica.', 2),

    // Não aparece no site — existe só como registro interno. Opcional para que
    // a falta dele não impeça a publicação de um candidato.
    nomeCompleto: z
      .string({
        invalid_type_error: erro(
          'o campo "nomeCompleto" precisa ser um texto entre aspas',
          'Escreva o nome civil entre aspas, ou apague a linha inteira.',
        ),
      })
      .trim()
      .optional(),

    numero: z
      .string({
        required_error: erro(
          'o campo "numero" não existe',
          'Adicione "numero" com o número de urna, entre aspas. Ex.: "12345".',
        ),
        invalid_type_error: erro(
          'o número precisa estar entre aspas',
          'Escreva "01234" e não 01234. Sem aspas o JSON perde o zero à esquerda.',
        ),
      })
      .trim()
      .min(1, erro('o campo "numero" está vazio', 'Preencha com o número de urna do candidato.'))
      .regex(
        /^\d+$/,
        erro(
          'o número contém algo que não é dígito',
          'Use apenas algarismos, sem espaço, ponto ou traço. Ex.: "12345".',
        ),
      ),

    // Opcional: quando a sigla ainda não foi confirmada, a linha do partido
    // simplesmente não aparece no card. Melhor um card sem sigla do que uma
    // sigla errada num site eleitoral.
    partido: z
      .string({
        invalid_type_error: erro(
          'o campo "partido" precisa ser um texto entre aspas',
          'Use a sigla oficial entre aspas. Ex.: "XX". Ou apague a linha inteira enquanto não souber.',
        ),
      })
      .trim()
      .min(2, erro('a sigla do partido é curta demais', 'Use a sigla oficial, com pelo menos duas letras.'))
      .max(20, erro('a sigla do partido é longa demais', 'Use só a sigla, não o nome por extenso.'))
      .optional(),

    foto: textoObrigatorio(
      'foto',
      'É o caminho da imagem. Ex.: "/candidatos/distrital-fulano.jpg".',
    ).refine(
      (valor) => valor.startsWith('/candidatos/'),
      erro(
        'o caminho da foto não começa com /candidatos/',
        'Toda foto de candidato fica em public/candidatos. O caminho precisa começar com "/candidatos/".',
      ),
    ),

    instagram: z
      .string({
        required_error: erro(
          'o campo "instagram" não existe',
          'Adicione o endereço completo do perfil. Ex.: "https://instagram.com/perfil".',
        ),
        invalid_type_error: erro('o campo "instagram" precisa ser um texto', 'Use o endereço entre aspas.'),
      })
      .trim()
      .superRefine((valor, ctx) => {
        let url: URL
        try {
          url = new URL(valor)
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: erro(
              `"${valor}" não é um endereço de internet`,
              'Use o endereço completo do perfil, começando com https://. Ex.: "https://instagram.com/perfil". Só o @ do perfil não serve.',
            ),
          })
          return
        }

        const host = url.hostname.replace(/^www\./, '')
        if (host !== 'instagram.com') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: erro(
              `"${valor}" não é um endereço do Instagram`,
              'O endereço precisa ser do instagram.com. Ex.: "https://instagram.com/perfil".',
            ),
          })
        }
      }),

    ativo: z.boolean({
      required_error: erro(
        'o campo "ativo" não existe',
        'Adicione "ativo": true para o candidato aparecer no site, ou false para tirá-lo do ar sem apagar.',
      ),
      invalid_type_error: erro(
        'o campo "ativo" precisa ser true ou false, sem aspas',
        'Escreva true ou false. Com aspas ("true") o JSON entende como texto, não como sim/não.',
      ),
    }),
  })
  .superRefine((candidato, ctx) => {
    // Quantidade de dígitos compatível com o cargo. Ver o aviso em lib/cargos.ts.
    const esperado = CARGOS[candidato.cargo].digitos
    if (/^\d+$/.test(candidato.numero) && candidato.numero.length !== esperado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['numero'],
        message: erro(
          `"${candidato.numero}" tem ${candidato.numero.length} ${
            candidato.numero.length === 1 ? 'dígito' : 'dígitos'
          }. ${CARGOS[candidato.cargo].rotulo} precisa de ${esperado}`,
          'Confira o número no registro do TSE (DivulgaCandContas) e corrija. Número de urna errado é o defeito mais grave que este site pode ter.',
        ),
      })
    }

    // O arquivo de imagem precisa existir de verdade no repositório.
    if (candidato.foto.startsWith('/candidatos/') && !existsSync(caminhoPublico(candidato.foto))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['foto'],
        message: erro(
          `o arquivo public${candidato.foto} não existe no repositório`,
          'Envie a foto pelo GitHub em "Add file → Upload files", dentro da pasta public/candidatos, com exatamente esse nome. Maiúsculas, minúsculas e acentos importam.',
        ),
      })
    }
  })

export const EsquemaCandidatos = z
  .object({
    _instrucoes: z.string().optional(),
    candidatos: z.array(EsquemaCandidato, {
      required_error: erro(
        'a lista "candidatos" não existe no arquivo',
        'O arquivo precisa ter uma chave "candidatos" com a lista entre colchetes.',
      ),
      invalid_type_error: erro(
        '"candidatos" precisa ser uma lista entre colchetes',
        'A estrutura é: "candidatos": [ { ... }, { ... } ].',
      ),
    }),
  })
  .superRefine((dados, ctx) => {
    // Número repetido dentro do mesmo cargo é quase sempre erro de cópia e cola.
    const vistos = new Map<string, { indice: number; nome: string }>()

    dados.candidatos.forEach((candidato, indice) => {
      const chave = `${candidato.cargo}::${candidato.numero}`
      const anterior = vistos.get(chave)

      if (anterior) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['candidatos', indice, 'numero'],
          message: erro(
            `o número ${candidato.numero} já está em uso por "${anterior.nome}" em ${
              CARGOS[candidato.cargo].rotulo
            }`,
            'Dois candidatos do mesmo cargo não podem ter o mesmo número. Confira qual dos dois está certo no registro do TSE.',
          ),
        })
      } else {
        vistos.set(chave, { indice, nome: candidato.nomeUrna })
      }
    })

    /*
     * Os dois primeiros dígitos de um número de urna são o número do partido.
     * Então um mesmo prefixo não pode aparecer com duas siglas diferentes.
     *
     * Existe por causa de um erro real: "Manuela Andrade, PODEMOS, 22101"
     * passava nas duas regras acima — cinco dígitos, número inédito — e o card
     * publicaria um número do PL sob a sigla do Podemos. Olhando o site, nada
     * denuncia. O correto era 20101.
     *
     * A regra é derivada do próprio arquivo, de propósito: uma tabela de
     * números de partido escrita à mão passaria a rejeitar dado correto se
     * tivesse um valor errado, que num site eleitoral é o pior resultado
     * possível. Aqui a prova sai de dentro do arquivo — se cinco candidatos do
     * PL usam 22, um sexto com 22 e outra sigla é contradição demonstrável.
     *
     * A contrapartida honesta: um partido que apareça uma vez só não tem com
     * quem ser confrontado, e passa. A regra pega colisão, não número inventado.
     */
    const donoDoPrefixo = new Map<string, { sigla: string; nome: string }>()

    dados.candidatos.forEach((candidato, indice) => {
      if (!candidato.partido) return

      const prefixo = candidato.numero.slice(0, 2)
      const sigla = candidato.partido.toUpperCase()
      const dono = donoDoPrefixo.get(prefixo)

      if (!dono) {
        donoDoPrefixo.set(prefixo, { sigla, nome: candidato.nomeUrna })
        return
      }

      if (dono.sigla !== sigla) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['candidatos', indice, 'numero'],
          message: erro(
            `o número ${candidato.numero} começa com ${prefixo}, que neste arquivo é do ${dono.sigla} (${dono.nome}), mas o partido aqui é ${sigla}`,
            'Todo número de urna começa pelo número do partido. Ou a sigla está errada, ou o número está. Confira no DivulgaCandContas do TSE antes de publicar.',
          ),
        })
      }
    })
  })

export type Candidato = z.infer<typeof EsquemaCandidato>

/* ──────────────────────────────────────────────────────────────────────────
   PAUTAS
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Ícones disponíveis. São traços geométricos derivados dos arcos da marca —
 * nada de ilustração de garçom, prato ou chapéu de chef, que o briefing proíbe.
 * Cada valor aqui precisa ter um desenho correspondente em
 * components/pautas/IconePauta.tsx.
 */
export const ICONES_PAUTA = [
  'turismo',
  'seguranca',
  'mobilidade',
  'ordenamento',
  'investidor',
] as const

export type IconePauta = (typeof ICONES_PAUTA)[number]

const EsquemaPauta = z.object({
  numero: z
    .number({
      required_error: erro('o campo "numero" do eixo não existe', 'Adicione "numero" de 1 a 5, sem aspas.'),
      invalid_type_error: erro(
        'o "numero" do eixo precisa ser um número sem aspas',
        'Escreva 1 e não "1".',
      ),
    })
    .int(erro('o "numero" do eixo precisa ser inteiro', 'Use 1, 2, 3, 4 ou 5.'))
    .min(1, erro('o "numero" do eixo precisa ser de 1 a 5', 'Use 1, 2, 3, 4 ou 5.'))
    .max(5, erro('o "numero" do eixo precisa ser de 1 a 5', 'São cinco eixos. Use 1, 2, 3, 4 ou 5.')),

  titulo: textoObrigatorio('titulo', 'É o nome do eixo. Ex.: "Fomento ao Turismo".', 3),

  resumo: textoObrigatorio('resumo', 'É a frase de uma linha que aparece no card fechado.', 10).max(
    160,
    erro(
      'o resumo passou de 160 caracteres',
      'O resumo aparece no card fechado, no celular. Encurte para caber em duas linhas.',
    ),
  ),

  detalhe: textoObrigatorio(
    'detalhe',
    'É o texto completo que aparece quando o card abre. Aceita markdown.',
    30,
  ),

  icone: z.enum(ICONES_PAUTA, {
    errorMap: mapaDeErroDeEnum('icone', ICONES_PAUTA),
  }),
})

export const EsquemaPautas = z
  .object({
    _instrucoes: z.string().optional(),
    pautas: z.array(EsquemaPauta, {
      required_error: erro('a lista "pautas" não existe no arquivo', 'O arquivo precisa ter a chave "pautas".'),
      invalid_type_error: erro('"pautas" precisa ser uma lista entre colchetes', 'A estrutura é: "pautas": [ ... ].'),
    }),
  })
  .superRefine((dados, ctx) => {
    const numerosVistos = new Set<number>()

    dados.pautas.forEach((pauta, indice) => {
      if (numerosVistos.has(pauta.numero)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pautas', indice, 'numero'],
          message: erro(
            `o eixo número ${pauta.numero} aparece mais de uma vez`,
            'Cada eixo tem um número próprio, de 1 a 5. Confira a numeração.',
          ),
        })
      }
      numerosVistos.add(pauta.numero)
    })
  })

export type Pauta = z.infer<typeof EsquemaPauta>

/* ──────────────────────────────────────────────────────────────────────────
   MURAL
   ────────────────────────────────────────────────────────────────────────── */

const EsquemaFotoMural = z
  .object({
    imagem: textoObrigatorio('imagem', 'É o caminho da foto. Ex.: "/mural/mural-01.jpg".').refine(
      (valor) => valor.startsWith('/mural/'),
      erro(
        'o caminho da imagem não começa com /mural/',
        'Toda foto do mural fica em public/mural. O caminho precisa começar com "/mural/".',
      ),
    ),

    // Legenda é opcional de propósito: nem toda foto precisa de texto.
    legenda: z
      .string({
        invalid_type_error: erro(
          'a legenda precisa ser um texto entre aspas',
          'Escreva a legenda entre aspas, ou apague a linha inteira se a foto não precisar de texto.',
        ),
      })
      .trim()
      .max(
        180,
        erro(
          'a legenda passou de 180 caracteres',
          'A legenda aparece sob a foto ampliada, no celular. Encurte.',
        ),
      )
      .optional(),

    ativo: z.boolean({
      required_error: erro(
        'o campo "ativo" não existe',
        'Adicione "ativo": true para a foto aparecer, ou false para escondê-la sem apagar.',
      ),
      invalid_type_error: erro(
        'o campo "ativo" precisa ser true ou false, sem aspas',
        'Escreva true ou false, sem aspas.',
      ),
    }),
  })
  .superRefine((foto, ctx) => {
    if (foto.imagem.startsWith('/mural/') && !existsSync(caminhoPublico(foto.imagem))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imagem'],
        message: erro(
          `o arquivo public${foto.imagem} não existe no repositório`,
          'Envie a foto pelo GitHub em "Add file → Upload files", dentro da pasta public/mural, com exatamente esse nome.',
        ),
      })
    }
  })

export const EsquemaMural = z.object({
  _instrucoes: z.string().optional(),
  fotos: z.array(EsquemaFotoMural, {
    required_error: erro('a lista "fotos" não existe no arquivo', 'O arquivo precisa ter a chave "fotos".'),
    invalid_type_error: erro('"fotos" precisa ser uma lista entre colchetes', 'A estrutura é: "fotos": [ ... ].'),
  }),
})

export type FotoMural = z.infer<typeof EsquemaFotoMural>

/* ──────────────────────────────────────────────────────────────────────────
   CONFIG
   ────────────────────────────────────────────────────────────────────────── */

/* ── Faixa "A Força da Abrasel-DF" ──────────────────────────────────────── */

const EsquemaIndicador = z.object({
  // O prefixo fica fora do valor porque o número é animado e o sinal não.
  prefixo: z
    .string({ invalid_type_error: erro('o "prefixo" precisa ser um texto entre aspas', 'Use "+" ou apague a linha.') })
    .trim()
    .max(3, erro('o "prefixo" é longo demais', 'É um sinal curto, como "+". '))
    .optional(),

  valor: z
    .number({
      required_error: erro('o campo "valor" não existe', 'Adicione o número inteiro, sem aspas e sem ponto: 16000, não "16.000".'),
      invalid_type_error: erro(
        'o "valor" precisa ser um número sem aspas e sem ponto',
        'Escreva 16000, não "16.000". O site formata o ponto de milhar sozinho.',
      ),
    })
    .int(erro('o "valor" precisa ser um número inteiro', 'Sem casas decimais.'))
    .positive(erro('o "valor" precisa ser maior que zero', 'Confira o número.')),

  rotulo: textoObrigatorio('rotulo', 'É o texto pequeno abaixo do número.', 3).max(
    60,
    erro(
      'o rótulo do indicador passou de 60 caracteres',
      'Ele aparece em caixa alta, abaixo do número. Encurte para caber em duas linhas no celular.',
    ),
  ),
})

const EsquemaForcaAbrasel = z.object({
  titulo: textoObrigatorio('titulo', 'É o título da faixa de números.', 5).max(
    80,
    erro('o título da faixa passou de 80 caracteres', 'Encurte.'),
  ),

  subtitulo: textoObrigatorio('subtitulo', 'É a linha abaixo do título da faixa.', 10).max(
    160,
    erro('o subtítulo da faixa passou de 160 caracteres', 'Encurte para caber em duas linhas.'),
  ),

  indicadores: z
    .array(EsquemaIndicador, {
      required_error: erro('a lista "indicadores" não existe', 'A faixa precisa da chave "indicadores".'),
      invalid_type_error: erro('"indicadores" precisa ser uma lista entre colchetes', 'A estrutura é: "indicadores": [ ... ].'),
    })
    .length(
      3,
      erro(
        'a faixa precisa de exatamente três indicadores',
        'São três números lado a lado no computador. Com mais ou menos, o layout desequilibra.',
      ),
    ),

  pilares: z
    .array(
      textoObrigatorio('pilar', 'Cada item é uma palavra.', 3).max(
        24,
        erro('um pilar passou de 24 caracteres', 'São palavras curtas, como "Emprego" ou "Segurança".'),
      ),
      {
        required_error: erro('a lista "pilares" não existe', 'Adicione "pilares" com as palavras entre colchetes.'),
        invalid_type_error: erro('"pilares" precisa ser uma lista entre colchetes', 'A estrutura é: "pilares": [ "Emprego", "Renda" ].'),
      },
    )
    .min(2, erro('a lista "pilares" tem menos de dois itens', 'A linha de pilares precisa de pelo menos duas palavras.'))
    .max(6, erro('a lista "pilares" tem mais de seis itens', 'Acima de seis, a linha quebra feio no celular.')),
})

export type ForcaAbrasel = z.infer<typeof EsquemaForcaAbrasel>

const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com']

export const EsquemaConfig = z.object({
  _instrucoes: z.string().optional(),

  urlSite: z
    .string({
      required_error: erro('o campo "urlSite" não existe', 'Adicione o endereço final do site.'),
      invalid_type_error: erro(
        'o campo "urlSite" precisa ser um texto entre aspas',
        'Ex.: "https://www.mobilizaabrasel.com.br".',
      ),
    })
    .trim()
    .url(
      erro(
        'o "urlSite" não é um endereço válido',
        'Use o endereço completo com https://. Ex.: "https://www.mobilizaabrasel.com.br".',
      ),
    ),

  fraseHero: textoObrigatorio('fraseHero', 'É a frase grande do topo do site.', 10).max(
    140,
    erro(
      'a frase do topo passou de 140 caracteres',
      'Ela aparece em corpo grande no celular. Encurte para não ocupar a tela inteira.',
    ),
  ),

  linhaApoio: textoObrigatorio('linhaApoio', 'É a linha menor, logo abaixo da frase do topo.', 10).max(
    200,
    erro('a linha de apoio passou de 200 caracteres', 'Encurte para caber em três linhas no celular.'),
  ),

  // No máximo três parágrafos, como o briefing define para o bloco Sobre.
  sobre: z
    .array(
      textoObrigatorio('parágrafo do bloco Sobre', 'Cada item da lista é um parágrafo.', 40),
      {
        required_error: erro(
          'a lista "sobre" não existe',
          'Adicione "sobre" com os parágrafos do bloco Sobre o Mobiliza, entre colchetes.',
        ),
        invalid_type_error: erro(
          '"sobre" precisa ser uma lista entre colchetes',
          'A estrutura é: "sobre": [ "primeiro parágrafo", "segundo parágrafo" ].',
        ),
      },
    )
    .min(1, erro('a lista "sobre" está vazia', 'O bloco Sobre precisa de pelo menos um parágrafo.'))
    .max(
      3,
      erro(
        'a lista "sobre" tem mais de três parágrafos',
        'O bloco Sobre é de no máximo três parágrafos. Junte ou corte algum.',
      ),
    ),

  textoCompartilhamento: textoObrigatorio(
    'textoCompartilhamento',
    'É o texto que vai junto quando alguém compartilha o site.',
    20,
  ).refine(
    (valor) => valor.includes('[link]'),
    erro(
      'o texto de compartilhamento não tem o marcador [link]',
      'Escreva [link] onde o endereço do site deve entrar. Ex.: "Conheça os candidatos: [link]". Sem esse marcador, quem receber a mensagem não recebe o endereço.',
    ),
  ),

  // Vazio é permitido: o vídeo definitivo ainda não foi gravado. Enquanto
  // estiver vazio, o bloco de vídeo não aparece no site.
  urlVideo: z
    .string({
      invalid_type_error: erro(
        'o campo "urlVideo" precisa ser um texto entre aspas',
        'Cole o endereço do vídeo no YouTube entre aspas, ou deixe "" enquanto não estiver pronto.',
      ),
    })
    .trim()
    .default('')
    .superRefine((valor, ctx) => {
      if (valor === '') return

      let url: URL
      try {
        url = new URL(valor)
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: erro(
            `"${valor}" não é um endereço de internet`,
            'Cole o endereço completo do vídeo no YouTube, ou deixe "" enquanto o vídeo não estiver pronto.',
          ),
        })
        return
      }

      const host = url.hostname.replace(/^www\./, '')
      if (!YOUTUBE_HOSTS.includes(host)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: erro(
            `"${valor}" não é um endereço do YouTube`,
            'O vídeo institucional fica no YouTube. Cole o endereço de lá, ou deixe "" enquanto não estiver pronto.',
          ),
        })
      }
    }),

  /**
   * Formato do vídeo, para o caso em que o endereço não diz.
   *
   * A orientação é derivada da URL sempre que ela declara: `/shorts/` é vertical
   * por definição da plataforma. Mas `youtu.be/ID`, que é a forma que o botão
   * "Compartilhar" do YouTube entrega com mais frequência, é muda quanto ao
   * formato — e um vídeo em pé dentro de moldura 16:9 aparece com tarjas pretas
   * dos dois lados. Este campo cobre esse caso, e só ele: nunca desliga o 9:16
   * de um endereço `/shorts/`.
   */
  videoVertical: z
    .boolean({
      invalid_type_error: erro(
        'o campo "videoVertical" precisa ser true ou false, sem aspas',
        'Escreva true se o vídeo for em pé (formato de celular) e false se for deitado. Sem aspas em volta: true, e não "true".',
      ),
    })
    .default(false),

  forcaAbrasel: EsquemaForcaAbrasel,

  dataPleito: z
    .string({
      required_error: erro('o campo "dataPleito" não existe', 'Adicione a data do pleito no formato AAAA-MM-DD.'),
      invalid_type_error: erro(
        'o campo "dataPleito" precisa ser um texto entre aspas',
        'Use o formato AAAA-MM-DD entre aspas. Ex.: "2026-10-04".',
      ),
    })
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      erro(
        'a data do pleito não está no formato certo',
        'Use AAAA-MM-DD. Ex.: "2026-10-04" para 4 de outubro de 2026.',
      ),
    )
    .refine((valor) => !Number.isNaN(new Date(`${valor}T00:00:00-03:00`).getTime()), {
      message: erro('a data do pleito não existe no calendário', 'Confira o dia e o mês.'),
    }),

  ogTitle: textoObrigatorio('ogTitle', 'É o título que aparece na prévia do link no WhatsApp.', 10).max(
    70,
    erro(
      'o "ogTitle" passou de 70 caracteres',
      'O WhatsApp corta títulos longos na prévia. Encurte para até 70.',
    ),
  ),

  ogDescription: textoObrigatorio(
    'ogDescription',
    'É a descrição que aparece na prévia do link no WhatsApp.',
    20,
  ).max(
    200,
    erro(
      'a "ogDescription" passou de 200 caracteres',
      'O WhatsApp mostra cerca de duas linhas na prévia. Encurte para até 200.',
    ),
  ),

  // Os dois campos abaixo são desenhados DENTRO da imagem da prévia do link,
  // não no site. Os limites são a largura real da arte: acima deles o texto
  // encolheria a ponto de não ser legível na miniatura do WhatsApp. É por isso
  // que a trava recusa — o estouro não apareceria em lugar nenhum antes do
  // primeiro compartilhamento.
  ogFrase: textoObrigatorio(
    'ogFrase',
    'É a frase desenhada dentro da imagem da prévia do link.',
    10,
  ).max(
    60,
    erro(
      'a "ogFrase" passou de 60 caracteres',
      'Ela aparece em corpo muito grande na imagem da prévia. Acima de 60 caracteres a letra encolhe e deixa de ser legível na miniatura do WhatsApp. Encurte — a frase inteira continua no topo do site.',
    ),
  ),

  ogRodape: textoObrigatorio(
    'ogRodape',
    'É a linha pequena de contexto no pé da imagem da prévia do link.',
    4,
  ).max(
    48,
    erro(
      'o "ogRodape" passou de 48 caracteres',
      'É a linha miúda no pé da imagem. Encurte para não brigar com o endereço do site, que entra logo abaixo dela.',
    ),
  ),

  aberturaMural: textoObrigatorio('aberturaMural', 'É o texto de abertura do mural de encontros.', 10).max(
    200,
    erro('a abertura do mural passou de 200 caracteres', 'Encurte.'),
  ),

  avisoRodape: textoObrigatorio(
    'avisoRodape',
    'É o aviso institucional do rodapé, ajustado conforme o parecer jurídico.',
    40,
  ),
})

export type Config = z.infer<typeof EsquemaConfig>
