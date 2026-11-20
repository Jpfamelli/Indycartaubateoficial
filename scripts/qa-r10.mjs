// Teste da rodada 10 (20/11/2026): conexões, segurança, desempenho e rede ruim. `npm test` roda este por último.
//
// Mesmo método do qa-r9: servidor local com os cabeçalhos do netlify.toml, Chrome instalado (puppeteer-core) e a rede de
// fora DESLIGADA (só 127.0.0.1 resolve). Horários e envio do pedido são respondidos dentro da página; qualquer envio ao
// banco da oficina (regra do barreira-banco.mjs) recebe uma resposta de mentira e é contado. Nada é gravado em lugar nenhum.
// Cada bloco tem o nome do teste citado no MELHORIAS.md (r10-...). QA_SO=r10-fila,r10-csp roda só esses blocos.
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
const SO = (process.env.QA_SO || '').split(',').filter(Boolean);

let falhas = 0, feitos = 0;
const ok = (cond, msg) => { feitos++; console.log((cond ? '  ok  ' : '  FALHOU ') + msg); if (!cond) falhas++; };
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
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
/**
 * Abre a página. op: { w, h, caminho, data (ISO fixa), movimento, convite, antes (código antes da página), ctx (reusar o
 * contexto: outra aba do mesmo navegador), semJs, horarios (dias), horariosFora (true = a consulta falha),
 * resposta: { status, corpo, atraso } ou 'semrede' para o envio do pedido }. O que a página manda fica em page.__posts.
 * page.__op pode ser trocado no meio do teste (a rede "volta").
 */
