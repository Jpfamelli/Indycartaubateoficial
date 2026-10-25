// Teste da rodada 7 (25/10/2026) — `npm test` roda este arquivo depois do qa.mjs.
// Mesmo método do qa.mjs: servidor local com os cabeçalhos do netlify.toml, Chrome instalado (puppeteer-core), fetch falso
// da Edge Function (nada vai para o banco). Novidade: o servidor também APLICA os redirecionamentos do netlify.toml com a
// regra da Netlify (a query string só é repassada quando o destino não tem "?"), então /s/freios?utm_source=meta é
// testado de ponta a ponta no navegador.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { lote2 } from './qa-r7-lote2.mjs';
import { lote3 } from './qa-r7-lote3.mjs';
import { lote4 } from './qa-r7-lote4.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa-out');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const TOML = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  FALHOU ') + msg); if (!cond) falhas++; };

/* ---------- netlify.toml: cabeçalhos e redirecionamentos ---------- */
function cabecalhos() {
  const bloco = TOML.split('[[headers]]').find(b => b.includes('for = "/*"')) || '';
  const saida = {};
  for (const linha of bloco.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z-]+) = "(.*)"\s*$/.exec(linha);
    if (m && m[1] !== 'for') saida[m[1]] = m[2];
  }
  return saida;
}
const CABECALHOS = cabecalhos();
export const REDIRECTS = TOML.split('[[redirects]]').slice(1).map(b => {
  const g = (k) => (new RegExp('^\\s*' + k + ' = "(.*)"\\s*$', 'm').exec(b) || [])[1];
  return { from: g('from'), to: g('to'), status: Number((/status = (\d+)/.exec(b) || [])[1] || 301) };
}).filter(r => r.from && r.from.startsWith('/'));
/** A regra da Netlify: placeholders (:nome e /*) viram :splat/:nome no destino; a query original só é repassada se o destino não tem "?". */
function aplicarRedirect(caminho, query) {
  for (const r of REDIRECTS) {
    const nomes = [];
    const re = new RegExp('^' + r.from.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\/\*$/, '(?:/(.*))?').replace(/:([a-z]+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; }) + '$');
    const m = re.exec(caminho);
    if (!m) continue;
    let to = r.to;
    nomes.forEach((n, i) => { to = to.replace(':' + n, m[i + 1]); });
    if (r.from.endsWith('/*')) to = to.replace(':splat', m[m.length - 1] || '');
    if (query && !to.includes('?')) { const [base, hash] = to.split('#'); to = base + '?' + query + (hash !== undefined ? '#' + hash : ''); }
    return { status: r.status, to };
  }
  return null;
}

/* ---------- servidor local ---------- */
const server = http.createServer((req, res) => {
  const [rota, query = ''] = req.url.split('?');
  const url = decodeURIComponent(rota);
  const f = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory() || !f.startsWith(ROOT)) {
    const r = aplicarRedirect(rota, query);
    if (r && !r.to.startsWith('http')) { res.writeHead(r.status, { location: r.to }); return res.end(); }
    res.writeHead(404, { 'content-type': TIPOS['.html'], ...CABECALHOS }); return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', ...CABECALHOS });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = (process.env.QA_URL || 'http://127.0.0.1:' + server.address().port).replace(/\/$/, '');
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 240000, args: ['--no-first-run', '--no-default-browser-check'] });

// Resposta falsa da Edge Function: horários e envio.
const FETCH_FALSO = `window.__envios = []; window.fetch = async (url, opts) => { if (String(url).endsWith('/horarios')) { window.__horariosPedidos = (window.__horariosPedidos | 0) + 1; return { ok: true, status: 200, json: async () => ({ ok: true, atualizado_em: '2026-10-26T15:00:00.000Z', dias: window.__dias || [{ data: '2026-10-26', rotulo: 'hoje', horas: ['08:00', '10:00', '12:00', '14:00'] }, { data: '2026-10-27', rotulo: 'amanhã', horas: ['08:00', '10:00'] }] }) }; } window.__envios.push({ url: String(url), body: JSON.parse(opts.body) }); if (window.__fetchFalha) throw new TypeError('rede'); return { ok: true, status: 200, json: async () => ({ ok: true, protocolo: 'QA1234', mensagem: 'Pedido enviado, Teste! (resposta de teste)' }) }; };`;

