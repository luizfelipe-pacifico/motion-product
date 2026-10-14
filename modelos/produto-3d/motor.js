// Motor do modo "produto em 3D": planos com perspectiva CSS (telas e cards do produto), camada de efeitos por cima
// (textos, marca, flash) e as peças aprovadas nos testes (ver referencias/licoes.md):
//   texto por máscara, desfoque ou decodificação (nunca só fade) · card escaneado · "Apresentando" com pílula e clique
//   · número que embaralha · lista que marca · selo · anel de progresso · caos de dores com traço e palavra de virada
//   · campo de cor com texto em tinta · slogan com troca de palavra · símbolo desenhado que vira o logotipo.
// Sem partículas. Um acento. Tudo é função pura do tempo: window.seek(t) pinta o quadro t.

const world = document.getElementById('world');
const bg = document.getElementById('bg'), bgx = bg.getContext('2d');
const fx = document.getElementById('fx'), f = fx.getContext('2d');

// ---------- caixas para a checagem de colisão (render.mjs --colisao) ----------
const CAIXAS = { textos: [] };
f.__caixas = CAIXAS.textos;
// uma camada opaca cobriu a tela: os textos já desenhados que ficaram por baixo saem da checagem
function cobreCaixas(dentro) { const v = CAIXAS.textos.filter(a => ![[a.x0, a.y0], [a.x1, a.y0], [a.x0, a.y1], [a.x1, a.y1]].every(dentro)); CAIXAS.textos.length = 0; CAIXAS.textos.push(...v); }
// desenha sem registrar caixa (decoração que pode cruzar bordas e textos de propósito: palavra gigante, caos)
function decorativo(fn) { const a = f.__decorativo; f.__decorativo = true; try { fn(); } finally { f.__decorativo = a; } }
window.caixas = () => ({
  textos: CAIXAS.textos,
  herois: PLANOS.filter(p => p.vis && p.heroi && Number(p.cv.style.opacity || 1) > 0.5 && !/blur\(([4-9]|\d\d)/.test(p.cv.style.filter))
    .map(p => { const r = p.cv.getBoundingClientRect(), bl = /blur\(([\d.]+)/.exec(p.cv.style.filter); return { s: p.nome || 'herói', x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, blur: bl ? +bl[1] : 0 }; }),
});

// ---------- planos 3D ----------
const PLANOS = [];
// heroi: true marca o plano para a checagem de colisão com os títulos (telas de fundo desfocadas não entram)
function plano(parent, w, h, { res = 1, r = 14, sombra = '0 30px 70px rgba(0,0,0,.55)', borda = true, ax = null, ay = null, heroi = false, nome = '' } = {}) {
  const el = document.createElement('div'); el.className = 'pl';
  Object.assign(el.style, { width: w + 'px', height: h + 'px', left: ((ax ?? 0) - w / 2) + 'px', top: ((ay ?? 0) - h / 2) + 'px' });
  const cv = document.createElement('canvas'); cv.width = Math.round(w * res); cv.height = Math.round(h * res);
  Object.assign(cv.style, { borderRadius: r + 'px', boxShadow: sombra, outline: borda ? `1px solid ${apoioA(0.22)}` : 'none', outlineOffset: '-1px' });
  el.appendChild(cv); (parent || world).appendChild(el);
  const p = { el, cv, ctx: cv.getContext('2d'), w, h, res, vis: false, heroi, nome }; PLANOS.push(p); return p;
}
function pose(p, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, o = 1, blur = 0 } = {}) {
  p.vis = true;
  p.el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`;
  p.cv.style.opacity = clamp(o).toFixed(3); const b = Math.round(blur * 2) / 2; p.cv.style.filter = b > 0 ? `blur(${b}px)` : 'none';
}
// pinta no plano o recorte (rx, ry, rw, rh) de uma tela desenhada em coordenadas de 1920x1080
function pinta(p, fn, st, rx = 0, ry = 0, rw = 1920, rh = 1080) {
  const k = p.cv.width / rw, kh = p.cv.height / rh, c = p.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, p.cv.width, p.cv.height);
  c.setTransform(k, 0, 0, kh, -rx * k, -ry * kh); fn(c, st); c.setTransform(1, 0, 0, 1, 0, 0);
}
// O card "nasce" escaneado: só existe a parte acima da linha de varredura, que é do acento e deixa um rastro curto.
function pintaVarrendo(p, fn, st, rx, ry, rw, rh, u) {
  pinta(p, fn, st, rx, ry, rw, rh);
  p.cv.style.clipPath = u >= 1 ? 'none' : `inset(0 -200px ${(100 - 100 * ease.inOut(clamp(u))).toFixed(2)}% -200px)`;
  if (u >= 1) return;
  const c = p.ctx, H2 = p.cv.height, W2 = p.cv.width, y = Math.round(H2 * ease.inOut(clamp(u)));
  c.clearRect(0, y, W2, H2 - y);
  const g = c.createLinearGradient(0, y - 60, 0, y); g.addColorStop(0, acentoA(0)); g.addColorStop(1, acentoA(0.22)); c.fillStyle = g; c.fillRect(0, Math.max(0, y - 60), W2, Math.min(60, y));
  c.fillStyle = T.primary; c.fillRect(0, Math.max(0, y - 3), W2, 3);
}
function offscreen(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }

// ---------- quadro ----------
function inicioQuadro() { for (const p of PLANOS) p.vis = false; CAIXAS.textos.length = 0; world.style.transform = 'none'; f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, W, H); f.globalAlpha = 1; f.filter = 'none'; }
// claro: flash curto na camada de cima (nunca um véu cinza longo)
function fimQuadro(t, halo = 0, claro = 0) {
  for (const p of PLANOS) { const d = p.vis ? '' : 'none'; if (p.el.style.display !== d) p.el.style.display = d; }
  fundo(t, halo);
  if (claro > 0.01) { f.fillStyle = `rgba(255,255,255,${(claro * 0.9).toFixed(3)})`; f.fillRect(0, 0, W, H); }
  const fade = seg(t, DUR - 0.5, DUR); if (fade > 0) { f.fillStyle = rgba(T.bgDeep, fade); f.fillRect(0, 0, W, H); }
}
// fundo: quase preto, faixa de luz diagonal discreta e halo do acento só quando há algo a acender
function fundo(t, halo = 0) {
  const c = bgx; c.fillStyle = T.bgDeep; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, H * 0.62, 0, W / 2, H * 0.62, 1000); g.addColorStop(0, rgba(T.bg, 0.92)); g.addColorStop(1, rgba(T.bgDeep, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, H / 2); c.rotate(-0.62);
  for (let k = 0; k < 3; k++) { const x = ((t * 60 + k * 1000) % 3000) - 1500, gw = 340, lg = c.createLinearGradient(x - gw, 0, x + gw, 0);
    lg.addColorStop(0, apoioA(0)); lg.addColorStop(0.5, apoioA(0.035)); lg.addColorStop(1, apoioA(0)); c.fillStyle = lg; c.fillRect(x - gw, -1400, gw * 2, 2800); }
  c.restore();
  if (halo > 0) { const r = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 560); r.addColorStop(0, acentoA(0.2 * halo)); r.addColorStop(1, acentoA(0)); c.fillStyle = r; c.fillRect(0, 0, W, H); }
}

// ---------- texto (por máscara, deslocamento, desfoque ou decodificação; nunca só fade) ----------
function frase(s, x, y, size, u, { w = 400, cor = T.fg, align = 'left', track = -0.02, blurMax = 12 } = {}) {
  if (u <= 0) return; f.save(); f.globalAlpha *= clamp(u * 1.5);
  const b = (1 - ease.expoOut(u)) * blurMax; if (b > 0.3) f.filter = `blur(${b.toFixed(1)}px)`;
  tx(f, s, x, y + (1 - ease.expoOut(u)) * 20, size, { w, color: cor, align, base: 'alphabetic', track }); f.restore();
}
function linhaMascara(s, x, y, size, u, cor, { w = 700, align = 'left' } = {}) {
  if (u <= 0) return;
  f.save(); f.beginPath(); f.rect(align === 'center' ? 0 : x - 10, y - size * 0.98, align === 'center' ? W : 1400, size * 1.28); f.clip();
  tx(f, s, x, y + (1 - ease.expoOut(clamp(u))) * size * 1.15, size, { w, color: cor, base: 'alphabetic', track: -0.035, align }); f.restore();
}
// título em 2 linhas com rótulo opcional (ex.: "SEGUNDA · 09:12"); acento na linha `acento` (1 ou 2)
function tituloGrande(l1, l2, x, y, size, t, a, z, opts = {}) {
  if (t < a - 0.05 || t > z + 0.4) return;
  // na saída o título sobe por dentro da máscara: não conta para a margem segura
  if (t > z && !f.__decorativo) return decorativo(() => tituloGrande(l1, l2, x, y, size, t, a, z, opts));
  const { acento = 2, rotulo = null, rotuloTam = 28 } = opts, sai = ease.in(seg(t, z, z + 0.35));
  f.save(); f.beginPath(); f.rect(x - 10, y - size - 70, 1400, size * 2.4 + 70); f.clip(); f.translate(0, -sai * size * 2.4);
  if (rotulo) { const q = ease.expoOut(seg(t, a - 0.1, a + 0.4)); fillR(f, x, y - size - 34, 56 * q, 3, 1.5, T.primary); frase(rotulo, x + 74, y - size - 22, rotuloTam, seg(t, a, a + 0.4), { w: 700, cor: T.primary, track: 0.2, blurMax: 6 }); }
  linhaMascara(l1, x, y, size, seg(t, a, a + 0.6), acento === 1 ? T.primary : T.fg); linhaMascara(l2, x, y + size * 1.02, size, seg(t, a + 0.1, a + 0.7), acento === 2 ? T.primary : T.fg);
  f.restore();
}
// selo de estado ao lado do título: "Em andamento" (contorno) que vira "Concluído" (acento) no instante `feito`
function seloEstado(x, y, t, feito, { antes = 'Em andamento', depois = 'Concluído' } = {}) {
  const u = ease.back(seg(t, feito, feito + 0.35)), done = t >= feito, label = done ? depois : antes, w = tw(f, label, 24, 600) + (done ? 76 : 48), h = 46;
  f.save(); f.translate(x + w / 2, y + h / 2); const k = done ? lerp(0.85, 1, u) : 1; f.scale(k, k); f.translate(-(x + w / 2), -(y + h / 2));
  if (done) { fillR(f, x, y, w, h, 23, T.primary); f.beginPath(); f.arc(x + 26, y + 23, 12, 0, 7); f.fillStyle = T.primaryFg; f.fill(); icon(f, 'check', x + 18, y + 15, 16, T.primary, { lw: 3.2 }); tx(f, label, x + 48, y + 24.5, 24, { w: 600, color: T.primaryFg }); }
  else { strokeR(f, x, y, w, h, 23, apoioA(0.45), 1.5); tx(f, label, x + 24, y + 24.5, 24, { w: 600, color: T.muted }); }
  f.restore();
}
// bloco de momento: rótulo + título de 2 linhas + selo; um herói do produto ocupa o outro lado da tela
function blocoTitulo(t, a, z, rotulo, l1, l2, x, feito, { y = 500, size = 104 } = {}) {
  tituloGrande(l1, l2, x, y, size, t, a, z, { rotulo });
  if (feito != null && t > a + 0.4 && t < z + 0.05) { const sai = ease.in(seg(t, z - 0.05, z + 0.2)); f.save(); f.globalAlpha = 1 - sai; seloEstado(x, y + 160, t, feito); f.restore(); }
}
// decodificação: cada letra começa como um caractere qualquer no acento e "acerta" na sua vez
const CARACTERES = 'ABCDEFGHJKLMNPRSTUVXZabcdefghijkmnoprstuvxz0123456789#%&';
function decodifica(s, x, y, size, t, a, dur, { w = 400, cor = T.fg, align = 'center' } = {}) {
  if (t < a) return;
  f.save(); f.font = font(size, w); f.letterSpacing = '-0.02em';
  const total = f.measureText(s).width; let cx = align === 'center' ? x - total / 2 : x;
  const r = mulberry32(Math.floor(t * 24) + s.length * 31);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], cw = f.measureText(ch).width, ti = a + (i / s.length) * dur * 0.75, ok = t >= ti + dur * 0.25;
    if (t >= ti && ch !== ' ') { f.fillStyle = ok ? cor : acentoA(0.75); f.textAlign = 'left'; f.textBaseline = 'alphabetic'; f.fillText(ok ? ch : CARACTERES[Math.floor(r() * CARACTERES.length)], cx, y); }
    cx += cw;
  }
  f.letterSpacing = '0em'; f.restore();
  if (t > a + dur * 0.5) { const x0 = align === 'center' ? x - total / 2 : x; f.__caixas.push({ s, x0, y0: y - size * 0.72, x1: x0 + total, y1: y + size * 0.2 }); }
}

// ---------- apresentação: "Apresentando" + pílula da marca + cursor + clique + flash ----------
function painelAceso(cx, cy, w, h, luz) {
  f.save(); rrect(f, cx - w / 2, cy - h / 2, w, h, 18); f.clip();
  const g = f.createRadialGradient(cx, cy, 0, cx, cy, w * 0.75); g.addColorStop(0, acentoA(0.10 + 0.28 * luz)); g.addColorStop(1, rgba(T.bg, 0.6)); f.fillStyle = g; f.fillRect(cx - w / 2, cy - h / 2, w, h);
  f.fillStyle = rgba(T.bgDeep, 0.55 - 0.2 * luz); for (let y = cy - h / 2; y < cy + h / 2; y += 7) f.fillRect(cx - w / 2, y, w, 3);
  f.restore(); strokeR(f, cx - w / 2, cy - h / 2, w, h, 18, apoioA(0.18 + 0.2 * luz));
}
function pilula(cx, cy, k, press, desenho = 1) {
  const nome = M.nome || 'Marca', h = 92, w = tw(f, nome, 42, 600) + 150; f.save(); f.translate(cx, cy); const s = k * (1 - 0.06 * press); f.scale(s, s);
  shadow(f, 40, 16, 'rgba(0,0,0,.6)'); fillR(f, -w / 2, -h / 2, w, h, h / 2, T.card); noShadow(f);
  strokeR(f, -w / 2, -h / 2, w, h, h / 2, apoioA(0.35), 1.5);
  simbolo(f, -w / 2 + 30, -32, 64, desenho); tx(f, nome, -w / 2 + 112, 2, 42, { w: 600, color: T.fg });
  f.restore();
}
// devolve { halo, claro } para o fimQuadro
function cenaApresentando(t, a, z, { cx = W / 2 + 160, palavra = 'Apresentando' } = {}) {
  const e = ease.expoOut(seg(t, a - 0.1, a + 0.5)), clique = seg(t, a + 1.4, a + 1.6), luz = ease.out(seg(t, a + 1.5, a + 2.3)), sai = ease.in(seg(t, z - 0.35, z));
  f.save(); f.globalAlpha = 1 - sai;
  painelAceso(cx, H / 2, 440 + 40 * luz, 520 + 40 * luz, Math.max(e * 0.3, luz));
  pilula(cx, H / 2, lerp(0.9, 1, e) * (1 + 0.04 * luz), Math.sin(clique * Math.PI), seg(t, a, a + 0.9));
  frase(palavra, cx - 270, H / 2 + 18, 56, seg(t, a + 0.3, a + 0.8), { w: 400, align: 'right', cor: T.muted });
  if (t > a + 0.7) { const cu = ease.inOut(seg(t, a + 0.7, a + 1.35)); cursor(f, lerp(cx + 360, cx + 70, cu), lerp(H / 2 + 300, H / 2 + 10, cu), { click: seg(t, a + 1.45, a + 1.9) }); }
  f.restore();
  return { halo: luz * (1 - sai), claro: 0.55 * Math.sin(Math.PI * seg(t, z - 0.12, z + 0.14)) };
}

// ---------- contagem, listas, selo e anel ----------
function embaralha(final, u, semente) { if (u >= 1) return final; const r = mulberry32(semente + Math.floor(u * 40)); return final.replace(/[0-9]/g, () => String(Math.floor(r() * 10))); }
// lista de itens que marcam com check; feita(k) devolve 0..1
function listaMarcada(itens, x, y, t, a, feita, { passo = 80, size = 36, alfa = 1 } = {}) {
  itens.forEach((nome, k) => {
    const u = ease.expoOut(seg(t, a + k * 0.08, a + 0.5 + k * 0.08)), yy = y + k * passo, ok = feita(k);
    f.save(); f.globalAlpha *= u * alfa; f.translate((1 - u) * 50, 0);
    if (ok > 0) { const q = ease.back(clamp(ok)); f.save(); f.translate(x + 20, yy); f.scale(q, q); f.beginPath(); f.arc(0, 0, 21, 0, 7); f.fillStyle = T.primary; f.fill(); icon(f, 'check', -12, -12, 24, T.primaryFg, { lw: 3.2 }); f.restore(); }
    else { f.beginPath(); f.arc(x + 20, yy, 20, 0, 7); f.strokeStyle = apoioA(0.5); f.lineWidth = 2; f.stroke(); }
    tx(f, nome, x + 64, yy + 1, size, { w: 500, color: ok > 0 ? T.fg : T.muted }); f.restore();
  });
}
function seloOk(x, y, q, texto) {
  if (q <= 0) return; f.save(); f.translate(x, y); f.scale(q, q); const w = tw(f, texto, 32, 700) + 96;
  fillR(f, 0, 0, w, 64, 32, T.primary); f.beginPath(); f.arc(34, 32, 16, 0, 7); f.fillStyle = T.primaryFg; f.fill(); icon(f, 'check', 23, 21, 22, T.primary, { lw: 3.4 }); tx(f, texto, 64, 34, 32, { w: 700, color: T.primaryFg }); f.restore();
}
// anel de progresso no canto superior direito com legenda ("Cliente · 2 de 4 momentos")
function anelProgresso(feitas, total, ap, legenda) {
  if (ap <= 0) return; f.save(); f.globalAlpha = ap; const x = W - 110, y = 96;
  f.beginPath(); f.arc(x, y, 30, 0, 7); f.strokeStyle = T.elev; f.lineWidth = 6; f.stroke();
  f.beginPath(); f.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * feitas / total); f.strokeStyle = T.primary; f.lineCap = 'round'; f.stroke(); f.lineCap = 'butt';
  const n = Math.round(feitas); tx(f, legenda(n), x - 50, y + 1, 24, { w: 600, align: 'right', color: n === total ? T.primary : T.fg }); f.restore();
}

// ---------- abertura: caos de dores → traço do acento → tudo encaixa → palavra de virada ----------
// dores: [[ícone, cor, texto], ...] (até 12); montaCaos() uma vez em monta(); cenaCaos() a cada quadro
function montaCaos(dores, semente = 42) {
  const r = mulberry32(semente);
  return dores.map((d, i) => { const col = i % 3, row = Math.floor(i / 3); return { d, x: 330 + r() * 1260, y: 170 + r() * 740, rot: (r() - 0.5) * 0.7, fase: r() * 6.28, vel: 0.5 + r(), gx: 960 + (col - 1) * 600, gy: 300 + row * 150, esc: 0.8 + r() * 0.3 }; });
}
function chipDor(x, y, rot, k, [ic, cor, txt], ok, alfa = 1) {
  const w = tw(f, txt, 26, 500) + 92, h = 64;
  f.save(); f.globalAlpha *= alfa; f.translate(x, y); f.rotate(rot); f.scale(k, k);
  shadow(f, 30, 12, 'rgba(0,0,0,.5)'); fillR(f, -w / 2, -h / 2, w, h, 16, T.card); noShadow(f); strokeR(f, -w / 2, -h / 2, w, h, 16, ok > 0.5 ? acentoA(0.55) : apoioA(0.25));
  if (ok > 0.5) { f.beginPath(); f.arc(-w / 2 + 38, 0, 15, 0, 7); f.fillStyle = T.primary; f.fill(); icon(f, 'check', -w / 2 + 28, -10, 20, T.primaryFg, { lw: 3.2 }); }
  else icon(f, ic, -w / 2 + 24, -12, 24, cor);
  tx(f, txt, -w / 2 + 70, 1, 26, { w: 500, color: T.fg }); f.restore();
}
function palavraGigante(txt, x, y, size, { contorno = false, cor = T.primary, alfa = 1 } = {}) {
  f.save(); f.globalAlpha *= alfa; f.font = font(size, 800); f.letterSpacing = '-0.04em'; f.textBaseline = 'alphabetic'; f.textAlign = 'left';
  if (contorno) { f.lineWidth = 3; f.strokeStyle = apoioA(0.32); f.strokeText(txt, x, y); } else { f.fillStyle = cor; f.fillText(txt, x, y); }
  f.letterSpacing = '0em'; f.restore();
}
// a: início · traco: o traço passa · fim: as dores se recolhem no centro (onde nasce a pílula)
function cenaCaos(t, chips, { a = 0, traco = 3.0, fim = 4.8, caos = 'CAOS', virada = 'CUIDADO', viradaTam = 330, centroX = W / 2 + 160 } = {}) {
  if (t > fim + 0.3) return;
  const tensao = seg(t, a + 1.6, traco), sai = ease.inOut(seg(t, fim - 0.45, fim + 0.15));
  decorativo(() => {
    const caosX = 60 + (t - a) * 18 - ease.in(seg(t, traco + 0.2, traco + 1.1)) * 2400;
    if (caosX > -2000) palavraGigante(caos, caosX, 1040, 520, { contorno: true, alfa: clamp((t - a) * 2) });
    const ou = ease.expoOut(seg(t, traco + 0.5, traco + 1.4));
    if (ou > 0) { f.save(); f.translate(W / 2, H / 2); const zz = 1 + 3 * ease.in(seg(t, fim - 0.45, fim + 0.25)); f.scale(zz, zz); f.translate(-W / 2, -H / 2); palavraGigante(virada, 90 + (1 - ou) * 1600, 1010, viradaTam, { alfa: 1 - seg(t, fim - 0.1, fim + 0.25) }); f.restore(); }
    chips.forEach((p, i) => {
      const tSnap = traco + 0.15 + (p.x / 1920) * 0.6, u = ease.spring(seg(t, tSnap, tSnap + 0.55)), ok = seg(t, tSnap + 0.15, tSnap + 0.3);
      const tremor = tensao * 6 * Math.sin(t * 40 + p.fase), dx = Math.sin(t * 0.8 * p.vel + p.fase) * 24 + tremor, dy = Math.cos(t * 0.7 * p.vel + p.fase) * 18;
      const x = lerp(p.x + dx, p.gx, u), y = lerp(p.y + dy, p.gy, u), rot = lerp(p.rot + Math.sin(t * p.vel + p.fase) * 0.05, 0, u), k = lerp(p.esc * 0.92, 0.72, u);
      chipDor(lerp(x, centroX, sai), lerp(y, H / 2, sai), rot, k * (1 - 0.88 * sai), p.d, ok, clamp((t - a - i * 0.06) * 3) * (1 - sai));
    });
    const ida = seg(t, traco, traco + 0.75), volta = seg(t, traco + 0.75, traco + 1.3);
    if (ida > 0 && volta < 1) { f.save(); f.lineCap = 'round'; f.strokeStyle = T.primary; f.lineWidth = 46; const p = new Path2D('M-200 760 C 300 980, 700 120, 1100 420 S 1700 820, 2150 300'), L = 2900;
      f.setLineDash([L, L]); f.lineDashOffset = L * (1 - ease.inOut(ida)) - L * ease.inOut(volta); f.stroke(p); f.restore(); }
  });
}

// ---------- campo de cor: o selo cresce e cobre a tela; texto em tinta escura entra por máscara ----------
function campoCor(t, a, { de = [400, 682], ate = [W / 2, H / 2] } = {}) {
  const u = ease.inOut(seg(t, a - 0.45, a + 0.2)); if (u <= 0) return 0;
  const cx = lerp(de[0], ate[0], u), cy = lerp(de[1], ate[1], u), raio = 1250 * u;
  f.save(); f.beginPath(); f.arc(cx, cy, raio, 0, 7); f.fillStyle = T.primary; f.fill(); f.restore();
  cobreCaixas(p => Math.hypot(p[0] - cx, p[1] - cy) < raio); return u;
}
// u: entrada 0..1 · s: saída 0..1
function tinta(txt, y, size, u, s, { w = 800, cor = T.primaryFg } = {}) {
  if (u <= 0 || s >= 1) return; f.save(); f.beginPath(); f.rect(0, y - size * 1.0, W, size * 1.3); f.clip();
  tx(f, txt, W / 2, y + (1 - ease.expoOut(clamp(u))) * size * 1.2 - ease.in(clamp(s)) * size * 1.3, size, { w, color: cor, align: 'center', base: 'alphabetic', track: -0.04 }); f.restore();
}
// slogan com troca de palavra por corte: "<palavra> <fim>" (a última palavra é a da marca)
function sloganTroca(t, a, z, palavras, fim, { passo = 0.62, size = 92, sobreAcento = true, y = 560 } = {}) {
  if (t < a || t >= z) return;
  const i = Math.min(palavras.length - 1, Math.max(0, Math.floor((t - a - 0.2) / passo))), p = palavras[i];
  const c1 = sobreAcento ? T.primaryFg : T.primary, c2 = sobreAcento ? T.primaryDeep : T.fg;
  const wp = tw(f, p, size, 800, -0.03), wf = tw(f, fim, size, 600, -0.03), x0 = W / 2 - (wp + wf) / 2, u = seg(t, a, a + 0.4), sa = seg(t, z - 0.3, z);
  f.save(); f.beginPath(); f.rect(0, y - 120, W, 140); f.clip(); const dy = (1 - ease.expoOut(u)) * 110 - ease.in(sa) * 120;
  tx(f, p, x0, y + dy, size, { w: 800, color: c1, base: 'alphabetic', track: -0.03 }); tx(f, fim, x0 + wp, y + dy, size, { w: 600, color: c2, base: 'alphabetic', track: -0.03 }); f.restore();
}

// ---------- fecho: o fundo aprofunda, o símbolo se desenha grande e encolhe para o logotipo; assinatura sobe ----------
function cenaFecho(t, a, { assinatura = '', fundoProfundo = true, simboloNoLogo = null } = {}) {
  if (t < a - 0.4) return;
  if (fundoProfundo) { const v = ease.inOut(seg(t, a - 0.4, a + 0.3)), gg = f.createLinearGradient(0, 0, W, H); gg.addColorStop(0, T.primaryFg); gg.addColorStop(1, T.primaryDeep); f.save(); f.globalAlpha = v; f.fillStyle = gg; f.fillRect(0, 0, W, H); f.restore(); }
  const lh = 150, lw = logoLargura(lh), lx = W / 2 - lw / 2, ly = 470 - lh / 2;
  // simboloNoLogo: { x, y, size } do símbolo dentro do logotipo de altura 150 (com imagem, meça no arquivo oficial);
  // sem imagem, o logotipo é símbolo + nome e o encaixe é automático
  const sl = simboloNoLogo || (LOGO.img ? null : LOGO_SIMBOLO(lh)), alvo = sl ? { x: lx + sl.x, y: ly + sl.y, s: sl.size } : { x: W / 2 - 30, y: ly + 15, s: 60 };
  const K = 600, u = seg(t, a, a + 0.9), m = ease.expoInOut(seg(t, a + 1.0, a + 1.8)), sz = lerp(K, alvo.s, m);
  f.save(); f.globalAlpha = 1 - seg(t, a + 1.8, a + 2.05); simbolo(f, lerp(W / 2 - K / 2, alvo.x, m), lerp(H / 2 - K / 2, alvo.y, m), sz, ease.inOut(u), T.primary); f.restore();
  const uw = ease.expoOut(seg(t, a + 1.75, a + 2.45));
  if (uw > 0) { f.save(); f.beginPath(); f.rect(lx - 10, ly - 20, (lw + 20) * uw, lh + 40); f.clip(); logo(f, lx, ly, lh); f.restore(); }
  if (assinatura) { f.save(); f.beginPath(); f.rect(0, 600, W, 80); f.clip(); tx(f, assinatura, W / 2, 655 + (1 - ease.expoOut(seg(t, a + 2.3, a + 2.9))) * 60, 34, { color: T.fg, align: 'center', base: 'alphabetic' }); f.restore(); }
}

// ---------- heróis do produto ----------
// Tela "sobre a mesa": entra de lado, inclinada e desfocada (fundo de contexto); sai em chicote para o mesmo lado.
function telaMesa(p, t, a, z, { x = 0, y = 110, lado = 1, rx = 50, rz = -14, zz = -340, blurBase = 3.5 } = {}) {
  const e = ease.expoOut(seg(t, a - 0.1, a + 0.7)), s = ease.in(seg(t, z - 0.35, z + 0.05));
  pose(p, { x: x + (1 - e) * 1400 * lado - s * 2800 * lado - 120 * seg(t, a, z) * lado, y, z: zz, rx, rz: rz * lado, o: clamp(e * 2), blur: blurBase + 14 * (1 - e) + 20 * s });
  return { e, s };
}
// Herói de frente (card, KPI, ficha): entra girando em Y e sai em chicote. s: escala.
function heroiEntra(p, t, a, z, { x = 470, y = 0, s = 1.8 } = {}) {
  const e = ease.expoOut(seg(t, a - 0.1, a + 0.7)), sa = ease.in(seg(t, z - 0.35, z + 0.05));
  pose(p, { x: x + (1 - e) * 1200 - sa * 2800, y, z: -40 + 50 * seg(t, a, z), ry: -16 + 28 * (1 - e), rx: 4, s, o: clamp(e * 2), blur: 14 * (1 - e) + 20 * sa });
}
// Card que descola da tela, cruza e pousa (filho do plano da tela). dx, dy em px da tela.
function descola(card, t, a, { dx = 328, dy = 0 } = {}) {
  const lift = ease.out(seg(t, a, a + 0.3)), mv = ease.inOut(seg(t, a + 0.3, a + 1.2)), drop = ease.in(seg(t, a + 1.2, a + 1.4));
  pose(card, { x: dx * mv, y: dy * mv, z: 190 * lift * (1 - drop), rx: -14 * lift * (1 - drop), rz: 4 * Math.sin(mv * Math.PI), s: 1 + 0.12 * lift * (1 - drop) });
  return t >= a + 1.4;
}
// Card que gira 180° e o verso vira um aviso (ex.: "NOVA VENDA!"); o aviso final pousa de frente em (toastX, toastY).
// base: pose do card antes de girar ({ x, y, z, s }); sai: 0..1 (chicote de saída do aviso)
function viraAviso(card, verso, aviso, t, a, { base = {}, toastX = 400, toastY = 10, s = 1.28, sai = 0 } = {}) {
  const vira = ease.inOut(seg(t, a, a + 0.55)), entrega = ease.inOut(seg(t, a + 0.4, a + 0.75)), bs = base.s ?? 1;
  pose(card, { x: base.x ?? 0, y: base.y ?? 0, z: (base.z ?? 0) + 240 * vira, rx: -30 * vira, ry: (base.ry ?? 0) * (1 - vira) + 180 * vira, s: bs * (1 + 0.2 * vira), o: (base.o ?? 1) * (1 - entrega), blur: base.blur ?? 0 });
  pose(verso, { o: 1 - entrega }); verso.el.style.transform = 'rotateY(180deg)';
  if (entrega > 0) pose(aviso, { x: lerp(toastX + 140, toastX, entrega) - sai * 2800, y: lerp(toastY - 70, toastY, entrega), z: lerp(-200, 20, entrega), rx: lerp(-16, 2, entrega), ry: lerp(-10, 10, entrega), s, o: clamp(entrega * 2), blur: 20 * sai });
  return entrega;
}

// ---------- carga ----------
// extra: promessas a aguardar (imagens, fontes). A fonte vem de config.marca.fontes (ver film.html).
function carregar(monta, extra = []) {
  const logoSrc = M.logo ? new Promise(r => { const img = new Image(); img.onload = () => r(img); img.onerror = () => r(null); img.src = M.logo; }) : Promise.resolve(null);
  const pesos = [400, 500, 600, 700, 800].map(w => document.fonts.load(`${w} 64px ${FONT_DISPLAY}`));
  Promise.all([logoSrc, ...pesos, ...extra]).then(([img]) => document.fonts.ready.then(() => img)).then(img => {
    prepararLogo(img); monta(); seek(0);
    window.ready = { w: W, h: H, dur: DUR, canvas: false, fonte: document.fonts.check(`700 64px ${FONT_DISPLAY}`) };
    if (!location.search.includes('render')) { const t0 = performance.now(); const loop = () => { seek(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  });
}
