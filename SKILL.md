---
name: motion-product
description: Cria filmes publicitários de produto digital (MP4 com trilha sintetizada) a partir da ideia e do código ou das telas do produto, com a interface reconstruída fielmente em código e animada em 3D, na marca de quem pede. Use quando pedirem motion, vídeo de lançamento ou de demonstração de um produto digital (SaaS, app, sistema, plataforma), com ou sem referência. Para vinheta, abertura de evento ou motion sem interface, prefira a skill motion-graphics.
---

# Motion de produto (v2.0)

Da ideia ao MP4 sem fotos, vídeos ou prints. Cada tela e cada card do produto são **reconstruídos em código**, na paleta e na tipografia da marca, e o filme é uma função pura do tempo. A v2 nasceu de mais de dez filmes completos feitos para um mesmo produto SaaS; o porquê de cada regra está em `referencias/licoes.md`.

**Não use HyperFrames** nem outro framework ou serviço de vídeo pronto (Remotion, Motion Canvas, After Effects, geradores de vídeo por IA). O pipeline é só o desta skill: `film.html`, `render.mjs` (Chrome headless + ffmpeg) e `audio.mjs`.

## 0. Escolha o modo
| Modo | Quando | Modelos |
|---|---|---|
| **produto-3d** (padrão para produto digital) | Mostrar um sistema, app ou SaaS: telas fiéis em perspectiva, card que sai da tela, card que gira e vira aviso, títulos fortes | `modelos/comum/` + `modelos/produto-3d/` |
| **canvas** | Peça sem interface em 3D: ilustração, contador, vinheta, corte vertical para redes | `modelos/comum/` + `modelos/canvas/` (o `audio.mjs` do canvas substitui o comum) |

O modo produto-3d captura a tela do Chrome (mais lento: cerca de 4 a 5 min de render para 30 s em 1080p). O canvas lê os pixels direto (2 a 5 vezes mais rápido) e é o único seguro para 9:16 (a janela headless corta alturas maiores que o monitor).

## 1. Briefing: pergunte só o que faltar (uma mensagem)
A skill não conhece o produto, a marca nem o público de quem pede: tudo vem do briefing. Se não estiver no pedido, pergunte de uma vez:
1. **"O que é o produto, o que ele faz e para quem?"** (tipo de produto, público, onde o filme vai passar)
2. **"Em uma frase: o que o produto promete?"** O foco decide a história: nos testes, quatro versões foram refeitas porque contavam a história errada sobre o que o produto faz (tarefas resolvidas, quando o produto era de relacionamento com clientes).
3. **"O motion é demonstrativo (mostrar funções) ou publicitário (vender uma sensação)?"**
4. **"Qual o formato (16:9, 9:16, 1:1) e a duração?"**
5. **"Qual o design system e onde estão as telas?"** Peça o material: o código do produto (repositório ou pasta), o documento do design system ou da marca, o site, os arquivos de fonte e o logo em SVG. Se não houver código, peça telas de referência **sem dados reais**. O motion se adapta à marca **sem mudar nada dela**; se a pessoa quiser uma paleta só para o filme (ex.: um tema escuro novo), aplique só no motion.

Se mandarem referência **sem dizer o que gostaram**, pergunte também: **"O que você gostou nela: as animações, os cards, a paleta, a tipografia, o ritmo, as transições?"** Só isso será extraído.

Padrões quando não disserem: publicitário, 16:9, 30 s, 60 fps, trilha sintetizada, textos em português. Não peça aprovação de roteiro; mostre o roteiro na resposta e siga.

Se pedirem **várias opções**, cada uma muda de propósito pelo menos dois eixos (arco, câmera, ritmo, tratamento de cor) e todas usam o mesmo motor; só o `cenas.js` e o ARRANJO mudam. Uma "mistura" de opções aprovadas parte da mais bem construída como espinha e traz momentos pontuais das outras.

## 2. Marca e fidelidade ao produto (ver `referencias/fidelidade-ui.md`)
- **Tokens, não imagens:** fundo, fundo profundo, superfície, borda, texto, apoio, **um acento**, tinta sobre o acento, fonte display e de interface. Do código do produto (CSS, tokens do Tailwind, tema) ou do documento de marca. Grave em `config.json` (`marca`).
- **Fonte:** o arquivo `woff2` oficial (no build do produto, ex.: `.next/static/media`, ou no pacote da fonte) em `assets/fontes/`, declarado em `marca.fontes`. Sem o arquivo, a fonte de sistema mais próxima, avisando.
- **Logo:** SVG oficial. Símbolo em `marca.simbolo.tracos` (paths para desenhar por traço); logotipo em `marca.logo`. Nunca recorte logo de print.
- **Inventário de telas:** liste as rotas e componentes que o filme vai mostrar e reconstrua cada um em `telas.js` com as medidas do código (Tailwind: 1 unidade = 4 px), os mesmos ícones (`ferramentas/extrair-icones.mjs` tira os traçados do `node_modules` do produto) e textos de interface.
- **Dados sempre fictícios.** Nunca capture tela com dados reais de clientes (LGPD, e o classificador de segurança bloqueia). Empresas, pessoas e valores inventados, coerentes com o domínio.

