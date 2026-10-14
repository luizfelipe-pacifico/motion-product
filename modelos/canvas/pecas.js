// Peças prontas do estúdio, em canvas 2D, para qualquer motion (vinheta, abertura, lançamento, explicativo).
// Tudo é função pura do tempo e dos argumentos. Medidas em px do quadro: multiplique por U nas cenas para valer
// nos três formatos. Depende do film.html (W, H, U, M, ctx, clamp, lerp, seg, ease, mulberry32).
//   texto: frase · linhaMascara · tituloGrande · decodifica · palavraGigante · embaralha
//   marca e momentos: traco · seloOk · listaMarcada · anelProgresso · campoCor · tinta · sloganTroca · simbolo · logo · cenaFecho · flash
//   checagem: caixas de texto e de "heróis" para `node render.mjs --colisao 1`

// ---------- tokens da marca (config.json → marca) ----------
const T = {
  bg: M.fundo || '#0F172A', bgDeep: M.fundoProfundo || M.fundo || '#020617', card: M.superficie || '#1E293B', border: M.borda || '#334155',
  fg: M.texto || '#F8FAFC', muted: M.apoio || '#94A3B8', primary: M.acento || '#22C55E', primaryFg: M.tintaAcento || '#052E16', primaryDeep: M.acentoProfundo || '#14532D',
};
const FONT_DISPLAY = `${M.display || 'system-ui'}, ui-sans-serif, system-ui, sans-serif`, FONT_UI = `${M.ui || M.display || 'system-ui'}, ui-sans-serif, system-ui, sans-serif`;
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
const acentoA = a => rgba(T.primary, a), apoioA = a => rgba(T.muted, a);

// ---------- caixas para a checagem de colisão ----------
const CAIXAS = { textos: [], herois: [] };
let _decorativo = false, _dono = null;
function novoQuadro() { CAIXAS.textos.length = 0; CAIXAS.herois.length = 0; }
// decoração que cruza bordas ou textos de propósito (palavra gigante, fundo) não entra na checagem
function decorativo(fn) { const a = _decorativo; _decorativo = true; try { fn(); } finally { _decorativo = a; } }
// registre um elemento principal (card, objeto) para a checagem: texto de fora sobre ele e corte na borda.
// conteudo: função opcional que desenha o que é do próprio herói (os textos dela não contam como colisão com ele)
function heroi(x0, y0, x1, y1, nome = 'herói', conteudo = null) {
  if (conteudo) { const d = _dono; _dono = nome; try { conteudo(); } finally { _dono = d; } } const m = ctx.getTransform(), p = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  CAIXAS.herois.push({ s: nome, x0: Math.min(...p.map(q => q[0])), y0: Math.min(...p.map(q => q[1])), x1: Math.max(...p.map(q => q[0])), y1: Math.max(...p.map(q => q[1])) }); }
// uma camada opaca cobriu parte da tela: o que ficou por baixo sai da checagem
function cobreCaixas(dentro) { for (const k of ['textos', 'herois']) { const v = CAIXAS[k].filter(a => ![[a.x0, a.y0], [a.x1, a.y0], [a.x0, a.y1], [a.x1, a.y1]].every(dentro)); CAIXAS[k].length = 0; CAIXAS[k].push(...v); } }
window.caixas = () => CAIXAS;

// ---------- texto ----------
function font(size, weight = 400, ui = false) { return `${weight} ${size}px ${ui ? FONT_UI : FONT_DISPLAY}`; }
function tx(s, x, y, size, { w = 400, color = T.fg, align = 'left', base = 'alphabetic', track = 0, ui = false } = {}) {
  ctx.font = font(size, w, ui); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = `${track}em`; ctx.fillText(s, x, y);
  if (!_decorativo && ctx.globalAlpha >= 0.35) { const mt = ctx.measureText(s), m = ctx.getTransform();
    const p = [[x - mt.actualBoundingBoxLeft, y - mt.actualBoundingBoxAscent], [x + mt.actualBoundingBoxRight, y + mt.actualBoundingBoxDescent]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
    CAIXAS.textos.push({ s, dono: _dono, x0: Math.min(p[0][0], p[1][0]), y0: Math.min(p[0][1], p[1][1]), x1: Math.max(p[0][0], p[1][0]), y1: Math.max(p[0][1], p[1][1]) }); }
  ctx.letterSpacing = '0em';
}
function tw(s, size, w = 400, track = 0) { ctx.font = font(size, w); ctx.letterSpacing = `${track}em`; const m = ctx.measureText(s).width; ctx.letterSpacing = '0em'; return m; }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillR(x, y, w, h, r, color) { rrect(x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); }
function strokeR(x, y, w, h, r, color, lw = 1) { rrect(x + lw / 2, y + lw / 2, w - lw, h - lw, r); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); }
// check desenhado (sem depender de biblioteca de ícones)
function check(cx, cy, s, color, lw = 3) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx - s * 0.45, cy); ctx.lineTo(cx - s * 0.12, cy + s * 0.33); ctx.lineTo(cx + s * 0.48, cy - s * 0.32); ctx.stroke(); ctx.restore(); }

