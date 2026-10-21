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
import { execFileSync } from 'node:child_process';
import { texto as textoWa, MENSAGENS, PREFIXO } from './mensagens-whatsapp.mjs';
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const SITE_LEAD = 'https://nppfqhavqahapmugnyng.supabase.co/functions/v1/site-lead';
// Resposta falsa da Edge Function site-lead: o teste NUNCA grava no banco de verdade.
const FETCH_FALSO = `window.__envios = []; window.__horariosPedidos = 0; window.fetch = async (url, opts) => { if (String(url).endsWith('/horarios')) { window.__horariosPedidos++; if (window.__horariosFalha) throw new TypeError('rede'); return { ok: true, status: 200, json: async () => ({ ok: true, atualizado_em: '2026-10-21T15:0' + Math.min(window.__horariosPedidos, 9) + ':00.000Z', dias: window.__horariosVazio ? [] : [{ data: '2026-10-21', rotulo: 'hoje', horas: window.__horariosMuda && window.__horariosPedidos > 1 ? ['08:00', '12:00'] : ['08:00', '10:00', '12:00', '14:00', '16:00'] }, { data: '2026-10-22', rotulo: 'amanhã', horas: ['08:00', '10:00'] }, { data: '2026-10-23', rotulo: 'sex 23/10', horas: ['09:00'] }] }) }; } window.__envios.push({ url: String(url), body: JSON.parse(opts.body) }); if (window.__fetchFalha) throw new TypeError('rede'); return { ok: true, status: 200, json: async () => ({ ok: true, protocolo: 'QA1234', mensagem: 'Pedido enviado, Teste! (resposta de teste)' }) }; };`;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa-out');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PHONE = '5512996830272';
const PROIBIDAS = [/\bprezad[oa]s?\b/i, /\befetu(ar|e|ou)\b/i, /\bcomparec(er|a)\b/i, /\bve[ií]culos?\b/i, /\b10x\b/i, /leva e traz gr[aá]tis/i];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 240000, args: ['--no-first-run', '--no-default-browser-check'] });

