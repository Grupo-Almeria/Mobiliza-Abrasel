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

### Cascata: o CSS da marca vive em `@layer components`

`styles/tokens-marca.css` é inlinado dentro de `app/globals.css` pelo
`postcss-import` e envolvido em `@layer components`. Isso coloca as classes
`.ma-*` **entre** o reset do Tailwind e os utilitários — que é exatamente onde
elas devem estar:

- vencem o preflight, como a marca precisa;
- perdem para `mt-4`, `p-0`, `text-sm` e afins, como o layout precisa.

**Não desfaça isso.** Na Fase 1 o arquivo era importado depois de tudo, e as
classes da marca anulavam os utilitários em silêncio — 92 elementos da página
tinham algum utilitário engolido. Três defeitos chegaram ao cliente por causa
disso: margens zeradas, botão sem borda e card com a largura errada.

As regras da marca que mordem, e por quê:

| Regra | O que ela engole se estiver fora da camada |
|---|---|
| `.ma-h1/h2/h3/body/eyebrow { margin: 0 }` | todo `mt-*` e `mb-*` |
| `.ma-btn { padding: 0 22px }` | `px-*`, `p-*` |
| `.ma-btn { font: 600 1rem/1 }` | `text-*` **e** `leading-*` (é shorthand) |
| `.ma-btn { border: 0 }` | a borda inteira, mesmo com `!important` — `border-style: none` força a largura a computar 0 |
| `.ma-card { padding: 32px }` | `p-0` |

Se precisar de um componente novo com essas classes, saiba que `font` e `border`
são shorthands: eles redefinem propriedades que você talvez não esperasse.

### Verificação visual automatizada

`scripts/verificar-visual.mjs` roda a página num Chromium e checa o que build e
typecheck não pegam:

```bash
npx next build && npx next start -p 3100 &
node scripts/verificar-visual.mjs
```

Ele reprova se encontrar rolagem horizontal, elemento estourando a coluna, alvo
de toque abaixo de 44px, erro de JavaScript, ícone colapsado por falta de
`shrink-0`, ou **utilitário anulado pelo CSS da marca**.

Antes de mexer em CSS que afete a identidade, grave uma linha de base e compare
depois:

```bash
node scripts/verificar-visual.mjs --salvar antes
# ... faça a mudança, reconstrua ...
node scripts/verificar-visual.mjs --comparar antes
```

A comparação mede cor, raio, sombra, peso e tamanho de fonte das classes `.ma-*`
puras, em elementos de prova injetados e sem utilitário nenhum por cima. Se algo
mudar, a alteração vazou para a identidade e precisa ser revista.

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

### O prefixo do número tem que bater com o partido

Os dois primeiros dígitos de um número de urna são o número do partido. A trava
confere isso, mas **sem tabela de números de partido**: a regra é que um mesmo
prefixo não pode aparecer com duas siglas diferentes dentro do arquivo.

Existe por causa de um erro real. Chegou "Manuela Andrade, PODEMOS, 22101".
Passava nas duas regras que já havia — cinco dígitos, número inédito — e o card
publicaria um número do PL sob a sigla do Podemos. Olhando o site, nada denuncia.
O correto era 20101.

**Derivar do arquivo em vez de escrever a tabela é decisão, não preguiça.** Uma
tabela escrita à mão, com um valor errado, passaria a rejeitar dado correto — num
site eleitoral é o pior resultado possível, porque o build trava e o operador não
tem como saber que quem está errado é a trava. Aqui a prova sai de dentro do
arquivo: se cinco candidatos do PL usam 22, um sexto com 22 e outra sigla é
contradição demonstrável, e a mensagem de erro nomeia o candidato que conflita.

A contrapartida, registrada: um partido que apareça uma vez só não tem com quem
ser confrontado e passa. **A regra pega colisão, não número inventado.** A
conferência no DivulgaCandContas do TSE continua sendo obrigatória.

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

A convenção das fotos de candidato é **JPEG 1000×1000**, enquadramento de cabeça
e ombros, com folga de 7% a 12% da altura acima da cabeça — foi assim que as
existentes foram tratadas, e é o que mantém os cards com tratamento idêntico, que
a conformidade eleitoral exige.

**Foto recortada com fundo transparente precisa ser achatada sobre cinza antes de
virar JPEG.** O JPEG não tem canal alfa: sem achatar, o fundo transparente sai
**preto**, e o card fica gritantemente diferente dos outros. O cinza de referência
é `rgb(176,177,182)`, a média dos fundos já publicados. Quando o recorte não deixa
folga acima da cabeça, estenda a tela para cima com o mesmo cinza antes de cortar
— nunca invente fundo de foto com textura, como estante ou parede.

### Números do setor

Vivem em `forcaAbrasel.indicadores`, no `config.json`, e aparecem só na faixa
"A Força da Abrasel-DF" — não se repetem em lugar nenhum.