async function abrir(largura, altura, url = BASE + '/', { promo = true, antes = null } = {}) {
  const page = await browser.newPage();
  const erros = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await page.evaluateOnNewDocument((promo) => {
    window.__csp = [];
    if (promo) { try { sessionStorage.setItem('indycar_promo', '1'); } catch (_) {} }
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline')));
  }, promo);
  await page.evaluateOnNewDocument(FETCH_FALSO);
  if (antes) await page.evaluateOnNewDocument(antes);
  await page.setViewport({ width: largura, height: altura, isMobile: largura < 768, hasTouch: largura < 768 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  return { page, erros };
}
const espera = (ms) => new Promise(r => setTimeout(r, ms));

/* ================================================================
   LOTE 1 — atalhos que não perdem a campanha (pedido aberto da rodada 6)
   ================================================================ */
console.log('\n== atalhos /s/<serviço>, /agendar e /orcamento mantêm utm_* (rodada 7) ==');
{
  const a = aplicarRedirect('/s/freios', 'utm_source=meta&utm_campaign=revisao&gclid=abc');
  ok(a && a.to === '/?utm_source=meta&utm_campaign=revisao&gclid=abc#agendar-freios', '/s/freios?utm_… → query intacta e #agendar-freios (' + (a && a.to) + ')');
  const b = aplicarRedirect('/agendar', 'utm_source=google&utm_medium=cpc');
  ok(b && b.to === '/?utm_source=google&utm_medium=cpc#agendar', '/agendar?utm_… mantém a campanha (' + (b && b.to) + ')');
  const c = aplicarRedirect('/orcamento', 'fbclid=xyz');
  ok(c && c.to === '/?fbclid=xyz#agendar-diagnostico', '/orcamento?fbclid=… mantém o clique (' + (c && c.to) + ')');
  const d = aplicarRedirect('/s/cambio', '');
  ok(d && d.to === '/#agendar-cambio', '/s/cambio sem campanha continua simples (' + (d && d.to) + ')');
  const internos = REDIRECTS.filter(r => r.to.startsWith('/'));
  const perdem = internos.filter(r => r.to.includes('?')).map(r => r.from);
  ok(internos.length >= 8 && perdem.length === 0, 'nenhum redirecionamento interno do netlify.toml tem "?" no destino (a Netlify descartaria a query): ' + (perdem.join(', ') || 'ok'));
  const patio = REDIRECTS.filter(r => r.to.startsWith('https://indycar-patio.netlify.app') && !/^\/(a|m)\//.test(r.from)); // /a/ e /m/ montam o ?t= / ?c= de propósito
  ok(patio.length >= 5 && patio.every(r => !r.to.includes('?')), '/acompanhar, /minha e /indicar levam a query adiante (o link com ?t= do Pátio não se perde)');
}
for (const [w, h] of [[375, 812], [1440, 900]]) {
  const { page, erros } = await abrir(w, h, BASE + '/s/freios?utm_source=meta&utm_campaign=revisao&gclid=abc123');
  await espera(900);
  const est = await page.evaluate(() => ({
    aberto: document.getElementById('formBackdrop').classList.contains('open'),
    servico: document.getElementById('fService').selectedOptions[0]?.dataset.codigo || '',
    foco: document.activeElement?.id,
    url: location.pathname + location.search + location.hash,
    utm: JSON.parse(sessionStorage.getItem('indycar_utm') || '{}'),
    cvOff: document.documentElement.classList.contains('cv-off'),
    wa: [...document.querySelectorAll('a[href*="wa.me"]')].filter(a => /--meta\)/.test(decodeURIComponent(a.href))).length,
  }));
  ok(est.aberto && est.servico === 'freios' && est.foco === 'fName', `[${w}] /s/freios?utm_… abre o formulário com "freios" escolhido e o foco no nome`);
  ok(est.utm.source === 'meta' && est.utm.campaign === 'revisao' && est.utm.gclid === 'abc123', `[${w}] campanha (utm_source, utm_campaign, gclid) guardada na sessão depois do /s/`);
  ok(est.wa >= 20, `[${w}] links de WhatsApp levam a fonte no código (site/…--meta): ${est.wa}`);
  ok(est.url === '/', `[${w}] o endereço fica limpo depois (${est.url})`);
  ok(!est.cvOff, `[${w}] #agendar não liga o modo sem content-visibility (a página abre leve)`);
  await page.evaluate(() => { document.getElementById('fName').value = 'Maria Teste'; document.getElementById('fPhone').value = '(12) 99683-0272'; });
  ok(erros.length === 0, `[${w}] sem erro de console` + (erros.length ? ': ' + erros[0] : ''));
  await page.close();
}
{
  const { page } = await abrir(375, 812, BASE + '/s/servico-que-nao-existe?utm_source=ig');
  await espera(900);
  const est = await page.evaluate(() => ({ aberto: document.getElementById('formBackdrop').classList.contains('open'), servico: document.getElementById('fService').selectedOptions[0]?.dataset.codigo || '' }));
  ok(est.aberto && est.servico === 'diagnostico', '/s/<serviço que não existe> abre o formulário com o diagnóstico gratuito (nunca vazio)');
  await page.close();
}
{
  const { page } = await abrir(375, 812, BASE + '/agendar?utm_source=google&utm_medium=cpc');
  await espera(900);
  const est = await page.evaluate(() => ({ aberto: document.getElementById('formBackdrop').classList.contains('open'), servico: document.getElementById('fService').value, utm: JSON.parse(sessionStorage.getItem('indycar_utm') || '{}') }));
  ok(est.aberto && est.servico === '' || est.aberto && /diagn/i.test(est.servico), '/agendar?utm_… abre o formulário');
  ok(est.utm.source === 'google' && est.utm.medium === 'cpc', '/agendar guarda utm_source e utm_medium');
  await page.close();
}
{
  // o endereço antigo (?servico=…&abrir=form, links já enviados no WhatsApp) segue funcionando
  const { page } = await abrir(375, 812, BASE + '/?servico=cambio&abrir=form');
  await espera(1000);
  const est = await page.evaluate(() => ({ aberto: document.getElementById('formBackdrop').classList.contains('open'), servico: document.getElementById('fService').selectedOptions[0]?.dataset.codigo || '' }));
  ok(est.aberto && est.servico === 'cambio', 'links antigos /?servico=cambio&abrir=form continuam abrindo o formulário');
  await page.close();
}

/* ================================================================
   Âncoras: o endereço com #contato, #faq... cai no lugar certo
   ================================================================ */
console.log('\n== entrada por âncora (rodada 7) ==');
for (const [w, h] of [[375, 812], [1440, 900]]) {
  for (const alvo of ['contato', 'faq', 'garantia', 'horarios']) {
    const { page } = await abrir(w, h, BASE + '/#' + alvo);
    await espera(2200);
    const topo = await page.evaluate(a => Math.round(document.getElementById(a).getBoundingClientRect().top), alvo);
    ok(topo >= 60 && topo <= 100, `[${w}] endereço com #${alvo} fica com o título logo abaixo do menu (topo ${topo}px)`);
    await page.close();
  }
}

await lote2({ abrir, ok, espera, BASE });
await lote3({ abrir, ok, espera, BASE, aplicarRedirect, ROOT, browser });
await lote4({ abrir, ok, espera, BASE, aplicarRedirect, ROOT });

await browser.close();
server.close();
console.log(falhas ? `\n${falhas} falha(s) (rodada 7).` : '\nrodada 7: tudo certo.');
process.exit(falhas ? 1 : 0);