async function abrir(largura, altura, url = BASE + '/') {
  const page = await browser.newPage();
  const erros = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('requestfailed', r => { if (r.url().startsWith(BASE)) erros.push('falhou: ' + r.url()); });
  await page.evaluateOnNewDocument(() => {
    window.__cls = 0; window.__lcp = 0; window.__csp = [];
    try { sessionStorage.setItem('indycar_promo', '1'); } catch (_) {} // o convite de 8 s não cobre a página durante o teste
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
    // Rodada 5: contrato com a IA do Atendimento — toda mensagem começa com o prefixo estável e bate com a tabela única.
    const foraDaTabela = wa.map(h => { const u = new URL(h); return [u.searchParams.get('utm_campaign'), u.searchParams.get('text') || '']; })
      .filter(([c, t]) => !t.startsWith(PREFIXO) || (MENSAGENS[c] && t !== textoWa(c)) || (!MENSAGENS[c] && !/^formulario/.test(c))).map(([c]) => c);
    ok(foraDaTabela.length === 0, `todas as ${wa.length} mensagens de WhatsApp começam com "${PREFIXO}" e seguem a tabela scripts/mensagens-whatsapp.mjs` + (foraDaTabela.length ? ': ' + foraDaTabela.join(', ') : ''));
    const orcar = wa.filter(h => /quero or%C3%A7ar%3A/.test(h) || /quero orçar: /.test(decodeURIComponent(h))).length;
    ok(orcar >= 16, `${orcar} links de serviço dizem "quero orçar: <serviço>" (a IA identifica o serviço por esse trecho)`);

    const ld = await page.$$eval('script[type="application/ld+json"]', ss => ss.map(s => s.textContent));
    let parse = true; const objs = [];
    for (const t of ld) { try { objs.push(JSON.parse(t)); } catch { parse = false; } }
    ok(parse && objs.length === 3 && objs.some(o => o['@type'] === 'WebSite'), 'JSON-LD válido (AutoRepair + FAQPage + WebSite)');
    const oficina = objs.find(o => o['@type'] === 'AutoRepair') || {};
    ok(!oficina.aggregateRating, 'JSON-LD sem nota autoatribuída');
    ok(oficina.openingHoursSpecification?.[0]?.closes === '17:30' && oficina.openingHoursSpecification[0].dayOfWeek.length === 6, 'JSON-LD com horário seg–sáb até 17h30');
    const faqLd = (objs.find(o => o['@type'] === 'FAQPage') || {}).mainEntity || [];
    const faqHtml = await page.$$eval('.faq-item', its => its.map(i => ({ q: i.querySelector('.faq-txt').textContent.trim(), a: i.querySelector('.faq-a-inner').textContent.replace(/\s+/g, ' ').trim() })));
    ok(faqLd.length === faqHtml.length && faqHtml.every((f, i) => faqLd[i].name === f.q && faqLd[i].acceptedAnswer.text === f.a), `FAQ JSON-LD igual ao FAQ visível (${faqHtml.length} perguntas)`);

    const imgs = await page.$$eval('img', is => is.filter(i => !i.getAttribute('width') || !i.getAttribute('height') || !i.hasAttribute('alt')).map(i => i.src));
    ok(imgs.length === 0, 'todas as imagens com width, height e alt' + (imgs.length ? ': ' + imgs.join(', ') : ''));
    const modernas = await page.$$eval('img', is => is.filter(i => i.currentSrc).map(i => i.currentSrc.split('/').pop()));
    ok(modernas.length >= 1 && modernas.every(s => /\.avif$/.test(s)), 'navegador moderno recebe AVIF (WebP e PNG/JPG de reserva): ' + modernas.join(', '));

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
    for (const id of ['diagnostico', 'garantia', 'avaliacoes', 'faq', 'area-cliente', 'contato']) ok(await page.$('#' + id) !== null, `seção #${id} existe`);

    // Rodada 5: Área do Cliente (sistema Pátio) — seção, menu, rodapé, FAQ e 404 apontam para o endereço certo.
    const area = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href^="https://indycar-patio.netlify.app/"]')];
      return {
        acompanhar: links.filter(a => a.href === 'https://indycar-patio.netlify.app/acompanhar/').map(a => a.closest('section, footer, nav')?.id || a.closest('footer') ? 'footer' : '?'),
        minha: links.filter(a => a.href === 'https://indycar-patio.netlify.app/minha/').length,
        semNoopener: links.filter(a => !/noopener/.test(a.rel)).length,
        secao: !!document.querySelector('#area-cliente .area-card[href$="/acompanhar/"]') && !!document.querySelector('#area-cliente .area-card[href$="/minha/"]'),
        menu: !!document.querySelector('.nav-link[href="#area-cliente"]'),
        faq: /Acompanhar meu carro/.test(document.getElementById('faq').textContent),
        texto: document.getElementById('area-cliente').textContent,
      };
    });
    ok(area.secao && area.acompanhar.length >= 3 && area.minha >= 2 && area.semNoopener === 0, `Área do Cliente: links para /acompanhar/ (${area.acompanhar.length}) e /minha/ (${area.minha}) na seção, no rodapé e na FAQ, todos com noopener`);
    ok(area.menu && area.faq && /Sem senha e sem cadastro/.test(area.texto), 'Área do Cliente no menu, explicada em uma frase (sem senha, link pelo WhatsApp) e citada na resposta da FAQ');
    const status = await page.evaluate(() => { const c = document.getElementById('statusAberto'); return { hidden: c.hidden, txt: c.innerText.replace(/\s+/g, ' ') }; });
    ok(!status.hidden && /^(Aberto agora|Fechado agora) /.test(status.txt), 'chip "Aberto agora / Fechado agora" calculado no fuso de Taubaté: ' + status.txt);
    ok(await page.$eval('meta[name="color-scheme"]', m => m.content) === 'dark', 'meta color-scheme=dark (campos nativos no tema do site)');
    const marcados = await page.evaluate(() => document.querySelectorAll('[data-num]').length);
    ok(marcados >= 14 && await page.evaluate(() => document.body.dataset.nota === '4,8' && document.body.dataset.avaliacoes === '1.200' && document.body.dataset.anos === '18'), `números da oficina (4,8 · +1.200 · +18) marcados em ${marcados} pontos e no <body>, trocáveis em scripts/dados-oficina.mjs`);
    ok(await page.$$eval('.service-card[id^="svc-"]', cs => cs.length) === 12, 'os 12 cards de serviço têm id estável (#svc-cambio, #svc-freios…) para links de anúncio');

    // formulário: telefone curto é barrado com mensagem (o fetch da Edge Function é falso: nada vai para o banco)
    await page.evaluate(FETCH_FALSO);
    await page.evaluate(() => { document.querySelector('.hero-cta [data-open-modal]').click(); });
    ok(await page.$eval('#fService', s => s.selectedOptions[0]?.dataset.codigo) === 'diagnostico', 'botão do hero abre o formulário já com "Diagnóstico digital gratuito" escolhido (data-servico)');
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
    // reabre o formulário limpo, preenche como gente e espera: o pedido vai para a Edge Function (falsa aqui)
    await page.evaluate(() => { document.querySelector('[data-open-modal]').click(); });
    await page.type('#fName', 'Teste QA'); await page.type('#fPhone', '12996830272'); await page.select('#fService', 'Pneus');
    ok(await page.$eval('#fPhone', i => i.value) === '(12) 99683-0272', 'telefone ganha máscara (12) 99683-0272 enquanto digita');
    await page.select('#fQuando', 'Amanhã'); await page.type('#fMsg', 'luz do motor acesa');
    await new Promise(r => setTimeout(r, 2700));
    await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
    await page.waitForSelector('#formOk:not([hidden])', { timeout: 5000 }).catch(() => {});
    const envio = await page.evaluate(() => ({ envios: window.__envios, aberto: window.__aberto, ok: !document.getElementById('formOk').hidden, proto: document.getElementById('formOkProto').innerText, wa: document.getElementById('formOkWa').href, formEscondido: document.getElementById('leadForm').hidden }));
    const corpoEnvio = envio.envios[0]?.body || {};
    ok(envio.envios.length === 1 && envio.envios[0].url === SITE_LEAD && corpoEnvio.nome === 'Teste QA' && corpoEnvio.telefone === '12996830272' && corpoEnvio.codigo === 'pneus' && corpoEnvio.servico === 'Pneus' && corpoEnvio.preferencia === 'Amanhã' && corpoEnvio.mensagem === 'luz do motor acesa' && corpoEnvio.decorrido >= 2500 && corpoEnvio.empresa === '', 'formulário válido manda o pedido para a Edge Function site-lead (nome, telefone só dígitos, código, serviço, quando, mensagem, tempo de preenchimento)');
    ok(envio.ok && envio.formEscondido && /QA1234/.test(envio.proto) && !envio.aberto, 'depois de enviar mostra a confirmação com protocolo e NÃO abre o WhatsApp sozinho');
    ok(envio.wa.startsWith('https://wa.me/5512996830272') && decodeURIComponent(envio.wa).includes('(site/formulario-pneus)') && decodeURIComponent(envio.wa).startsWith('https://wa.me/5512996830272?text=' + PREFIXO + ', quero orçar: Pneus.') && envio.wa.includes('utm_campaign=formulario-pneus'), 'botão "abrir no WhatsApp" da confirmação leva a mesma mensagem (prefixo + quero orçar + código do serviço)');
    await page.evaluate(() => document.querySelector('#formOk [data-close-form]').click());
    await new Promise(r => setTimeout(r, 600));
    ok(await page.evaluate(() => !document.getElementById('leadForm').hidden && document.getElementById('formOk').hidden), 'fechar a confirmação devolve o formulário limpo para o próximo pedido');
    // sem rede (ou servidor fora): o caminho antigo continua — abre o WhatsApp com a mesma mensagem
    await page.evaluate(() => { window.__fetchFalha = true; window.__aberto = null; document.querySelector('[data-open-modal]').click(); });
    await page.type('#fName', 'Teste QA'); await page.type('#fPhone', '12996830272'); await page.select('#fService', 'Pneus');
    await new Promise(r => setTimeout(r, 2700));
    await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
    await page.waitForSelector('#formOk:not([hidden])', { timeout: 5000 }).catch(() => {});
    const aberto = await page.evaluate(() => { window.__fetchFalha = false; return window.__aberto || ''; });
    ok(aberto.startsWith('https://wa.me/' + '5512996830272') && decodeURIComponent(aberto).includes('(site/formulario-pneus)') && aberto.includes('utm_campaign=formulario-pneus'), 'sem rede, o formulário abre o WhatsApp com código do serviço (site/formulario-pneus) e UTM (nada se perde)');
    await page.evaluate(() => document.querySelector('#formOk [data-close-form]').click());
    await new Promise(r => setTimeout(r, 600));
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
    ok((await page.evaluate(() => window.__envios.length)) === 2, 'robô (isca ou rápido demais) não chega à Edge Function: só os 2 envios de gente foram mandados');
    // menu marca a seção atual enquanto rola
    await page.evaluate(() => document.getElementById('contato').scrollIntoView());
    await new Promise(r => setTimeout(r, 900));
    ok(await page.evaluate(() => document.querySelector('.nav-link[href="#contato"]').getAttribute('aria-current') === 'true'), 'menu marca a seção atual (aria-current) ao rolar até #contato');
    await page.evaluate(() => scrollTo(0, 0));

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
  // Rodada 5: as camadas que repintam a tela inteira ficam paradas (velocidade/bateria); no celular também o título e os botões.
  const parado = await page.evaluate(() => ({
    aurora: getComputedStyle(document.querySelector('.bg-aurora')).animationName, grao: getComputedStyle(document.querySelector('.bg-grain')).animationName,
    titulo: getComputedStyle(document.querySelector('.hero-title .text-red')).animationName, glow: getComputedStyle(document.querySelector('.hero-cta .glow')).animationName,
  }));
  ok(parado.aurora === 'none' && parado.grao === 'none', 'aurora e grão de fundo sem animação contínua (menos repintura de tela inteira)');
  if (w === 375) ok(parado.titulo === 'none' && parado.glow === 'none', 'celular: título e botões sem pulso de sombra contínuo (TBT/bateria)');
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

