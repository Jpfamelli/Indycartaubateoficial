// Monta dist/ só com o que vai para o ar (o netlify-cli ignora o .netlifyignore no deploy por pasta).
// Uso: npm run publicar  ->  npx netlify-cli deploy --prod --dir dist
// Rodada 5: styles.css e script.js vão MINIFICADOS (esbuild) e o HTML passa a chamá-los com ?v=<hash do conteúdo>,
// o que permite o cache de um ano do netlify.toml (/*.css e /*.js immutable) sem risco de ficar desatualizado.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const NAO = new Set(['oficina-2.png', 'oficina-fachada.png']); // rodada 7: o PNG da fachada (483 KB) não é chamado por página nenhuma
const PERMITIDO = /\.(html|css|js|png|jpg|webp|avif|svg|txt|xml|webmanifest)$/;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
const copiados = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isFile() && PERMITIDO.test(d.name) && !NAO.has(d.name) && !d.name.startsWith('.') && !d.name.startsWith('qa-'))
  .map(d => { fs.copyFileSync(path.join(ROOT, d.name), path.join(DIST, d.name)); return d.name; });
// Pastas que vão inteiras (rodada 4: fontes no próprio site).
const PASTAS = { fontes: /\.woff2$/ };
for (const [pasta, tipo] of Object.entries(PASTAS)) {
  fs.mkdirSync(path.join(DIST, pasta));
  const arquivos = fs.readdirSync(path.join(ROOT, pasta)).filter(n => tipo.test(n));
  if (!arquivos.length) { console.error('pasta vazia: ' + pasta); process.exit(1); }
  for (const n of arquivos) { fs.copyFileSync(path.join(ROOT, pasta, n), path.join(DIST, pasta, n)); copiados.push(pasta + '/' + n); }
}
for (const f of ['index.html', '404.html', 'privacidade.html', 'robots.txt', 'sitemap.xml', 'script.js', '404.js', 'styles.css', '404.css', 'privacidade.css', 'sem-js.css', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png']) {
  if (!copiados.includes(f)) { console.error('faltou ' + f); process.exit(1); }
}

// Minifica CSS e JS no dist/ (os fontes continuam legíveis na pasta) e versiona os links no HTML.
const tamanhos = [];
const versao = {};
for (const [arquivo, loader] of [['styles.css', 'css'], ['script.js', 'js']]) {
  const fonte = fs.readFileSync(path.join(ROOT, arquivo), 'utf8');
  const { code } = transformSync(fonte, { loader, minify: true, charset: 'utf8', legalComments: 'none', target: ['es2018'] });
  fs.writeFileSync(path.join(DIST, arquivo), code);
  versao[arquivo] = crypto.createHash('sha256').update(code).digest('hex').slice(0, 10);
  tamanhos.push(`${arquivo} ${Math.round(fonte.length / 1024)} → ${Math.round(code.length / 1024)} KB`);
}
const html = path.join(DIST, 'index.html');
let h = fs.readFileSync(html, 'utf8');
h = h.replace('href="styles.css"', `href="styles.css?v=${versao['styles.css']}"`).replace('src="script.js"', `src="script.js?v=${versao['script.js']}"`);
if (!h.includes('styles.css?v=') || !h.includes('script.js?v=')) { console.error('não achei os links de styles.css/script.js no index.html'); process.exit(1); }

// Rodada 7: HTML enxuto no ar (sem comentários nem indentação); o fonte continua legível na pasta.
// Só tira o que o navegador ignora: comentários e espaço no começo/fim das linhas (a quebra de linha fica, então o texto não gruda).
function enxugarHtml(texto) {
  return texto.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/^[ \t]+/gm, '').replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n');
}
const antes = h.length;
h = enxugarHtml(h);
fs.writeFileSync(html, h);
tamanhos.push(`index.html ${Math.round(antes / 1024)} → ${Math.round(h.length / 1024)} KB`);
// Rodada 10: os estilos das páginas pequenas saíram do <style> embutido (CSP sem 'unsafe-inline'): vão minificados e com ?v=<hash>,
// porque o netlify.toml deixa todo /*.css em cache de um ano.
const cssPequeno = {};
for (const arquivo of ['404.css', 'privacidade.css', 'sem-js.css']) {
  const { code } = transformSync(fs.readFileSync(path.join(ROOT, arquivo), 'utf8'), { loader: 'css', minify: true, charset: 'utf8', legalComments: 'none' });
  fs.writeFileSync(path.join(DIST, arquivo), code);
  cssPequeno[arquivo] = crypto.createHash('sha256').update(code).digest('hex').slice(0, 10);
}
{
  const h2 = fs.readFileSync(html, 'utf8');
  if (!h2.includes('href="sem-js.css"')) { console.error('não achei o link de sem-js.css no index.html'); process.exit(1); }
  fs.writeFileSync(html, h2.replace('href="sem-js.css"', 'href="sem-js.css?v=' + cssPequeno['sem-js.css'] + '"'));
}
// 404.js também vai com ?v=<hash> (o netlify.toml deixa todo /*.js em cache de um ano)
const js404 = crypto.createHash('sha256').update(fs.readFileSync(path.join(DIST, '404.js'))).digest('hex').slice(0, 10);
for (const extra of ['404.html', 'privacidade.html']) {
  const p = path.join(DIST, extra);
  let t = enxugarHtml(fs.readFileSync(p, 'utf8'));
  if (extra === '404.html') t = t.replace('src="/404.js"', 'src="/404.js?v=' + js404 + '"');
  const css = extra.replace('.html', '.css');
  if (!t.includes('href="/' + css + '"')) { console.error('não achei o link de ' + css + ' em ' + extra); process.exit(1); }
  t = t.replace('href="/' + css + '"', 'href="/' + css + '?v=' + cssPequeno[css] + '"');
  fs.writeFileSync(p, t);
}

// sitemap com a data do dia da publicação (lastmod nunca fica velho)
const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const sm = path.join(DIST, 'sitemap.xml');
fs.writeFileSync(sm, fs.readFileSync(sm, 'utf8').replace(/<lastmod>[^<]*<\/lastmod>/g, '<lastmod>' + hoje + '</lastmod>'));

// Orçamento de peso (rodada 7): falha o publicar se a página engordar sem querer. Valores em bytes, depois da minificação.
const ORCAMENTO = { 'index.html': 96 * 1024, 'styles.css': 92 * 1024, 'script.js': 66 * 1024 }; // rodada 10: script.js de 64 para 66 KB (avisos de rede ruim e fila sem pedido em dobro)
const estouros = Object.entries(ORCAMENTO).filter(([f, max]) => fs.statSync(path.join(DIST, f)).size > max);
if (estouros.length) { console.error('acima do orçamento de peso: ' + estouros.map(([f, max]) => `${f} ${fs.statSync(path.join(DIST, f)).size} > ${max}`).join('; ')); process.exit(1); }

console.log('dist/ pronto com ' + copiados.length + ' arquivos (' + tamanhos.join('; ') + '): ' + copiados.join(', '));