// frase que entra subindo com desfoque curto (u: 0..1)
function frase(s, x, y, size, u, { w = 400, cor = T.fg, align = 'left', track = -0.02, blurMax = 12 } = {}) {
  if (u <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(u * 1.5);
  const bl = (1 - ease.expoOut(u)) * blurMax; if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
  tx(s, x, y + (1 - ease.expoOut(u)) * size * 0.25, size, { w, color: cor, align, track }); ctx.restore();
}
// linha que sobe de dentro de uma janela (máscara)
function linhaMascara(s, x, y, size, u, cor = T.fg, { w = 700, align = 'left', track = -0.035 } = {}) {
  if (u <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(align === 'left' ? x - size * 0.1 : 0, y - size * 0.98, align === 'left' ? W : W, size * 1.28); ctx.clip();
  tx(s, x, y + (1 - ease.expoOut(clamp(u))) * size * 1.15, size, { w, color: cor, align, track }); ctx.restore();
}
// título em 2 linhas (acento na linha `acento`) com rótulo opcional acima; entra em a, sai em z
function tituloGrande(l1, l2, x, y, size, t, a, z, opts = {}) {
  if (t < a - 0.05 || t > z + 0.4) return;
  // na saída o título sobe por dentro da máscara: não conta para a margem segura
  if (t > z && !_decorativo) return decorativo(() => tituloGrande(l1, l2, x, y, size, t, a, z, opts));
  const { acento = 2, rotulo = null, rotuloTam = size * 0.27, align = 'left' } = opts; const sai = ease.in(seg(t, z, z + 0.35));
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.7, W, size * 3.2); ctx.clip(); ctx.translate(0, -sai * size * 2.4);
  if (rotulo) { const q = ease.expoOut(seg(t, a - 0.1, a + 0.4)), rx = align === 'center' ? x - tw(rotulo, rotuloTam, 700, 0.2) / 2 - rotuloTam * 1.3 : x;
    fillR(rx, y - size - rotuloTam * 1.2, rotuloTam * 2 * q, 3 * U, 1.5 * U, T.primary); frase(rotulo, rx + rotuloTam * 2.6, y - size - rotuloTam * 0.8, rotuloTam, seg(t, a, a + 0.4), { w: 700, cor: T.primary, track: 0.2, blurMax: 6 }); }
  linhaMascara(l1, x, y, size, seg(t, a, a + 0.6), acento === 1 ? T.primary : T.fg, { align }); linhaMascara(l2, x, y + size * 1.02, size, seg(t, a + 0.1, a + 0.7), acento === 2 ? T.primary : T.fg, { align });
  ctx.restore();
}
// decodificação: cada letra começa como um caractere qualquer (no acento) e acerta na sua vez
const CARACTERES = 'ABCDEFGHJKLMNPRSTUVXZabcdefghijkmnoprstuvxz0123456789#%&';
function decodifica(s, x, y, size, t, a, dur, { w = 400, cor = T.fg, align = 'center' } = {}) {
  if (t < a) return; ctx.save(); ctx.font = font(size, w); ctx.letterSpacing = '-0.02em';
  const total = ctx.measureText(s).width; let cx = align === 'center' ? x - total / 2 : x; const r = mulberry32(Math.floor(t * 24) + s.length * 31);
  for (let i = 0; i < s.length; i++) { const ch = s[i], cw = ctx.measureText(ch).width, ti = a + (i / s.length) * dur * 0.75, ok = t >= ti + dur * 0.25;
    if (t >= ti && ch !== ' ') { ctx.fillStyle = ok ? cor : acentoA(0.75); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(ok ? ch : CARACTERES[Math.floor(r() * CARACTERES.length)], cx, y); }
    cx += cw; }
  ctx.letterSpacing = '0em'; ctx.restore();
  if (t > a + dur * 0.5 && !_decorativo) { const x0 = align === 'center' ? x - total / 2 : x; CAIXAS.textos.push({ s, x0, y0: y - size * 0.72, x1: x0 + total, y1: y + size * 0.2 }); }
}
// palavra enorme, cheia ou em contorno (decorativa: pode cruzar a borda de propósito)
function palavraGigante(s, x, y, size, { contorno = false, cor = T.primary, alfa = 1, align = 'left' } = {}) {
  decorativo(() => { ctx.save(); ctx.globalAlpha *= alfa; ctx.font = font(size, 800); ctx.letterSpacing = '-0.04em'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
    if (contorno) { ctx.lineWidth = 3 * U; ctx.strokeStyle = apoioA(0.32); ctx.strokeText(s, x, y); } else { ctx.fillStyle = cor; ctx.fillText(s, x, y); }
    ctx.letterSpacing = '0em'; ctx.restore(); });
}
// número que embaralha os dígitos até o valor final (u: 0..1)
function embaralha(final, u, semente = 7) { if (u >= 1) return final; const r = mulberry32(semente + Math.floor(u * 40)); return final.replace(/[0-9]/g, () => String(Math.floor(r() * 10))); }

// ---------- marca e momentos ----------
// traço grosso do acento que atravessa a tela e some pelo outro lado (virada); d: path SVG em px de 1920x1080
function traco(t, a, { d = 'M-200 760 C 300 980, 700 120, 1100 420 S 1700 820, 2150 300', comprimento = 2900, largura = 46, dur = 1.3 } = {}) {
  const ida = seg(t, a, a + dur * 0.58), volta = seg(t, a + dur * 0.58, a + dur); if (ida <= 0 || volta >= 1) return;
  ctx.save(); ctx.scale(W / 1920, H / 1080); ctx.lineCap = 'round'; ctx.strokeStyle = T.primary; ctx.lineWidth = largura;
  ctx.setLineDash([comprimento, comprimento]); ctx.lineDashOffset = comprimento * (1 - ease.inOut(ida)) - comprimento * ease.inOut(volta); ctx.stroke(new Path2D(d)); ctx.restore();
}
function seloOk(x, y, q, texto, size = 32 * U) {
  if (q <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(q, q); const h = size * 2, w = tw(texto, size, 700) + size * 3;
  fillR(0, 0, w, h, h / 2, T.primary); ctx.beginPath(); ctx.arc(h / 2 + 2, h / 2, size / 2, 0, 7); ctx.fillStyle = T.primaryFg; ctx.fill(); check(h / 2 + 2, h / 2, size * 0.55, T.primary, size * 0.11);
  tx(texto, h + size * 0.2, h / 2 + size * 0.36, size, { w: 700, color: T.primaryFg }); ctx.restore();
}
// lista que marca com check; feita(k) devolve 0..1
function listaMarcada(itens, x, y, t, a, feita, { passo = 80 * U, size = 36 * U, alfa = 1 } = {}) {
  itens.forEach((nome, k) => { const u = ease.expoOut(seg(t, a + k * 0.08, a + 0.5 + k * 0.08)), yy = y + k * passo, ok = feita(k), r = size * 0.58;
    ctx.save(); ctx.globalAlpha *= u * alfa; ctx.translate((1 - u) * 50 * U, 0);
    if (ok > 0) { const q = ease.back(clamp(ok)); ctx.save(); ctx.translate(x + r, yy); ctx.scale(q, q); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = T.primary; ctx.fill(); check(0, 0, r * 1.1, T.primaryFg, r * 0.16); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(x + r, yy, r - 1, 0, 7); ctx.strokeStyle = apoioA(0.5); ctx.lineWidth = 2 * U; ctx.stroke(); }
    tx(nome, x + r * 3, yy + size * 0.36, size, { w: 500, color: ok > 0 ? T.fg : T.muted }); ctx.restore(); });
}
function anelProgresso(x, y, raio, feitas, total, ap, legenda = '') {
  if (ap <= 0) return; ctx.save(); ctx.globalAlpha = ap; ctx.lineWidth = raio * 0.2;
  ctx.beginPath(); ctx.arc(x, y, raio, 0, 7); ctx.strokeStyle = apoioA(0.3); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, raio, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * feitas / total); ctx.strokeStyle = T.primary; ctx.lineCap = 'round'; ctx.stroke();
  if (legenda) tx(legenda, x - raio * 1.7, y + raio * 0.27, raio * 0.8, { w: 600, align: 'right', color: Math.round(feitas) === total ? T.primary : T.fg }); ctx.restore();
}
// campo de cor: um círculo do acento cresce a partir de (de) e cobre a tela; devolve 0..1
function campoCor(t, a, { de = [W / 2, H / 2], cor = T.primary } = {}) {
  const u = ease.inOut(seg(t, a - 0.45, a + 0.2)); if (u <= 0) return 0;
  const cx = lerp(de[0], W / 2, u), cy = lerp(de[1], H / 2, u), raio = Math.hypot(W, H) * 0.65 * u;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, raio, 0, 7); ctx.fillStyle = cor; ctx.fill(); ctx.restore();
  cobreCaixas(p => Math.hypot(p[0] - cx, p[1] - cy) < raio); return u;
}
// texto em tinta escura sobre o campo de cor, por máscara (u entrada, s saída)
function tinta(s, y, size, u, sai, { w = 800, cor = T.primaryFg, x = W / 2, align = 'center' } = {}) {
  if (u <= 0 || sai >= 1) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.0, W, size * 1.3); ctx.clip();
  tx(s, x, y + (1 - ease.expoOut(clamp(u))) * size * 1.2 - ease.in(clamp(sai)) * size * 1.3, size, { w, color: cor, align, track: -0.04 }); ctx.restore();
}
// slogan "<palavra><fim>": a palavra troca por corte a cada `passo` s e termina na última.
// duasLinhas (padrão no vertical): a palavra numa linha e o fim na outra, para caber grande no celular
function sloganTroca(t, a, z, palavras, fim, { passo = 0.62, size = 92 * U, y = H / 2 + 30 * U, sobreAcento = true, duasLinhas = H > W } = {}) {
  if (t < a || t >= z) return; const i = Math.min(palavras.length - 1, Math.max(0, Math.floor((t - a - 0.2) / passo))), p = palavras[i];
  const c1 = sobreAcento ? T.primaryFg : T.primary, c2 = sobreAcento ? T.primaryDeep : T.fg, u = seg(t, a, a + 0.4), sa = seg(t, z - 0.3, z);
  const dy = (1 - ease.expoOut(u)) * size * 1.2 - ease.in(sa) * size * 1.3;
  if (duasLinhas) {
    for (const [s, yy, w, cor] of [[p, y - size * 0.55, 800, c1], [fim.trim(), y + size * 0.6, 600, c2]]) { ctx.save(); ctx.beginPath(); ctx.rect(0, yy - size * 1.0, W, size * 1.3); ctx.clip(); tx(s, W / 2, yy + dy, size, { w, color: cor, align: 'center', track: -0.03 }); ctx.restore(); }
    return;
  }
  const wp = tw(p, size, 800, -0.03), wf = tw(fim, size, 600, -0.03), x0 = W / 2 - (wp + wf) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.2, W, size * 1.5); ctx.clip();
  tx(p, x0, y + dy, size, { w: 800, color: c1, track: -0.03 }); tx(fim, x0 + wp, y + dy, size, { w: 600, color: c2, track: -0.03 }); ctx.restore();
}
// flash curto e claro na camada de cima (nunca um véu longo): some em ~0,25 s
function flash(t, em, forca = 0.55) { const v = forca * Math.sin(Math.PI * seg(t, em - 0.12, em + 0.14)); if (v > 0.01) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${v})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } }

