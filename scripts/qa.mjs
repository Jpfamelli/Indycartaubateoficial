// Teste automático do site (headless) — `npm test`
// Sobe um servidor estático local, abre no Chrome instalado (puppeteer-core)
// em 375 px e 1440 px e confere: sem rolagem horizontal, sem erro de console,
// links de WhatsApp válidos (número, mensagem com código de origem e UTM),
// JSON-LD válido e FAQ em sincronia, imagens com dimensões, mapa sob demanda,
// validação do formulário, vocabulário proibido e páginas extras (privacidade, 404).
// Capturas vão para qa-out/ (fora do git e do deploy).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa-out');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PHONE = '5512996830272';
const PROIBIDAS = [/\bprezad[oa]s?\b/i, /\befetu(ar|e|ou)\b/i, /\bcomparec(er|a)\b/i, /\bve[ií]culos?\b/i, /\b10x\b/i, /leva e traz gr[aá]tis/i];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  FALHOU ') + msg); if (!cond) falhas++; };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, { 'content-type': TIPOS['.html'] }); return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = (process.env.QA_URL || 'http://127.0.0.1:' + server.address().port).replace(/\/$/, ''); // QA_URL=https://... testa produção
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });

async function abrir(largura, altura, url = BASE + '/') {
  const page = await browser.newPage();
  const erros = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('requestfailed', r => { if (r.url().startsWith(BASE)) erros.push('falhou: ' + r.url()); });
  await page.evaluateOnNewDocument(() => {
    window.__cls = 0; window.__lcp = 0;
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { const e = l.getEntries().pop(); if (e) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}
  });
  await page.setViewport({ width: largura, height: altura, isMobile: largura < 768, hasTouch: largura < 768 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  return { page, erros };
}

async function rolarTudo(page) {
  await page.evaluate(async () => {
    const passo = innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += passo) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, 0);
  });
}