async function abrir(op = {}) {
  const ctx = op.ctx || await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.__ctx = ctx; page.__posts = []; page.__csp = []; page.__op = op; page.__horarios = 0;
  if (op.semJs) await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', async (r) => {
    const u = r.url(), o = page.__op;
    if (u.startsWith(BASE)) return r.continue();
    if (u.startsWith(BANCO) && r.method() === 'OPTIONS') return r.respond({ status: 204, headers: CORS });
    if (u.startsWith(BANCO) && u.includes('/horarios') && r.method() === 'GET') {
      page.__horarios++;
      if (o.horariosFora) return r.abort('internetdisconnected');
      return r.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ ok: true, atualizado_em: '2026-11-19T13:00:00Z', dias: o.horarios || DIAS }) });
    }
    if (u.startsWith(BANCO) && !['GET', 'HEAD'].includes(r.method())) {
      barrados.push(r.method() + ' ' + u.slice(BANCO.length)); page.__posts.push(r.postData() || '');
      const resp = o.resposta || {};
      if (resp === 'semrede') return r.abort('internetdisconnected');
      if (resp.atraso) await espera(resp.atraso);
      return r.respond({ status: resp.status || 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(resp.corpo || { ok: true, protocolo: 'QA0000', mensagem: 'Teste: nada foi para o banco.' }) }).catch(() => {});
    }
    return r.abort('blockedbyclient');
  });
  page.on('pageerror', e => errosDePagina.push(String(e).slice(0, 160)));
  page.on('console', m => { if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) page.__csp.push(m.text().slice(0, 200)); });
  await page.evaluateOnNewDocument((o) => {
    if (o.data) { const R = Date; const F = R.parse(o.data); globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(F); } static now() { return F; } }; }
    if (!o.convite) { try { sessionStorage.setItem('indycar_promo', '1'); } catch (_) {} }
    window.__abertas = []; window.open = (u) => { window.__abertas.push(String(u)); return null; }; // a janela nova (WhatsApp) nunca abre no teste
    if (o.antes) { try { new Function(o.antes)(); } catch (_) {} }
  }, { data: op.data || '', convite: !!op.convite, antes: op.antes || '' });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: op.movimento ? 'no-preference' : 'reduce' }]);
  const w = op.w || 375;
  await page.setViewport({ width: w, height: op.h || (w < 768 ? 812 : 900), isMobile: w < 768, hasTouch: w < 768 });
  await page.goto(BASE + '/' + (op.caminho || ''), { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (!op.semJs) await page.evaluate(() => document.fonts && document.fonts.ready);
  await espera(400);
  return page;
}
const fechar = async (page) => { await page.__ctx.close().catch(() => {}); };
const abrirForm = async (page) => { await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(700); };
/** Preenche o pedido de sempre e espera o tempo mínimo (anti-robô) antes de quem chamou tocar em enviar. */
async function preencher(page, o = {}) {
  await abrirForm(page);
  await page.type('#fName', o.nome || 'Maria Teste'); await page.type('#fPhone', o.tel || '12996830272'); await page.select('#fService', o.servico || 'Freios (pastilhas e discos)');
  await espera(2600);
}
const enviar = async (page) => { await page.evaluate(() => document.getElementById('fEnviar').click()); };
const confirmacao = (page) => page.evaluate(() => ({ visivel: !document.getElementById('formOk').hidden, titulo: document.getElementById('formOkTitulo').textContent, texto: document.getElementById('formOkTexto').textContent, fila: JSON.parse(localStorage.getItem('indycar_fila') || '[]').length, abertas: window.__abertas.length }));
const esperarConfirmacao = (page) => ate(() => page.evaluate(() => !document.getElementById('formOk').hidden), 12000);

const FOTOS = process.env.QA_FOTOS ? path.join(ROOT, 'qa-out', 'r10') : ''; // QA_FOTOS=1 guarda capturas em qa-out/r10/
const foto = async (page, nome) => { if (FOTOS) { fs.mkdirSync(FOTOS, { recursive: true }); await page.screenshot({ path: path.join(FOTOS, nome + '.png') }); } };
const blocos = [];
/** bloco('r10-nome', async () => {...}): um bloco por teste citado no MELHORIAS.md. */
const bloco = (nome, fn) => blocos.push([nome, fn]);

// ===================================================================== blocos =====================================================================

bloco('r10-limite', async () => {
  const erro = 'Recebemos vários pedidos deste aparelho agora. Se quiser, chame a gente direto no WhatsApp.';
  const page = await abrir({ resposta: { status: 429, corpo: { ok: false, erro } } });
  await preencher(page); await enviar(page); await esperarConfirmacao(page); await espera(300);
  const r = await confirmacao(page);
  ok(r.visivel && r.texto.includes('Recebemos vários pedidos') && !/internet/i.test(r.texto), 'r10-limite: limite de pedidos (429) mostra o motivo que o servidor deu, não "a internet não deixou": "' + r.texto.slice(0, 90) + '…"');
  ok(r.abertas === 1 && r.titulo === 'Falta só mandar no WhatsApp', 'r10-limite: o WhatsApp abre com a mensagem pronta (a pessoa não fica sem caminho)');
  ok(r.fila === 0, 'r10-limite-fila: pedido barrado pelo limite não entra na fila de reenvio (reenviar sozinho só bateria no limite de novo)');
  await fechar(page);
});

bloco('r10-servidor', async () => {
  const page = await abrir({ resposta: { status: 500, corpo: { ok: false, erro: 'Não conseguimos registrar agora. Chame a gente no WhatsApp.' } } });
  await preencher(page); await enviar(page); await esperarConfirmacao(page); await espera(300);
  const r = await confirmacao(page);
  ok(r.visivel && /sistema da oficina não respondeu/.test(r.texto) && !/internet não deixou/i.test(r.texto), 'r10-servidor: erro do servidor (500) não culpa a internet da pessoa: "' + r.texto.slice(0, 90) + '…"');
  ok(r.fila === 1 && r.abertas === 1, 'r10-servidor: o pedido fica guardado para o site tentar de novo e o WhatsApp abre');
  await fechar(page);
  const p2 = await abrir({ resposta: 'semrede' });
  await preencher(p2); await enviar(p2); await esperarConfirmacao(p2); await espera(300);
  const r2 = await confirmacao(p2);
  ok(/internet não deixou/i.test(r2.texto) && r2.fila === 1, 'r10-servidor: sem rede de verdade a mensagem continua falando da internet');
  await fechar(p2);
});

bloco('r10-campo', async () => {
  for (const [erro, campo] of [['Conta pra gente o seu nome.', 'fName'], ['Confira o número com DDD (10 ou 11 dígitos).', 'fPhone'], ['Escolha o serviço (ou "Outro / Não sei ainda").', 'fService']]) {
    const page = await abrir({ resposta: { status: 400, corpo: { ok: false, erro } } });
    await preencher(page); await enviar(page);
    await ate(() => page.evaluate(() => !document.getElementById('fEnvioMsg').hidden), 8000);
    const r = await page.evaluate((id) => ({ aviso: document.getElementById('fEnvioMsg').textContent, foco: document.activeElement.id, inv: document.getElementById(id).getAttribute('aria-invalid'), ok: !document.getElementById('formOk').hidden, btn: document.getElementById('fEnviar').disabled }), campo);
    ok(r.aviso === erro && r.foco === campo && r.inv === 'true' && !r.ok && !r.btn, `r10-campo: o servidor recusou ("${erro.slice(0, 28)}…"): o campo ${campo} fica marcado e com o foco (foco em ${r.foco}, aria-invalid ${r.inv})`);
    await fechar(page);
  }
});

bloco('r10-abas', async () => {
  // duas abas do mesmo navegador com o mesmo pedido esperando na fila: só uma reenvia
  const pedido = { nome: 'Maria Teste', telefone: '12996830272', servico: 'Freios (pastilhas e discos)', codigo: 'freios', decorrido: 5000 };
  const antes = `if (!localStorage.getItem('indycar_fila') && !sessionStorage.getItem('ja')) localStorage.setItem('indycar_fila', JSON.stringify([{ em: Date.now() - 60000, pedido: ${JSON.stringify(pedido)} }])); sessionStorage.setItem('ja', '1');`;
  const a = await abrir({ antes, resposta: { atraso: 2500 } });
  const b = await abrir({ ctx: a.__ctx, antes, resposta: { atraso: 2500 } });
  // as duas tentam no mesmo instante (a rede "voltou" para as duas)
  await Promise.all([a, b].map(p => p.evaluate(() => { window.dispatchEvent(new Event('online')); })));
  await ate(async () => !(await a.evaluate(() => localStorage.getItem('indycar_fila'))), 12000);
  await espera(4500); // passa do reenvio automático de 6 s das duas abas
  const fila = await a.evaluate(() => localStorage.getItem('indycar_fila'));
  ok(a.__posts.length + b.__posts.length === 1 && !fila, `r10-abas: com duas abas abertas o pedido da fila é reenviado uma vez só (foram ${a.__posts.length + b.__posts.length} envios; fila ${fila ? 'ainda cheia' : 'vazia'})`);
  await fechar(a);
});

bloco('r10-fila-repetido', async () => {
  const page = await abrir({ resposta: 'semrede' });
  for (let i = 0; i < 2; i++) {
    await preencher(page); await enviar(page); await esperarConfirmacao(page); await espera(300);
    await page.evaluate(() => document.querySelector('#formOk .form-ok-fechar').click()); await espera(900);
  }
  const f1 = await page.evaluate(() => JSON.parse(localStorage.getItem('indycar_fila') || '[]').length);
  ok(f1 === 1, `r10-fila-repetido: o mesmo pedido enviado duas vezes sem rede fica uma vez só na fila (ficaram ${f1})`);
  await preencher(page, { servico: 'Pneus' }); await enviar(page); await esperarConfirmacao(page); await espera(300);
  const f2 = await page.evaluate(() => JSON.parse(localStorage.getItem('indycar_fila') || '[]').map(x => x.pedido.servico).join(' + '));
  ok(f2 === 'Freios (pastilhas e discos) + Pneus', 'r10-fila-repetido: pedido de outro serviço continua entrando na fila (' + f2 + ')');
  await fechar(page);
});

bloco('r10-semrede-aviso', async () => {
  const page = await abrir({});
  await abrirForm(page);
  const antes = await page.evaluate(() => { const e = document.getElementById('fSemRede'); return !!e && getComputedStyle(e).display !== 'none'; });
  await page.setOfflineMode(true); await espera(300);
  const fora = await page.evaluate(() => { const e = document.getElementById('fSemRede'); return e ? { v: getComputedStyle(e).display !== 'none', t: e.textContent, acima: e.getBoundingClientRect().bottom <= document.getElementById('fEnviar').getBoundingClientRect().top + 1 } : {}; });
  await page.evaluate(() => document.getElementById('fSemRede').scrollIntoView({ block: 'center' })); await foto(page, 'form-sem-internet-depois-375');
  await page.setOfflineMode(false); await espera(300);
  const volta = await page.evaluate(() => { const e = document.getElementById('fSemRede'); return !!e && getComputedStyle(e).display !== 'none'; });
  ok(!antes && fora.v && /sem internet/.test(fora.t || '') && fora.acima && !volta, 'r10-semrede-aviso: sem internet o formulário avisa, antes do botão, que o pedido vai sair pelo WhatsApp; com rede o aviso some');
  await fechar(page);
});

bloco('r10-horarios-voltam', async () => {
  const page = await abrir({ horariosFora: true });
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('diagnostico').scrollIntoView(); });
  const sumiu = await ate(() => page.evaluate(() => document.getElementById('horarios').hidden), 10000);
  page.__op = {};
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  const voltou = await ate(() => page.evaluate(() => !document.getElementById('horarios').hidden && document.querySelectorAll('#horariosLista .horario-chip').length > 0), 6000);
  const links = await page.evaluate(() => [...document.querySelectorAll('[data-so-horarios]')].every(e => !e.hidden));
  ok(sumiu && voltou && links, 'r10-horarios-voltam: a rede voltou e os horários livres reaparecem sozinhos, com os links "Ver horários livres" (sem recarregar a página)');
  await fechar(page);
});

