# Mobiliza Abrasel — decisões de arquitetura e operação

Site oficial do movimento Mobiliza Abrasel, da Abrasel-DF.
Landing page única, estática, em `www.mobilizaabrasel.com.br`.

**Pleito: 04/10/2026.** O site tem vida útil crítica curta e um único editor.
Toda decisão aqui foi tomada com isso em mente.

---

## A métrica é compartilhamento, não permanência

Este site não é um destino, é um objeto de encaminhamento. Mais de 85% do
tráfego chega por link aberto dentro do WhatsApp, no celular, em 4G. A conversão
acontece quando alguém reencaminha o link, não quando alguém lê a página inteira.

Na prática, isso ordena as prioridades assim:

1. A prévia do link no WhatsApp (`og-image.jpg`) — é a primeira impressão e
   acontece antes de qualquer HTML carregar.
2. O número de urna — é o único dado que o eleitor precisa reter.
3. A trava de validação no build — o pior defeito possível deste site não é
   ficar feio, é publicar número errado.
4. Tempo até o primeiro byte legível no WebView do WhatsApp.
5. O filtro por cargo com URL compartilhável, que multiplica o vetor.

Parallax, transições elaboradas e animação decorativa não movem essa métrica.
Foram deliberadamente cortados.

---

## Stack

| Camada | Decisão |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Estilo | Tailwind CSS 3 + `tokens.css` oficial da marca |
| Conteúdo | JSON versionado em `content/` |
| Validação | Zod, em build time |
| Imagens | `next/image`, arquivos no repositório |
| Hospedagem | Vercel |

Sem banco de dados. Sem CMS. Sem serviço externo. Sem variável de ambiente com
credencial.

### Geração estática, sem `output: 'export'`

O site é SSG: todo o conteúdo entra no HTML durante o build e não há nenhuma
chamada de rede em runtime.

Não usamos `output: 'export'` **de propósito**. O export estático força
`images.unoptimized`, o que elimina WebP e `srcset` responsivo — justamente o
que o briefing exige na seção 8. Com SSG padrão, a Vercel serve o mesmo HTML
estático pelo CDN e mantém a otimização de imagem.

### Zero requisição externa

Verificado com navegador headless: a página não faz nenhuma chamada a domínio de
terceiros. A única exceção possível é a miniatura do YouTube, e só depois que
alguém clica no play do vídeo.

---

## Tokens de design

A fonte da verdade é `content/.tokens-marca.json`, o arquivo oficial entregue
pela marca. Ele alimenta dois caminhos, e o build confere se continuam iguais:

1. `styles/tokens-marca.css` — o `tokens.css` oficial, servido praticamente
   intacto. Dá as custom properties `--ma-*` e as classes `.ma-btn`, `.ma-card`,
   `.ma-callout`, `.ma-h1`…`.ma-eyebrow`.
2. `lib/design-tokens.ts` — espelha os mesmos valores para o
   `tailwind.config.ts`, gerando `bg-ma-green`, `rounded-ma-md`, `p-ma-4` etc.

`scripts/validar-conteudo.ts` compara os dois a cada build. Se divergirem, o
build falha. **Nunca edite `lib/design-tokens.ts` sozinho** — atualize o JSON
oficial e ajuste o TS para bater com ele.

### Paleta

| Token | Hex | Onde é usado |
|---|---|---|
| `--ma-green` | `#00652E` | hero, fechamento, botão primário, eyebrow |
| `--ma-orange` | `#F58220` | CTA de destaque, **número de urna**, foco de teclado |
| `--ma-lime` | `#8DC63F` | acentos, contagem regressiva, eyebrow sobre carvão |
| `--ma-charcoal` | `#231F20` | texto corrido, fundo do mural, fundo do rodapé |
| `--ma-cream` | `#F7F4EE` | fundo dos blocos Sobre e Candidatos |
| `--ma-blue` | `#25408F` | **só dado/informação** — nunca decorativo |
| `--ma-red` | `#B11116` | **só erro** |
| `--ma-white` | `#FFFFFF` | fundo padrão, texto sobre verde e carvão |

Composição por bloco: **verde dominante + um acento + neutros**. Nunca as sete
cores na mesma peça.

