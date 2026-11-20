// Teste da rodada 9 (19-20/11/2026): o que a frente R9-site mudou e que nenhum teste cobria. `npm test` roda este por último.
//
// Mesmo método das outras suítes (servidor local, Chrome instalado, puppeteer-core), com a rede de fora DESLIGADA:
//  - o Chrome sobe com a resolução de nomes só para 127.0.0.1 (nem o banco, nem o WhatsApp, nem o Google recebem nada);
//  - a consulta de horários é respondida dentro da página com dados de mentira;
//  - qualquer envio ao banco da oficina (mesma regra do barreira-banco.mjs) recebe uma resposta falsa ou "sem rede" e é
//    contado; nada é gravado em lugar nenhum;
//  - cada cenário roda num contexto novo do navegador (o que fica guardado no aparelho não passa de um para o outro).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { BANCO } from './barreira-banco.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };
// O CSP de verdade (netlify.toml): um estilo ou script fora da regra quebra aqui também.
const CSP = (/Content-Security-Policy = "([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8')) || [])[1] || '';

let falhas = 0, feitos = 0;
const ok = (cond, msg) => { feitos++; console.log((cond ? '  ok  ' : '  FALHOU ') + msg); if (!cond) falhas++; };
const titulo = (t) => console.log('\n== ' + t + ' ==');
const espera = (ms) => new Promise(r => setTimeout(r, ms));
async function ate(cond, ms = 6000, passo = 50) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await cond()) return true; await espera(passo); } return !!(await cond()); }
const barrados = [], errosDePagina = [];

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, url === '/' ? 'index.html' : url.replace(/^\/+/, ''));
  let status = 200;
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { f = path.join(ROOT, '404.html'); status = 404; }
  res.writeHead(status, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', 'content-security-policy': CSP });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', '--no-first-run'],
});

const DIAS = [{ data: '2026-11-23', rotulo: 'seg 23/11', horas: ['08:00', '09:30', '10:00', '14:00'] }, { data: '2026-11-24', rotulo: 'ter 24/11', horas: ['08:00', '11:00'] }];
/**
 * Abre a página num contexto novo. op: { w, h, caminho, data (ISO fixa), movimento, convite, semRede, horarios, antes }
 */
async function abrir(op = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.__ctx = ctx;
  page.__posts = [];
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.startsWith(BASE)) return r.continue();
    if (u.startsWith(BANCO) && u.includes('/horarios') && r.method() === 'GET') {
      return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, atualizado_em: '2026-11-19T13:00:00Z', dias: op.horarios || DIAS }) });
    }
    if (u.startsWith(BANCO) && !['GET', 'HEAD', 'OPTIONS'].includes(r.method())) {
      barrados.push(r.method() + ' ' + u.slice(BANCO.length)); page.__posts.push(r.postData() || '');
      if (op.semRede) return r.abort('internetdisconnected');
      return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, protocolo: 'QA0000', mensagem: 'Teste: nada foi para o banco.' }) });
    }
    if (u.startsWith(BANCO) && r.method() === 'OPTIONS') return r.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' } });
    return r.abort('blockedbyclient');
  });
  page.on('pageerror', e => errosDePagina.push(String(e).slice(0, 160)));
  await page.evaluateOnNewDocument((o) => {
    if (o.data) { const R = Date; const F = R.parse(o.data); globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(F); } static now() { return F; } }; }
    if (!o.convite) { try { sessionStorage.setItem('indycar_promo', '1'); } catch (_) {} }
    else { const st = window.setTimeout; window.setTimeout = (f, ms, ...a) => st(f, ms === 8000 ? 1500 : ms === 6000 ? 2000 : ms, ...a); } // convite: 8 s viram 1,5 s
    window.open = () => null; // a janela nova (WhatsApp) nunca abre no teste
    if (o.antes) { try { new Function(o.antes)(); } catch (_) {} }
  }, { data: op.data || '', convite: !!op.convite, antes: op.antes || '' });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: op.movimento ? 'no-preference' : 'reduce' }]);
  const w = op.w || 375;
  await page.setViewport({ width: w, height: op.h || (w < 768 ? 812 : 900), isMobile: w < 768, hasTouch: w < 768 });
  await page.goto(BASE + '/' + (op.caminho || ''), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await espera(400);
  return page;
}
const fechar = async (page) => { await page.__ctx.close(); };
const CONTRASTE = `(() => {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const rgb = s => s.match(/[\\d.]+/g).map(Number);
  const fundo = (el) => { for (let a = el; a; a = a.parentElement) { const v = rgb(getComputedStyle(a).backgroundColor); if (v.length === 3 || v[3] === 1) return v.slice(0, 3); } return [13, 14, 18]; };
  window.__contraste = (el) => { const L1 = lum(rgb(getComputedStyle(el).color)), L2 = lum(fundo(el)); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
})()`;

