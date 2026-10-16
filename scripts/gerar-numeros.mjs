// Reescreve em index.html os números da oficina a partir de scripts/dados-oficina.mjs (idempotente).
// Uso: node scripts/gerar-numeros.mjs [--conferir]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NUMEROS, NOTA_NUMERO, AVALIACOES_NUMERO, ANOS_NUMERO } from './dados-oficina.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'index.html');
const conferir = process.argv.includes('--conferir');
const antes = fs.readFileSync(f, 'utf8');
let n = 0;
let depois = antes.replace(/(<(?:span|b|strong)[^>]*\bdata-num="(nota|avaliacoes|anos)"[^>]*>)([^<]*)(<\/(?:span|b|strong)>)/g, (m, abre, chave, atual, fecha) => {
  n++;
  return abre + NUMEROS[chave] + fecha;
});
// contadores animados e selos
depois = depois
  .replace(/data-target="[\d.]+" data-decimals="1"/g, () => { n++; return `data-target="${NOTA_NUMERO}" data-decimals="1"`; })
  .replace(/data-target="\d+"(?=>0<\/span>\s*\n\s*<span class="counter-label">Avaliações)/g, () => { n++; return `data-target="${AVALIACOES_NUMERO}"`; })
  .replace(/data-target="\d+"(?=>0<\/span>\s*\n\s*<span class="counter-label">Anos)/g, () => { n++; return `data-target="${ANOS_NUMERO}"`; })
  .replace(/data-circular-text="OFICINA PREMIUM • TAUBATÉ • \+\d+ ANOS • "/g, () => { n++; return `data-circular-text="OFICINA PREMIUM • TAUBATÉ • +${NUMEROS.anos} ANOS • "`; })
  .replace(/<body data-nota="[^"]*" data-avaliacoes="[^"]*" data-anos="[^"]*">/, () => { n++; return `<body data-nota="${NUMEROS.nota}" data-avaliacoes="${NUMEROS.avaliacoes}" data-anos="${NUMEROS.anos}">`; });
if (n < 20) throw new Error('poucos pontos encontrados (' + n + '): a marcação data-num do index.html mudou?');
const mudou = depois !== antes;
if (mudou && !conferir) fs.writeFileSync(f, depois);
console.log(`${n} pontos com números da oficina ${conferir ? (mudou ? 'DIFERENTES da tabela' : 'iguais à tabela') : (mudou ? 'reescritos' : 'já estavam certos')}: nota ${NUMEROS.nota}, +${NUMEROS.avaliacoes} avaliações, +${NUMEROS.anos} anos`);
if (conferir && mudou) process.exit(1);
