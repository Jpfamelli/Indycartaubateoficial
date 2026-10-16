// Reescreve todos os links wa.me do index.html e do 404.html a partir de scripts/mensagens-whatsapp.mjs.
// Idempotente: rodar duas vezes não muda nada. Uso: node scripts/gerar-whatsapp.mjs [--conferir]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { link, MENSAGENS } from './mensagens-whatsapp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conferir = process.argv.includes('--conferir');
let mudou = 0, total = 0;
const usados = new Set();
for (const arquivo of ['index.html', '404.html']) {
  const f = path.join(ROOT, arquivo);
  const antes = fs.readFileSync(f, 'utf8');
  const depois = antes.replace(/href="https:\/\/wa\.me\/[^"]*"/g, (m) => {
    total++;
    const href = m.slice(6, -1).replace(/&amp;/g, '&');
    const codigo = /\(site\/([a-z0-9_-]+)\)/.exec(decodeURIComponent(href))?.[1] || new URL(href).searchParams.get('utm_campaign');
    if (codigo && /^formulario/.test(codigo)) return m; // o script.js monta este texto na hora
    if (!codigo || !MENSAGENS[codigo]) throw new Error(arquivo + ': link sem código conhecido: ' + href.slice(0, 80));
    usados.add(codigo);
    const novo = 'href="' + link(codigo).replace(/&/g, '&amp;') + '"';
    if (novo !== m) mudou++;
    return novo;
  });
  if (depois !== antes && !conferir) fs.writeFileSync(f, depois);
}
const semUso = Object.keys(MENSAGENS).filter((c) => !usados.has(c) && !['atalho', 'area-cliente'].includes(c));
console.log(`${total} links de WhatsApp conferidos, ${mudou} ${conferir ? 'fora da tabela' : 'reescritos'}` + (semUso.length ? `; códigos da tabela sem uso no HTML: ${semUso.join(', ')}` : ''));
if (conferir && mudou) process.exit(1);