// ---------- símbolo e logotipo ----------
// config.marca.simbolo = { viewBox: 120, espessura: 12, tracos: ['M..', ...] } (paths do SVG oficial). Sem símbolo: um anel.
const SIMBOLO = (() => { const s = M.simbolo || { viewBox: 120, espessura: 12, tracos: ['M60 18a42 42 0 1 0 0.01 0'] }, ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  const tracos = s.tracos.map(d => { const el = document.createElementNS(ns, 'path'); el.setAttribute('d', d); svg.appendChild(el); return { p: new Path2D(d), el }; });
  return { vb: s.viewBox || 120, lw: s.espessura || 12, tracos, svg, len: null }; })();
// desenha o símbolo por traço progressivo (u: 0..1, traços em sequência)
function simbolo(x, y, size, u = 1, color = T.primary) {
  if (!SIMBOLO.len) { document.body.appendChild(SIMBOLO.svg); SIMBOLO.len = SIMBOLO.tracos.map(t => t.el.getTotalLength()); }
  const k = size / SIMBOLO.vb, n = SIMBOLO.tracos.length; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.strokeStyle = color; ctx.lineWidth = SIMBOLO.lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  SIMBOLO.tracos.forEach((tr, i) => { const a = i / (n + 0.5), z = (i + 1.5) / (n + 0.5), q = clamp((u - a) / (z - a)); if (q <= 0) return; const L = SIMBOLO.len[i] + 1; ctx.setLineDash([L * q, L + 10]); ctx.stroke(tr.p); });
  ctx.setLineDash([]); ctx.restore();
}
// logotipo: imagem oficial (marca.logo, SVG ou PNG transparente) ou símbolo + nome na fonte display
const LOGO = { img: null };
function logoLargura(h) { return LOGO.img ? h * LOGO.img.naturalWidth / LOGO.img.naturalHeight : h * 0.85 + tw(M.nome || 'Marca', h * 0.62, 700, -0.03); }
function logo(x, y, h, { cor = T.fg } = {}) {
  if (LOGO.img) { ctx.drawImage(LOGO.img, x, y, logoLargura(h), h); return; }
  simbolo(x, y + h * 0.15, h * 0.7, 1); tx(M.nome || 'Marca', x + h * 0.85, y + h * 0.72, h * 0.62, { w: 700, color: cor, track: -0.03 });
}
// fecho: fundo aprofunda para o acento escuro, o símbolo se desenha grande, encolhe e encaixa no logotipo; assinatura sobe
function cenaFecho(t, a, { assinatura = '', fundoAcento = true, simboloNoLogo = null } = {}) {
  if (t < a - 0.4) return;
  if (fundoAcento) { const v = ease.inOut(seg(t, a - 0.4, a + 0.3)), g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.primaryFg); g.addColorStop(1, T.primaryDeep); ctx.save(); ctx.globalAlpha = v; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); cobreCaixas(() => v > 0.95); }
  const lh = 150 * U, lw = logoLargura(lh), lx = W / 2 - lw / 2, ly = H / 2 - lh * 0.75;
  const sl = simboloNoLogo || (LOGO.img ? { x: lw / 2 - 30 * U, y: lh * 0.1, size: 60 * U } : { x: 0, y: lh * 0.15, size: lh * 0.7 }), K = 560 * U;
  const u = seg(t, a, a + 0.9), m = ease.expoInOut(seg(t, a + 1.0, a + 1.8)), sz = lerp(K, sl.size, m);
  ctx.save(); ctx.globalAlpha = 1 - seg(t, a + 1.8, a + 2.05); simbolo(lerp(W / 2 - K / 2, lx + sl.x, m), lerp(H / 2 - K / 2, ly + sl.y, m), sz, ease.inOut(u)); ctx.restore();
  const uw = ease.expoOut(seg(t, a + 1.75, a + 2.45)); if (uw > 0) { ctx.save(); ctx.beginPath(); ctx.rect(lx - 10, ly - 20, (lw + 20) * uw, lh + 40); ctx.clip(); logo(lx, ly, lh); ctx.restore(); }
  if (assinatura) { const y = ly + lh + 110 * U; ctx.save(); ctx.beginPath(); ctx.rect(0, y - 50 * U, W, 80 * U); ctx.clip(); tx(assinatura, W / 2, y + (1 - ease.expoOut(seg(t, a + 2.3, a + 2.9))) * 60 * U, 34 * U, { color: T.fg, align: 'center' }); ctx.restore(); }
}
// carrega o logotipo (se houver) antes de declarar o filme pronto
function carregarLogo() { return M.logo ? new Promise(r => { const img = new Image(); img.onload = () => { LOGO.img = img; r(); }; img.onerror = () => r(); img.src = M.logo; }) : Promise.resolve(); }
