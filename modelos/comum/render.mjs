// Renderiza film.html quadro a quadro no Chrome headless (protocolo CDP) e codifica com ffmpeg.
// Uso (na pasta fonte do projeto):
//   node render.mjs --check                          -> só detecta Chrome e ffmpeg (e guarda no cache)
//   node render.mjs --sheet rodadas/rodada-1.png     -> folha de contato, um quadro por batida
//   node render.mjs --stills 1.3,5.8 --dir <pasta>   -> quadros soltos em JPEG
//   node render.mjs --marcos rodadas/marcos-1.png    -> folha NO MEIO das transições (window.MARCOS + 0,25/0,6/1,0/1,6 s)
//   node render.mjs --colisao 1                      -> texto x herói, texto x texto, texto fora da margem e herói cortado (reprova com código 1)
//   node render.mjs --eval "<expressão>"             -> depuração: avalia uma expressão na página
//   node render.mjs                                  -> vídeo final em ../resultados/<config.saida>
//   node render.mjs --draft 1                        -> vídeo de rascunho (30 fps, preset veryfast)
// Antes do vídeo e da folha, rode `node audio.mjs` (gera audio/trilha-bruta.wav e beats.json).
// Requer Node 22+ (WebSocket nativo). Variáveis opcionais: CHROME e FFMPEG.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SERVE = path.resolve(ROOT, '..'); // serve a pasta do projeto (o filme pode ler ../assets)
const argv = process.argv.slice(2), args = {};
for (let i = 0; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k] = '1'; else { args[k] = v; i++; } }
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const DRAFT = !!args.draft;
const FPS = Number(args.fps || (DRAFT ? 30 : CONFIG.fps || 60));
const { w: W, h: H } = CONFIG;

