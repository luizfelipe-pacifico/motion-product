# Por que estas regras

A base (história com verbo, regras do estúdio, sem mídia real, referência com o porquê, checagens objetivas) vem dos testes comparados da skill irmã [motion-graphics](https://github.com/luizfelipe-pacifico/motion-graphics), em `referencias/licoes.md`. Abaixo, o que mais de dez filmes completos para um mesmo produto SaaS ensinaram sobre **filme de produto digital**, sem os nomes do produto e do cliente.

Sequência dos filmes: demonstrativo → imersivo → publicitário → "um dia" → minimalista → sete versões finais → versão definitiva (uma mistura das duas melhores finais).

1. **O foco do produto vale mais que qualquer técnica.** Quatro versões finais contavam "pendências resolvidas" de um produto que, na verdade, é de relacionamento com clientes. Foram refeitas. Por isso o briefing pergunta o que o produto faz, para quem e o que promete, antes de tudo.
2. **Demonstrativo cansa; publicitário prende.** O primeiro filme mostrava cada função e foi achado "demonstrativo demais". Os bons vieram com títulos fortes, menos informação por tela e um arco de sensação.
3. **"Informação demais" foi a crítica mais repetida.** Uma ideia por tela: um título, um herói, um selo.
4. **Telas fiéis em 3D foram o que mais impressionou.** Card que descola do quadro kanban, card que gira e vira "NOVA VENDA!", indicador que nasce escaneado. Isso exige DOM com perspectiva CSS; o canvas puro não fazia. Daí o modo produto-3d.
5. **Reinventar o motor a cada versão custou horas.** As versões finais só saíram rápido depois de um motor comum (`motor.js`) com as peças aprovadas; cada nova versão virou só um roteiro.
6. **Partículas foram rejeitadas.** O "nascer do nada" ficou melhor com texto que decodifica, card escaneado por uma linha do acento e símbolo desenhado por traço.
7. **Minimalismo pontual funciona.** "Apresentando" com a pílula da marca, número grande que embaralha e slogan com troca de palavra, entre momentos densos.
8. **Caos → virada é o melhor gancho.** As dores reais do público flutuando e tremendo, um traço do acento que organiza tudo e uma palavra gigante de virada foram o ponto mais elogiado.
9. **O campo de cor com texto em tinta é o melhor respiro.** O selo que vira a tela inteira no acento prepara o slogan e o fecho.
10. **Um protagonista dá história.** Um cliente fictício atravessando os momentos, com rótulos de dia e hora e um anel de progresso, venceu a lista de funções.
11. **Defeitos aparecem no meio do movimento.** Na versão definitiva, um card girando cruzava o título e um quadro encostava no fim de outro: nada disso aparecia na folha por batida. Daí `--marcos` (quadros no meio das transições) e `--colisao` (checagem automática).
12. **Flash longo vira véu cinza.** O clarão da apresentação ficou bom só quando curto e na camada de cima.
13. **Palavra gigante corta na borda.** A 520 px saía do quadro; a 330 px coube. Teste o maior texto na margem.
14. **MP4 em gravação parece corrompido.** O arquivo foi aberto durante o render duas vezes. O render agora grava `.parcial` e renomeia no fim, e só se avisa depois.
15. **Dados reais de clientes não entram.** Capturar telas do produto com dados reais foi bloqueado (proteção de dados). Tudo é reconstruído do código com dados fictícios, o que também deixa animar cada elemento.
16. **A fonte do build.** A fonte certa estava no build do produto; com a fonte de sistema, o filme parecia outro produto.
17. **Paleta só do filme.** Quando a marca está migrando de paleta, dá para aplicar a nova só no motion, sem tocar no produto.
18. **Edição por `sed` com template strings quebra o código.** Use a ferramenta de edição ou scripts Node. No Git Bash do Windows, `MSYS_NO_PATHCONV=1`.
19. **Tempo real é de 30 a 60 min** no modo 3D, com render de 4 a 5 min para 30 s. Prometer 5 a 10 min gerava expectativa errada.
20. **Opções boas mudam de propósito em dois eixos ou mais;** a mistura definitiva usou a opção mais bem construída como espinha e trouxe momentos pontuais da mais criativa.
