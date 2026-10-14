// Sintetiza trilha e efeitos sonoros do filme, mede a grade de batidas e grava:
//   audio/trilha-bruta.wav  (sem normalizar; o render.mjs normaliza para -14 LUFS)
//   beats.json              (grade medida por detecção de ataques no pulso grave)
// Determinístico: ruído por mulberry32 com semente fixa. Duração e BPM vêm de config.json.
// O que editar: só a seção ARRANJO. A BIBLIOTECA DE EVENTOS tem um som pronto para cada momento (tensao, revelacao,
// entrada, pousa, varre, vira, contagem, campo, slogan, fecho, leito); componha o arranjo com os marcos de cenas.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const SR = 48000, DUR = CONFIG.dur, N = Math.round(SR * DUR), BPM = CONFIG.bpm || 120, BEAT = 60 / BPM;
const L = new Float32Array(N), R = new Float32Array(N);
const pulseBus = new Float32Array(N);

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(2026);
const noise = new Float32Array(N); for (let i = 0; i < N; i++) noise[i] = rnd() * 2 - 1;
const add = (i, v, pan = 0) => { if (i < 0 || i >= N) return; L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan)); };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const b = k => k * BEAT;

// ---------- instrumentos ----------
function pulse(t0, amp = 1) { // bumbo curto: define a grade medida
  const s = Math.round(t0 * SR); let ph = 0;
  for (let i = 0; i < SR * 0.3; i++) {
    const t = i / SR, f = 50 + 70 * Math.exp(-t * 40); ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.exp(-t * 11) * amp;
    add(s + i, v * 0.75); if (s + i < N) pulseBus[s + i] += v;
  }
}
function shaker(t0, amp = 0.06) {
  const s = Math.round(t0 * SR); let hp = 0, prev = 0;
  for (let i = 0; i < SR * 0.06; i++) { const n = noise[(s + i * 7) % N]; hp = 0.9 * (hp + n - prev); prev = n; const t = i / SR; add(s + i, hp * Math.min(1, t / 0.01) * Math.exp(-t * 55) * amp, 0.3); }
}
function bass(t0, dur, midi, amp = 0.2) {
  const s = Math.round(t0 * SR), f = mtof(midi);
  for (let i = 0; i < SR * dur; i++) { const t = i / SR; const env = Math.min(1, t / 0.01) * Math.exp(-t * 1.8) * Math.min(1, (dur - t) / 0.03); add(s + i, (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * env * amp); }
}
function piano(t0, midi, amp = 0.16, pan = 0, decay = 3.2) {
  const s = Math.round(t0 * SR), f = mtof(midi), len = SR * Math.min(3, DUR - t0);
  for (let i = 0; i < len; i++) { const t = i / SR; const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * decay) + 0.4 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * decay * 2.2) + 0.12 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * decay * 4); add(s + i, v * Math.min(1, t / 0.002) * amp, pan); }
}
function pad(t0, dur, notes, amp = 0.035, att = 0.3, rel = 0.4) {
  const s = Math.round(t0 * SR);
  for (let i = 0; i < SR * dur; i++) { const t = i / SR, env = Math.min(1, t / att) * Math.min(1, Math.max(0, dur - t) / rel); let v = 0; for (const m of notes) { const f = mtof(m); v += Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 1.003 * t + 1) + 0.12 * Math.sin(4 * Math.PI * f * t); } add(s + i, v * env * amp, Math.sin(t * 1.7) * 0.3); }
}
function click(t0, amp = 0.14, f = 3000, pan = 0.2) { const s = Math.round(t0 * SR); for (let i = 0; i < SR * 0.03; i++) { const t = i / SR; add(s + i, (Math.sin(2 * Math.PI * f * t) * 0.6 + noise[(s + i * 3) % N] * 0.4) * Math.exp(-t * 180) * amp, pan); } }
function key(t0, amp = 0.05) { // tecla de digitação
  const s = Math.round(t0 * SR); let lp = 0;
  for (let i = 0; i < SR * 0.04; i++) { const t = i / SR, n = noise[(s + i * 5) % N]; lp += (n - lp) * 0.35; add(s + i, (lp * 1.5 + Math.sin(2 * Math.PI * 900 * t) * 0.4) * Math.exp(-t * 120) * amp, -0.15); }
}
function whoosh(t0, dur, amp = 0.3, dir = 1) { // passagem rápida (chicote, troca de plano)
  const s = Math.round(t0 * SR); let lp = 0, lp2 = 0;
  for (let i = 0; i < SR * dur; i++) { const u = i / (SR * dur), c = 0.02 + 0.35 * Math.sin(Math.PI * u); const n = noise[(s + i * 5) % N]; lp += (n - lp) * c; lp2 += (lp - lp2) * c; add(s + i, (lp - lp2) * Math.sin(Math.PI * u) ** 2 * amp * 3, (u - 0.5) * 1.2 * dir); }
}
function riser(t0, dur, amp = 0.2) {
  const s = Math.round(t0 * SR); let lp = 0, lp2 = 0;
  for (let i = 0; i < SR * dur; i++) { const u = i / (SR * dur), c = 0.008 + 0.3 * u ** 2; const n = noise[(s + i * 11) % N]; lp += (n - lp) * c; lp2 += (lp - lp2) * c; add(s + i, (lp - lp2) * u ** 1.8 * amp * 4); }
}
function snap(t0, amp = 0.35) { // encaixe: toque grave curto + clique (algo pousa, botão confirma)
  const s = Math.round(t0 * SR); let ph = 0;
  for (let i = 0; i < SR * 0.2; i++) { const t = i / SR; ph += 2 * Math.PI * (140 + 120 * Math.exp(-t * 50)) / SR; add(s + i, (Math.sin(ph) * Math.exp(-t * 22) + noise[(s + i) % N] * Math.exp(-t * 500) * 0.4) * amp); }
}
function chime(t0, amp = 0.06) { for (const [m, d] of [[84, 0], [88, 0.05], [91, 0.1]]) piano(t0 + d, m, amp, 0.3 - d * 4, 5); } // sucesso, chegada
const mute = (a, z) => { const ia = Math.round(a * SR), iz = Math.round(z * SR), rp = SR * 0.005; for (let i = Math.max(0, ia - rp); i < Math.min(N, iz + rp); i++) { const g = i < ia ? (ia - i) / rp : i >= iz ? (i - iz) / rp : 0; L[i] *= g; R[i] *= g; } };

