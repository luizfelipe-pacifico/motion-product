// Roteiro de exemplo no arco publicitário (referencias/arco-publicitario.md), 30 s, 16:9:
//   caos de dores → traço e palavra de virada → "Apresentando" → 3 momentos de prova (rótulo, título, herói em 3D,
//   selo) → resultado contado → campo de cor com frase → slogan com troca de palavra → fecho com logotipo e silêncio.
// Troque textos, telas e tempos pelo projeto real. MARCOS alimenta `render.mjs --marcos` (quadros no meio das transições).
const A = { caos: 0, traco: 3.0, pilula: 4.8, m1: 7.4, m2: 10.6, m3: 13.8, res: 17.0, campo: 19.8, slogan: 23.0, fecho: 25.6 };
window.MARCOS = A;

const DORES = [['message-circle', '#86EFAC', 'Cliente sem resposta há 3 dias'], ['user-x', '#FBBF24', 'Quem cuida do meu pedido?'], ['clipboard-list', '#C7D2FE', 'Onde está minha proposta?'],
  ['folder-open', '#CBD5E1', 'Histórico em 4 planilhas'], ['mail', '#93C5FD', 'E-mail do cliente perdido'], ['alarm-clock', '#F87171', 'Prazo do cliente vencido'],
  ['phone', '#CBD5E1', 'Cliente ligou de novo'], ['calendar', '#93C5FD', 'Reunião sem registro'], ['history', '#F87171', 'Proposta esquecida']];
const MOMENTOS = ['Primeiro contato registrado', 'Números do cliente à vista', 'Venda fechada e celebrada'];
const FEITO = [A.m1 + 2.3, A.m2 + 2.3, A.m3 + 2.0];
let CHIPS, quadro, movel, kpi, deal, verso, aviso;

function monta() {
  CHIPS = montaCaos(DORES);
  // momento 1: tela do quadro sobre a mesa; o card móvel é um plano filho que descola
  quadro = plano(null, 1920, 1080, { r: 22 }); pinta(quadro, telaQuadro, { semMovel: true });
  const sl = slotCardMovel();
  movel = plano(quadro.el, sl.w, sl.h, { res: 3, r: 8, ax: sl.x + sl.w / 2, ay: sl.y + sl.h / 2, sombra: '0 40px 70px rgba(0,0,0,.6)' }); movel.dx = sl.dx;
  { const c = movel.ctx; c.scale(3, 3); cardQuadro(c, 0, 0, sl.w, CARDS[0][0], COLUNAS[0][1]); }
  // momento 2: KPI que nasce escaneado e conta
  kpi = plano(null, 420, 140, { res: 3, r: 12, sombra: '0 50px 100px rgba(0,0,0,.6)', heroi: true, nome: 'KPI' });
  // momento 3: card que gira e o verso vira o aviso de venda
  deal = plano(null, sl.w, sl.h, { res: 3, r: 8, sombra: '0 40px 70px rgba(0,0,0,.6)', heroi: true, nome: 'card' });
  { const c = deal.ctx; c.scale(3, 3); cardQuadro(c, 0, 0, sl.w, CARDS[2][0], COLUNAS[2][1]); }
  verso = plano(deal.el, 560, 180, { res: 2, r: 16, ax: sl.w / 2, ay: sl.h / 2, borda: false }); pinta(verso, cardAviso, {}, 0, 0, 560, 180);
  aviso = plano(null, 560, 180, { res: 3, r: 16, sombra: '0 60px 120px rgba(0,0,0,.7)', borda: false, heroi: true, nome: 'aviso' }); pinta(aviso, cardAviso, {}, 0, 0, 560, 180);
}