## 3. Referência (opcional): extraia a gramática, nunca o conteúdo
- Uma folha de contato (1 quadro por segundo, `tile`); leia no máximo 3 imagens.
- 5 a 8 linhas de gramática **só na dimensão de que a pessoa gostou**.
- Pessoas, rostos, cenas filmadas, texturas fotográficas e logos de terceiros não se traduzem em código: descarte.

## 4. Roteiro: parta do arco publicitário (ver `referencias/arco-publicitario.md`)
O arco que funcionou (aprovado como versão definitiva nos testes):

> **dor em caos → virada (traço do acento e palavra gigante) → "Apresentando" com a pílula → prova em 3 a 5 momentos (rótulo de dia e hora, título de 2 linhas, um herói do produto em 3D, selo que conclui) → resultado contado → campo de cor com frase em tinta → slogan com troca de palavra → fecho com símbolo desenhado, logotipo e silêncio**

- **Uma ideia por tela.** "Informação demais" foi a crítica mais repetida. Um título, um herói e no máximo um selo ou anel por momento.
- Um **protagonista** atravessa os momentos (um cliente, um pedido) e um **anel de progresso** mostra o avanço.
- Títulos curtos, em duas linhas, com o acento na segunda. Rótulo em caixa alta com dia e hora dá ritmo de narrativa.
- Tabela de marcos (`const A = {...}`) com uma cena nova a cada 2,5 a 3,5 s. A mesma tabela vai para o ARRANJO do áudio e para `window.MARCOS`.

## 5. Montagem
1. Copie `modelos/comum/*` e `modelos/<modo>/*` para `<projeto>/fonte/`. **Não reescreva o render, o áudio, o kit nem o motor.**
2. Ajuste `config.json` (formato, `dur`, `saida`, `marca`).
3. `node render.mjs --check` (detecta Chrome e ffmpeg com libx264 e guarda em cache). Se faltar algo, peça autorização para instalar `ffmpeg-static` numa pasta temporária.
4. **produto-3d:** escreva `telas.js` (telas do produto) e `cenas.js` (roteiro). O `cenas.js` do modelo já é o arco inteiro funcionando; troque textos, telas e tempos. Peças prontas do `motor.js`:
   - planos 3D: `plano`, `pose`, `pinta`, `pintaVarrendo` (card que nasce escaneado), `telaMesa` (tela inclinada de fundo), `heroiEntra`, `descola` (card que sai da tela e pousa), `viraAviso` (card que gira e o verso vira aviso);
   - texto: `frase`, `linhaMascara`, `tituloGrande`, `blocoTitulo` (rótulo + título + selo), `decodifica`, `embaralha`;
   - marca e momentos: `cenaCaos`, `cenaApresentando` (pílula, clique e flash), `listaMarcada`, `seloOk`, `anelProgresso`, `campoCor`, `tinta`, `sloganTroca`, `cenaFecho`.
   **canvas:** escreva as cenas em `cenas.js` (array `SCENES`) com as peças gerais de `pecas.js` (as mesmas da skill motion-graphics).
5. Edite só a seção ARRANJO de `audio.mjs`. A BIBLIOTECA DE EVENTOS já tem um som para cada peça: `caos`, `apresentando`, `momento`, `descolaSom`, `varreSom`, `viraSom`, `contagem`, `campo`, `slogan`, `fecho`, `leito`. `node audio.mjs` mede a grade em `beats.json`. No modo canvas, o `audio.mjs` de `modelos/canvas` traz a biblioteca geral (`tensao`, `revelacao`, `entrada`, `pousa`, `varre`, `vira`, `contagem`, `campo`, `slogan`, `fecho`).
6. **Edite arquivos por script Node ou pela ferramenta de edição, nunca por `sed` com template strings** (aspas e crases quebram). No Git Bash do Windows, use `MSYS_NO_PATHCONV=1` antes de comandos com caminhos que começam por `/`.

