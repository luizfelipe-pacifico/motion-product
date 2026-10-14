// Telas do produto, desenhadas com o kit em coordenadas de 1920x1080 (1 px de tela = 1 px aqui).
// ESTE ARQUIVO É UM EXEMPLO GENÉRICO. Num projeto real, substitua por telas reconstruídas do código do produto
// (ver referencias/fidelidade-ui.md): mesmas medidas, tokens, ícones e textos, com dados fictícios.
// Cada tela é function(c, st): pura; `st` traz o estado animável (ex.: progresso de um contador, card escondido).

const SB = 256, HD = 56;
function cascoApp(c, ativo = 1) {
  fillR(c, 0, 0, 1920, 1080, 0, T.bg);
  fillR(c, 0, 0, SB, 1080, 0, T.bgDeep); c.fillStyle = T.border; c.fillRect(SB - 1, 0, 1, 1080);
  simbolo(c, 24, 18, 28, 1); tx(c, M.nome || 'Marca', 62, 32, 18, { w: 700, ui: true });
  ['Início', 'Clientes', 'Jornadas', 'Vendas', 'Relatórios'].forEach((l, i) => {
    const y = 96 + i * 40; if (i === ativo) fillR(c, 12, y - 16, SB - 24, 32, 6, acentoA(0.12));
    fillR(c, 28, y - 6, 12, 12, 3, i === ativo ? T.primary : apoioA(0.5)); tx(c, l, 52, y, 14, { color: i === ativo ? T.fg : T.muted, w: i === ativo ? 600 : 400, ui: true });
  });
  c.fillStyle = T.border; c.fillRect(SB, HD, 1920 - SB, 1);
  input(c, SB + 26, 10, 360, { placeholder: 'Buscar', ic: 'search' });
  avatar(c, 'AB', 1920 - 58, 12, 32);
}
function input(c, x, y, w, { placeholder = '', ic = null, h = 36 } = {}) {
  fillR(c, x, y, w, h, 6, rgba(T.bg, 0.6)); strokeR(c, x, y, w, h, 6, T.border);
  if (ic) icon(c, ic, x + 12, y + h / 2 - 8, 16, T.muted); tx(c, placeholder, x + (ic ? 36 : 12), y + h / 2 + 0.5, 14, { color: T.muted, ui: true });
}
// Quadro (kanban) com colunas e cards. st.semMovel: esconde o card que vai descolar (ele é um plano à parte).
const COLUNAS = [['Novo', '#3B82F6'], ['Em contato', '#8B5CF6'], ['Proposta', '#F59E0B'], ['Fechado', T.primary]];
const QUADRO = { x: SB + 26, y: 150, colW: 312, gap: 16, cardH: 120 };
const CARDS = [[['Clínica Horizonte', 'R$ 1.200'], ['Studio Lima', 'R$ 800']], [['Mercado Sol', 'R$ 2.400'], ['Ótica Visão', 'R$ 650']], [['Padaria Aurora', 'R$ 950']], [['Café Central', 'R$ 1.100']]];
function cardQuadro(c, x, y, w, [nome, valor], cor) {
  card(c, x, y, w, QUADRO.cardH - 12, { r: 8 }); fillR(c, x, y + 10, 3, QUADRO.cardH - 32, 2, cor);
  tx(c, nome, x + 16, y + 28, 15, { w: 600, ui: true }); tx(c, 'Responsável: Ana Souza', x + 16, y + 52, 12, { color: T.muted, ui: true });
  badge(c, valor, x + 16, y + 70, {});
}
function telaQuadro(c, st = {}) {
  cascoApp(c, 3); tx(c, 'Vendas', SB + 26, 104, 24, { w: 700, ui: true }); button(c, 'Nova negociação', 1920 - 210, 86, {});
  COLUNAS.forEach(([nome, cor], i) => {
    const x = QUADRO.x + i * (QUADRO.colW + QUADRO.gap); fillR(c, x, QUADRO.y, QUADRO.colW, 860, 10, rgba(T.card, 0.45));
    fillR(c, x + 14, QUADRO.y + 20, 8, 8, 4, cor); tx(c, nome, x + 30, QUADRO.y + 24, 14, { w: 600, ui: true });
    CARDS[i].forEach((cd, k) => { if (st.semMovel && i === 0 && k === 0) return; cardQuadro(c, x + 12, QUADRO.y + 50 + k * QUADRO.cardH, QUADRO.colW - 24, cd, cor); });
  });
}
// posição (centro) do card móvel na tela e o deslocamento até a coluna seguinte
function slotCardMovel() { const w = QUADRO.colW - 24, h = QUADRO.cardH - 12; return { x: QUADRO.x + 12, y: QUADRO.y + 50, w, h, dx: QUADRO.colW + QUADRO.gap }; }
// KPI: número que conta (st.u 0..1)
function cardKPI(c, st = {}) {
  card(c, 0, 0, 420, 140, { r: 12 }); tx(c, 'Receita do mês', 24, 34, 16, { color: T.muted, ui: true });
  const v = Math.round(84320 * ease.out(clamp(st.u ?? 1))); tx(c, 'R$ ' + v.toLocaleString('pt-BR') + ',00', 24, 82, 38, { w: 700, ui: true });
  badge(c, '+12% no mês', 24, 104, {});
}
// aviso de sucesso (verso do card que gira)
function cardAviso(c) {
  fillR(c, 0, 0, 560, 180, 16, T.card); strokeR(c, 0, 0, 560, 180, 16, acentoA(0.6), 2);
  avatar(c, 'PA', 24, 28, 56); tx(c, 'NOVA VENDA!', 100, 42, 14, { w: 700, color: T.primary, track: 0.12, ui: true });
  tx(c, 'Padaria Aurora', 100, 72, 24, { w: 600, ui: true }); tx(c, 'Plano mensal', 100, 102, 15, { color: T.muted, ui: true });
  fillR(c, 24, 124, 512, 40, 8, acentoA(0.12)); tx(c, 'R$ 950,00 por mês', 280, 144, 17, { w: 600, color: T.primary, align: 'center', ui: true });
}
