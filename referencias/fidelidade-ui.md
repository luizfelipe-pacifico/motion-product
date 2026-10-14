# Fidelidade ao produto: telas reconstruídas do código

O filme mostra o produto **idêntico**, mas nunca por print: cada tela é redesenhada em canvas a partir do código, o que permite animar qualquer elemento (um card que descola, um número que conta) e garante dados fictícios.

## Passo a passo
1. **Inventário.** Liste as telas e os componentes que o roteiro usa (ex.: quadro kanban de vendas, card de KPI, aviso de venda, ficha do cliente). Para cada um, ache no código a página, o componente e os componentes de UI usados (shadcn, design system próprio).
2. **Tokens.** Leia o tema (CSS global, `@theme` do Tailwind v4, variáveis do design system). Se houver uma paleta nova só para o filme, defina-a no `config.json` e não mexa no produto.
3. **Medidas.** Tailwind: 1 unidade = 4 px (`h-9` = 36 px, `px-4` = 16 px, `rounded-md` = 6 px). Desenhe a tela em 1920x1080 a 1:1, com a largura real da barra lateral e do cabeçalho.
4. **Ícones.** `node ferramentas/extrair-icones.mjs --nm <produto>/node_modules --lucide check,bell,... --saida fonte/icones.js` grava os traçados originais (Lucide; Phosphor com `--phosphor House,ChartBar`). O kit desenha com `icon(c, nome, x, y, tamanho, cor)`.
5. **Fonte.** O `woff2` do build (ex.: `.next/static/media/*.woff2`) ou do pacote da fonte, em `assets/fontes/`.
6. **Componentes primeiro, telas depois.** Primitivas do kit (`card`, `badge`, `button`, `avatar`, `cursor`) → componentes do produto (card do kanban, linha de tabela) → telas (casco com barra lateral e cabeçalho + conteúdo).
7. **Estado animável.** Cada tela é `function(c, st)`; o `st` controla o que anima (`u` de um contador, `semMovel` para esconder o card que vira um plano 3D à parte, `drag`, `notif`).
8. **Elementos que saem da tela** são planos filhos do plano da tela (`plano(tela.el, w, h, { ax, ay })`), posicionados no mesmo lugar onde a tela os desenharia; a tela é pintada com o elemento escondido.

## Dados fictícios
- Empresas, pessoas, valores e datas inventados, coerentes com o domínio (uma padaria, uma clínica, um escritório).
- **Nunca** capture tela com dados reais, nem para "só olhar": se precisar ver o produto rodando, use uma tela sem dados de clientes ou um banco de testes com dados inventados.

## Conferência
- Compare lado a lado uma tela reconstruída com o produto (em uma tela sem dados reais): espaçamentos, cores, pesos de fonte e ícones.
- No filme, a tela de fundo pode ficar desfocada; o herói nítido precisa ser exato.
