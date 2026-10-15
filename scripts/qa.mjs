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
import { createRequire } from 'node:module';
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa-out');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PHONE = '5512996830272';
const PROIBIDAS = [/\bprezad[oa]s?\b/i, /\befetu(ar|e|ou)\b/i, /\bcomparec(er|a)\b/i, /\bve[ií]culos?\b/i, /\b10x\b/i, /leva e traz gr[aá]tis/i];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

/* Os mesmos cabeçalhos do netlify.toml (bloco "/*") no servidor local: CSP que quebre algo falha aqui. */
function cabecalhosDoNetlify() {
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  const bloco = toml.split('[[headers]]').find(b => b.includes('for = "/*"')) || '';
  const saida = {};
  for (const linha of bloco.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z-]+) = "(.*)"\s*$/.exec(linha);
    if (m && m[1] !== 'for') saida[m[1]] = m[2];
  }
  return saida;
}
const CABECALHOS = cabecalhosDoNetlify();
// O código que o Atendimento reconhece (gatilho at_origem_pelo_site): (site/<código>) com [a-z0-9_-]{1,40}.
const CODIGO_OK = /^[a-z0-9_-]{1,40}$/;

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  FALHOU ') + msg); if (!cond) falhas++; };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, { 'content-type': TIPOS['.html'], ...CABECALHOS }); return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', ...CABECALHOS });
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
    window.__cls = 0; window.__lcp = 0; window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline')));
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
    // Rodada 4: as seções abaixo da dobra usam content-visibility; rola até o mapa e espera ele assentar antes do clique.
    await page.evaluate(() => document.getElementById('mapLoad').scrollIntoView({ block: 'center' }));
    await new Promise(r => setTimeout(r, 1500));
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
    // anti-spam 1: campo-isca invisível, fora do Tab e do leitor de tela
    const isca = await page.evaluate(() => { const i = document.getElementById('fEmpresa'), r = i.getBoundingClientRect(); return { tab: i.tabIndex, oculto: i.closest('[aria-hidden="true"]') !== null, fora: r.right < 0 || r.bottom < 0 }; });
    ok(isca.tab === -1 && isca.oculto && isca.fora, 'campo-isca do formulário fora da tela, do Tab e do leitor de tela');
    await page.evaluate(() => { document.getElementById('fEmpresa').value = 'robo ltda'; document.querySelector('#leadForm button[type=submit]').click(); });
    ok(!(await page.evaluate(() => window.__aberto)), 'robô que preenche o campo-isca não abre o WhatsApp');
    // reabre o formulário limpo, preenche como gente e espera
    await page.evaluate(() => { document.querySelector('[data-open-modal]').click(); });
    await page.type('#fName', 'Teste QA'); await page.type('#fPhone', '(12) 99683-0272'); await page.select('#fService', 'Pneus');
    await new Promise(r => setTimeout(r, 2700));
    await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
    const aberto = await page.evaluate(() => window.__aberto || '');
    ok(aberto.startsWith('https://wa.me/' + '5512996830272') && decodeURIComponent(aberto).includes('(site/formulario-pneus)') && aberto.includes('utm_campaign=formulario-pneus'), 'formulário válido abre o WhatsApp com código do serviço (site/formulario-pneus) e UTM');
    // anti-spam 2: enviar rápido demais (robô) só pede para conferir
    await page.evaluate(() => { window.__aberto = null; document.querySelector('[data-open-modal]').click(); });
    await page.evaluate(() => {
      const v = (id, x) => { const e = document.getElementById(id); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); };
      v('fName', 'Robo'); v('fPhone', '12996830272'); document.getElementById('fService').selectedIndex = 3;
      document.querySelector('#leadForm button[type=submit]').click();
    });
    ok(!(await page.evaluate(() => window.__aberto)), 'envio instantâneo (abaixo de 2,5 s) não abre o WhatsApp');
    ok(await page.evaluate(() => !document.getElementById('fEnvioMsg').hidden && /Confere os dados/.test(document.getElementById('fEnvioMsg').textContent)), 'envio rápido mostra aviso no próprio formulário (role=status)');
    await page.keyboard.press('Escape');

    // todo serviço tem código: cada card de serviço e cada opção do formulário
    const semCodigo = await page.$$eval('.service-card', cs => cs.filter(c => !/\(site\/[a-z0-9_-]+\)/.test(decodeURIComponent([...c.querySelectorAll('a[href*="wa.me"]')].map(a => a.href).join(' ')))).map(c => (c.querySelector('h3') || {}).textContent));
    ok(semCodigo.length === 0, 'todo card de serviço tem WhatsApp com código (site/…)' + (semCodigo.length ? ': ' + semCodigo.join(', ') : ''));
    const opcoes = await page.$$eval('#fService option:not([disabled])', os => os.map(o => o.dataset.codigo || ''));
    ok(opcoes.length >= 10 && opcoes.every(c => /^[a-z0-9_-]{1,29}$/.test(c)) && new Set(opcoes).size === opcoes.length, `todas as ${opcoes.length} opções do formulário têm código único (formulario-<código> cabe no limite do gatilho)`);
    const codigos = [...new Set(wa.map(h => (/\(site\/([^)]+)\)/.exec(decodeURIComponent(h)) || [])[1]).filter(Boolean))];
    ok(codigos.every(c => CODIGO_OK.test(c)), `${codigos.length} códigos de WhatsApp no formato que o Atendimento reconhece`);

    // links quebrados: tudo que é interno responde 200 e toda âncora existe
    const internos = await page.evaluate(base => [...new Set([...document.querySelectorAll('a[href], link[href], img[src], source[srcset], script[src]')]
      .flatMap(e => e.tagName === 'SOURCE' ? e.getAttribute('srcset').split(',').map(x => x.trim().split(' ')[0]) : [e.getAttribute('href') || e.getAttribute('src')])
      .filter(u => u && !/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(u)).map(u => new URL(u, base + '/').href))], BASE);
    const quebrados = [];
    for (const u of internos) { const r = await fetch(u).catch(() => null); if (!r || r.status !== 200) quebrados.push(u.replace(BASE, '') + ' → ' + (r ? r.status : 'erro')); }
    ok(quebrados.length === 0, `${internos.length} links/arquivos internos respondem 200` + (quebrados.length ? ': ' + quebrados.join(', ') : ''));
    const ancoras = await page.$$eval('a[href^="#"]', as => [...new Set(as.map(a => a.getAttribute('href')))].filter(h => h.length > 1 && !document.getElementById(h.slice(1))));
    ok(ancoras.length === 0, 'toda âncora (#…) aponta para uma seção que existe' + (ancoras.length ? ': ' + ancoras.join(', ') : ''));
    const externos = await page.$$eval('a[href^="http"]', as => as.filter(a => a.target === '_blank' && !/noopener/.test(a.rel)).map(a => a.href));
    ok(externos.length === 0, 'link externo em nova aba sempre com rel=noopener' + (externos.length ? ': ' + externos.slice(0, 3).join(', ') : ''));

    // acessibilidade básica
    const a11y = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      semNome: [...document.querySelectorAll('button, a[href]')].filter(b => !b.closest('[aria-hidden="true"]') && !(b.getAttribute('aria-label') || b.textContent.trim() || b.getAttribute('title') || b.querySelector('img[alt]:not([alt=""])'))).map(b => b.outerHTML.slice(0, 80)),
      semRotulo: [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(i => !i.closest('[aria-hidden="true"]') && !((i.labels && i.labels.length) || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby'))).map(i => i.id || i.name),
      pular: [...document.querySelectorAll('a[href^="#"]')].slice(0, 3).some(a => /pular/i.test(a.textContent)),
      lang: document.documentElement.lang,
    }));
    ok(a11y.h1 === 1 && a11y.lang === 'pt-BR' && a11y.pular, 'um h1, lang pt-BR e atalho para pular ao conteúdo');
    ok(a11y.semNome.length === 0, 'todo botão/link tem nome acessível' + (a11y.semNome.length ? ': ' + a11y.semNome.slice(0, 3).join(' | ') : ''));
    ok(a11y.semRotulo.length === 0, 'todo campo tem rótulo' + (a11y.semRotulo.length ? ': ' + a11y.semRotulo.join(', ') : ''));
    await page.evaluate(() => document.querySelector('.svc-rev').click());
    const pop = await page.evaluate(() => ({ vis: !document.getElementById('revPop').hidden, wa: document.getElementById('revPopWa').href, txt: document.getElementById('revPopBody').innerText }));
    ok(pop.vis && decodeURIComponent(pop.wa).includes('(site/avaliacao-') && !/Local Guide/.test(pop.txt), 'popover de avaliações abre sem depoimento inventado e com WhatsApp rastreável');
    await page.keyboard.press('Escape');
    ok(await page.evaluate(() => document.getElementById('revPop').hidden), 'popover fecha com Esc');
    await page.keyboard.press('Escape');
  }

  // ---- Rodada 4 (14/10/2026) ----
  // Acessibilidade com axe-core (WCAG 2.1 A/AA): nenhuma violação séria ou crítica, com a página toda já rolada.
  // Como a pessoa vê depois de rolar: tudo revelado e as transições (preenchimento dos títulos) terminadas.
  await page.evaluate(() => {
    document.documentElement.classList.add('cv-off');
    document.querySelectorAll('.reveal, .section-head').forEach(e => e.classList.add('in'));
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(AXE);
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' (' + v.nodes.length + '): ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | '));
  });
  ok(axe.length === 0, 'axe-core: nenhuma violação séria/crítica de WCAG 2.1 AA' + (axe.length ? ': ' + axe.join(' ;; ') : ''));
  // Cada "Agende pelo WhatsApp" diz o serviço para o leitor de tela; passos do serviço sem preço nem prazo.
  const servicos = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.service-card .service-link')];
    const secao = document.getElementById('servicos').innerText;
    return {
      links: links.length,
      comServico: links.filter(a => /— .+ \(abre o WhatsApp\)/.test(a.textContent)).length,
      passos: document.querySelectorAll('.svc-passos li').length,
      precoOuPrazo: /R\$|\bprazo\b|\bem \d+ (min|minutos|horas|dias)\b/i.test(secao),
    };
  });
  ok(servicos.links >= 12 && servicos.comServico === servicos.links, `link de cada serviço diz qual é e que abre o WhatsApp (${servicos.comServico}/${servicos.links})`);
  ok(servicos.passos === 3 && !servicos.precoOuPrazo, 'serviços: "como funciona" em 3 passos e nenhum preço ou prazo na seção');
  await page.evaluate(() => document.documentElement.classList.remove('cv-off'));

  const csp = await page.evaluate(() => window.__csp);
  ok(csp.length === 0, 'nenhuma violação da CSP (mapa, fontes e WhatsApp funcionam com ela)' + (csp.length ? ': ' + [...new Set(csp)].slice(0, 4).join(' | ') : ''));
  // Rodada 4: fontes no próprio site (nada do Google), carregadas e usadas no título.
  const fontes = await page.evaluate(async () => {
    await document.fonts.ready;
    const externas = performance.getEntriesByType('resource').filter(r => /fonts\.(googleapis|gstatic)\.com/.test(r.name)).length;
    return { externas, archivo: document.fonts.check('800 40px Archivo'), inter: document.fonts.check('400 16px Inter') };
  });
  ok(fontes.externas === 0 && fontes.archivo && fontes.inter, 'fontes do próprio site carregadas (Archivo e Inter), nada do Google' + (fontes.externas ? ': ' + fontes.externas + ' pedidos externos' : ''));
  await page.screenshot({ path: path.join(OUT, `qa-${w}.png`), fullPage: false });
  ok(erros.length === 0, 'sem erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
  await page.close();
}

