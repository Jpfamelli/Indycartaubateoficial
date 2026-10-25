// Acha (e, com --remover, tira) regras de CSS cuja classe ou id não existe em nenhum lugar do site
// (index.html, 404.html, privacidade.html, script.js). Rodada 7. Uso:
//   node scripts/css-morto.mjs            -> só lista
//   node scripts/css-morto.mjs --remover  -> reescreve styles.css sem elas
// Regra conservadora: um nome conta como "existe" se aparece como texto em qualquer um dos arquivos (cobre classes montadas
// por script). Seletores com vários itens perdem só os itens mortos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fonte = ['index.html', '404.html', 'privacidade.html', 'script.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

const existe = (nome) => fonte.includes(nome);
function seletorMorto(sel) {
  // tira o que está entre colchetes e parênteses (não são nomes de classe)
  const limpo = sel.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '');
  const nomes = [...limpo.matchAll(/[.#]([A-Za-z_][\w-]*)/g)].map(m => m[1]);
  return nomes.some(n => !existe(n));
}

/** Percorre o CSS em blocos; devolve { saida, removidas: [] }. */
function processar(texto) {
  let i = 0, saida = '';
  const removidas = [];
  while (i < texto.length) {
    // comentário
    if (texto.startsWith('/*', i)) { const f = texto.indexOf('*/', i + 2); const fim = f < 0 ? texto.length : f + 2; saida += texto.slice(i, fim); i = fim; continue; }
    const ab = texto.indexOf('{', i);
    const pv = texto.indexOf(';', i);
    if (ab < 0) { saida += texto.slice(i); break; }
    if (pv >= 0 && pv < ab && !texto.slice(i, pv).includes('{')) { saida += texto.slice(i, pv + 1); i = pv + 1; continue; } // @import; etc.
    // acha o fecha-chaves correspondente
    let prof = 1, j = ab + 1;
    while (j < texto.length && prof > 0) {
      if (texto.startsWith('/*', j)) { const f = texto.indexOf('*/', j + 2); j = f < 0 ? texto.length : f + 2; continue; }
      const c = texto[j];
      if (c === '"' || c === "'") { const q = c; j++; while (j < texto.length && texto[j] !== q) { if (texto[j] === '\\') j++; j++; } j++; continue; }
      if (c === '{') prof++; else if (c === '}') prof--;
      j++;
    }
    const cabeca = texto.slice(i, ab);
    const corpo = texto.slice(ab + 1, j - 1);
    const prefixo = cabeca.match(/^\s*/)[0];
    const sel = cabeca.trim();
    if (sel.startsWith('@media') || sel.startsWith('@supports') || sel.startsWith('@layer')) {
      const interno = processar(corpo);
      removidas.push(...interno.removidas);
      if (interno.saida.trim()) saida += prefixo + sel + ' {' + interno.saida + '}'; else removidas.push('(bloco vazio) ' + sel);
    } else if (sel.startsWith('@')) {
      saida += texto.slice(i, j); // @keyframes, @font-face: ficam
    } else {
      const itens = sel.replace(/\/\*[\s\S]*?\*\//g, '').split(',').map(s => s.trim());
      const vivos = itens.filter(s => !seletorMorto(s));
      if (vivos.length === itens.length) saida += texto.slice(i, j);
      else {
        removidas.push(itens.filter(s => seletorMorto(s)).join(', '));
        if (vivos.length) saida += prefixo + vivos.join(', ') + ' {' + corpo + '}';
      }
    }
    i = j;
  }
  return { saida, removidas };
}

const { saida, removidas } = processar(css);
console.log(`${removidas.length} regra(s)/seletor(es) sem uso; styles.css ${css.length} -> ${saida.length} bytes (-${css.length - saida.length})`);
if (!process.argv.includes('--silencioso')) removidas.slice(0, 80).forEach(r => console.log('  - ' + r.slice(0, 110)));
if (process.argv.includes('--remover')) { fs.writeFileSync(path.join(ROOT, 'styles.css'), saida); console.log('styles.css reescrito.'); }
process.exit(process.argv.includes('--falhar') && removidas.length ? 1 : 0);