try {
  titulo('primeira tela: o botão principal aparece sem rolar');
  for (const [w, h] of [[375, 812], [360, 740], [1280, 720], [1440, 900]]) {
    const page = await abrir({ w, h });
    const r = await page.evaluate(() => { const b = document.querySelector('.hero-cta [data-open-modal]').getBoundingClientRect(); return { fundo: Math.round(b.bottom), tela: innerHeight }; });
    ok(r.fundo <= r.tela, `[${w}x${h}] "Agendar diagnóstico grátis" inteiro na primeira tela (termina em ${r.fundo} de ${r.tela} px)`);
    await fechar(page);
  }

  titulo('contadores: o número real já vem no HTML');
  {
    for (const movimento of [false, true]) {
      const page = await abrir({ movimento });
      const antes = await page.evaluate(() => [...document.querySelectorAll('.counter-num')].map(e => e.textContent.trim()).join('|'));
      ok(antes === '4,8|1.200|18|12', `${movimento ? 'com animação' : 'menos movimento'}: antes de rolar até lá os contadores já mostram ${antes} (nunca 0)`);
      await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.querySelector('.counters').scrollIntoView({ block: 'center' }); });
      const fim = await ate(() => page.evaluate(() => [...document.querySelectorAll('.counter-num')].map(e => e.textContent.trim()).join('|') === '4,8|1.200|18|12'), 5000);
      ok(fim, `${movimento ? 'com animação' : 'menos movimento'}: depois de aparecer na tela, terminam em 4,8 · 1.200 · 18 · 12`);
      await fechar(page);
    }
  }

  titulo('menu do celular pelo teclado');
  {
    const page = await abrir({ w: 375 });
    const fechadoNoTab = await page.evaluate(() => getComputedStyle(document.querySelector('.nav-links')).visibility);
    ok(fechadoNoTab === 'hidden', 'gaveta fechada fica fora do Tab (visibility hidden), sem foco invisível nos links');
    let achou = false;
    for (let i = 0; i < 8 && !achou; i++) { await page.keyboard.press('Tab'); achou = await page.evaluate(() => document.activeElement && document.activeElement.id === 'hamburger'); }
    await page.keyboard.press('Enter'); await espera(500);
    const aberto = await page.evaluate(() => ({ foco: document.activeElement.classList.contains('nav-link'), rotulo: document.getElementById('hamburger').getAttribute('aria-label') }));
    ok(achou && aberto.foco, 'abrir o menu pelo teclado leva o foco ao primeiro link da gaveta');
    ok(aberto.rotulo === 'Fechar menu', 'com a gaveta aberta o botão se chama "Fechar menu"');
    await page.keyboard.press('Escape'); await espera(600);
    const depois = await page.evaluate(() => ({ foco: document.activeElement.id, rotulo: document.getElementById('hamburger').getAttribute('aria-label') }));
    ok(depois.foco === 'hamburger' && depois.rotulo === 'Abrir menu', 'Esc fecha, devolve o foco ao botão e o nome volta a "Abrir menu"');
    await fechar(page);
  }

  titulo('contraste e o que o leitor de tela lê');
  {
    const page = await abrir({ w: 1440 });
    await page.evaluate(CONTRASTE);
    const tags = await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')); return [...document.querySelectorAll('.section-tag')].filter(e => e.offsetParent && !e.closest('[hidden]')).map(e => [(e.closest('section') || {}).id || '?', +window.__contraste(e).toFixed(2)]); });
    const baixos = tags.filter(([, c]) => c < 4.5);
    ok(tags.length >= 8 && !baixos.length, `rótulo vermelho das seções com contraste de pelo menos 4,5 em ${tags.length} seções` + (baixos.length ? ': ' + baixos.map(b => b.join(' ')).join(', ') : ''));
    const wa = await page.evaluate(() => [...document.querySelectorAll('.btn-whatsapp, .wa-float')].map(e => ({ img: getComputedStyle(e).backgroundImage, c: window.__contraste(e) })));
    ok(wa.length >= 3 && wa.every(x => x.img === 'none' && x.c >= 4.5), `botões de WhatsApp em verde sólido com o branco em contraste de pelo menos 4,5 (${wa.map(x => x.c.toFixed(1)).join(', ')})`);
    const lidos = await page.evaluate(() => {
      const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!/[★☆✓✔→←]/.test(n.nodeValue)) continue;
        const el = n.parentElement;
        if (el.closest('script, style, noscript, [aria-hidden="true"], [hidden], [aria-label], [role="img"]')) continue;
        out.push((el.className || el.tagName) + ': ' + n.nodeValue.trim().slice(0, 30));
      }
      return out;
    });
    ok(!lidos.length, 'estrelas, ✓ e setas decorativas ficam fora do leitor de tela' + (lidos.length ? ': ' + lidos.slice(0, 4).join(' | ') : ''));
    const regiao = await page.evaluate(() => { const h = document.getElementById('horarios'); return h.getAttribute('role') + ' ' + !!document.getElementById(h.getAttribute('aria-labelledby')); });
    ok(regiao === 'region true', 'a caixa "Próximos horários livres" é uma região com nome (aria-labelledby num div sem papel é ignorado)');
    await fechar(page);
  }

  titulo('no computador, nenhum link solto com menos de 24 px (WCAG 2.2, 2.5.8)');
  {
    const page = await abrir({ w: 1440 });
    await espera(1500);
    const pequenos = await page.evaluate(() => {
      document.documentElement.classList.add('cv-off'); document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
      const out = [];
      for (const e of document.querySelectorAll('a[href], button, select, input:not([type=hidden]), textarea')) {
        const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
        if (!r.width || cs.visibility === 'hidden' || e.closest('[hidden], .campo-isca, .modal-backdrop:not(.open), .so-leitor, [aria-hidden="true"]')) continue;
        const noMeioDoTexto = cs.display === 'inline' && e.parentElement && e.parentElement.textContent.trim().length > e.textContent.trim().length + 3;
        if ((r.height < 24 || r.width < 24) && !noMeioDoTexto) out.push(e.tagName + ' "' + e.textContent.trim().slice(0, 24) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      return out;
    });
    ok(!pequenos.length, 'links e botões soltos com pelo menos 24x24 px no computador' + (pequenos.length ? ': ' + pequenos.slice(0, 5).join(' | ') : ''));
    await fechar(page);
  }

  titulo('faixa vermelha que corre: para com o mouse e com um toque');
  for (const [w, toque] of [[1440, false], [375, true]]) {
    const page = await abrir({ w, movimento: true });
    const tx = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.trust-track')).transform).m41);
    await page.mouse.move(5, 5); await page.evaluate(() => document.querySelector('.trust-bar').scrollIntoView({ block: 'center' }));
    await ate(() => page.evaluate(() => document.querySelector('.trust-track').classList.contains('js-marquee')), 9000);
    await espera(600);
    const box = await (await page.$('.trust-bar')).boundingBox();
    const a0 = await tx(); await espera(400); const a1 = await tx();
    if (toque) await page.touchscreen.tap(box.x + 40, box.y + box.height / 2); else await page.mouse.move(box.x + 300, box.y + box.height / 2);
    await espera(300); const b0 = await tx(); await espera(600); const b1 = await tx();
    if (toque) await page.touchscreen.tap(box.x + 40, box.y + box.height / 2); else await page.mouse.move(box.x + 300, box.y - 200);
    await espera(300); const c0 = await tx(); await espera(600); const c1 = await tx();
    ok(a0 !== a1 && b0 === b1 && c0 !== c1, `[${w}] a faixa anda, para ${toque ? 'com um toque' : 'com o mouse em cima'} e volta ${toque ? 'com outro toque' : 'quando o mouse sai'}`);
    await fechar(page);
  }

  titulo('formulário');
  {
    const page = await abrir({ w: 375 });
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(700);
    await page.focus('#fName'); await page.keyboard.type('Maria Teste'); await page.keyboard.press('Enter'); await espera(150);
    const f1 = await page.evaluate(() => document.activeElement.id);
    ok(f1 === 'fPhone', 'Enter no nome leva ao campo do WhatsApp (o teclado do celular mostra "próximo")');
    await page.evaluate(() => document.getElementById('fEnviar').click()); await espera(300);
    const vazio = await page.evaluate(() => { const e = document.getElementById('fPhoneErr'); return e.hidden ? '' : e.textContent; });
    await page.focus('#fPhone'); await page.keyboard.type('012 99683-0272'); await page.keyboard.press('Enter'); await espera(150);
    const f2 = await page.evaluate(() => document.activeElement.id);
    await page.select('#fService', 'Freios (pastilhas e discos)');
    await page.focus('#fPlaca'); await page.keyboard.type('ABC1D23'); await page.keyboard.press('Enter'); await espera(300);
    const f3 = await page.evaluate(() => ({ foco: document.activeElement.id, enviado: !document.getElementById('formOk').hidden }));
    ok(f2 === 'fService' && f3.foco === 'fQuando' && !f3.enviado && !page.__posts.length, 'Enter no meio do formulário vai para o próximo campo e nunca envia o pedido pela metade');
    ok(/Precisamos do seu WhatsApp/.test(vazio), 'WhatsApp em branco tem aviso próprio ("Precisamos do seu WhatsApp com DDD..."), não "confira o número"');
    await espera(2600); // o tempo mínimo de preenchimento do formulário (anti-robô)
    await page.evaluate(() => document.getElementById('fEnviar').click());
    const foi = await ate(() => page.evaluate(() => !document.getElementById('formOk').hidden), 8000);
    const corpo = page.__posts.map(p => { try { return JSON.parse(p); } catch (_) { return {}; } }).find(p => p.telefone) || {};
    ok(foi && corpo.telefone === '12996830272', '"012 99683-0272" (com o zero do interurbano) é aceito e vai como 12996830272');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('form-ok-fechar')), 'pedido que chegou: o foco fica no "Fechar" (não há nada a fazer)');
    await fechar(page);
  }
  {
    const page = await abrir({ w: 375, semRede: true, movimento: true });
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(700);
    await page.type('#fName', 'Maria Teste'); await page.type('#fPhone', '12996830272'); await page.select('#fService', 'Freios (pastilhas e discos)');
    await espera(2600);
    // conta as faíscas que entram na página: o clique no botão solta 8 (ClickSpark); a festa de concluído, mais 22
    await page.evaluate(() => { window.__faiscas = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('spark')) window.__faiscas++; }))).observe(document.body, { childList: true }); });
    await page.click('#fEnviar');
    await ate(() => page.evaluate(() => !document.getElementById('formOk').hidden), 12000);
    await espera(300);
    const r = await page.evaluate(() => ({ titulo: document.getElementById('formOkTitulo').textContent, ico: document.querySelector('.form-ok-ico').hidden, faiscas: window.__faiscas }));
    ok(r.titulo === 'Falta só mandar no WhatsApp' && r.ico && r.faiscas <= 8, `sem rede o pedido não diz "Pedido enviado!": "${r.titulo}", sem o ✓ e sem a festa de concluído (${r.faiscas} faíscas, só as do clique)`);
    ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'formOkWa'), 'sem rede o foco vai para "Abrir no WhatsApp" (o que falta fazer), não para "Fechar"');
    await fechar(page);
  }

  {
    // pedido que ficou na fila do aparelho (sem rede) e é reenviado ao abrir a página: a pessoa fica sabendo que chegou
    const pedido = { nome: 'Maria Teste', telefone: '12996830272', servico: 'Freios (pastilhas e discos)', codigo: 'freios' };
    const page = await abrir({ w: 375, antes: `localStorage.setItem('indycar_fila', JSON.stringify([{ em: Date.now() - 60000, pedido: ${JSON.stringify(pedido)} }]))` });
    const chegou = await ate(() => page.evaluate(() => !document.getElementById('areaPedido').hidden), 15000);
    const r = await page.evaluate(() => ({ area: document.getElementById('areaPedidoTit').textContent, aviso: document.getElementById('spName').textContent, fila: localStorage.getItem('indycar_fila') }));
    ok(chegou && /QA0000/.test(r.area) && r.aviso === 'Seu pedido chegou à oficina' && !r.fila && page.__posts.length === 1, `pedido que esperava a rede: reenviado uma vez, aviso "${r.aviso}" e "${r.area}"`);
    await fechar(page);
  }

  titulo('convite do diagnóstico');
  {
    // a pessoa já está num campo quando a página termina de carregar (o convite estaria marcado para 1,5 s depois)
    const page = await abrir({ w: 375, convite: true, antes: "document.addEventListener('DOMContentLoaded', () => document.getElementById('areaColaCampo')?.focus())" });
    // confere 2,5 s depois do carregamento: o convite já tentou abrir uma vez (1,5 s) e adiou
    await ate(() => page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n && n.domContentLoadedEventEnd > 0 && performance.now() - n.domContentLoadedEventEnd > 2500; }), 9000);
    const r = await page.evaluate(() => ({ foco: document.activeElement.id, aberto: document.getElementById('promoBackdrop').classList.contains('open') }));
    await page.evaluate(() => document.activeElement.blur());
    const depois = await ate(() => page.evaluate(() => document.getElementById('promoBackdrop').classList.contains('open')), 6000);
    ok(r.foco === 'areaColaCampo' && !r.aberto && depois, 'o convite espera a pessoa sair do campo em que está digitando (não rouba o foco) e aparece depois');
    await fechar(page);
  }
  for (const [horas, deve] of [[2, false], [40, true]]) {
    const page = await abrir({ w: 375, convite: true, antes: `localStorage.setItem('indycar_pedido', JSON.stringify({ em: Date.now() - ${horas} * 3600000, protocolo: 'QA1234' }))` });
    const abrindo = () => page.evaluate(() => document.getElementById('promoBackdrop').classList.contains('open'));
    const abriu = deve ? await ate(abrindo, 7000) : (await espera(3500), await abrindo());
    ok(abriu === deve, deve ? 'com um pedido de 40 h atrás o convite volta a aparecer' : 'quem mandou um pedido há 2 h neste aparelho não recebe o convite');
    await fechar(page);
  }

  titulo('horários e feriados (data fixa)');
  {
    const page = await abrir({ w: 375, horarios: [] });
    await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('diagnostico').scrollIntoView(); });
    const cheia = await ate(() => page.evaluate(() => !!document.querySelector('#horariosLista a[href*="wa.me"]')), 8000);
    const sub = await page.evaluate(() => document.querySelector('#horarios .horarios-sub').hidden);
    ok(cheia && sub, 'agenda cheia: o aviso leva ao WhatsApp (link) e o "Toque num horário" some');
    await fechar(page);
  }
  for (const [data, quando, chip, contato] of [
    ['2026-11-19T10:00:00-03:00', 'Amanhã', null, /^Amanhã é feriado \(Consciência Negra\)/],
    ['2026-11-19T19:10:00-03:00', null, 'amanhã é feriado', /^Amanhã é feriado/],
    ['2026-11-18T19:10:00-03:00', null, 'abre amanhã, 8h', /^Sexta, 20\/11, é feriado/],
    ['2027-02-06T18:00:00-03:00', null, 'segunda é feriado', /^Segunda, 08\/02, é feriado \(Carnaval\)/],
    ['2026-11-25T10:00:00-03:00', null, null, null],
  ]) {
    const page = await abrir({ w: 375, data });
    const r = await page.evaluate(() => ({
      ops: [...document.querySelectorAll('#fQuando option')].map(o => o.value + '=' + o.textContent.trim()),
      chip: document.querySelector('#statusAberto span').textContent, contato: (document.querySelector('.contato-feriado') || {}).textContent || null,
    }));
    const dia = data.slice(0, 16);
    if (quando) ok(r.ops.includes(quando + '=' + quando + ' (feriado: a equipe confirma)') && r.ops.includes('Hoje=Hoje'), `[${dia}] "Quando prefere?": "Amanhã" avisa que é feriado e continua enviando "Amanhã"`);
    if (chip) ok(r.chip === chip, `[${dia}] chip do topo fechado: "${r.chip}"`);
    ok(contato ? contato.test(r.contato || '') : r.contato === null, `[${dia}] horário do contato: ${r.contato ? '"' + r.contato.slice(0, 48) + '..."' : 'sem aviso de feriado na semana'}`);
    await fechar(page);
  }
  {
    const page = await abrir({ w: 375, data: '2026-11-20T10:00:00-03:00' });
    const r = await page.evaluate(() => { const c = document.getElementById('statusAberto'); const s = c.querySelector('span').getBoundingClientRect(), cr = c.getBoundingClientRect(); return { texto: c.textContent.replace(/\s+/g, ' ').trim(), cabe: s.right <= cr.right + 1 && cr.right <= innerWidth }; });
    ok(/Hoje é feriado/.test(r.texto) && r.cabe, 'em feriado o chip do topo quebra em duas linhas e o "confirme no WhatsApp se abrimos" não sai cortado no celular');
    await fechar(page);
  }

  for (const [data, esperado] of [['2026-11-21T19:00:00-03:00', 'Semana que vem'], ['2026-11-22T10:00:00-03:00', 'Semana que vem'], ['2026-11-18T10:00:00-03:00', 'Esta semana']]) {
    const page = await abrir({ w: 375, data });
    const ops = await page.evaluate(() => [...document.querySelectorAll('#fQuando option')].map(o => o.value + '=' + o.textContent.trim()));
    ok(ops.includes(esperado + ', de manhã=' + esperado + ', de manhã') && ops.includes(esperado + ', à tarde=' + esperado + ', à tarde'), `[${data.slice(0, 16)}] "Quando prefere?" oferece "${esperado}, de manhã / à tarde"`);
    await fechar(page);
  }

  titulo('mapa, roteador de links e voltar ao topo');
  {
    const page = await abrir({ w: 375 });
    await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('mapLoad').click(); });
    const ref = await ate(() => page.evaluate(() => { const f = document.querySelector('#mapBox iframe'); return f && f.referrerPolicy === 'strict-origin-when-cross-origin'; }), 4000);
    ok(ref, 'o mapa do Google carrega com referrerPolicy strict-origin-when-cross-origin (o Google não recebe o endereço completo com utm/gclid)');
    const rota = await page.evaluate(() => { const a = document.querySelector('#mapBox .map-rota'); if (!a) return null; const r = a.getBoundingClientRect(); return { href: a.href, alt: Math.round(r.height), vis: getComputedStyle(a).visibility }; });
    ok(!!rota && /\/maps\/dir\//.test(rota.href) && rota.alt >= 44 && rota.vis === 'visible', 'com o mapa aberto, o "Traçar rota" continua à mão, por cima do mapa (' + (rota ? rota.alt + ' px' : 'sumia') + ')');
    const cola = await page.evaluate(() => {
      const f = document.getElementById('areaCola'), c = document.getElementById('areaColaCampo'), m = document.getElementById('areaColaMsg');
      f.requestSubmit(); const vazio = m.textContent;
      c.value = 'a'.repeat(32); f.requestSubmit();
      const a = m.querySelector('a');
      return { vazio, link: a ? a.textContent + ' ' + a.href : '' };
    });
    ok(/^Cole aqui o link ou o código/.test(cola.vazio), '"Abrir" com o campo vazio pede para colar (não diz "não reconheci")');
    ok(/^toque aqui https:\/\/indycar-orcador\.netlify\.app\/#\/o\/a{32}$/.test(cola.link), 'se o navegador barrar a janela nova, fica o link "toque aqui" para o mesmo endereço');
    const topo = await page.evaluate(async () => {
      document.activeElement.blur(); scrollTo(0, 0); window.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 700));
      const b = document.getElementById('toTop'); b.focus(); const antes = document.activeElement === b;
      scrollTo(0, 2500); window.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 700));
      b.focus(); return { antes, depois: document.activeElement === b };
    });
    ok(!topo.antes && topo.depois, '"Voltar ao topo" escondido não recebe foco; depois de rolar, recebe');
    await fechar(page);
  }

  titulo('página 404');
  {
    const page = await abrir({ w: 375, caminho: 'pagina-que-nao-existe' });
    const r = await page.evaluate(() => {
      const acoes = document.querySelector('.acoes'), dica = document.querySelector('.dica-codigo');
      const rod = [...document.querySelectorAll('footer a')].map(a => Math.round(a.getBoundingClientRect().height));
      return { ordem: !!(acoes && dica && (acoes.compareDocumentPosition(dica) & Node.DOCUMENT_POSITION_FOLLOWING)), rod, fonte: getComputedStyle(document.body).fontFamily };
    });
    ok(r.ordem, '404: "Voltar ao site" e WhatsApp vêm antes da dica do código');
    ok(r.rod.length && r.rod.every(h => h >= 44), '404: link do rodapé com área de toque de 44 px (' + r.rod.join(', ') + ')');
    ok(/Archivo/.test(r.fonte), '404: mesma fonte do site (Archivo), não a do sistema');
    await fechar(page);
  }

  titulo('fim');
  ok(!errosDePagina.length, 'nenhum erro de JavaScript nas páginas abertas' + (errosDePagina.length ? ': ' + [...new Set(errosDePagina)].slice(0, 3).join(' | ') : ''));
  console.log(`  info ${barrados.length} envio(s) ao banco respondido(s) dentro do teste; nada saiu da máquina`);
} finally {
  await browser.close();
  server.close();
}

console.log('');
console.log(falhas ? `rodada 9: ${falhas} de ${feitos} conferências FALHARAM.` : `rodada 9: tudo certo (${feitos} conferências).`);
process.exit(falhas ? 1 : 0);