console.log('\n== entradas por endereço (rodada 5) ==');
{
  // /?servico=freios&utm_source=meta&utm_campaign=freios-outubro: escolhe o serviço, destaca o card, guarda a campanha e limpa o endereço
  const { page, erros } = await abrir(1440, 900, BASE + '/?servico=freios&utm_source=meta&utm_campaign=freios-outubro&fbclid=abc');
  await new Promise(r => setTimeout(r, 1200));
  const e1 = await page.evaluate(() => ({
    sel: document.querySelector('#fService').selectedOptions[0]?.dataset.codigo, destaque: document.getElementById('svc-freios').classList.contains('svc-destaque'),
    url: location.search, utm: sessionStorage.getItem('indycar_utm'),
    waHero: new URL(document.querySelector('.hero-cta a[href*="wa.me"]').href).searchParams.get('utm_campaign'),
    waTexto: decodeURIComponent(new URL(document.querySelector('.hero-cta a[href*="wa.me"]').href).searchParams.get('text')),
    topoCard: Math.round(document.getElementById('svc-freios').getBoundingClientRect().top),
  }));
  ok(e1.sel === 'freios' && e1.destaque && e1.topoCard > 0 && e1.topoCard < 900, `/?servico=freios escolhe Freios no formulário e rola até o card destacado (topo ${e1.topoCard}px)`);
  ok(e1.url === '' && /"source":"meta"/.test(e1.utm) && /"fbclid":"abc"/.test(e1.utm), 'campanha (utm_source, utm_campaign, fbclid) guardada na sessão e endereço limpo');
  ok(e1.waHero === 'hero--meta' && e1.waTexto.endsWith('(site/hero--meta)'), 'links de WhatsApp levam a campanha no código: (site/hero--meta)');
  await page.evaluate(FETCH_FALSO);
  await page.evaluate(() => { document.querySelector('.hero-cta [data-open-modal]').click(); });
  await page.type('#fName', 'Teste QA'); await page.type('#fPhone', '12996830272');
  await new Promise(r => setTimeout(r, 2700));
  await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
  await page.waitForSelector('#formOk:not([hidden])', { timeout: 5000 }).catch(() => {});
  const corpo = await page.evaluate(() => window.__envios[0]?.body || {});
  ok(corpo.utm?.source === 'meta' && corpo.utm?.campaign === 'freios-outubro' && corpo.codigo === 'freios', 'pedido do formulário leva a campanha paga junto (utm.source=meta, campaign) e o serviço pré-escolhido');
  ok(erros.length === 0, 'sem erro de console na entrada por endereço' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
  await page.close();
  const { page: p2 } = await abrir(375, 812, BASE + '/?abrir=form');
  await new Promise(r => setTimeout(r, 1400));
  ok(await p2.evaluate(() => document.getElementById('formBackdrop').classList.contains('open') && document.activeElement?.id === 'fName'), '/?abrir=form abre o formulário direto no celular, com o foco no nome');
  await p2.close();
}

console.log('\n== fontes de verdade (tabelas) ==');
{
  for (const [script, rotulo] of [['gerar-whatsapp.mjs', 'mensagens de WhatsApp do HTML iguais à tabela scripts/mensagens-whatsapp.mjs'], ['gerar-numeros.mjs', 'números da oficina do HTML iguais a scripts/dados-oficina.mjs']]) {
    let saida = '', okk = true;
    try { saida = execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), '--conferir'], { encoding: 'utf8' }).trim(); } catch (e) { okk = false; saida = (e.stdout || e.message).toString().trim(); }
    ok(okk, rotulo + ' (' + saida.split('\n')[0] + ')');
  }
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  ok(/from = "\/acompanhar"[\s\S]*?to = "https:\/\/indycar-patio\.netlify\.app\/acompanhar\/"/.test(toml) && /from = "\/minha"[\s\S]*?to = "https:\/\/indycar-patio\.netlify\.app\/minha\/"/.test(toml) && /from = "\/whatsapp"/.test(toml) && /from = "\/agendar"[\s\S]*?to = "\/\?abrir=form"/.test(toml), 'netlify.toml: atalhos /acompanhar, /minha, /whatsapp e /agendar');
  ok(/for = "\/\*\.css"[\s\S]*?immutable/.test(toml) && /for = "\/\*\.js"[\s\S]*?immutable/.test(toml), 'netlify.toml: CSS e JS com cache de um ano (o publicar versiona os links com ?v=)');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  ok(manifest.icons.some(i => i.sizes === '192x192') && manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable') && manifest.icons.every(i => fs.existsSync(path.join(ROOT, i.src.replace(/^\//, '')))) && manifest.shortcuts?.length >= 2, 'manifesto com ícones 192/512 (maskable) existentes e atalhos');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const datas = [...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(m => m[1]);
  ok(datas.length === 2 && datas.every(d => !isNaN(Date.parse(d)) && d <= new Date().toISOString().slice(0, 10)), 'sitemap com lastmod válido nas duas páginas');
  ok(/@media print/.test(fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8')), 'folha de impressão (@media print) presente');
  for (const f of ['oficina-fachada.avif', 'oficina-fachada-720.avif', 'fachada-recorte.avif', 'fachada-recorte-thumb.avif']) {
    const webp = f.replace('.avif', '.webp');
    ok(fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).size < fs.statSync(path.join(ROOT, webp)).size, `${f} existe e é menor que o WebP`);
  }
  // dist/ minificado e versionado (o que vai para o ar)
  let distOk = true, distSaida = '';
  try { distSaida = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'publicar.mjs')], { encoding: 'utf8' }).trim(); } catch (e) { distOk = false; distSaida = e.message; }
  const distHtml = distOk ? fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8') : '';
  ok(distOk && /styles\.css\?v=[0-9a-f]{10}/.test(distHtml) && /script\.js\?v=[0-9a-f]{10}/.test(distHtml) && fs.statSync(path.join(ROOT, 'dist', 'script.js')).size < fs.statSync(path.join(ROOT, 'script.js')).size * 0.6, 'dist/: CSS e JS minificados e chamados com ?v=<hash> (' + distSaida.split('(')[1]?.split(')')[0] + ')');
  ok(distOk && !fs.existsSync(path.join(ROOT, 'dist', 'package.json')) && !fs.existsSync(path.join(ROOT, 'dist', 'scripts')) && !fs.existsSync(path.join(ROOT, 'dist', 'supabase')), 'dist/ não leva scripts, package.json nem a Edge Function');
  // Edge Function no ar (só leitura: /saude)
  try {
    const r = await fetch(SITE_LEAD + '/saude', { headers: { origin: 'https://indycar-taubate.netlify.app' } });
    const j = await r.json();
    ok(r.ok && j.ok && r.headers.get('access-control-allow-origin') === 'https://indycar-taubate.netlify.app', 'Edge Function site-lead responde /saude com CORS para o site');
  } catch (e) { console.log('  info Edge Function não conferida (sem rede): ' + e.message); }
}