bloco('r10-horarios-repintam', async () => {
  // a consulta funciona, falha uma vez (sinal ruim) e volta com a MESMA lista: a caixa tem de reaparecer
  const page = await abrir({ antes: 'window.__horariosTtl = 0;' });
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('diagnostico').scrollIntoView(); });
  const pintou = await ate(() => page.evaluate(() => document.querySelectorAll('#horariosLista .horario-chip').length > 0), 10000);
  page.__op = { horariosFora: true };
  await abrirForm(page);
  const sumiu = await ate(() => page.evaluate(() => document.getElementById('horarios').hidden), 6000);
  await page.keyboard.press('Escape'); await espera(700);
  page.__op = {};
  await abrirForm(page);
  const voltou = await ate(() => page.evaluate(() => !document.getElementById('horarios').hidden && document.querySelectorAll('#horariosLista .horario-chip').length > 0), 6000);
  ok(pintou && sumiu && voltou, `r10-horarios-repintam: depois de uma falha passageira a caixa de horários volta na consulta seguinte (pintou ${pintou}, sumiu ${sumiu}, voltou ${voltou})`);
  await fechar(page);
});

bloco('r10-mapa-semrede', async () => {
  const page = await abrir({});
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('mapBox').scrollIntoView({ block: 'center' }); });
  await page.setOfflineMode(true); await espera(200);
  await page.evaluate(() => document.getElementById('mapLoad').click()); await espera(300);
  const fora = await page.evaluate(() => ({ quadro: !!document.querySelector('#mapBox iframe'), nota: document.querySelector('#mapBox .map-ph small').textContent, capa: getComputedStyle(document.querySelector('#mapBox .map-ph')).display !== 'none' }));
  ok(!fora.quadro && fora.capa && /Sem internet/.test(fora.nota), 'r10-mapa-semrede: sem internet "Ver mapa aqui" não troca o endereço por uma página de erro: avisa e mantém a capa ("' + fora.nota.slice(0, 40) + '…")');
  await page.setOfflineMode(false); await espera(200);
  await page.evaluate(() => document.getElementById('mapLoad').click()); await espera(300);
  ok(await page.evaluate(() => document.querySelectorAll('#mapBox iframe').length === 1), 'r10-mapa-semrede: com a rede de volta o mesmo botão abre o mapa');
  await fechar(page);
});