Os valores são números inteiros **sem aspas e sem ponto**: `16000`, não
`"16.000"`. O site formata o ponto de milhar sozinho. O `prefixo` é separado do
valor porque o número é animado e o sinal fica parado ao lado.

São exatamente três indicadores: com mais ou menos, o layout de três colunas
desequilibra, e a trava recusa.

**A faixa é carvão, não verde, e isso é medição e não gosto:** o número em
laranja sobre verde dá 2,75:1 e reprova o mínimo de acessibilidade; sobre carvão
dá 6,28:1. Se alguém trocar o fundo para verde, o número precisa deixar de ser
laranja.

Os pilares (`Emprego · Renda · Cultura · Segurança`) são conceituais, não
numéricos: Poppins em caixa alta com espaçamento largo, sem ícone nenhum. A
especificação original sugeria serifa; vale aqui a mesma decisão da Fase 1, de
que a identidade vence, e ela proíbe fontes fora do sistema.

Os números continuam pendentes de confirmação pela Abrasel-DF antes da
publicação no domínio. Nunca publique estimativa como dado verificado.

### Vídeo institucional

O vídeo vive no YouTube, como **não listado**, e `config.json` guarda só o
endereço. Nunca coloque o arquivo de vídeo no repositório: o GitHub rejeita
arquivos acima de 100 MB, e servir vídeo estático elimina a qualidade adaptativa
de que quem abre no 4G depende.

O bloco usa *facade*: mostra a miniatura, e o iframe do YouTube — cerca de
700 KB — só é criado quando alguém clica no play.

#### Orientação — a regra, nesta ordem

1. endereço `/shorts/` → **vertical**, sempre. É definição da plataforma, e
   nenhum campo desliga isso;
2. qualquer outro endereço → vale o campo `videoVertical` do `config.json`;
3. campo ausente → horizontal.

Vertical rende `aspect-[9/16]` com largura máxima de 340px; horizontal rende
`aspect-video`. O `aspect-[9/16]` em `VideoFacade.tsx` não é arbitrário, vem daí.

**A derivação pela URL continua sendo a fonte primária; o campo existe só para o
silêncio dela.** O desenho original derivava tudo do endereço, para evitar um
interruptor que alguém precisasse lembrar de mexer. Estava certo, mas incompleto:
`youtu.be/ID` — a forma que o botão "Compartilhar" do YouTube entrega com mais
frequência — não diz nada sobre o formato, e o mesmo vale para `watch?v=`. Isso
não se conserta derivando melhor, porque a informação não está no endereço. E um
vídeo em pé dentro de moldura 16:9 aparece com tarjas pretas dos dois lados.

Por isso `dadosDoVideo()` devolve `verticalPelaUrl`, e não `vertical`: `false`
ali significa "o endereço não disse", e não "é horizontal". Só o `true` vence o
campo. **Não simplifique para `vertical` nem inverta a precedência** — inverter
faria um `videoVertical: false` esquecido no arquivo achatar um Short.

O vídeo atual é vertical, feito para redes. O briefing previa 16:9; o site foi
adaptado ao material real, e não o contrário.

Uma coisa que não dá para verificar em sessão de desenvolvimento: **o YouTube é
bloqueado pelo proxy** — tanto o oEmbed quanto as miniaturas em `i.ytimg.com`
respondem 403. A miniatura sai quebrada em screenshot local e carrega normalmente
no site publicado. Se o vídeo abre e é o certo, só o cliente confirma.

Se `urlVideo` estiver vazio, o espaço fica reservado com um aviso, e o layout já
está resolvido para quando o vídeo chegar.

### Aviso institucional do rodapé

`avisoRodape`, em `config.json`, é a versão **definitiva** do aviso — o carimbo
de "texto provisório" foi removido pelo cliente. Ele declara quem mantém o site,
a natureza associativa do movimento, a ausência de vínculo partidário, que a
apresentação decorre da adesão à Carta e que a ordem de exibição é aleatória.

Qualquer alteração nesse texto mexe na peça de conformidade eleitoral do site.
Não reescreva sem passar pelo cliente.

### Imagem da prévia do link (WhatsApp)

O caminho da imagem mora em **`lib/og.ts`**, num lugar só, lido pelo
`app/layout.tsx`, pelo gerador e pela trava.

**O número no nome do arquivo é proposital.** O WhatsApp guarda a imagem da
prévia pela URL, no aparelho de quem envia. Trocar só o conteúdo do arquivo não
garante que ele busque de novo — trocar o nome garante. Ao redesenhar a arte,
suba o número em `lib/og.ts` e rode `npm run og`.

O texto desenhado dentro da imagem são `ogFrase` e `ogRodape`, em `config.json`.
Não confunda com `ogTitle` e `ogDescription`, que são o texto **ao lado** da
imagem no cartão. São coisas diferentes e não devem repetir uma à outra.
**Depois de mexer em `ogFrase` ou `ogRodape`, rode `npm run og`** — senão a arte
continua com o texto antigo.

#### Por que o Chromium e não o `sharp`