// ---------- detecção de ferramentas (com cache, para não gastar minutos procurando a cada projeto) ----------
const CACHE = path.join(os.tmpdir(), 'motion-graphic-ferramentas.json');
const exists = p => { try { return p && fs.statSync(p).isFile(); } catch { return false; } };
const hasX264 = ff => { const r = spawnSync(ff, ['-hide_banner', '-encoders'], { encoding: 'utf8' }); return r.status === 0 && /libx264/.test(r.stdout); };
function globDirs(base, re) { try { return fs.readdirSync(base).filter(d => re.test(d)).sort().reverse().map(d => path.join(base, d)); } catch { return []; } }
function findChrome() {
  if (exists(process.env.CHROME)) return process.env.CHROME;
  const H0 = os.homedir(), LA = process.env.LOCALAPPDATA || '', c = [];
  for (const base of [path.join(LA, 'ms-playwright'), path.join(H0, '.cache', 'ms-playwright'), path.join(H0, 'Library', 'Caches', 'ms-playwright')])
    for (const d of globDirs(base, /^chromium/)) c.push(
      path.join(d, 'chrome-win64', 'chrome.exe'), path.join(d, 'chrome-win', 'chrome.exe'),
      path.join(d, 'chrome-win64', 'headless_shell.exe'), path.join(d, 'chrome-linux', 'chrome'), path.join(d, 'chrome-linux64', 'chrome'),
      path.join(d, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'));
  c.push('C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(LA, 'Google/Chrome/Application/chrome.exe'), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  return c.find(exists);
}
function findFfmpeg() {
  const c = [process.env.FFMPEG];
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['ffmpeg'], { encoding: 'utf8' });
  if (which.status === 0) c.push(...which.stdout.split(/\r?\n/).filter(Boolean));
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  for (let d = ROOT; d !== path.dirname(d); d = path.dirname(d)) c.push(path.join(d, 'node_modules', 'ffmpeg-static', exe));
  for (const d of globDirs(os.tmpdir(), /ffmpeg/i)) c.push(path.join(d, 'node_modules', 'ffmpeg-static', exe), path.join(d, exe));
  return c.find(f => exists(f) && hasX264(f));
}
function tools() {
  try { const t = JSON.parse(fs.readFileSync(CACHE, 'utf8')); if (exists(t.chrome) && exists(t.ffmpeg) && !process.env.CHROME && !process.env.FFMPEG) return t; } catch {}
  const t = { chrome: findChrome(), ffmpeg: findFfmpeg() };
  if (t.chrome && t.ffmpeg) fs.writeFileSync(CACHE, JSON.stringify(t, null, 2));
  return t;
}
const { chrome: CHROME, ffmpeg: FFMPEG } = tools();
if (args.check || !CHROME || !FFMPEG) {
  console.log(`Chrome: ${CHROME || 'NÃO ENCONTRADO (defina CHROME)'}\nffmpeg com libx264: ${FFMPEG || 'NÃO ENCONTRADO (defina FFMPEG; pedir autorização para instalar ffmpeg-static numa pasta temporária)'}\ncache: ${CACHE}`);
  if (!CHROME || !FFMPEG) process.exit(1);
  if (args.check) process.exit(0);
}

// ---------- servidor local e Chrome ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(SERVE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(SERVE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${path.basename(ROOT)}/film.html?render`;

const port = 9300 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-chrome-'));
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, '--headless=new', '--hide-scrollbars', `--window-size=${W},${H}`,
  '--force-device-scale-factor=1', '--no-first-run', '--mute-audio', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 100 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
  if (!target) await sleep(150);
}
if (!target) { chrome.kill(); server.close(); throw new Error('Chrome headless não respondeu'); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') console.error('erro na página:', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') console.error('console da página:', m.params.args.map(a => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expr => {
  const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (m.error) throw new Error(JSON.stringify(m.error));
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails));
  return m.result.result.value;
};
const beatsFile = path.join(ROOT, 'beats.json');
const beats = fs.existsSync(beatsFile) ? JSON.parse(fs.readFileSync(beatsFile, 'utf8')).beats : [];
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, screenWidth: W, screenHeight: H, deviceScaleFactor: 1, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.CONFIG = ${JSON.stringify(CONFIG)}; window.BEATS = ${JSON.stringify(beats)};` });
await send('Page.navigate', { url });
for (let i = 0; i < 300; i++) { if (await evaluate('typeof window.ready') === 'object') break; await sleep(100); }
const info = await evaluate('window.ready');
if (!info) throw new Error('o filme não terminou de carregar (window.ready não foi definido)');
// Caminho padrão: o filme é um canvas (window.ready.canvas = true) e o quadro sai direto dos pixels do canvas.
// É mais rápido e não depende do tamanho da janela headless (que é limitada pela altura do monitor e corta o 9:16).
// Caminho alternativo (filme em HTML/DOM): captura de tela em JPEG. PNG trava com grão e camadas de mistura.
if (!info.canvas) {
  const vh = await evaluate('innerHeight');
  if (vh < H) console.log(`AVISO: a janela headless tem ${vh} px de altura e o filme ${H} px; a captura de tela vai cortar. Use o filme em canvas (padrão do modelo).`);
}
const frame = async t => {
  if (info.canvas) {
    const b64 = await evaluate(`seek(${t}); document.getElementById('c').toDataURL('image/jpeg', ${DRAFT ? 0.85 : 0.97}).split(',')[1]`);
    return Buffer.from(b64, 'base64');
  }
  await evaluate(`seek(${t}); 1`);
  const m = await send('Page.captureScreenshot', { format: 'jpeg', quality: DRAFT ? 85 : 97 });
  return Buffer.from(m.result.data, 'base64');
};

// folha de contato com os tempos dados (a posição de cada quadro sai no console)
async function folha(list, saida, colsMin = 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-folha-')), t0 = Date.now();
  for (let i = 0; i < list.length; i++) fs.writeFileSync(path.join(dir, `b_${String(i).padStart(3, '0')}.jpg`), await frame(list[i]));
  const vertical = H > W, tw = vertical ? 216 : 384, th = Math.round(tw * H / W), cols = colsMin || (vertical ? 8 : 5), rows = Math.ceil(list.length / cols);
  const font = process.platform === 'win32' ? "fontfile='C\\:/Windows/Fonts/arial.ttf':" : '';
  const lbl = `drawtext=${font}text='%{n}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6`;
  fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'b_%03d.jpg'),
    '-vf', `scale=${tw}:${th},${lbl},pad=${tw + 12}:${th + 12}:6:6:#3B3D42,tile=${cols}x${rows}`, '-frames:v', '1', path.resolve(saida)], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`folha: ${path.resolve(saida)} (${list.length} quadros, ${((Date.now() - t0) / 1000).toFixed(1)} s)${r.status === 0 ? '' : ' (ffmpeg falhou)'}`);
  console.log('tempo de cada posição:', list.map((t, i) => `${i}=${t}s`).join(' '));
}

