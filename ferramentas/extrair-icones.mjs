// Extrai os traçados dos ícones que o produto usa (Lucide e Phosphor) direto do node_modules do produto, para o filme
// desenhar os mesmos ícones em Path2D. Gera um icones.js (window.ICONES) para a pasta fonte do filme.
// Uso:
//   node extrair-icones.mjs --nm <produto>/node_modules --lucide check,bell,search --phosphor House,ChartBar --saida <projeto>/fonte/icones.js
// Os nomes do Lucide são os dos arquivos (kebab-case); os do Phosphor, os dos componentes (PascalCase).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2), args = {};
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
if (!args.nm || !args.saida) { console.error('uso: node extrair-icones.mjs --nm <node_modules> --lucide a,b --phosphor A,B --saida <arquivo>'); process.exit(1); }
const NM = path.resolve(args.nm);
const LUCIDE = (args.lucide || '').split(',').filter(Boolean);
const PHOSPHOR = (args.phosphor || '').split(',').filter(Boolean);

// Converte cada elemento SVG do Lucide (viewBox 24, traço 2) em string de path.
function toD([tag, a]) {
  const n = k => Number(a[k] ?? 0);
  switch (tag) {
    case 'path': return a.d;
    case 'circle': { const cx = n('cx'), cy = n('cy'), r = n('r'); return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`; }
    case 'ellipse': { const cx = n('cx'), cy = n('cy'), rx = n('rx'), ry = n('ry'); return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`; }
    case 'line': return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    case 'polyline': return 'M' + a.points.trim().split(/\s+/).join('L');
    case 'polygon': return 'M' + a.points.trim().split(/\s+/).join('L') + 'Z';
    case 'rect': {
      const x = n('x'), y = n('y'), w = n('width'), h = n('height'), r = Math.min(n('rx') || n('ry'), w / 2, h / 2);
      if (!r) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
    }
  }
  throw new Error('elemento não tratado: ' + tag);
}

const out = { lucide: {}, phosphor: {} };
for (const name of LUCIDE) {
  const file = path.join(NM, 'lucide-react/dist/esm/icons', `${name}.js`);
  if (!fs.existsSync(file)) { console.error('Lucide sem arquivo:', name); continue; }
  const mod = await import(pathToFileURL(file));
  out.lucide[name] = mod.__iconNode.map(toD);
}
function collect(el, acc) {
  if (!el || typeof el !== 'object') return acc;
  if (Array.isArray(el)) { el.forEach(e => collect(e, acc)); return acc; }
  if (el.props?.d) acc.push(el.props.d);
  collect(el.props?.children, acc);
  return acc;
}
for (const name of PHOSPHOR) {
  const file = path.join(NM, '@phosphor-icons/react/dist/defs', `${name}.es.js`);
  if (!fs.existsSync(file)) { console.error('Phosphor sem arquivo:', name); continue; }
  const mod = await import(pathToFileURL(file));
  const map = mod.default;
  out.phosphor[name] = collect(map.get('regular'), []);
}
fs.mkdirSync(path.dirname(path.resolve(args.saida)), { recursive: true });
fs.writeFileSync(path.resolve(args.saida), '// Gerado por extrair-icones.mjs: traçados originais do Lucide (viewBox 24, traço 2) e do Phosphor regular (viewBox 256, preenchido).\nwindow.ICONES = ' + JSON.stringify(out) + ';\n');
console.log(`Lucide: ${Object.keys(out.lucide).length} · Phosphor: ${Object.keys(out.phosphor).length}`);