for (const [w, h] of [[375, 812], [1440, 900]]) {
  console.log(`\n== ${w}px ==`);
  const { page, erros } = await abrir(w, h);
  const vitais = await page.evaluate(() => ({ cls: window.__cls, lcp: window.__lcp }));
  ok(vitais.cls < 0.1, 'CLS no carregamento abaixo de 0,1 (' + vitais.cls.toFixed(3) + ')');
  // LCP aqui é só informativo: o Chrome headless desta máquina tem 1ª pintura lenta e varia muito
  console.log('  info LCP local ' + Math.round(vitais.lcp) + ' ms (referência; medir no PageSpeed em produção)');
  await rolarTudo(page);
  await new Promise(r => setTimeout(r, 600));

  const larg = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  ok(larg.sw <= larg.iw, `sem rolagem horizontal (scrollWidth ${larg.sw} <= ${larg.iw})`);

  const largos = await page.evaluate(() => [...document.querySelectorAll('main *, footer *')].filter(el => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.right > innerWidth + 1 && cs.position !== 'fixed' && el.tagName !== 'CANVAS' && !el.closest('[aria-hidden="true"], .trust-track, .brands-track, .eb-canvas-container');
  }).slice(0, 5).map(el => el.tagName + '.' + el.className));
  ok(largos.length === 0, 'nenhum elemento de conteúdo vaza da tela' + (largos.length ? ': ' + largos.join(', ') : ''));
  const cortados = await page.evaluate(() => [...document.querySelectorAll('.service-card a, .service-card button')].filter(e => e.getBoundingClientRect().right > e.closest('.service-card').getBoundingClientRect().right + 1).map(e => e.textContent.trim()));
  ok(cortados.length === 0, 'botões dos cards de serviço não ficam cortados' + (cortados.length ? ': ' + cortados.join(', ') : ''));

  if (w === 1440) {
    const wa = await page.$$eval('a[href*="wa.me"]', as => as.map(a => a.href));
    ok(wa.length >= 25, `${wa.length} links de WhatsApp na página`);
    const ruins = wa.filter(href => {
      const u = new URL(href);
      const t = u.searchParams.get('text') || '';
      return u.pathname !== '/' + PHONE || !/\(site\/[a-z0-9-]+\)$/.test(t) || u.searchParams.get('utm_source') !== 'site' ||
        u.searchParams.get('utm_medium') !== 'whatsapp' || !u.searchParams.get('utm_campaign') || !t.endsWith('(site/' + u.searchParams.get('utm_campaign') + ')');
    });
    ok(ruins.length === 0, 'todo link de WhatsApp tem número certo, mensagem pronta, código (site/…) e UTM' + (ruins.length ? ': ' + ruins.slice(0, 3).join(' | ') : ''));

    const ld = await page.$$eval('script[type="application/ld+json"]', ss => ss.map(s => s.textContent));
    let parse = true; const objs = [];
    for (const t of ld) { try { objs.push(JSON.parse(t)); } catch { parse = false; } }
    ok(parse && objs.length === 2, 'JSON-LD válido (AutoRepair + FAQPage)');
    const oficina = objs.find(o => o['@type'] === 'AutoRepair') || {};
    ok(!oficina.aggregateRating, 'JSON-LD sem nota autoatribuída');
    ok(oficina.openingHoursSpecification?.[0]?.closes === '17:30' && oficina.openingHoursSpecification[0].dayOfWeek.length === 6, 'JSON-LD com horário seg–sáb até 17h30');
    const faqLd = (objs.find(o => o['@type'] === 'FAQPage') || {}).mainEntity || [];
    const faqHtml = await page.$$eval('.faq-item', its => its.map(i => ({ q: i.querySelector('.faq-txt').textContent.trim(), a: i.querySelector('.faq-a-inner').textContent.replace(/\s+/g, ' ').trim() })));
    ok(faqLd.length === faqHtml.length && faqHtml.every((f, i) => faqLd[i].name === f.q && faqLd[i].acceptedAnswer.text === f.a), `FAQ JSON-LD igual ao FAQ visível (${faqHtml.length} perguntas)`);

    const imgs = await page.$$eval('img', is => is.filter(i => !i.getAttribute('width') || !i.getAttribute('height') || !i.hasAttribute('alt')).map(i => i.src));
    ok(imgs.length === 0, 'todas as imagens com width, height e alt' + (imgs.length ? ': ' + imgs.join(', ') : ''));
    const webp = await page.$$eval('img', is => is.filter(i => i.currentSrc).every(i => /\.webp$/.test(i.currentSrc)));
    ok(webp, 'navegador moderno recebe WebP');

    ok(await page.$('#mapBox iframe') === null, 'mapa do Google não carrega antes do clique');
    await page.click('#mapLoad');
    await page.waitForSelector('#mapBox iframe', { timeout: 5000 }).catch(() => {});
    ok(await page.$('#mapBox iframe') !== null, 'mapa carrega ao clicar em "Ver mapa aqui"');

    const corpo = await page.evaluate(() => document.body.innerText);
    const achadas = PROIBIDAS.filter(re => re.test(corpo)).map(String);
    ok(achadas.length === 0, 'vocabulário da casa (sem prezado/efetuar/comparecer/veículo/10x/leva e traz grátis)' + (achadas.length ? ': ' + achadas : ''));
    ok(/Quem conhece, Indyca!/.test(corpo) && /8h às 17h30/.test(corpo) && /12 meses/.test(corpo), 'slogan, horário e garantia presentes');
    ok(await page.$('.review-card') === null, 'sem depoimentos inventados');
    for (const id of ['diagnostico', 'garantia', 'avaliacoes', 'faq', 'contato']) ok(await page.$('#' + id) !== null, `seção #${id} existe`);

    // formulário: telefone curto é barrado com mensagem
    await page.evaluate(() => { document.querySelector('[data-open-modal]').click(); });
    await page.type('#fName', 'Teste QA');
    await page.type('#fPhone', '1234');
    await page.select('#fService', 'Pneus');
    await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
    const formErr = await page.evaluate(() => ({ vis: !document.getElementById('fPhoneErr').hidden, inv: document.getElementById('fPhone').getAttribute('aria-invalid') }));
    ok(formErr.vis && formErr.inv === 'true', 'formulário barra telefone sem DDD e avisa');
    await page.evaluate(() => { window.__aberto = null; window.open = u => { window.__aberto = u; return null; }; });
    await page.click('#fPhone', { clickCount: 3 });
    await page.type('#fPhone', '(12) 99683-0272');
    await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
    const aberto = await page.evaluate(() => window.__aberto || '');
    ok(aberto.startsWith('https://wa.me/' + '5512996830272') && decodeURIComponent(aberto).includes('(site/formulario)') && aberto.includes('utm_campaign=formulario'), 'formulário válido abre o WhatsApp com código (site/formulario) e UTM');
    await page.evaluate(() => document.querySelector('.svc-rev').click());
    const pop = await page.evaluate(() => ({ vis: !document.getElementById('revPop').hidden, wa: document.getElementById('revPopWa').href, txt: document.getElementById('revPopBody').innerText }));
    ok(pop.vis && decodeURIComponent(pop.wa).includes('(site/avaliacao-') && !/Local Guide/.test(pop.txt), 'popover de avaliações abre sem depoimento inventado e com WhatsApp rastreável');
    await page.keyboard.press('Escape');
    ok(await page.evaluate(() => document.getElementById('revPop').hidden), 'popover fecha com Esc');
    await page.keyboard.press('Escape');
  }

  await page.screenshot({ path: path.join(OUT, `qa-${w}.png`), fullPage: false });
  ok(erros.length === 0, 'sem erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
  await page.close();
}

console.log('\n== páginas extras ==');
for (const [rota, texto] of [['/privacidade.html', 'Privacidade'], ['/nao-existe', 'saiu da pista']]) {
  const { page, erros } = await abrir(375, 812, BASE + rota);
  const t = await page.evaluate(() => document.body.innerText);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const errosReais = erros.filter(e => !(rota === '/nao-existe' && /404/.test(e)));
  ok(t.includes(texto) && sw && errosReais.length === 0, `${rota} abre limpa em 375 px`);
  await page.close();
}
for (const f of ['robots.txt', 'sitemap.xml', 'og-indycar.jpg', 'manifest.webmanifest']) ok(fs.existsSync(path.join(ROOT, f)), `${f} existe`);
const ignorar = fs.readFileSync(path.join(ROOT, '.netlifyignore'), 'utf8');
ok(['scripts/**', '.publicacao.zip', 'qa-out/**', 'package.json'].every(p => ignorar.includes(p)), '.netlifyignore exclui testes e sobras locais');

await browser.close();
server.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