bloco('r10-csp', async () => {
  // as páginas inteiras com o CSP do netlify.toml: nada barrado e o estilo que saiu do <style> continua valendo
  const semInline = !CSP.includes('unsafe-inline');
  const vigia = `window.__viol = []; document.addEventListener('securitypolicyviolation', e => window.__viol.push(e.violatedDirective + ' ' + e.blockedURI));`;
  const p404 = await abrir({ caminho: 'nao-existe', antes: vigia });
  const r404 = await p404.evaluate(() => ({ viol: window.__viol, cor: getComputedStyle(document.querySelector('.n')).color, fonte: getComputedStyle(document.body).fontFamily, grade: getComputedStyle(document.querySelector('.links')).display }));
  ok(semInline && !r404.viol.length && !p404.__csp.length && r404.cor === 'rgb(229, 9, 20)' && /Archivo/.test(r404.fonte) && r404.grade === 'grid', `r10-csp: 404 com o estilo no arquivo próprio e CSP sem 'unsafe-inline' (barrados: ${r404.viol.length + p404.__csp.length}; "404" em ${r404.cor})`);
  await fechar(p404);
  const pp = await abrir({ caminho: 'privacidade.html', antes: vigia });
  const rp = await pp.evaluate(() => ({ viol: window.__viol, fundo: getComputedStyle(document.body).backgroundColor, larg: Math.round(document.querySelector('main').getBoundingClientRect().width), fonte: getComputedStyle(document.querySelector('h1')).fontFamily }));
  ok(semInline && !rp.viol.length && !pp.__csp.length && rp.fundo === 'rgb(13, 14, 18)' && /Archivo/.test(rp.fonte), `r10-csp: privacidade com o estilo no arquivo próprio (barrados: ${rp.viol.length + pp.__csp.length}; fundo ${rp.fundo})`);
  await fechar(pp);
  const pi = await abrir({ antes: vigia, movimento: true, w: 1280 });
  await pi.evaluate(() => { document.documentElement.classList.add('cv-off'); window.scrollTo(0, document.body.scrollHeight); });
  await espera(1500);
  await abrirForm(pi);
  await pi.keyboard.press('Escape'); await espera(500);
  await pi.evaluate(() => document.getElementById('mapLoad').click()); await espera(400);
  const ri = await pi.evaluate(() => ({ viol: window.__viol, mapa: (document.querySelector('#mapBox iframe') || {}).src || '' }));
  ok(semInline && !ri.viol.length && !pi.__csp.length, `r10-csp: página principal inteira (efeitos, formulário, mapa) sem nada barrado pelo CSP` + (ri.viol.length ? ': ' + ri.viol.slice(0, 3).join(' | ') : ''));
  ok(ri.mapa.startsWith('https://www.google.com/maps?') && /frame-src https:\/\/www\.google\.com;/.test(CSP), 'r10-csp-dominios: o mapa entra direto por www.google.com (sem o redirecionamento de maps.google.com) e é a única origem liberada para quadro');
  await fechar(pi);
  const ps = await abrir({ semJs: true });
  const rs = await ps.evaluate(() => ({ op: getComputedStyle(document.querySelector('#sobre .reveal')).opacity, menu: getComputedStyle(document.querySelector('.hamburger')).display, aviso: getComputedStyle(document.querySelector('.sem-js')).zIndex }));
  ok(semInline && rs.op === '1' && rs.menu === 'none' && rs.aviso === '950', `r10-csp: sem JavaScript a página continua aparecendo (seções com opacidade ${rs.op}, aviso por cima do menu), agora com o estilo vindo de sem-js.css`);
  await fechar(ps);
});

// ===================================================================== fim =====================================================================
try {
  for (const [nome, fn] of blocos) {
    if (SO.length && !SO.includes(nome)) continue;
    console.log('\n== ' + nome + ' ==');
    try { await fn(); } catch (e) { ok(false, nome + ': o teste quebrou no meio: ' + String(e && e.message || e).slice(0, 200)); }
  }
  console.log('\n== fim ==');
  ok(!errosDePagina.length, 'nenhum erro de JavaScript nas páginas abertas' + (errosDePagina.length ? ': ' + [...new Set(errosDePagina)].slice(0, 3).join(' | ') : ''));
  console.log(`  info ${barrados.length} envio(s) ao banco respondido(s) dentro do teste; nada saiu da máquina`);
} finally {
  await browser.close();
  server.close();
}

console.log('');
console.log(falhas ? `rodada 10: ${falhas} de ${feitos} conferências FALHARAM.` : `rodada 10: tudo certo (${feitos} conferências).`);
process.exit(falhas ? 1 : 0);