console.log('\n== cabeçalhos de segurança ==');
{
  const r = await fetch(BASE + '/');
  const h = k => r.headers.get(k) || '';
  const csp = h('content-security-policy');
  ok(/script-src 'self'(;|$)/.test(csp) && /frame-ancestors/.test(csp) && csp.includes('frame-src https://maps.google.com'), 'CSP com script só do site, frame-ancestors e mapa liberado');
  ok(csp.includes("connect-src 'self' https://nppfqhavqahapmugnyng.supabase.co"), 'CSP libera só o Supabase da oficina em connect-src (formulário → site-lead)');
  ok(/max-age=[0-9]{8}/.test(h('strict-transport-security')), 'HSTS de 1 ano');
  ok(h('permissions-policy').includes('camera=()') && h('permissions-policy').includes('browsing-topics=()'), 'Permissions-Policy fecha câmera, microfone, localização, pagamento e rastreio');
  ok(h('x-content-type-options') === 'nosniff' && h('referrer-policy').includes('strict-origin'), 'nosniff e Referrer-Policy');
  const html = await (await fetch(BASE + '/')).text();
  const embutidos = [...html.matchAll(/<script([^>]*)>([^<]*)<\/script>/gi)].filter(m => !m[1].includes('application/ld+json') && m[2].trim());
  ok(embutidos.length === 0 && !/ on[a-z]+="/i.test(html), 'HTML sem script embutido nem onload/onerror (a CSP barraria)');
  ok(!/<script[^>]+src="https?:/i.test(html), 'nenhum script de CDN (nada a proteger com SRI)');
}

console.log('\n== rodada 6: horários livres, placa, roteador de links, atalhos e SEO ==');
for (const w of [375, 1440]) {
  const { page, erros } = await abrir(w, w === 375 ? 812 : 900);
  await page.evaluate(FETCH_FALSO);
  await page.evaluate(() => window.open = u => { window.__aberto = u; return null; });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('diagnostico').scrollIntoView(); });
  await page.waitForFunction(() => document.querySelector('#horariosLista .horario-chip'), { timeout: 5000 }).catch(() => {});
  const h = await page.evaluate(() => {
    const caixa = document.getElementById('horarios');
    return { vis: getComputedStyle(caixa).display !== 'none' && !caixa.hidden, chips: caixa.querySelectorAll('.horario-chip').length, pedidos: window.__horariosPedidos,
      dias: caixa.querySelectorAll('.horarios-dia').length, atual: document.getElementById('horariosAtualizado').textContent, ancora: document.documentElement.scrollWidth <= innerWidth, y: scrollY, top: Math.round(document.getElementById('diagnostico').getBoundingClientRect().top), li: document.getElementById('horariosLista').innerHTML.slice(0,80) };
  });
  ok(h.vis && h.chips === 7 && h.dias === 3 && h.pedidos === 1 && /Atualizado às \d{2}:\d{2}/.test(h.atual), `${w}px: "Próximos horários livres" lidos da Agenda (1 consulta, ${h.chips} horários em ${h.dias} dias, hora da atualização) ${JSON.stringify(h)} ${JSON.stringify(erros.slice(0,3))}`);
  ok(h.ancora, `${w}px: sem rolagem horizontal com os horários`);
  const alvo = await page.evaluate(() => [...document.querySelectorAll('.horario-chip')].every(b => b.getBoundingClientRect().height >= 38 || b.offsetParent === null));
  ok(alvo, `${w}px: cada horário é um botão com pelo menos 38 px de altura (toque)`);
  // clicar num horário abre o formulário com o serviço e o horário escolhidos
  await page.evaluate(() => document.querySelector('#horariosLista .horario-chip[data-hora="10:00"]').click());
  await page.waitForSelector('#formBackdrop.open', { timeout: 3000 });
  await page.waitForFunction(() => !document.getElementById('fHorarios').hidden, { timeout: 3000 }).catch(() => {});
  const f = await page.evaluate(() => ({
    servico: document.getElementById('fService').selectedOptions[0]?.dataset.codigo, quandoOff: document.getElementById('fQuando').disabled,
    marcados: [...document.querySelectorAll('.horario-chip[aria-pressed="true"]')].length, pedidos: window.__horariosPedidos,
    formLista: document.querySelectorAll('#fHorariosLista .horario-chip').length,
  }));
  ok(f.servico === 'diagnostico' && f.quandoOff && f.marcados >= 2 && f.formLista > 0, `${w}px: tocar num horário abre o formulário com o diagnóstico e o horário marcado nas duas listas`);
  ok(await page.evaluate(() => /Você escolheu hoje às 10:00/.test(document.getElementById('fHorarioEscolhido').textContent) && document.getElementById('fHorarioEscolhido').getAttribute('aria-live') === 'polite'), `${w}px: o formulário avisa em voz alta (aria-live) qual horário foi escolhido`);
  ok(await page.evaluate(() => document.getElementById('horariosLista').getAttribute('role') === 'group' && document.getElementById('horariosLista').getAttribute('aria-labelledby') === 'horariosTitulo'), `${w}px: lista de horários é um grupo com nome acessível`);
  ok(f.pedidos === 1, `${w}px: a consulta de horários é reaproveitada (não repete a cada abertura)`);
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.querySelectorAll('.reveal, .section-head').forEach(e => e.classList.add('in')); });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(AXE);
  const axe6 = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' (' + v.nodes.length + '): ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | '));
  });
  ok(axe6.length === 0, `${w}px: axe-core sem violação séria/crítica com horários na tela, formulário aberto (placa, horário, contador) e roteador` + (axe6.length ? ': ' + axe6.join(' ;; ') : ''));
  // placa com máscara e envio com horário + placa
  await page.type('#fPlaca', 'abc-1d23');
  ok(await page.$eval('#fPlaca', i => i.value) === 'ABC1D23', `${w}px: placa vira maiúscula e sem hífen (ABC1D23)`);
  await page.type('#fName', 'Teste Horario'); await page.type('#fPhone', '12996830272');
  await page.type('#fCar', 'Civic 2018');
  await new Promise(r => setTimeout(r, 2700));
  await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
  await page.waitForSelector('#formOk:not([hidden])', { timeout: 5000 }).catch(() => {});
  const e = await page.evaluate(() => ({ envios: window.__envios, wa: document.getElementById('formOkWa').href, quandoOff: document.getElementById('fQuando').disabled, marcados: document.querySelectorAll('.horario-chip[aria-pressed="true"]').length }));
  const c = e.envios[0]?.body || {};
  ok(e.envios.length === 1 && c.horario && c.horario.data === '2026-10-21' && c.horario.hora === '10:00' && c.placa === 'ABC1D23' && c.servico === 'Diagnóstico digital gratuito', `${w}px: o pedido leva o horário escolhido (2026-10-21 10:00) e a placa ABC1D23 para a Edge Function`);
  ok(decodeURIComponent(e.wa).includes('Placa: ABC1D23') && decodeURIComponent(e.wa).includes('Horário: hoje às 10:00'), `${w}px: a mensagem do WhatsApp também leva a placa e o horário`);
  ok(await page.evaluate(() => { const b = document.getElementById('formOkCopiar'); return !b.hidden && getComputedStyle(b).display !== 'none' && /Copiar/.test(b.textContent); }), `${w}px: a confirmação oferece "Copiar protocolo" e leva à Minha IndyCar`);
  ok(await page.evaluate(() => document.getElementById('fHorarioEscolhido').textContent === ''), `${w}px: depois de enviar o aviso "Você escolheu…" some`);
  ok(!e.quandoOff && e.marcados === 0, `${w}px: depois de enviar o horário é desmarcado e "Quando prefere?" volta`);
  // roteador de links e códigos
  const t36 = 'a'.repeat(36), t48 = 'b1'.repeat(24), t32 = 'c2'.repeat(16);
  await page.evaluate(() => { document.querySelector('#formOk [data-close-form]').click(); });
  await new Promise(r => setTimeout(r, 700));
  await page.evaluate(() => { document.querySelector('.hero-cta [data-open-modal]').click(); });
  await page.waitForFunction(() => !document.getElementById('leadForm').hidden, { timeout: 4000 }).catch(() => {});
  await page.type('#fMsg', 'barulho ao frear');
  ok(await page.$eval('#fMsgConta', e => e.textContent) === '16/500', `${w}px: contador de caracteres do campo "o que o carro está fazendo" (16/500)`);
  await page.evaluate(() => { document.getElementById('fName').value = ''; document.querySelector('#leadForm button[type=submit]').click(); });
  const erroCampos = await page.evaluate(() => ({ nome: !document.getElementById('fNameErr').hidden, servico: !document.getElementById('fServiceErr').hidden || document.getElementById('fService').value !== '', desc: document.getElementById('fName').getAttribute('aria-describedby') }));
  ok(erroCampos.nome && erroCampos.desc === 'fNameErr', `${w}px: nome vazio mostra a frase de erro ligada ao campo (aria-describedby)`);
  await page.evaluate(() => { document.querySelector('#formBackdrop [data-close-form]').click(); });
  const rota = async (txt) => {
    await page.evaluate((t) => {
      window.__aberto = null;
      const c = document.getElementById('areaColaCampo'); c.value = t; c.dispatchEvent(new Event('input'));
      document.querySelector('#areaCola button[type=submit]').click();
    }, txt);
    return page.evaluate(() => ({ url: window.__aberto, msg: document.getElementById('areaColaMsg').textContent, inv: document.getElementById('areaColaCampo').getAttribute('aria-invalid') }));
  };
  let r = await rota(t36);
  ok(r.url === 'https://indycar-patio.netlify.app/acompanhar/?t=' + t36, `${w}px: código de 36 letras leva ao Acompanhar meu carro`);
  r = await rota(t48);
  ok(r.url === 'https://indycar-patio.netlify.app/minha/?c=' + t48, `${w}px: código de 48 letras leva à Minha IndyCar`);
  r = await rota(t32);
  ok(r.url === 'https://indycar-orcador.netlify.app/#/o/' + t32, `${w}px: código de 32 letras leva ao orçamento no Orçador`);
  r = await rota('https://indycar-patio.netlify.app/acompanhar/?t=' + t36 + '&x=1');
  ok(r.url === 'https://indycar-patio.netlify.app/acompanhar/?t=' + t36, `${w}px: link colado do Pátio é refeito só com o código (sem lixo)`);
  r = await rota('https://indycar-orcador.netlify.app/#/o/Abc12345Def');
  ok(r.url === 'https://indycar-orcador.netlify.app/#/o/Abc12345Def', `${w}px: link de orçamento colado abre o mesmo orçamento`);
  r = await rota('indycar-patio.netlify.app/minha/?c=' + t48);
  ok(r.url === 'https://indycar-patio.netlify.app/minha/?c=' + t48, `${w}px: link colado sem https:// também é reconhecido`);
  r = await rota('https://site-malicioso.com/acompanhar/?t=' + t36);
  ok(!r.url && r.inv === 'true' && /Não reconheci/.test(r.msg), `${w}px: link de outro site nunca é aberto (sem redirecionamento aberto) e o campo avisa`);
  r = await rota('javascript:alert(1)');
  ok(!r.url && r.inv === 'true', `${w}px: javascript: e lixo são recusados`);
  ok(erros.length === 0, `${w}px: sem erro de console nos horários e no roteador` + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
  await page.screenshot({ path: path.join(OUT, `r6-horarios-${w}.png`) });
  await page.close();
}
{
  // A Agenda muda enquanto a página está aberta: a lista é repintada e o horário que sumiu é solto com aviso
  const { page } = await abrir(375, 812);
  await page.evaluate(FETCH_FALSO);
  await page.evaluate(() => { window.__horariosTtl = 0; document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('diagnostico').scrollIntoView(); });
  await page.waitForFunction(() => document.querySelector('#horariosLista .horario-chip'), { timeout: 6000 }).catch(() => {});
  await page.evaluate(() => { document.querySelector('#horariosLista .horario-chip[data-hora="10:00"]').click(); });
  await page.waitForSelector('#formBackdrop.open', { timeout: 3000 });
  await page.evaluate(() => { window.__horariosMuda = true; document.querySelector('#formBackdrop [data-close-form]').click(); });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { document.querySelector('.hero-cta [data-open-modal]').click(); });
  await page.waitForFunction(() => /acabou de ser ocupado/.test(document.getElementById('fHorarioEscolhido').textContent), { timeout: 5000 }).catch(() => {});
  const mud = await page.evaluate(() => ({ aviso: document.getElementById('fHorarioEscolhido').textContent, marcados: document.querySelectorAll('.horario-chip[aria-pressed="true"]').length, tem10: !!document.querySelector('.horario-chip[data-data="2026-10-21"][data-hora="10:00"]'), quandoOff: document.getElementById('fQuando').disabled }));
  ok(/acabou de ser ocupado/.test(mud.aviso) && mud.marcados === 0 && !mud.tem10 && !mud.quandoOff, 'Agenda mudou: a lista é repintada, o horário que sumiu é solto e o aviso fala qual foi ' + JSON.stringify(mud));
  await page.close();
}
{
  // Convite de 8 s mostra o próximo horário livre; tocar leva ao formulário com ele marcado
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(FETCH_FALSO);
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForSelector('#promoBackdrop.open', { timeout: 15000 }).catch(() => {});
  const promo = await page.evaluate(() => ({ aberto: document.getElementById('promoBackdrop').classList.contains('open'), vis: !document.getElementById('promoProximo').hidden, txt: document.getElementById('promoSlot').textContent }));
  ok(promo.aberto && promo.vis && promo.txt === 'hoje às 08:00', 'convite de 8 s mostra o próximo horário livre (hoje às 08:00)');
  await page.evaluate(() => document.getElementById('promoSlot').click());
  await page.waitForSelector('#formBackdrop.open', { timeout: 3000 });
  const viaPromo = await page.evaluate(() => ({ servico: document.getElementById('fService').selectedOptions[0]?.dataset.codigo, aviso: document.getElementById('fHorarioEscolhido').textContent, promoFechou: !document.getElementById('promoBackdrop').classList.contains('open') }));
  ok(viaPromo.servico === 'diagnostico' && /hoje às 08:00/.test(viaPromo.aviso) && viaPromo.promoFechou, 'tocar no horário do convite fecha o convite e abre o formulário com o diagnóstico e o horário marcados');
  await page.close();
}
{
  // Domingo: "Quando prefere?" não oferece "Hoje"; sábado: não oferece "Amanhã"
  for (const [quando, tira, fica] of [['2026-10-25T15:00:00Z', 'Hoje', 'Amanhã'], ['2026-10-24T15:00:00Z', 'Amanhã', 'Hoje']]) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((fixo) => { const R = Date; const F = R.parse(fixo); globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(F); } static now() { return F; } }; try { sessionStorage.setItem('indycar_promo', '1'); } catch (_) {} }, quando);
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    const ops = await page.evaluate(() => [...document.querySelectorAll('#fQuando option')].map(o => o.textContent.trim()));
    ok(!ops.includes(tira) && ops.includes(fica), '"Quando prefere?" em ' + (tira === 'Hoje' ? 'domingo' : 'sábado') + ' não oferece "' + tira + '" (mas mantém "' + fica + '")');
    await page.close();
  }
}
{
  // Sem JavaScript: aviso com WhatsApp e telefone aparece e a caixa de horários não fica vazia na tela
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const nj = await page.evaluate(() => ({ aviso: !!document.querySelector('noscript') && document.body.innerText.includes('precisa de JavaScript'), caixa: getComputedStyle(document.getElementById('horarios')).display, sw: document.documentElement.scrollWidth <= innerWidth }));
  ok(nj.aviso && nj.caixa === 'none' && nj.sw, 'sem JavaScript: aviso com WhatsApp e telefone, caixa de horários escondida e sem rolagem horizontal');
  await page.close();
}
{
  // Edge Function de verdade (só leitura): /horarios responde no formato certo e sem dado de cliente
  let r = null;
  try { const x = await fetch(SITE_LEAD + '/horarios', { headers: { origin: 'https://indycar-taubate.netlify.app' } }); r = { status: x.status, cors: x.headers.get('access-control-allow-origin'), corpo: await x.json() }; } catch (_) { /* sem internet */ }
  if (r) ok(r.status === 200 && r.cors === 'https://indycar-taubate.netlify.app' && Array.isArray(r.corpo.dias) && r.corpo.dias.length <= 4 && r.corpo.dias.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d.data) && Object.keys(d).sort().join() === 'data,horas,rotulo' && d.horas.every(h => /^\d{2}:(00|30)$/.test(h))), 'Edge Function no ar: GET /horarios com CORS, até 4 dias, horas de meia em meia hora e só data/hora (nenhum dado de cliente)');
  else console.log('  info sem internet: /horarios não conferido');
}
{
  // Agenda cheia: aviso com caminho para o WhatsApp, em vez de sumir sem explicar
  const { page } = await abrir(375, 812);
  await page.evaluate(FETCH_FALSO);
  await page.evaluate(() => { window.__horariosVazio = true; document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('diagnostico').scrollIntoView(); });
  await page.waitForFunction(() => /agenda está cheia/.test(document.getElementById('horariosLista').textContent), { timeout: 6000 }).catch(() => {});
  ok(await page.evaluate(() => !document.getElementById('horarios').hidden && /agenda está cheia/.test(document.getElementById('horariosLista').textContent) && document.getElementById('fHorarios').hidden), 'agenda cheia: a caixa avisa e manda chamar no WhatsApp (e o formulário não mostra horários)');
  // Nome de um caractere só é barrado no próprio site
  await page.evaluate(() => { document.querySelector('.hero-cta [data-open-modal]').click(); });
  await page.type('#fName', 'X'); await page.type('#fPhone', '12996830272');
  await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
  ok(await page.evaluate(() => document.getElementById('fName').getAttribute('aria-invalid') === 'true' && window.__envios.length === 0), 'nome com menos de 2 letras é barrado no site (sem ir ao servidor)');
  await page.close();
}
{
  // Sem rede: os horários somem sem quebrar nada
  const { page } = await abrir(375, 812);
  await page.evaluate(FETCH_FALSO);
  await page.evaluate(() => { window.__horariosFalha = true; document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('diagnostico').scrollIntoView(); });
  await new Promise(r => setTimeout(r, 900));
  const sem = await page.evaluate(() => ({ escondido: document.getElementById('horarios').hidden, form: document.getElementById('fHorarios').hidden }));
  ok(sem.escondido && sem.form, 'se a Agenda não responde, as caixas de horário ficam escondidas (o formulário segue igual)');
  ok(await page.evaluate(() => [...document.querySelectorAll('[data-so-horarios]')].length === 3 && [...document.querySelectorAll('[data-so-horarios]')].every(e => getComputedStyle(e).display === 'none')), 'sem Agenda, os links "Ver horários livres" também somem (nenhum link para o vazio)');
  await page.close();
}
{
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  ok(/from = "\/s\/:servico"[\s\S]*?to = "\/\?servico=:servico&abrir=form"/.test(toml) && /from = "\/orcamento"/.test(toml) && /from = "\/horarios"[\s\S]*?to = "\/#horarios"/.test(toml) && /from = "\/indicar"[\s\S]*?minha\/#indique/.test(toml) && /from = "\/minha-indycar"/.test(toml), 'netlify.toml: atalhos /s/<serviço>, /orcamento, /horarios, /indicar e /minha-indycar');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ld = JSON.parse(/<script type="application\/ld\+json">\s*(\{[\s\S]*?"@type": "AutoRepair"[\s\S]*?\n\})\s*<\/script>/.exec(html)[1]);
  ok(ld.potentialAction && ld.potentialAction.target.urlTemplate === 'https://indycar-taubate.netlify.app/agendar' && !('priceRange' in ld), 'JSON-LD: ação "Pedir horário" (ReserveAction → /agendar) e sem faixa de preço inventada');
  ok(/hreflang="pt-BR"/.test(html) && /geo\.region" content="BR-SP"/.test(html), 'SEO local: hreflang pt-BR e geo.region BR-SP');
  const priv = fs.readFileSync(path.join(ROOT, 'privacidade.html'), 'utf8');
  ok(!/não envia nada para servidor nenhum/.test(priv) && /envia o pedido direto para o sistema da oficina/.test(priv) && /placa/.test(priv) && /horários livres/i.test(priv), 'privacidade diz a verdade: o formulário envia o pedido ao sistema da oficina (placa, horário, hash de rede) e os horários só mostram dia e hora');
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  ok(man.shortcuts.some(x => x.url === '/horarios') && man.shortcuts.length <= 4, 'manifesto: atalho "Horários livres" e no máximo 4 atalhos');
  ok(fs.readFileSync(path.join(ROOT, '404.html'), 'utf8').includes('href="/#horarios"'), '404 oferece os horários livres');
  ok(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').includes('<lastmod>2026-10-21</lastmod>'), 'sitemap com lastmod de hoje');
  ok(html.includes('<noscript><p class="sem-js">') && html.includes('href="tel:+551236245957"') && html.includes('href="tel:+5512996830272"'), 'sem JavaScript aparece o aviso com WhatsApp e telefone; o celular tem link "Ligar" (tel:)');
  ok(toml.includes('Link = "</fontes/archivo-variavel.woff2>') && toml.includes('inter-variavel.woff2>; rel=preload'), 'netlify.toml: cabeçalho Link pré-carrega as duas fontes da primeira dobra');
  const urlsServico = (ld.hasOfferCatalog.itemListElement || []).map(o => o.itemOffered.url);
  ok(urlsServico.length === 12 && urlsServico.every(u => /^https:\/\/indycar-taubate\.netlify\.app\/#svc-[a-z-]+$/.test(u)) && urlsServico.every(u => html.includes('id="' + u.split('#')[1] + '"')), 'JSON-LD: cada um dos 12 serviços tem endereço próprio (#svc-…) que existe na página');
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  ok(['/s/', '/agendar', '/orcamento', '/horarios', '/indicar'].every(p => robots.includes('Disallow: ' + p)) && robots.includes('Sitemap:'), 'robots.txt: atalhos que só redirecionam fora do Google e sitemap mantido');
  ok(html.includes('href="#areaCola"') && html.includes('minha/#indique') && html.includes('name="application-name"'), 'rodapé e Área do Cliente: "Colar link ou código", "Indicar um amigo" (Minha IndyCar) e nome do app');
  ok(/pedido de horário direto para a oficina/.test(priv), 'privacidade: descrição da página também diz a verdade');
  const fn = fs.readFileSync(path.join(ROOT, 'supabase/functions/site-lead/index.ts'), 'utf8');
  ok(fn.includes('semControle(') && fn.includes("'Retry-After'"), 'Edge Function: texto sem caracteres de controle/invisíveis e Retry-After no 429');
  ok(fn.includes('venceEm('), 'Edge Function: a tarefa vence antes do horário pedido (hoje)');
  ok(/servico_id: servicoId/.test(fn) && /horario_livre/.test(fn), 'Edge Function: serviço do cadastro (servico_id) e rastro do horário/placa em site_pedidos');
  ok(/rota === 'horarios'/.test(fn) && /horarioLivre\(/.test(fn) && /linksDaEquipe\(/.test(fn) && /extrairPlaca/.test(fn), 'Edge Function: /horarios, conferência do horário, links da equipe e placa no lead');
}

console.log('\n== páginas extras ==');
for (const [rota, texto] of [['/privacidade.html', 'Privacidade'], ['/nao-existe', 'saiu da pista']]) {
  const { page, erros } = await abrir(375, 812, BASE + rota);
  const t = await page.evaluate(() => document.body.innerText);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const errosReais = erros.filter(e => !(rota === '/nao-existe' && /404/.test(e)));
  ok(t.includes(texto) && sw && errosReais.length === 0, `${rota} abre limpa em 375 px`);
  if (rota === '/nao-existe') {
    const l404 = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    ok(l404.includes('https://indycar-patio.netlify.app/acompanhar/') && l404.includes('https://indycar-patio.netlify.app/minha/') && l404.includes('/#servicos') && l404.some(h => /wa\.me.*site%2F404/.test(h)), '404 oferece os caminhos mais procurados (serviços, Área do Cliente, contato, WhatsApp)');
  }
  await page.close();
}
for (const f of ['robots.txt', 'sitemap.xml', 'og-indycar.jpg', 'manifest.webmanifest']) ok(fs.existsSync(path.join(ROOT, f)), `${f} existe`);
const ignorar = fs.readFileSync(path.join(ROOT, '.netlifyignore'), 'utf8');
ok(['scripts/**', '.publicacao.zip', 'qa-out/**', 'package.json'].every(p => ignorar.includes(p)), '.netlifyignore exclui testes e sobras locais');

await browser.close();
server.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
