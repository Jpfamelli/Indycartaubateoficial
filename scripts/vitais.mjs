// Core Web Vitals com o Lighthouse (rodada 5) — `npm run vitais` (local, sobre dist/) ou `npm run vitais -- --prod` (no ar).
// Celular e computador; falha se alguma nota ficar abaixo de 95. Relatórios JSON em qa-out/lighthouse-*.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa-out');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROD = process.argv.includes('--prod');
const MINIMO = Number(process.env.VITAIS_MINIMO || 95);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
fs.mkdirSync(OUT, { recursive: true });

let base = 'https://indycar-taubate.netlify.app', server = null;
if (!PROD) {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'publicar.mjs')], { stdio: 'ignore' }); // mede o que vai para o ar (minificado)
  const DIST = path.join(ROOT, 'dist');
  server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let f = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', 'cache-control': 'public, max-age=31536000' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
}

let falhou = false;
for (const modo of ['celular', 'computador']) {
  const saida = path.join(OUT, `lighthouse-${modo}.json`);
  const args = ['--yes', 'lighthouse', base + '/', '--output=json', '--output-path=' + saida, '--quiet', '--chrome-flags=--headless --disable-gpu --no-sandbox',
    '--only-categories=performance,accessibility,best-practices,seo'];
  if (modo === 'computador') args.push('--preset=desktop');
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { stdio: 'inherit', env: { ...process.env, CHROME_PATH: CHROME }, shell: process.platform === 'win32' });
  const r = JSON.parse(fs.readFileSync(saida, 'utf8'));
  if (r.runtimeError) { console.log(`${modo}: erro do Lighthouse ${r.runtimeError.code}`); falhou = true; continue; }
  const notas = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round((v.score || 0) * 100)]));
  const a = id => r.audits[id]?.displayValue || '-';
  console.log(`${modo} (${PROD ? 'produção' : 'local, dist/'}): desempenho ${notas.performance} · acessibilidade ${notas.accessibility} · boas práticas ${notas['best-practices']} · SEO ${notas.seo} | FCP ${a('first-contentful-paint')} · LCP ${a('largest-contentful-paint')} · TBT ${a('total-blocking-time')} · CLS ${a('cumulative-layout-shift')} · SI ${a('speed-index')}`);
  const baixas = Object.entries(notas).filter(([, n]) => n < MINIMO);
  if (baixas.length) {
    falhou = true;
    console.log(`  abaixo de ${MINIMO}: ` + baixas.map(([k, n]) => k + ' ' + n).join(', '));
    const audits = Object.values(r.audits).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable').slice(0, 12);
    for (const x of audits) console.log(`  - ${x.id}: ${x.displayValue || ''} ${x.title}`);
  }
}
if (server) server.close();
process.exit(falhou ? 1 : 0);