A primeira versão desenhava a arte em SVG e rasterizava com `sharp`. Funciona
para formas, mas não para texto: o `sharp` desenha texto pela fonte instalada no
sistema, via fontconfig, e a Poppins não está instalada em lugar nenhum. Cairia
numa fonte de fallback diferente a cada máquina. Por isso a arte original ficou
só com o logotipo, sem uma palavra.

`scripts/gerar-og-image.ts` renderiza a peça como página no Chromium e fotografa.
A Poppins entra embutida em base64, a partir dos mesmos `.woff2` que o site
serve — nada depende do sistema operacional. Fonte e logotipo vão como data URI
de propósito: a página é montada com `setContent` e o Chromium não busca arquivo
nenhum, o que contorna a restrição de CORS que `file://` impõe a `@font-face`.

**Isto não roda no build.** O script é manual e a imagem vai versionada no git;
a Vercel nunca executa o Chromium.

#### A trava confere a imagem

`validar-conteudo.ts` checa que o arquivo existe, que está em 1200×630 e que
está abaixo de 300 KB. Existe por causa de um defeito real: **prévia quebrada
não aparece em lugar nenhum do site.** O build fica verde, a página abre certa, e
o erro só se revela no primeiro compartilhamento no WhatsApp — o canal que este
site existe para alimentar. Nenhuma outra checagem pega isso.

#### Quando a prévia não aparece no WhatsApp

Cartão mostrando o domínio cru como título, sem imagem, significa que o WhatsApp
**não leu nada** da página — não que a imagem esteja ruim. Se tivesse lido,
mostraria o `ogTitle`. Quase sempre é cache de uma tentativa feita antes de o
domínio responder. Na ordem:

1. abrir a URL da imagem direto no navegador — se ela não carregar, o problema é
   a publicação, não a marcação;
2. rodar `developers.facebook.com/tools/debug/` e clicar em **Scrape Again**;
3. testar numa conversa consigo mesmo, esperando a prévia carregar **antes** de
   enviar.

### Se o build falhar

A Vercel manda e-mail e mostra o erro no log do deploy. O site continua no ar com
a versão anterior. Corrija o arquivo e salve de novo — ou reverta o commit pela
interface do GitHub.

---

## Conformidade eleitoral

Regras que valem para qualquer texto novo:

- **Nenhum pedido direto de voto.** Nada de "vote em", "eleja", "seu voto". A
  formulação é sempre *assinaram*, *se comprometeram com*, *conheça*.
- **Ordem aleatória** dentro de cada cargo, tratamento visual idêntico, sem
  ranking e sem destaque individual. Todos os cards têm o mesmo tamanho e o
  mesmo peso.

  O embaralhamento está em `lib/embaralhar.ts` e roda em duas camadas: no build,
  com semente derivada do commit, e de novo no cliente depois da hidratação.
  **A camada do build não é redundância.** Sem ela, quem abrir o site com
  JavaScript bloqueado veria sempre a ordem de cadastro — o ranking implícito
  que a regra existe para evitar. Se algum dia alguém simplificar isso para
  randomizar só no cliente, a proteção cai justamente no caso mais frágil.

  A ordem dos CARGOS é fixa e definida pelo cliente: distrital, federal,
  senador, governador. Só a ordem dentro de cada um é sorteada.

- **Fotos do mural:** algumas mostram material de campanha ao fundo (banners com
  número de urna, adesivos, camisetas), o que contraria a regra de não reproduzir
  material de campanha. Está com o cliente para decisão junto ao advogado
  eleitoral. Para tirar qualquer uma do ar: `ativo: false` em `mural.json`.
- Não reproduzir material de campanha: santinho, jingle, arte oficial, slogan.
- Sem qualquer mecanismo de doação ou arrecadação.
- Sem coleta de dado pessoal. Não há formulário em lugar nenhum, o que mantém a
  superfície de LGPD em zero e dispensa banner de cookies.
- O aviso do rodapé vive em `config.json` para ser ajustado rápido após o parecer
  jurídico. O texto atual é a versão definitiva entregue pelo cliente.
- **A imagem da prévia do link traz "Eleições 2026 · Distrito Federal"** — escolha
  do cliente, registrada. É informação factual, mas é conteúdo eleitoral numa peça
  feita para circular em massa, e está pendente de parecer. Para tirar: apague
  `ogRodape` de `config.json` e rode `npm run og`; nenhum código muda.

---

## Comandos

```bash
npm run dev            # desenvolvimento
npm run validar        # roda a trava de validação isoladamente
npm run build          # valida e constrói (a validação é prebuild)
npm run placeholders   # gera imagens provisórias que ainda faltam
npm run og             # regera a imagem da prévia do link (1200×630, < 300 KB)

# verificação visual (exige o site rodando em localhost:3100)
node scripts/verificar-visual.mjs
node scripts/verificar-visual.mjs --salvar antes
node scripts/verificar-visual.mjs --comparar antes
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