## 6. Regras do estúdio
**Contrato de render**
- `window.seek(t)` pinta o quadro t. Sem transição CSS, `setTimeout`, `requestAnimationFrame` no render ou estado entre quadros. Ruído só por mulberry32 com semente.
- H.264 yuv420p, CRF 16, 60 fps, áudio a -14 LUFS (o render normaliza).

**Visual**
- Proibidos: partículas e confete, título centralizado sobre degradê, tudo em fade, rótulos de canto e moldura, brilho em interface, véu cinza longo (o flash é curto e na camada de cima).
- Uma fonte display (pode ser a mesma da interface). **Um acento.** Fundo quase preto com uma faixa de luz discreta; o halo do acento só quando algo acende.
- Texto entra por máscara, deslocamento, desfoque curto ou decodificação. A cada 2 a 4 s algo novo acontece.
- **Heróis em 3D:** a tela do produto fica de fundo, inclinada e desfocada; o herói (card, KPI, aviso) fica nítido, à frente, do lado oposto ao título. **Título e herói nunca se cruzam, nem no meio do movimento.** Se o herói anda em direção ao título, troque os lados.
- Minimalismo pontual: momentos de tela quase vazia ("Apresentando", número grande, slogan) entre os momentos densos.
- Leitura no celular: título com no mínimo 5% da altura em 16:9 (6% em 9:16); rótulos e legendas com no mínimo 22 px em 1080p; nada importante a menos de 6% da borda.
- Proibido no filme: foto ou vídeo de pessoas, banco de imagens, print, textura fotográfica.

**Som**
- Um som para cada evento, na grade medida. Respiro (`mute`) antes do clímax e silêncio no fecho.

## 7. Ciclo antes de mostrar (no máximo 3 rodadas)
1. `node render.mjs --sheet rodadas/rodada-N.png` (um quadro por batida) **e** `node render.mjs --marcos rodadas/marcos-N.png` (4 quadros no meio de cada transição: +0,25, +0,6, +1,0 e +1,6 s de cada marco). Olhe as duas folhas. **Os defeitos aparecem no meio do movimento, não na batida.**
2. `node render.mjs --colisao 1`: varre o filme a cada 0,1 s e reprova texto sobre herói, texto sobre texto, texto fora da margem segura e herói nítido cortado pela borda. Marque os heróis com `heroi: true` no `plano`; decoração que cruza bordas de propósito vai dentro de `decorativo(() => ...)`; camadas opacas que cobrem a tela chamam `cobreCaixas`.
3. **Checagens objetivas, que reprovam sozinhas:**
   - `--colisao` acusou algo? Algum herói cortado na borda em `--marcos`?
   - Há foto, vídeo, print, pessoa real ou dado real de cliente? Mais de um acento? Texto entrando só por fade?
   - Algum trecho de 4 s sem mudança? Gancho até 2 s?
   - A história conta o foco do produto dito no briefing?
   - Algum texto ilegível na miniatura? Cores, fonte e logo batem com a marca?
4. Notas de 1 a 10: gancho, leitura no celular, movimento, variedade, marca, sincronia do som. Corrija os 3 piores problemas; repita até tudo ter 8 ou mais e nenhuma checagem reprovar. Para conferir um trecho, `--stills t1,t2 --dir <pasta>`.
5. Só então o render completo, **uma vez**, em segundo plano.

## 8. Entrega
- O render grava `<saida>.parcial` e renomeia só no fim. **Não diga que o vídeo está pronto antes de o arquivo final existir** (um MP4 em gravação parece corrompido).
- Confira o MP4: duração, resolução, codec, áudio a -14 LUFS, zero erro de decodificação (`ffmpeg -v error -i x.mp4 -f null -`) e 4 a 6 quadros extraídos do próprio arquivo, incluindo pelo menos um no meio de uma transição.
- Entregue com o caminho do arquivo, a estrutura do filme em lista curta e a tabela de notas.
- Não sobrescreva arquivos existentes (`--force 1` só para os deste projeto); cada versão em pasta ou arquivo novo. Se o projeto tiver um arquivo de instruções ou de memória, leia antes e registre o resultado ao terminar.

## Orçamento de tempo (realista)
Briefing e marca 5 min · inventário e telas 10 a 20 min · roteiro 5 min · cenas 10 min · rodadas 10 min · render 5 min (produto-3d) ou 1 a 3 min (canvas). **Total de 30 a 60 min no modo produto-3d.** Se o render estimar mais de 10 min, pare e procure a camada cara (`filter: blur` grande em plano grande, `mix-blend-mode`, imagem enorme).