window.seek = t => {
  t = clamp(t, 0, DUR - 1e-4); inicioQuadro(); let halo = 0, claro = 0;
  // 1) caos → traço → virada; as dores se recolhem onde nasce a pílula
  cenaCaos(t, CHIPS, { a: A.caos, traco: A.traco, fim: A.pilula, caos: 'CAOS', virada: 'CUIDADO' });
  // 2) "Apresentando" + pílula + clique + flash
  if (t >= A.pilula - 0.1 && t < A.m1 + 0.1) ({ halo, claro } = cenaApresentando(t, A.pilula + 0.1, A.m1));
  // 3) momento 1: título à esquerda, tela à direita; o card descola e pousa na coluna seguinte
  if (t >= A.m1 - 0.1 && t < A.m2 + 0.1) {
    telaMesa(quadro, t, A.m1, A.m2, { x: 980, y: 140, lado: 1, rz: -14 });
    if (t < A.m1 + 0.9) pose(movel, {}); else descola(movel, t, A.m1 + 0.9, { dx: movel.dx });
    blocoTitulo(t, A.m1 + 0.3, A.m2 - 0.45, 'SEGUNDA · 09:12', 'Do contato', 'à proposta.', 140, FEITO[0]);
  }
  // 4) momento 2: o KPI nasce escaneado e conta
  if (t >= A.m2 - 0.1 && t < A.m3 + 0.1) {
    pintaVarrendo(kpi, cardKPI, { u: seg(t, A.m2 + 1.0, A.m2 + 2.2) }, 0, 0, 420, 140, seg(t, A.m2 + 0.1, A.m2 + 0.9));
    heroiEntra(kpi, t, A.m2, A.m3, { x: 470, s: 1.7 });
    blocoTitulo(t, A.m2 + 0.3, A.m3 - 0.45, 'QUARTA · 11:45', 'Números que', 'contam.', 140, FEITO[1]);
  }
  // 5) momento 3: o card gira e o verso vira "NOVA VENDA!"
  if (t >= A.m3 - 0.1 && t < A.res + 0.1) {
    const e = ease.expoOut(seg(t, A.m3 - 0.1, A.m3 + 0.7)), sa = ease.in(seg(t, A.res - 0.35, A.res + 0.05));
    viraAviso(deal, verso, aviso, t, A.m3 + 1.1, { base: { x: 340 + (1 - e) * 1200, s: 1.8, ry: -16 + 28 * (1 - e), o: clamp(e * 2), blur: 14 * (1 - e) }, toastX: 360, s: 1.1, sai: sa });
    blocoTitulo(t, A.m3 + 0.3, A.res - 0.45, 'SEXTA · 16:05', 'Do sim', 'à venda.', 140, FEITO[2]);
  }
  // 6) resultado contado: 0 → 3, lista marcada e selo (que vira o campo de cor)
  if (t >= A.res && t < A.campo + 0.3) {
    const a = A.res, scr = seg(t, a + 0.8, a + 1.6);
    frase('SEXTA-FEIRA · 18:00', 165, 330, 28, seg(t, a + 0.05, a + 0.45), { w: 700, cor: T.muted, track: 0.14 });
    linhaMascara(t < a + 0.8 ? '0' : embaralha(scr >= 1 ? '3' : '0', scr, 29), 160, 600, 300, seg(t, a + 0.05, a + 0.6), scr >= 1 ? T.primary : T.fg);
    if (t < a + 1.9) frase('momentos de 3', 165, 690, 56, seg(t, a + 0.25, a + 0.7), { w: 500, cor: T.muted });
    else seloOk(165, 650, ease.back(seg(t, a + 1.9, a + 2.25)), 'Cliente bem atendido.');
    listaMarcada(MOMENTOS, 1000, 420, t, a + 0.2, () => 1);
  }
  // 7) campo de cor a partir do selo, com frases em tinta; slogan sobre o acento
  if (campoCor(t, A.campo) > 0 && t < A.fecho + 0.6) {
    const a = A.campo;
    tinta('Cada cliente,', 400, 64, seg(t, a + 0.15, a + 0.6), seg(t, a + 1.45, a + 1.75), { w: 600 });
    tinta('bem atendido.', 610, 200, seg(t, a + 0.25, a + 0.75), seg(t, a + 1.5, a + 1.8));
    tinta('Do primeiro contato', 480, 128, seg(t, a + 1.75, a + 2.25), seg(t, A.slogan - 0.3, A.slogan - 0.05));
    tinta('à venda fechada.', 620, 128, seg(t, a + 1.85, a + 2.35), seg(t, A.slogan - 0.25, A.slogan));
    sloganTroca(t, A.slogan, A.fecho, ['Contato', 'Proposta', 'Venda', 'Relação'], ' com o seu cliente.');
  }
  // 8) fecho: fundo profundo, símbolo desenhado grande que encolhe, logotipo e assinatura; silêncio no som
  cenaFecho(t, A.fecho, { assinatura: 'Tudo sobre o seu cliente em um só lugar.' });
  // anel de progresso durante os momentos
  const feitas = FEITO.reduce((n, ft) => n + ease.out(seg(t, ft, ft + 0.4)), 0), ap = ease.expoOut(seg(t, A.m1 - 0.2, A.m1 + 0.4)) * (1 - seg(t, A.campo - 0.4, A.campo - 0.1));
  anelProgresso(feitas, 3, ap, n => `Padaria Aurora · ${n} de 3 momentos`);
  fimQuadro(t, halo, claro);
};
carregar(monta);
