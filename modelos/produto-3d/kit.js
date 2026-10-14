// Kit de interface em canvas: tokens da marca (de config.json), primitivas (texto, formas, card, badge, botão, avatar,
// cursor, ícones) e a marca (símbolo desenhado por traço e logotipo).
// Contrato do filme: tudo aqui é função pura dos argumentos; nenhum estado entre quadros.
// As telas do produto (cenas/telas.js) são desenhadas com estas primitivas, a partir do código do produto.

// ---------- tokens: vêm de config.json (marca); os nomes curtos são os usados no motor ----------
const M = (window.CONFIG && window.CONFIG.marca) || {};
const T = {
  bg: M.fundo || '#0F172A', bgDeep: M.fundoProfundo || M.fundo || '#020617', card: M.superficie || '#1E293B', elev: M.elevado || '#334155',
  border: M.borda || '#334155', fg: M.texto || '#F8FAFC', muted: M.apoio || '#94A3B8',
  primary: M.acento || '#22C55E', primaryFg: M.tintaAcento || '#052E16', primaryDeep: M.acentoProfundo || '#14532D',
};
const FONT_DISPLAY = `${M.display || 'system-ui'}, ui-sans-serif, system-ui, sans-serif`;
const FONT_UI = `${M.ui || M.display || 'system-ui'}, ui-sans-serif, system-ui, sans-serif`;
// cor com alfa a partir de um hex (#RRGGBB)
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
const acentoA = a => rgba(T.primary, a);
const apoioA = a => rgba(T.muted, a);