### Contraste — pares autorizados

Branco/verde 7.24 · Branco/carvão 16.30 · Carvão/laranja 6.28 ·
Carvão/lima 7.98 · Branco/azul 9.51.

**Proibido:** branco sobre laranja (2.59) e branco sobre lima (2.04).

Consequência prática: o botão laranja leva texto **carvão**, sempre. O número de
urna é laranja **sobre fundo claro**, nunca texto branco sobre pastilha laranja.

O hero tem uma trava de contraste embutida: sobre a foto de fundo aplicamos verde
da marca e, por cima, um véu de carvão de no mínimo 30%. No pior caso possível —
uma foto inteiramente branca — o fundo resultante ainda dá **6,8:1** com texto
branco. Qualquer foto que a Abrasel enviar continua legível, sem tratamento.

### Tipografia

Poppins 400/500/600/700, fallback `Inter, Arial, system-ui, sans-serif`.

**Autohospedada** em `public/fontes/`, subset `latin` (cobre todos os acentos do
português), 8 KB por peso. O `@import` do Google Fonts foi removido do
`tokens.css` — é o **único** desvio em relação ao arquivo oficial, e está
documentado no cabeçalho do próprio arquivo. Motivo: o briefing exige fonte
autohospedada e nenhuma requisição ao Google em runtime.

Os pesos 400 e 700 têm `<link rel="preload">` no `layout.tsx` por estarem no
caminho crítico do LCP.

### Elemento gráfico

`components/ui/Arcos.tsx` — os três arcos concêntricos do símbolo da marca,
ampliados e em opacidade baixa. É a camada gráfica de fundo do site.

**Isso substitui as texturas de papel, madeira e linho que o briefing sugeria.**
A identidade pede "institucional, clara e confiável" e alerta contra excesso de
elementos gráficos; a camada de fundo vem da marca, não de material. Pela mesma
razão, **não há serifa em lugar nenhum** — as frases-manifesto são Poppins 700
em corpo grande. Foi decisão consciente, não esquecimento.

O "setor de bares e restaurantes" entra pela **fotografia real** do hero e do
mural, que é o que os dois documentos pedem.

### Conflito de cascata entre Tailwind e tokens.css

`styles/tokens-marca.css` é importado **depois** do `globals.css`, para que as
classes `.ma-*` vençam o preflight do Tailwind. O efeito colateral é que, nos
poucos pontos em que um utilitário do Tailwind precisa vencer uma regra `.ma-*`,
é necessário o modificador `!`:

- `.ma-btn` define `border: 0` → o botão de contorno usa `!border-2`.
- `.ma-eyebrow` define `display: inline-block` → o rótulo "Ler o detalhe" usa
  `!inline-flex` para a seta não quebrar linha.

São os únicos dois casos. Se aparecer um terceiro, considere mover o import para
dentro de `@layer components`.

---

## A trava de validação

**É o item central da arquitetura.** Está em `lib/schema.ts`, `lib/conteudo.ts` e
`scripts/validar-conteudo.ts`, e roda como `prebuild` — antes do Next iniciar.

Conteúdo inválido derruba o build, a Vercel mantém a versão anterior no ar e o
erro nunca chega ao público.

O que ela pega:

- campo obrigatório ausente ou vazio;
- `cargo` fora dos quatro valores permitidos;
- número de urna não numérico ou com quantidade de dígitos errada para o cargo;
- **número repetido dentro do mesmo cargo**;
- URL de Instagram inválida ou de outro domínio;
- arquivo de imagem referenciado que não existe no repositório;
- JSON malformado, com o número da linha e o trecho do arquivo ao redor;
- número do setor escrito como texto ou com ponto (`"1.100"`);
- tokens de design divergentes do arquivo oficial da marca.

### Dígitos por cargo — atenção

`lib/cargos.ts` é a fonte da regra:

| Cargo | Dígitos |
|---|---|
| Governador | 2 |
| **Senador** | **3** |
| Deputado Federal | 4 |
| Deputado Distrital | 5 |

**O briefing original dizia 2 dígitos para senador. Está errado** — o número de
senador tem 3 dígitos (os dois do partido mais um sequencial: 133, 155, 250).
Governador e presidente é que usam 2.