console.log('\n== âncoras e primeira dobra (rodada 4) ==');
for (const [w, h] of [[375, 812], [1440, 900]]) {
  for (const alvo of ['contato', 'faq', 'garantia']) {
    const { page } = await abrir(w, h);
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(a => document.querySelector(`a[href="#${a}"]`).click(), alvo);
    await new Promise(r => setTimeout(r, 1800));
    const topo = await page.evaluate(a => Math.round(document.getElementById(a).getBoundingClientRect().top), alvo);
    ok(topo >= 0 && topo < 160, `[${w}] menu leva até #${alvo} no lugar certo (topo ${topo}px)`);
    await page.close();
  }
  const { page } = await abrir(w, h, BASE + '/#contato');
  await new Promise(r => setTimeout(r, 1800));
  const topo = await page.evaluate(() => Math.round(document.getElementById('contato').getBoundingClientRect().top));
  ok(topo >= 0 && topo < 160, `[${w}] endereço com #contato abre no contato (topo ${topo}px)`);
  await page.close();
}
{
  // Sem JavaScript, o título do hero (o LCP no celular) aparece: não depende do script para ficar visível.
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 900));
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-title')).opacity);
  ok(Number(op) === 1, 'celular: título do hero visível antes do JavaScript (opacity ' + op + ')');
  await page.close();
}