// ---------- texto ----------
function font(size, weight = 400, ui = false) { return `${weight} ${size}px ${ui ? FONT_UI : FONT_DISPLAY}`; }
function tx(c, s, x, y, size, { w = 400, color = T.fg, align = 'left', base = 'middle', track = 0, max, ui = false } = {}) {
  c.font = font(size, w, ui); c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.letterSpacing = `${track}em`;
  if (max && c.measureText(s).width > max) { while (s.length > 1 && c.measureText(s + '…').width > max) s = s.slice(0, -1); s += '…'; }
  c.fillText(s, x, y); if (c.__caixas && !c.__decorativo) registraTexto(c, s, x, y); c.letterSpacing = '0em';
}
// Caixa do texto em coordenadas de tela, para a checagem automática de colisão (render.mjs --colisao).
function registraTexto(c, s, x, y) {
  if (c.globalAlpha < 0.35) return; const mt = c.measureText(s); // medida real das letras (sem a margem da fonte)
  const x0 = x - mt.actualBoundingBoxLeft, x1 = x + mt.actualBoundingBoxRight, y0 = y - mt.actualBoundingBoxAscent, y1 = y + mt.actualBoundingBoxDescent;
  const m = c.getTransform(), pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  c.__caixas.push({ s, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
}
function tw(c, s, size, w = 400, track = 0, ui = false) { c.font = font(size, w, ui); c.letterSpacing = `${track}em`; const m = c.measureText(s).width; c.letterSpacing = '0em'; return m; }

// ---------- formas ----------
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function fillR(c, x, y, w, h, r, color) { rrect(c, x, y, w, h, r); c.fillStyle = color; c.fill(); }
function strokeR(c, x, y, w, h, r, color, lw = 1) { rrect(c, x + lw / 2, y + lw / 2, w - lw, h - lw, r); c.strokeStyle = color; c.lineWidth = lw; c.stroke(); }
function shadow(c, blur, oy, color) { c.shadowColor = color; c.shadowBlur = blur; c.shadowOffsetY = oy; c.shadowOffsetX = 0; }
function noShadow(c) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; }
function card(c, x, y, w, h, { r = 10, bg = T.card, border = T.border, sh = true } = {}) {
  c.save(); if (sh) shadow(c, 6, 2, 'rgba(0,0,0,.35)'); fillR(c, x, y, w, h, r, bg); c.restore(); strokeR(c, x, y, w, h, r, border);
}

// ---------- ícones (Lucide em traço, viewBox 24; Phosphor preenchido, viewBox 256) ----------
const _ic = {};
function icon(c, name, x, y, size, color, { lw = 2, set = 'lucide' } = {}) {
  const key = set + ':' + name, src = (window.ICONES?.[set] || {})[name];
  if (!src) { console.error('ícone ausente: ' + key); return; }
  _ic[key] ??= src.map(d => new Path2D(d));
  c.save(); c.translate(x, y);
  if (set === 'lucide') { const k = size / 24; c.scale(k, k); c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; for (const p of _ic[key]) c.stroke(p); }
  else { const k = size / 256; c.scale(k, k); c.fillStyle = color; for (const p of _ic[key]) c.fill(p); }
  c.restore();
}

// ---------- componentes ----------
function badge(c, s, x, y, { bg = acentoA(0.15), color = T.primary, size = 12, h = 22, pill = false, w: fw = 600 } = {}) {
  const pad = 8, w = tw(c, s, size, fw, 0, true) + pad * 2;
  fillR(c, x, y, w, h, pill ? h / 2 : 6, bg); tx(c, s, x + pad, y + h / 2 + 0.5, size, { w: fw, color, ui: true }); return w;
}
function button(c, s, x, y, { variant = 'default', h = 36, size = 14, press = 0 } = {}) {
  const w = tw(c, s, size, 500, 0, true) + 32; c.save(); const k = 1 - 0.03 * press; c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.translate(-(x + w / 2), -(y + h / 2));
  if (variant === 'default') fillR(c, x, y, w, h, 6, T.primary); else { fillR(c, x, y, w, h, 6, T.bg); strokeR(c, x, y, w, h, 6, T.border); }
  tx(c, s, x + 16, y + h / 2 + 0.5, size, { w: 500, color: variant === 'default' ? T.primaryFg : T.fg, ui: true }); c.restore(); return w;
}
function avatar(c, initials, x, y, d = 32, { bg = T.primary, color = T.primaryFg } = {}) {
  c.beginPath(); c.arc(x + d / 2, y + d / 2, d / 2, 0, 7); c.fillStyle = bg; c.fill();
  tx(c, initials, x + d / 2, y + d / 2 + 0.5, d * 0.36, { w: 700, color, align: 'center', ui: true });
}
function cursor(c, x, y, { click = 0 } = {}) {
  if (click > 0 && click < 1) { c.beginPath(); c.arc(x, y, 8 + 22 * click, 0, 7); c.strokeStyle = acentoA(0.6 * (1 - click)); c.lineWidth = 3; c.stroke(); }
  c.save(); c.translate(x, y); c.scale(1.25, 1.25); shadow(c, 6, 2, 'rgba(0,0,0,.5)');
  const p = new Path2D('M0 0 L0 17 L4.5 13 L7.5 20 L10.5 18.8 L7.5 12 L13 12 Z');
  c.fillStyle = '#F8FAFC'; c.fill(p); noShadow(c); c.strokeStyle = '#020617'; c.lineWidth = 1.2; c.lineJoin = 'round'; c.stroke(p); c.restore();
}

// ---------- marca ----------
// Símbolo desenhado por traço progressivo. config.marca.simbolo = { viewBox: 120, espessura: 12, tracos: ['M..', ...] }
// (traços do SVG oficial: círculos viram path com dois arcos). Sem símbolo, desenha um anel no acento.
const SIMBOLO = (() => {
  const s = M.simbolo || { viewBox: 120, espessura: 12, tracos: ['M60 18a42 42 0 1 0 0.01 0'] };
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  const tracos = s.tracos.map(d => { const el = document.createElementNS(ns, 'path'); el.setAttribute('d', d); svg.appendChild(el); return { p: new Path2D(d), el }; });
  return { vb: s.viewBox || 120, lw: s.espessura || 12, tracos, len: null };
})();
// u: 0..1 (os traços se desenham em sequência, com sobreposição)
function simbolo(c, x, y, size, u = 1, color = T.primary) {
  if (!SIMBOLO.len) { try { document.body.appendChild(SIMBOLO.tracos[0].el.ownerSVGElement); SIMBOLO.len = SIMBOLO.tracos.map(t => t.el.getTotalLength()); } catch { SIMBOLO.len = SIMBOLO.tracos.map(() => 400); } }
  const k = size / SIMBOLO.vb, n = SIMBOLO.tracos.length; c.save(); c.translate(x, y); c.scale(k, k);
  c.strokeStyle = color; c.lineWidth = SIMBOLO.lw; c.lineCap = 'round'; c.lineJoin = 'round';
  SIMBOLO.tracos.forEach((t, i) => { const a = i / (n + 0.5), z = (i + 1.5) / (n + 0.5), q = clamp((u - a) / (z - a)); if (q <= 0) return; const L = SIMBOLO.len[i] + 1; c.setLineDash([L * q, L + 10]); c.stroke(t.p); });
  c.setLineDash([]); c.restore();
}
// Logotipo: imagem oficial (config.marca.logo, de preferência SVG ou PNG sobre transparente) ou o nome na fonte display.
const LOGO = { img: null, w: 0, h: 0 };
function prepararLogo(img) { if (img) Object.assign(LOGO, { img, w: img.naturalWidth, h: img.naturalHeight }); }
// sem imagem: símbolo (altura 0,7h) + nome na fonte display
function logoLargura(h) { return LOGO.img ? h * LOGO.w / LOGO.h : h * 0.85 + tw(document.createElement('canvas').getContext('2d'), M.nome || 'Marca', h * 0.62, 700, -0.03); }
const LOGO_SIMBOLO = h => ({ x: 0, y: h * 0.15, size: h * 0.7 }); // onde o símbolo fica no logotipo sem imagem
function logo(c, x, y, h, { cor = T.fg } = {}) {
  if (LOGO.img) { c.drawImage(LOGO.img, x, y, h * LOGO.w / LOGO.h, h); return h * LOGO.w / LOGO.h; }
  const s = M.nome || 'Marca', size = h * 0.62, sb = LOGO_SIMBOLO(h); simbolo(c, x + sb.x, y + sb.y, sb.size, 1);
  tx(c, s, x + h * 0.85, y + h / 2, size, { w: 700, color: cor, track: -0.03 }); return logoLargura(h);
}