try {
  if (args.eval) {
    console.log(await evaluate(args.eval));
  } else if (args.sheet) {
    // Folha de contato: um quadro logo após cada batida, miniaturas no tamanho de tela de celular.
    const list = beats.length ? beats.filter(b => b < info.dur) : Array.from({ length: Math.ceil(info.dur * 2) }, (_, i) => i / 2);
    await folha(list.map(b => +Math.min(b + 0.15, info.dur - 0.01).toFixed(2)), args.sheet);
  } else if (args.marcos) {
    // Quadros no meio das transições: os defeitos (sobreposição, corte na borda) aparecem durante o movimento, não na batida.
    const m = await evaluate('JSON.stringify(window.MARCOS || null)');
    if (!m || m === 'null') throw new Error('defina window.MARCOS em cenas.js (objeto ou lista com o início de cada cena)');
    const marcos = Object.values(JSON.parse(m)).map(Number).sort((a, c) => a - c), list = [];
    for (const a of marcos) for (const d of [0.25, 0.6, 1.0, 1.6]) if (a + d < info.dur) list.push(+(a + d).toFixed(2));
    await folha(list, args.marcos, 4);
  } else if (args.colisao) {
    // Checagem objetiva: varre o filme a cada 0,1 s e lista intervalos com texto sobre herói, texto sobre texto
    // texto fora da margem segura (6% da largura e da altura) ou herói nítido cortado pela borda. Reprova (código 1) se houver qualquer um.
    const margemX = W * 0.06, margemY = H * 0.06, achados = [];
    const inter = (p, q) => Math.max(0, Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0)) * Math.max(0, Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0));
    const area = p => Math.max(1, (p.x1 - p.x0) * (p.y1 - p.y0));
    const nota = (chave, t) => { const v = achados.findLast(a => a.chave === chave); if (v && t - v.fim < 0.25) v.fim = t; else achados.push({ chave, ini: t, fim: t }); };
    for (let t = 0; t < info.dur; t = +(t + 0.1).toFixed(2)) {
      const cx = JSON.parse(await evaluate(`seek(${t}); JSON.stringify(window.caixas ? window.caixas() : { textos: [], herois: [] })`));
      for (const a of cx.textos) {
        if (a.x0 < margemX - 1 || a.x1 > W - margemX + 1 || a.y0 < margemY - 1 || a.y1 > H - margemY + 1) nota(`margem: "${a.s}"`, t);
        for (const h of cx.herois) if (a.dono !== h.s && inter(a, h) > 0.04 * area(a)) nota(`texto x herói: "${a.s}" sob ${h.s}`, t);
      }
      for (const h of cx.herois) if (!(h.blur > 0.5) && (h.x0 < -2 || h.x1 > W + 2 || h.y0 < -2 || h.y1 > H + 2)) nota(`herói cortado na borda: ${h.s}`, t);
      for (let i = 0; i < cx.textos.length; i++) for (let j = i + 1; j < cx.textos.length; j++) {
        const a = cx.textos[i], c = cx.textos[j]; if (inter(a, c) > 0.08 * Math.min(area(a), area(c))) nota(`texto x texto: "${a.s}" e "${c.s}"`, t);
      }
    }
    if (!achados.length) console.log('colisão: nenhum problema encontrado');
    else { console.log(`colisão: ${achados.length} problema(s)`); for (const a of achados) console.log(`  ${a.ini.toFixed(1)} a ${a.fim.toFixed(1)} s  ${a.chave}`); process.exitCode = 1; }
  } else if (args.stills) {
    fs.mkdirSync(args.dir, { recursive: true });
    for (const s of args.stills.split(',')) fs.writeFileSync(path.join(args.dir, `quadro_${s}.jpg`), await frame(Number(s)));
    console.log('quadros salvos em', args.dir);
  } else {
    const out = path.resolve(ROOT, args.out || `../resultados/${DRAFT ? 'rascunho-' : ''}${CONFIG.saida || 'filme.mp4'}`);
    if (fs.existsSync(out) && !args.force) throw new Error(`já existe: ${out} (use --force 1 só para arquivos deste projeto)`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // 1) áudio: loudnorm em duas passadas para -14 LUFS
    const raw = path.join(ROOT, 'audio', 'trilha-bruta.wav'), norm = path.join(ROOT, 'audio', 'trilha-14lufs.wav');
    const hasAudio = fs.existsSync(raw);
    if (hasAudio) {
      const p1 = spawnSync(FFMPEG, ['-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1:LRA=20:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
      const meas = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf('{'), p1.stderr.lastIndexOf('}') + 1));
      spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af',
        `loudnorm=I=-14:TP=-1:LRA=20:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true`,
        '-ar', '48000', norm], { stdio: 'inherit' });
    }
    // 2) vídeo: H.264 yuv420p CRF 16 (rascunho: veryfast CRF 23)
    const ff = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      ...(hasAudio ? ['-i', norm, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
      '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'slow', '-crf', DRAFT ? '23' : '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-movflags', '+faststart', '-f', 'mp4', out + '.parcial'], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    const total = Math.round(info.dur * FPS), t0 = Date.now();
    for (let i = 0; i < total; i++) {
      const buf = await frame(i / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i === 30) { const est = (Date.now() - t0) / 31 * total / 1000; console.log(`estimativa: ${est.toFixed(0)} s para ${total} quadros`); if (est > 600) console.log('AVISO: render lento; procure camada cara (blur grande, mix-blend-mode, imagem enorme) antes de seguir.'); }
      if (i % 60 === 0) process.stdout.write(`\rquadro ${i}/${total}`);
    }
    ff.stdin.end();
    const code = await done;
    console.log(`\nffmpeg terminou com código ${code} em ${((Date.now() - t0) / 1000).toFixed(0)} s; arquivo: ${out}`);
    // o MP4 só aparece com o nome final quando está completo (um arquivo em gravação não abre no player)
    if (code === 0) fs.renameSync(out + '.parcial', out); else process.exitCode = 1;
  }
} finally {
  ws.close(); chrome.kill(); server.close();
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }, 500);
}
