// Roteiro de exemplo (16 s) no arco geral do estúdio (referencias/arcos.md), sem interface de produto:
//   tensão → virada → revelação → prova → campo de cor → slogan → fecho com símbolo e silêncio.
// Funciona em 16:9, 9:16 e 1:1 (posições relativas a W e H, tamanhos em U). Troque textos e tempos pelo projeto.
// MARCOS alimenta `node render.mjs --marcos` (quadros no meio de cada transição).
const A = { tensao: 0, virada: 2.6, revela: 4.0, prova: 6.4, campo: 9.6, slogan: 11.4, fecho: 12.6 };
window.MARCOS = A;
const VERTICAL = H > W;

function fundo(t) {
  ctx.fillStyle = T.bgDeep; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.6, 0, W / 2, H * 0.6, Math.max(W, H) * 0.6); g.addColorStop(0, rgba(T.bg, 0.95)); g.addColorStop(1, rgba(T.bgDeep, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// frases em tinta sobre o campo de cor (do campo até o slogan)
function frasesCampo(t) {
  tinta('Menos ruído.', H / 2 - 20 * U, (VERTICAL ? 96 : 120) * U, seg(t, A.campo + 0.1, A.campo + 0.6), seg(t, A.slogan - 0.3, A.slogan - 0.05));
  tinta('Mais clareza.', H / 2 + 110 * U, (VERTICAL ? 96 : 120) * U, seg(t, A.campo + 0.2, A.campo + 0.7), seg(t, A.slogan - 0.25, A.slogan), { cor: T.primaryDeep });
}

const SCENES = [
  // 1) tensão: palavra gigante em contorno ao fundo e a frase do problema decodificando
  { a: A.tensao, z: A.revela, draw(t) {
      fundo(t);
      const sai = ease.in(seg(t, A.virada + 0.2, A.virada + 1.0));
      palavraGigante('RUÍDO', W * 0.04 + t * 18 * U - sai * W * 1.4, H * 0.92, 420 * U, { contorno: true, alfa: clamp(t * 2) });
      ctx.save(); ctx.globalAlpha = 1 - seg(t, A.virada, A.virada + 0.3);
      decodifica('Toda marca tem algo a dizer.', W / 2, H * 0.45, 64 * U, t, 0.3, 1.4, { w: 500 });
      frase('Pouca gente para para ouvir.', W / 2, H * 0.45 + 90 * U, 40 * U, seg(t, 1.6, 2.1), { cor: T.muted, align: 'center' });
      ctx.restore();
      // 2) virada: o traço do acento atravessa e entra a palavra cheia
      traco(t, A.virada);
      const ou = ease.expoOut(seg(t, A.virada + 0.5, A.virada + 1.2)), some = seg(t, A.revela - 0.25, A.revela);
      if (ou > 0) palavraGigante('CLAREZA', W * 0.05 + (1 - ou) * W, H * 0.62, (VERTICAL ? 190 : 300) * U, { alfa: 1 - some });
  } },
  // 3) revelação: "Apresentando" e o logotipo; flash curto na passagem para a prova
  { a: A.revela, z: A.prova, draw(t) {
      fundo(t); const sai = ease.in(seg(t, A.prova - 0.35, A.prova)), lh = 110 * U, lw = logoLargura(lh);
      ctx.save(); ctx.globalAlpha = 1 - sai;
      linhaMascara('Apresentando', W / 2, H / 2 - 110 * U, 48 * U, seg(t, A.revela + 0.1, A.revela + 0.6), T.muted, { align: 'center', w: 400 });
      const u = ease.expoOut(seg(t, A.revela + 0.5, A.revela + 1.2)); ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - lw / 2 - 10, H / 2 - lh, (lw + 20) * u, lh * 2); ctx.clip(); logo(W / 2 - lw / 2, H / 2 - lh / 2, lh); ctx.restore();
      ctx.restore(); flash(t, A.prova);
  } },
  // 4) prova: título de 2 linhas com rótulo, um herói (card) com número que embaralha e uma lista que marca
  { a: A.prova, z: A.campo + 0.3, draw(t) {
      fundo(t); const a = A.prova;
      const tx0 = VERTICAL ? W * 0.08 : W * 0.07, ty = VERTICAL ? H * 0.22 : H * 0.42;
      tituloGrande('Um resultado', 'que se vê.', tx0, ty, (VERTICAL ? 88 : 96) * U, t, a + 0.1, A.campo - 0.5, { rotulo: 'EM NÚMEROS' });
      const cw = 560 * U, ch = 300 * U, cx = VERTICAL ? W / 2 - cw / 2 : W * 0.56, cy = VERTICAL ? H * 0.42 : H * 0.3;
      const e = ease.spring(seg(t, a + 0.3, a + 1.0)), s = ease.in(seg(t, A.campo - 0.45, A.campo - 0.1));
      ctx.save(); ctx.globalAlpha = clamp(e * 2) * (1 - s); ctx.translate(0, (1 - e) * 160 * U + s * 80 * U);
      fillR(cx, cy, cw, ch, 24 * U, T.card); strokeR(cx, cy, cw, ch, 24 * U, apoioA(0.25));
      heroi(cx, cy, cx + cw, cy + ch, 'card', () => {
        tx('Alcance no mês', cx + 40 * U, cy + 70 * U, 28 * U, { color: T.muted });
        const n = seg(t, a + 0.9, a + 1.9); tx(embaralha(n >= 1 ? '+48%' : '+00%', n, 11), cx + 40 * U, cy + 200 * U, 120 * U, { w: 700, color: n >= 1 ? T.primary : T.fg, track: -0.03 });
      });
      ctx.restore();
      listaMarcada(['Mensagem clara', 'Marca reconhecida', 'Público lembrando'], VERTICAL ? W * 0.12 : tx0, VERTICAL ? H * 0.72 : H * 0.72, t, a + 0.8, k => seg(t, a + 1.6 + k * 0.3, a + 1.9 + k * 0.3), { alfa: 1 - s });
      // 5) campo de cor a partir do card: frase em tinta
      if (campoCor(t, A.campo, { de: [cx + cw / 2, cy + ch / 2] }) > 0) frasesCampo(t);
  } },
  // 6) slogan sobre o acento: a primeira palavra troca por corte
  { a: A.campo + 0.3, z: A.fecho + 0.6, draw(t) {
      ctx.fillStyle = T.primary; ctx.fillRect(0, 0, W, H); frasesCampo(t);
      sloganTroca(t, A.slogan, A.fecho, ['Ideia', 'Marca', 'História'], ' em movimento.', { size: (VERTICAL ? 120 : 92) * U });
      cenaFecho(t, A.fecho, { assinatura: '' });
  } },
  // 7) fecho: símbolo desenhado grande que encolhe para o logotipo, assinatura; silêncio no som
  { a: A.fecho + 0.6, z: DUR, draw(t) { ctx.fillStyle = T.primaryFg; ctx.fillRect(0, 0, W, H); cenaFecho(t, A.fecho, { assinatura: 'Sua assinatura em uma frase.' }); } },
];