Mantida a regra do briefing, a trava **rejeitaria o número correto** de um
senador e aceitaria um errado de 2 dígitos, invertendo a proteção no cargo mais
visível do pleito. A regra foi corrigida aqui. Os números reais precisam ser
conferidos no DivulgaCandContas do TSE antes da publicação.

### As mensagens são para quem não programa

Toda mensagem de erro diz **o que está errado** e **como corrigir**, em
português, sem stack trace e sem jargão do Zod. Quem lê é o editor olhando o log
da Vercel.

Há um teste de varredura que percorre 61 casos de erro e falha se qualquer
mensagem em inglês vazar. Ao mexer no schema, rode-o de novo.

---

## Como atualizar o conteúdo

Tudo é feito pela interface web do GitHub. Sem terminal, sem deploy manual. A
Vercel reconstrói e publica sozinha em cerca de um minuto.

### Adicionar um candidato

1. Abra `content/candidatos.json` no GitHub e clique no lápis.
2. Copie um bloco inteiro entre chaves, cole depois do último e edite os campos.
   **Não esqueça a vírgula entre um bloco e outro.**
3. Envie a foto em "Add file → Upload files", na pasta `public/candidatos`, com
   exatamente o nome escrito no campo `foto`.
4. Commit. Se algo estiver errado, o build falha com a explicação e o site
   continua no ar como estava.

### Tirar alguém do ar sem apagar

Mude `"ativo": true` para `"ativo": false`.

### Trocar uma foto

Suba o arquivo novo com o mesmo nome, em "Add file → Upload files".

### Números do setor

`associados` e `empregos` estão como `null` em `content/config.json` porque ainda
não foram confirmados pela Abrasel-DF. **Enquanto forem `null`, o bloco de
números não aparece no site.** Nunca publique estimativa como dado verificado.

### Vídeo institucional

`urlVideo` está vazio. Enquanto estiver, o espaço fica reservado na página com um
aviso. Cole o endereço do YouTube e o vídeo aparece com facade (miniatura +
botão de play; o iframe só carrega no clique).

### Se o build falhar

A Vercel manda e-mail e mostra o erro no log do deploy. O site continua no ar com
a versão anterior. Corrija o arquivo e salve de novo — ou reverta o commit pela
interface do GitHub.

---

## Conformidade eleitoral

Regras que valem para qualquer texto novo:

- **Nenhum pedido direto de voto.** Nada de "vote em", "eleja", "seu voto". A
  formulação é sempre *assinaram*, *se comprometeram com*, *conheça*.
- Ordem aleatória, tratamento visual idêntico, sem ranking e sem destaque
  individual. Todos os cards têm o mesmo tamanho e o mesmo peso.
- Não reproduzir material de campanha: santinho, jingle, arte oficial, slogan.
- Sem qualquer mecanismo de doação ou arrecadação.
- Sem coleta de dado pessoal. Não há formulário em lugar nenhum, o que mantém a
  superfície de LGPD em zero e dispensa banner de cookies.
- O aviso do rodapé vive em `config.json` para ser ajustado rápido após o parecer
  jurídico. **O texto atual está marcado como provisório.**

---

## Comandos

```bash
npm run dev            # desenvolvimento
npm run validar        # roda a trava de validação isoladamente
npm run build          # valida e constrói (a validação é prebuild)
npm run placeholders   # gera imagens provisórias que ainda faltam
npm run og             # regera public/og-image.jpg (1200×630, < 300 KB)
```

`npm run placeholders` nunca sobrescreve foto existente: ele só preenche o que
falta. Continua útil depois que as fotos reais chegarem.

---

## Pendências que bloqueiam a publicação

1. **Números reais dos candidatos**, conferidos no DivulgaCandContas do TSE.
2. **Parecer do advogado eleitoral** sobre os textos, a forma de listar os
   candidatos e o custeio da peça por entidade de classe.
3. **Números do setor** (`associados`, `empregos`) confirmados pela Abrasel-DF.
4. **Texto final do aviso do rodapé**, após o parecer.
5. **URL do vídeo institucional.**
6. **Assets reais**: fotos dos candidatos, 12 do mural, foto do hero, PDF da
   Carta, logo da Abrasel-DF.