// ---------- BIBLIOTECA DE EVENTOS (um som para cada peça do motor; tempos em segundos) ----------
const chords = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 64], [46, 53, 57, 62]], roots = [41, 45, 38, 34];
// leito musical entre as batidas k0 e k1 (pulso que define a grade, pad, baixo e shaker)
const leito = (k0, k1) => { for (let k = k0; k < k1; k++) pulse(b(k), k % 2 === 0 ? 1 : 0.75); for (let bar = Math.ceil(k0 / 4); bar * 4 < k1; bar++) pad(b(bar * 4), b(4) + 0.1, chords[bar % 4].map(m => m + 12), 0.025, 0.15, 0.2);
  for (let k = k0; k < k1; k++) bass(b(k), BEAT - 0.04, roots[Math.floor(k / 4) % 4] + (k % 4 === 2 ? 12 : 0), 0.13); for (let k = k0 + 2; k < k1 - 1; k++) shaker(b(k) + BEAT / 2, 0.04); };
// tensão (a → virada): pulsos irregulares, cluster dissonante e cliques espalhados; o traço corta, sopra e tudo encaixa
const tensao = (a, traco) => { for (let k = 0; k < 6; k++) pulse(a + 0.15 + k * 0.47 + (k % 2) * 0.09, 0.55); pad(a, traco - a + 0.1, [52, 53, 58, 59], 0.03, 0.8, 0.1); riser(a + 1.2, traco - a - 1.2, 0.16);
  for (let k = 0; k < 12; k++) click(a + 0.2 + k * 0.21, 0.04, 1800 + (k * 377) % 2400, (k % 2 ? 0.4 : -0.4));
  mute(traco - 0.05, traco); whoosh(traco - 0.05, 0.9, 0.35); for (let k = 0; k < 12; k++) snap(traco + 0.2 + k * 0.06, 0.12); snap(traco + 0.9, 0.45); pad(traco + 0.9, 3.6, [60, 64, 67, 72], 0.03, 0.05, 0.6); };