console.log('\n== cabeçalhos de segurança ==');
{
  const r = await fetch(BASE + '/');
  const h = k => r.headers.get(k) || '';
  const csp = h('content-security-policy');
  ok(/script-src 'self'(;|$)/.test(csp) && /frame-ancestors/.test(csp) && csp.includes('frame-src https://maps.google.com'), 'CSP com script só do site, frame-ancestors e mapa liberado');
  ok(/max-age=[0-9]{8}/.test(h('strict-transport-security')), 'HSTS de 1 ano');
  ok(h('permissions-policy').includes('camera=()') && h('permissions-policy').includes('browsing-topics=()'), 'Permissions-Policy fecha câmera, microfone, localização, pagamento e rastreio');
  ok(h('x-content-type-options') === 'nosniff' && h('referrer-policy').includes('strict-origin'), 'nosniff e Referrer-Policy');
  const html = await (await fetch(BASE + '/')).text();
  const embutidos = [...html.matchAll(/<script([^>]*)>([^<]*)<\/script>/gi)].filter(m => !m[1].includes('application/ld+json') && m[2].trim());
  ok(embutidos.length === 0 && !/ on[a-z]+="/i.test(html), 'HTML sem script embutido nem onload/onerror (a CSP barraria)');
  ok(!/<script[^>]+src="https?:/i.test(html), 'nenhum script de CDN (nada a proteger com SRI)');
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
