#!/usr/bin/env node
// Instala a skill no Claude Code. Rodar de novo atualiza. Sem dependências: só Node.
//   npx github:<dono>/<repositório>             para todos os projetos (~/.claude/skills/<nome>)
//   npx github:<dono>/<repositório> --projeto   só no projeto atual (./.claude/skills/<nome>)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { name: NOME, version: VERSAO } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
const ITENS = ['SKILL.md', 'modelos', 'referencias', 'ferramentas', 'README.md', 'CHANGELOG.md', 'LICENSE'];
const args = process.argv.slice(2), i = args.indexOf('--destino'); // --destino <pasta>: para testes

const base = i >= 0 ? path.resolve(args[i + 1]) : args.includes('--projeto') ? path.join(process.cwd(), '.claude', 'skills') : path.join(os.homedir(), '.claude', 'skills');
const destino = path.join(base, NOME);

// Só substitui uma pasta que seja desta mesma skill.
let acao = 'Instalada';
if (fs.existsSync(destino)) {
  const skill = path.join(destino, 'SKILL.md');
  if (!fs.existsSync(skill) || !new RegExp(`^name:\\s*${NOME}\\s*$`, 'm').test(fs.readFileSync(skill, 'utf8'))) {
    console.error(`\nA pasta ${destino} já existe e não é da skill ${NOME}. Nada foi alterado.\n`); process.exit(1);
  }
  for (const item of fs.readdirSync(destino)) fs.rmSync(path.join(destino, item), { recursive: true, force: true });
  acao = 'Atualizada';
}
fs.mkdirSync(destino, { recursive: true });
for (const item of ITENS) if (fs.existsSync(path.join(RAIZ, item))) fs.cpSync(path.join(RAIZ, item), path.join(destino, item), { recursive: true });

console.log(`\n✓ ${NOME} ${VERSAO} ${acao.toLowerCase()} em ${destino}\n
Agora abra (ou reinicie) o Claude Code e peça o vídeo com as suas palavras.
Para atualizar, rode o mesmo comando de novo.\n`);
