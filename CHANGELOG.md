# Histórico

## v2.0.1 (14/10/2026)
- Instalação em um comando: `npx github:luizfelipe-pacifico/motion-product` (com `--projeto` para instalar só no projeto atual; rodar de novo atualiza).

## v2.0 (14/10/2026): motion-product
Nova skill, irmã da `motion-graphics`, a partir de mais de dez filmes completos para um mesmo produto SaaS.

- **Modo produto-3d** (novo padrão para produto digital): palco com perspectiva CSS, telas do produto como planos 3D, `kit.js` com tokens vindos do `config.json` e `motor.js` com as peças aprovadas (card escaneado, card que descola, card que gira e vira aviso, caos com traço e palavra de virada, "Apresentando" com pílula, número que embaralha, lista que marca, anel de progresso, campo de cor com texto em tinta, slogan com troca de palavra, símbolo desenhado que vira o logotipo).
- **Arco publicitário** documentado (`referencias/arco-publicitario.md`) e já montado como roteiro de exemplo (`cenas.js`).
- **Briefing** pergunta a promessa do produto e se o filme é demonstrativo ou publicitário.
- **Fidelidade ao produto** como etapa própria: inventário de telas, tokens e fonte do build, ícones extraídos do `node_modules`, dados sempre fictícios.
- **render.mjs:** `--marcos` (quadros no meio das transições), `--colisao` (texto sobre herói, texto sobre texto, margem segura, herói cortado na borda; reprova sozinho), gravação em `.parcial` com renomeação no fim, folha com o tempo de cada quadro.
- **audio.mjs:** biblioteca de sons por evento (caos, apresentando, momento, descola, varre, vira, contagem, campo, slogan, fecho, leito).
- **ferramentas/extrair-icones.mjs** com parâmetros (`--nm`, `--lucide`, `--phosphor`, `--saida`).
- Orçamento de tempo realista (30 a 60 min no modo 3D) e regras de operação no Windows.
- Sem partículas.

## v0.1 (13/10/2026): base comum com a motion-graphics
Protótipo: canvas 2D, `render.mjs`, `audio.mjs`, regras do estúdio e ciclo de rodadas, a partir de cinco testes comparados.
