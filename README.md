# motion-product

Skill para Claude Code que cria **filmes publicitários de produto digital** (SaaS, app, sistema, plataforma) em MP4, com a interface do produto reconstruída fielmente em código, animada em 3D, na marca de quem pede e com trilha sintetizada. Sem fotos, vídeos de banco ou prints: tudo é desenhado em código, então qualquer elemento pode ser animado (um card que sai da tela, um número que conta, um aviso que gira).

Para motion sem interface (vinheta, abertura de evento, explicativo), veja a skill irmã [motion-graphics](https://github.com/luizfelipe-pacifico/motion-graphics).

## Instalação
Clone esta pasta para a pasta de skills do Claude Code:

```bash
# para todos os projetos
git clone https://github.com/luizfelipe-pacifico/motion-product.git ~/.claude/skills/motion-product
# ou só para um projeto
git clone https://github.com/luizfelipe-pacifico/motion-product.git <projeto>/.claude/skills/motion-product
```

Requisitos: Node 22 ou mais novo, Chrome ou Edge, e ffmpeg com libx264 (`node render.mjs --check` encontra e guarda em cache).

## Uso
Peça ao Claude Code um vídeo do produto ("faça um motion de lançamento do nosso sistema"). A skill pergunta só o que faltar: o que é o produto, o que ele faz e para quem, o que promete, se o filme é demonstrativo ou publicitário, formato e duração, e o design system e onde estão as telas (código, site, documento de marca, fonte e logo). Depois monta o roteiro no arco publicitário, reconstrói as telas com dados fictícios, revisa com folhas de contato e checagens automáticas, e renderiza uma vez.

## Estrutura
```
SKILL.md                         instruções que o Claude segue
modelos/
  comum/render.mjs               render: Chrome headless + ffmpeg; --sheet, --marcos, --colisao, --stills, --draft
  comum/audio.mjs                trilha sintetizada; sons por evento do filme de produto; edite só o ARRANJO
  produto-3d/                    modo padrão para produto digital
    film.html                    palco 3D (perspectiva CSS) + camada de efeitos
    kit.js                       tokens da marca (config.json) e primitivas de interface em canvas
    motor.js                     planos 3D, textos e as peças do arco (caos, apresentação, momentos, campo, slogan, fecho)
    telas.js                     telas do produto (exemplo genérico: substitua pelas reconstruídas do código)
    cenas.js                     roteiro de exemplo, o arco inteiro em 30 s
    icones.js                    subconjunto do Lucide
    config.json                  formato, duração e marca
  canvas/                        modo canvas 2D, com as peças gerais (mesmas da skill motion-graphics)
ferramentas/extrair-icones.mjs   copia os traçados dos ícones do node_modules do produto
referencias/
  arco-publicitario.md           o roteiro que funcionou, parte a parte, com exemplo
  fidelidade-ui.md               como reconstruir as telas do produto a partir do código
  licoes.md                      o porquê de cada regra
```

## Testar o modelo
```bash
mkdir -p teste/fonte && cp modelos/comum/* modelos/produto-3d/* teste/fonte/ && cd teste/fonte
node audio.mjs
node render.mjs --sheet ../rodadas/r1.png     # um quadro por batida
node render.mjs --marcos ../rodadas/m1.png    # quadros no meio das transições
node render.mjs --colisao 1                   # sobreposição, margem segura e corte na borda
node render.mjs                               # vídeo final em ../resultados/
```
Para usar a fonte da marca, coloque o `woff2` em `teste/assets/fontes/` e declare em `marca.fontes` no `config.json`.

## Contribuição
Mudanças entram só por pull request, com revisão do mantenedor. A branch `main` é protegida.

## Créditos e licença
- Ícones: [Lucide](https://lucide.dev) (licença ISC) e, quando extraídos do produto, [Phosphor](https://phosphoricons.com) (licença MIT).
- Código e documentação desta skill: [MIT](LICENSE). Histórico em `CHANGELOG.md`.