const decod = (a, n, d) => { for (let i = 0; i < n; i++) click(a + i * d, 0.03, 2600 + (i % 5) * 300, (i % 2 ? 0.2 : -0.2)); };
// revelação: clique, subida, respiro e impacto no flash
const revelacao = (a, z) => { click(a + 0.35, 0.05, 2400); click(a + 1.45, 0.18, 2000); riser(a + 1.5, z - a - 1.55, 0.2); mute(z - 0.18, z - 0.02); snap(z, 0.5); chime(z + 0.05, 0.05); };
// entrada de um momento: chicote, rótulo e selo concluído
const entrada = (a, feito) => { whoosh(a - 0.38, 0.5, 0.28); click(a + 0.35, 0.06, 2800); snap(feito, 0.3); chime(feito + 0.03, 0.035); };
const pousa = (a) => { click(a, 0.13); whoosh(a + 0.3, 0.9, 0.1); snap(a + 1.35, 0.36); };
const varre = (a, dur) => { riser(a, dur, 0.08); for (let k = 0; k < 8; k++) click(a + dur + 0.1 + k * 0.12, 0.03, 3200, 0.1); };
const vira = (a) => { whoosh(a, 0.55, 0.18); snap(a + 0.5, 0.42); chime(a + 0.55, 0.08); };
const contagem = (a, n = 8) => { for (let k = 0; k < n; k++) click(a + k * 0.1, 0.03, 3600, -0.1); snap(a + n * 0.1 + 0.1, 0.4); chime(a + n * 0.1 + 0.15, 0.06); };
const campo = (a, dur = 3.2) => { riser(a - 0.8, 0.8, 0.18); snap(a, 0.5); chime(a + 0.05, 0.07); pad(a, dur, [57, 64, 69, 72], 0.035, 0.05, 0.6); whoosh(a + 1.6, 0.5, 0.16); };
const slogan = (a, n, passo) => { for (let k = 0; k < n; k++) snap(a + 0.2 + k * passo, 0.24); };
// fecho: respiro antes, impacto, acorde longo e silêncio até o fim
const fecho = (a) => { mute(a - 0.25, a - 0.05); snap(a, 0.5); pad(a, DUR - a, [65, 69, 72, 76], 0.03, 0.03, 1.6); chime(a + 1.5, 0.06); };

// ---------- ARRANJO (edite só aqui; mesmos marcos de cenas.js) ----------
const A = { tensao: 0, virada: 2.6, revela: 4.0, prova: 6.4, campo: 9.6, slogan: 11.4, fecho: 12.6 };
tensao(A.tensao, A.virada); decod(0.3, 20, 0.06);
revelacao(A.revela, A.prova);
leito(Math.round(A.prova / BEAT), Math.round(A.campo / BEAT));
entrada(A.prova + 0.1, A.prova + 1.9); contagem(A.prova + 0.9, 10);
for (let k = 0; k < 3; k++) snap(A.prova + 1.6 + k * 0.3, 0.2);
campo(A.campo, A.slogan - A.campo + 0.4);
slogan(A.slogan, 3, 0.62);
fecho(A.fecho);
const fadeA = Math.round((DUR - 0.6) * SR);
for (let i = fadeA; i < N; i++) { const g = (1 - (i - fadeA) / (N - fadeA)) ** 2; L[i] *= g; R[i] *= g; }

// ---------- saída ----------
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / (peak || 1);
fs.mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(ROOT, 'audio', 'trilha-bruta.wav'), buf);

// ---------- medição da grade (beats.json) ----------
const Wn = SR * 0.005, frames = Math.floor(N / Wn), env = new Float32Array(frames);
for (let f = 0; f < frames; f++) { let e = 0; for (let i = 0; i < Wn; i++) e += pulseBus[f * Wn + i] ** 2; env[f] = Math.sqrt(e / Wn); }
const flux = env.map((v, f) => Math.max(0, v - (f ? env[f - 1] : 0)));
let fmax = 0; for (const v of flux) fmax = Math.max(fmax, v);
const thr = fmax * 0.3, onsets = [];
for (let f = 0; f < frames - 1; f++) if (flux[f] > thr && flux[f] >= (f ? flux[f - 1] : 0) && flux[f] > flux[f + 1] && (!onsets.length || f * 0.005 - onsets.at(-1) > 0.15)) onsets.push(f * 0.005);
const diffs = onsets.slice(1).map((v, i) => v - onsets[i]).sort((a, c) => a - c);
const period = diffs[Math.floor(diffs.length / 2)] || BEAT;
const phase = onsets.length ? onsets.reduce((s, o) => s + (o - Math.round(o / period) * period), 0) / onsets.length : 0;
const beats = []; for (let k = 0; phase + k * period < DUR; k++) beats.push(+Math.max(0, phase + k * period).toFixed(4));
fs.writeFileSync(path.join(ROOT, 'beats.json'), JSON.stringify({ bpm: +(60 / period).toFixed(2), period: +period.toFixed(4), phase: +phase.toFixed(4), beats }, null, 2));
console.log(`trilha: ${DUR} s; ataques medidos: ${onsets.length}; BPM medido ${(60 / period).toFixed(2)}; batidas: ${beats.length}`);
