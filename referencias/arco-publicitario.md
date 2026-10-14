# Arco publicitário (o roteiro que funcionou)

Ponto de partida para filmes de produto digital. Foi a estrutura escolhida como versão definitiva depois de mais de dez filmes completos para um mesmo produto SaaS. Adapte os textos ao **foco do produto** dito no briefing; a estrutura muda pouco.

## As 8 partes

| # | Parte | O que acontece | Duração | Peças do motor |
|---|---|---|---|---|
| 1 | **Dor em caos** | Chips com as dores reais do público flutuam e tremem; palavra gigante em contorno ao fundo ("CAOS"). Gancho em menos de 2 s. | 3 s | `montaCaos`, `cenaCaos` |
| 2 | **Virada** | Um traço grosso do acento atravessa a tela; cada dor encaixa numa grade com um check; entra a palavra de virada cheia no acento ("CUIDADO"). | 1,8 s | `cenaCaos` (parâmetros `traco`, `virada`) |
| 3 | **Apresentação** | As dores se recolhem no centro e ali nasce a pílula da marca. "Apresentando", cursor, clique, luz e flash curto. | 2,6 s | `cenaApresentando` |
| 4 | **Prova (3 a 5 momentos)** | Cada momento: rótulo com dia e hora, título de 2 linhas (acento na segunda), herói do produto em 3D do lado oposto, selo "Em andamento" que vira "Concluído". Anel de progresso no canto com o protagonista. | 3,2 s cada | `blocoTitulo`, `telaMesa`, `heroiEntra`, `descola`, `viraAviso`, `pintaVarrendo`, `anelProgresso` |
| 5 | **Resultado contado** | Número grande que embaralha de 0 até o total, lista que marca tudo, selo final. | 2,8 s | `embaralha`, `listaMarcada`, `seloOk` |
| 6 | **Campo de cor** | O selo cresce e inunda a tela com o acento; duas frases curtas em tinta escura entram por máscara. | 3,2 s | `campoCor`, `tinta` |
| 7 | **Slogan** | Sobre o acento, a primeira palavra troca por corte e termina na palavra da marca. | 2,6 s | `sloganTroca` |
| 8 | **Fecho** | O fundo aprofunda, o símbolo se desenha grande por traço, encolhe e encaixa no logotipo; a assinatura sobe. Silêncio no som. | 3,5 a 4 s | `cenaFecho` |

Total típico: 30 a 35 s.

## Regras do arco
- **Uma ideia por tela.** Cada momento tem um título, um herói e um selo. Nada além disso.
- **Protagonista:** um cliente ou pedido fictício atravessa os momentos ("Padaria Aurora · 2 de 4 momentos"). Dá história, não lista de funções.
- **Dias e horas** nos rótulos ("SEGUNDA · 09:12", "QUARTA · 11:45") viram linha do tempo sem precisar de cenário.
- **Alternância:** momento denso (tela em 3D) seguido de respiro (texto grande sobre fundo vazio). O campo de cor é o maior respiro e prepara o fecho.
- **Lados:** título à esquerda e herói à direita é o padrão. Se o herói se move em direção ao título, troque os lados naquele momento.
- **Som:** cada parte tem um evento da biblioteca do `audio.mjs` (caos, apresentando, momento, descolaSom, varreSom, viraSom, contagem, campo, slogan, fecho) e o leito entra só na prova.

## Exemplo (35 s, plataforma de relacionamento com clientes; marca e cliente fictícios)
| Marco | s | Texto na tela |
|---|---|---|
| caos | 0 | "Cliente sem resposta há 3 dias", "Quem cuida do meu pedido?", "Onde está meu contrato?"… · CAOS |
| traço | 3,0 | CUIDADO |
| pílula | 4,8 | Apresentando · Marca |
| cliente | 7,4 | "Um cliente. Uma relação inteira." · Padaria Aurora · 4 momentos |
| seg | 9,8 | SEGUNDA · 09:12 · "Do contato à venda." (card gira e vira "NOVA VENDA!") |
| qua | 13,0 | QUARTA · 11:45 · "Uma jornada para cada cliente." (card descola no kanban) |
| qui | 16,2 | QUINTA · 14:20 · "Cada cliente, completo." (card escaneado) |
| sex | 19,4 | SEXTA · 16:05 · "O cliente tranquilo." (prazo e notificação) |
| fim | 22,6 | 4 de 4 momentos · "Cliente bem acompanhado." |
| campo | 25,4 | "Cada cliente, acompanhado." · "Do primeiro contato ao dia a dia." |
| slogan | 28,8 | Contato / Proposta / Venda / **Relação** com o seu cliente. |
| logo | 31,4 | símbolo → logotipo · "Tudo sobre o seu cliente em um só lugar." |

## Variações que também funcionaram
- **Um dia / uma semana:** relógio ou dias como espinha (08:00 a 18:00, segunda a sexta), cada parada resolve algo e o anel completa.
- **Plano-sequência:** sem cortes, só zoom contínuo; o verde do campo é revelado como um botão da interface ao recuar a câmera.
- **Corte curto (15 a 16 s):** caos curto, apresentação, 2 momentos, slogan e fecho.
