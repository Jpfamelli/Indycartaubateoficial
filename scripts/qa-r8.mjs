// Teste da rodada 8 (19/11/2026): rastreio do anúncio até o WhatsApp. `npm test` roda este arquivo por último.
//
// Mesmo método das outras suítes (servidor local com os cabeçalhos do netlify.toml, Chrome instalado, puppeteer-core),
// com quatro diferenças:
//  1. o site registra a visita num BANCO DE MENTIRA que este arquivo sobe em 127.0.0.1: o script.js é servido com o
//     endereço e a chave trocados (se a troca não casar, o teste para antes de abrir o navegador);
//  2. o Chrome sobe sem a marca de "navegador comandado por programa" (com ela o site, de propósito, não registra
//     nada: é o que protege o banco de verdade das suítes antigas e do Lighthouse);
//  3. o Chrome sobe com a resolução de nomes desligada para tudo que não seja 127.0.0.1: nem o banco de verdade nem
//     o WhatsApp recebem coisa alguma, mesmo que o teste erre. A consulta de horários e o envio do formulário
//     (função site-lead) são respondidos dentro da própria página, como nas outras suítes;
//  4. cada cenário roda num contexto novo do navegador: o que fica guardado no aparelho não passa de um para o outro.
// Capturas em qa-out/ (fora do git e do deploy).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { transformSync } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa-out');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const NL = String.fromCharCode(10);
const TOML = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const PRIV = fs.readFileSync(path.join(ROOT, 'privacidade.html'), 'utf8');
const BANCO_REAL = 'https://nppfqhavqahapmugnyng.supabase.co';
const SITE_LEAD = BANCO_REAL + '/functions/v1/site-lead';
const RPC = '/rest/v1/rpc/trafego_rastreio_registrar';
const CHAVE_TESTE = 'sb_publishable_chave-de-mentira-so-para-o-teste-local';
const PHONE = '5512996830272';
const PREFIXO = 'Olá! Vim pelo site';
// Os campos do contrato de rastreio (§6.1). Nada além deles pode ir para o banco.
const CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid', 'pagina', 'referencia', 'referencia_tipo'];
const GCLID = 'Cj0KCQiAoae5BhCNARIsADVLzZd5oM2x_7-teste-do-site-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV_wB';
const FBCLID = 'IwY2xjawN5teste' + 'AbCdEf0123456789_-'.repeat(8);
const DIAS_NORMAIS = [{ data: '2026-10-21', rotulo: 'hoje', horas: ['09:30', '11:30', '13:30', '15:30'] }, { data: '2026-10-22', rotulo: 'amanhã', horas: ['08:00', '10:00', '12:00', '14:00'] }, { data: '2026-10-23', rotulo: 'sex 23/10', horas: ['08:00', '10:00', '12:00', '14:00'] }];
// 20/11 é feriado nacional: a lista ganha o rótulo "feriado" e um aviso, e fica 82 px mais alta no celular.
const DIAS_FERIADO = [{ data: '2026-11-19', rotulo: 'hoje', horas: ['09:30', '11:30', '13:30', '15:30'] }, { data: '2026-11-20', rotulo: 'amanhã', horas: ['08:00', '10:00', '12:00', '14:00'] }, { data: '2026-11-21', rotulo: 'sáb 21/11', horas: ['08:00', '10:00', '12:00', '14:00'] }];

let falhas = 0, feitos = 0;
const ok = (cond, msg) => { feitos++; console.log((cond ? '  ok  ' : '  FALHOU ') + msg); if (!cond) falhas++; };
const info = (msg) => console.log('  info ' + msg);
let secaoAtual = '';
const titulo = (t) => { secaoAtual = t; console.log(''); console.log('== ' + t + ' =='); };
const espera = (ms) => new Promise(r => setTimeout(r, ms));
async function ate(cond, ms = 6000, passo = 40) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await cond()) return true; await espera(passo); } return !!(await cond()); }
const ordenar = (v) => (Array.isArray(v) ? v.map(ordenar) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordenar(v[k])])) : v);
const igual = (a, b) => JSON.stringify(ordenar(a)) === JSON.stringify(ordenar(b));
const ACENTOS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(ACENTOS, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ---------- netlify.toml: cabeçalhos e redirecionamentos (a mesma leitura do qa-r7.mjs) ---------- */
function cabecalhosDoNetlify() {
  const bloco = TOML.split('[[headers]]').find(b => b.includes('for = "/*"')) || '';
  const saida = {};
  for (const linha of bloco.split(NL)) {
    const m = /^\s*([A-Za-z-]+) = "(.*)"\s*$/.exec(linha);
    if (m && m[1] !== 'for') saida[m[1]] = m[2];
  }
  return saida;
}
const CABECALHOS_REAIS = cabecalhosDoNetlify();
const REDIRECTS = TOML.split('[[redirects]]').slice(1).map(b => {
  const g = (k) => (new RegExp('^\\s*' + k + ' = "(.*)"\\s*$', 'm').exec(b) || [])[1];
  return { from: g('from'), to: g('to'), status: Number((/status = (\d+)/.exec(b) || [])[1] || 301) };
}).filter(r => r.from && r.from.startsWith('/'));
/** A regra da Netlify: a query original só é repassada se o destino não tem "?". */
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

/* ---------- banco de mentira: faz o papel do PostgREST do Supabase ---------- */
const chamadas = []; // tudo que chegou pela rede (menos a sondagem OPTIONS)
const resposta = { modo: 'ok', codigo: 'K7M2P', atraso: 0 };
let sondagens = 0;
const definir = (r = {}) => { Object.assign(resposta, { modo: 'ok', codigo: 'K7M2P', atraso: 0 }, r); chamadas.length = 0; sondagens = 0; };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'apikey, authorization, content-type, x-client-info', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-max-age': '600' };
const banco = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { sondagens++; res.writeHead(204, CORS); return res.end(); }
  let bruto = '';
  req.setEncoding('utf8');
  req.on('data', (d) => { bruto += d; });
  req.on('end', () => {
    let corpo = null;
    try { corpo = JSON.parse(bruto); } catch (_) {}
    chamadas.push({ metodo: req.method, caminho: req.url, cabecalhos: req.headers, corpo, em: Date.now() });
    const { modo, codigo, atraso } = resposta;
    const json = (status, obj) => { res.writeHead(status, { ...CORS, 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
    const responder = () => {
      if (req.method !== 'POST' || req.url !== RPC) return json(404, { code: 'PGRST125', message: 'caminho desconhecido' });
      if (modo === 'cai') return req.socket.destroy();
      if (modo === 'erro500') return json(500, { code: 'XX000', message: 'erro de teste' });
      if (modo === 'erro404') return json(404, { code: 'PGRST202', message: 'Could not find the function public.trafego_rastreio_registrar(p_dados) in the schema cache' });
      if (modo === 'lixo') { res.writeHead(200, { ...CORS, 'content-type': 'text/html' }); return res.end('<html>nada</html>'); }
      if (modo === 'sem-codigo') return json(200, { ok: true });
      if (modo === 'codigo-ruim') return json(200, { ok: true, codigo: '<b>x</b>' });
      if (modo === 'codigo-comprido') return json(200, { ok: true, codigo: 'ABCDEF' });
      if (modo === 'nulo') return json(200, null);
      return json(200, { ok: true, codigo });
    };
    if (atraso && corpo && corpo.p_dados && corpo.p_dados.evento === 'visita') setTimeout(responder, atraso); else responder();
  });
});
await new Promise(r => banco.listen(0, '127.0.0.1', r));
const BANCO = 'http://127.0.0.1:' + banco.address().port;
const posts = () => chamadas.filter(c => c.metodo === 'POST');
const doEvento = (e) => posts().filter(c => c.corpo && c.corpo.p_dados && c.corpo.p_dados.evento === e);
const visitas = () => doEvento('visita');
const cliquesNoBanco = () => doEvento('clique');

/* ---------- o script.js do teste: o mesmo arquivo, com o endereço e a chave trocados ---------- */
const achados = { url: [...JS.matchAll(/const RASTREIO_URL = '([^']*)';/g)], chave: [...JS.matchAll(/const RASTREIO_CHAVE = '([^']*)';/g)] };
if (achados.url.length !== 1 || achados.chave.length !== 1) {
  console.error('script.js: esperava UMA linha "const RASTREIO_URL = \'…\';" e UMA "const RASTREIO_CHAVE = \'…\';" (achei ' + achados.url.length + ' e ' + achados.chave.length + '). Sem isso o teste não troca o banco de verdade pelo de mentira, então para aqui.');
  process.exit(1);
}
const URL_REAL = achados.url[0][1], CHAVE_REAL = achados.chave[0][1];
const JS_TESTE = JS.replace(achados.url[0][0], "const RASTREIO_URL = '" + BANCO + RPC + "';").replace(achados.chave[0][0], "const RASTREIO_CHAVE = '" + CHAVE_TESTE + "';");
const MINIFICAR = { loader: 'js', minify: true, charset: 'utf8', legalComments: 'none', target: ['es2018'] }; // as mesmas opções do scripts/publicar.mjs
const VARIANTES = { teste: JS_TESTE, 'como-esta': JS, minificado: transformSync(JS_TESTE, MINIFICAR).code };
let variante = 'teste';

/* ---------- servidor do site ---------- */
const CSP_REAL = CABECALHOS_REAIS['Content-Security-Policy'] || '';
const CSP_TESTE = CSP_REAL.replace(/connect-src ([^;]*)/, (m, v) => 'connect-src ' + v + ' ' + BANCO);
if (CSP_TESTE === CSP_REAL) { console.error('netlify.toml: não achei connect-src na política de segurança.'); process.exit(1); }
const CABECALHOS = { ...CABECALHOS_REAIS, 'Content-Security-Policy': CSP_TESTE };
const site = http.createServer((req, res) => {
  const [rota, query = ''] = req.url.split('?');
  const url = decodeURIComponent(rota);
  if (url === '/script.js') { res.writeHead(200, { 'content-type': TIPOS['.js'], ...CABECALHOS, 'cache-control': 'no-store' }); return res.end(VARIANTES[variante]); }
  const f = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const r = aplicarRedirect(rota, query);
    if (r && !r.to.startsWith('http')) { res.writeHead(r.status, { location: r.to }); return res.end(); }
    res.writeHead(404, { 'content-type': TIPOS['.html'], ...CABECALHOS }); return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', ...CABECALHOS });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => site.listen(0, '127.0.0.1', r));
const SITE = 'http://127.0.0.1:' + site.address().port;
fs.mkdirSync(OUT, { recursive: true });
if (process.env.QA_URL) console.log('QA_URL definido: esta suíte testa sempre os arquivos locais contra o banco de mentira (nada dela toca o site no ar).');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 240000,
  args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
});
const fechar = async (codigo) => { try { await browser.close(); } catch (_) {} site.close(); banco.close(); process.exit(codigo); };

/* ---------- o que roda dentro de cada página antes do script do site ---------- */
function preparo(cfg) {
  window.__csp = []; window.__envios = []; window.__rastreios = []; window.__cliques = []; window.__interacao = null; window.__rejeicoes = []; window.__aberto = [];
  window.__horariosPendentes = []; window.__horariosSoltos = false;
  const negado = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
  if (cfg.semLocal) Object.defineProperty(window, 'localStorage', { configurable: true, get: negado });
  if (cfg.semSessao) Object.defineProperty(window, 'sessionStorage', { configurable: true, get: negado });
  if (cfg.cheio) Storage.prototype.setItem = function () { throw new DOMException('cheio', 'QuotaExceededError'); };
  if (cfg.comandado) Object.defineProperty(Navigator.prototype, 'webdriver', { configurable: true, get: () => true });
  if (cfg.oculta) { window.__oculta = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__oculta }); }
  try { sessionStorage.setItem('indycar_promo', '1'); } catch (_) {} // o convite de 8 s não cobre a página durante o teste
  if (cfg.guardar) {
    try {
      if (!sessionStorage.getItem('qa_semeado')) { // só na primeira carga da aba (recarregar não semeia de novo)
        sessionStorage.setItem('qa_semeado', '1');
        Object.keys(cfg.guardar.local || {}).forEach(k => localStorage.setItem(k, cfg.guardar.local[k]));
        Object.keys(cfg.guardar.sessao || {}).forEach(k => sessionStorage.setItem(k, cfg.guardar.sessao[k]));
      }
    } catch (_) {}
  }
  document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline')));
  window.addEventListener('unhandledrejection', e => window.__rejeicoes.push(String((e.reason && e.reason.message) || e.reason)));
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(s => addEventListener(s, () => { if (window.__interacao === null) window.__interacao = performance.now(); }, { capture: true, passive: true }));
  window.__soltarHorarios = () => { window.__horariosSoltos = true; window.__horariosPendentes.splice(0).forEach(f => f()); };
  window.open = (u) => { window.__aberto.push(String(u)); return null; }; // o caminho "sem rede" do formulário abre o WhatsApp por window.open
  const real = window.fetch.bind(window);
  window.fetch = (url, opts) => {
    const u = String(url);
    if (u.startsWith(cfg.siteLead)) {
      if (u.endsWith('/horarios')) {
        return new Promise((resolver, rejeitar) => {
          const entregar = () => (cfg.horariosFalha ? rejeitar(new TypeError('rede')) : resolver({ ok: true, status: 200, json: async () => ({ ok: true, atualizado_em: '2026-11-19T15:00:00.000Z', dias: cfg.dias }) }));
          if (cfg.segurarHorarios && !window.__horariosSoltos) window.__horariosPendentes.push(entregar); else entregar();
        });
      }
      window.__envios.push({ url: u, body: JSON.parse(opts.body) });
      if (cfg.envioFalha) return Promise.reject(new TypeError('rede'));
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true, protocolo: 'QA1234', mensagem: 'Pedido enviado, Teste! (resposta de teste)' }) });
    }
    if (u.startsWith(cfg.banco) || u.startsWith(cfg.bancoReal)) {
      let corpo = null;
      try { corpo = JSON.parse(opts.body); } catch (_) {}
      window.__rastreios.push({ url: u, metodo: opts && opts.method, keepalive: !!(opts && opts.keepalive), cabecalhos: (opts && opts.headers) || {}, corpo, em: performance.now() });
    }
    return real(url, opts);
  };
  // Último a ver o clique (janela, fase de borbulha): anota como o link estava e se alguém segurou o toque; depois o
  // próprio teste cancela a navegação, para o WhatsApp não abrir (a não ser que o cenário peça para deixar abrir).
  window.addEventListener('click', (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (!a) return;
    let texto = '';
    try { texto = new URL(a.href).searchParams.get('text') || ''; } catch (_) {}
    window.__cliques.push({ href: a.href, texto, alvo: a.target, prevenido: e.defaultPrevented, rastreios: window.__rastreios.length });
    if (!window.__deixarAbrir) e.preventDefault();
  });
}

async function abrir(ctx, largura, altura, caminho = '/', cfg = {}, { ate: quando = 'domcontentloaded', referer = '' } = {}) {
  const page = await ctx.newPage();
  const erros = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text() + ' @ ' + ((m.location() && m.location().url) || '')); });
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await page.evaluateOnNewDocument(preparo, { siteLead: SITE_LEAD, banco: BANCO, bancoReal: BANCO_REAL, dias: DIAS_NORMAIS, ...cfg });
  await page.setViewport({ width: largura, height: altura, isMobile: largura < 768, hasTouch: largura < 768 });
  await page.goto(SITE + caminho, { waitUntil: quando, timeout: 45000, ...(referer ? { referer, referrerPolicy: 'unsafe-url' } : {}) });
  return { page, erros };
}
const estado = (page) => page.evaluate(() => {
  const ler = (f) => { try { return f(); } catch (e) { return { erro: String(e && e.name) }; } };
  return {
    tempo: performance.now(),
    guardado: ler(() => JSON.parse(localStorage.getItem('indycar_rastreio'))),
    bruto: ler(() => localStorage.getItem('indycar_rastreio')),
    marca: ler(() => sessionStorage.getItem('indycar_rastreio')),
    utmSessao: ler(() => JSON.parse(sessionStorage.getItem('indycar_utm'))),
    rastreios: window.__rastreios, cliques: window.__cliques, envios: window.__envios, aberto: window.__aberto,
    interacao: window.__interacao, csp: window.__csp, rejeicoes: window.__rejeicoes, veioDe: document.referrer,
    endereco: location.pathname + location.search + location.hash,
    links: [...document.querySelectorAll('a[href*="wa.me"]')].map(a => { const u = new URL(a.href); return { id: a.id, caminho: u.pathname, texto: u.searchParams.get('text') || '', campanha: u.searchParams.get('utm_campaign') || '', fonte: u.searchParams.get('utm_source') || '', meio: u.searchParams.get('utm_medium') || '', alvo: a.target }; }),
    sw: document.documentElement.scrollWidth, iw: innerWidth,
  };
});
const comCodigo = (page, codigo) => page.waitForFunction((c) => [...document.querySelectorAll('a[href*="wa.me"]')].some(a => decodeURIComponent(a.href).includes('--r-' + c + ')')), { timeout: 8000 }, codigo.toLowerCase()).then(() => true, () => false);
/** Só confere "antes da hora" se a página ainda está antes da hora (em máquina muito carregada os 4 s podem ter passado). */
function cedo(est, cond, msg) { if (est.tempo > 3600) info('a página levou ' + Math.round(est.tempo) + ' ms para responder; pulei: ' + msg); else ok(cond, msg); }
/** Clica (clique do próprio DOM) no botão de WhatsApp de um serviço e devolve o que o teste anotou. */
const clicarWa = (page, servico) => page.evaluate((servico) => {
  const re = new RegExp('\\(site/' + servico + '(--|\\))');
  const a = [...document.querySelectorAll('a[href*="wa.me"]')].find(x => { try { return re.test(new URL(x.href).searchParams.get('text') || ''); } catch (_) { return false; } });
  if (!a) return null;
  const n = window.__cliques.length;
  a.click();
  return window.__cliques[n] || null;
}, servico);
const pontoNeutro = (page) => page.evaluate(() => { const r = document.querySelector('h1').getBoundingClientRect(); return [Math.round(r.left + 8), Math.round(r.top + 8)]; });

/* ---------- os links de WhatsApp como estão no HTML (sem o do <noscript>, que não existe com JavaScript ligado) ---------- */
const RE_FIM = /^([\s\S]*) \(site\/([a-z0-9_-]{1,40})\)$/;
const ESTATICOS = [...HTML.replace(/<noscript>[\s\S]*?<\/noscript>/g, '').matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m => {
  const t = new URL(m[1].replace(/&amp;/g, '&')).searchParams.get('text') || '';
  const c = RE_FIM.exec(t);
  return { texto: c ? c[1] : t, servico: c ? c[2] : '' };
});
/** O que tem de estar dentro de (site/…): a regra do contrato §6.3, escrita de novo aqui (não é cópia do site). */
function esperado(servico, { codigo = '', source = '' } = {}) {
  const s = slug(source);
  if (!codigo) return s ? (servico + '--' + s).slice(0, 40).replace(/-+$/, '') : servico;
  const cauda = '--' + (s.replace(/-/g, '_').slice(0, 20).replace(/_+$/, '') || 'direto') + '--r-' + codigo.toLowerCase();
  return servico.slice(0, 40 - cauda.length).replace(/-+$/, '') + cauda;
}
const dentro = (l) => (RE_FIM.exec(l.texto) || [])[2] || '';
function problemasNosLinks(links, opcoes = {}) {
  const p = [];
  if (links.length !== ESTATICOS.length) p.push('eram ' + ESTATICOS.length + ' links no HTML, achei ' + links.length + ' na página');
  links.forEach((l, i) => {
    const base = ESTATICOS[i];
    if (!base) return;
    const m = RE_FIM.exec(l.texto);
    const quer = esperado(base.servico, opcoes);
    if (!m) p.push('link ' + i + ' sem (site/…) no fim: ' + l.texto.slice(-60));
    else if (m[2] !== quer) p.push('link ' + i + ': ' + m[2] + ' (esperado ' + quer + ')');
    else if (m[2].length > 40) p.push('link ' + i + ': ' + m[2].length + ' caracteres');
    else if (m[1] !== base.texto) p.push('link ' + i + ': a mensagem mudou (' + m[1].slice(0, 50) + ')');
    else if (!m[1].startsWith(PREFIXO)) p.push('link ' + i + ' sem o começo combinado com o Atendimento');
    else if (l.campanha !== m[2] || l.fonte !== 'site' || l.meio !== 'whatsapp' || l.caminho !== '/' + PHONE) p.push('link ' + i + ': número ou utm do link');
  });
  return p;
}
const resumo = (p) => (p.length ? ': ' + p.slice(0, 3).join(' | ') : '');
const soDoBanco = (erros) => erros.filter(x => !(x.startsWith('Failed to load resource') && x.includes(BANCO)));

/* ================================================================
   0. A rede de segurança do próprio teste
   ================================================================ */
titulo('rede de segurança do teste (nada sai de 127.0.0.1)');
{
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.goto(BANCO + '/sonda'); // uma página local sem política de segurança, só para sondar a rede
  // 1º só com endereços desta máquina: o número 127.0.0.1 tem de funcionar e o NOME localhost não (prova que o Chrome
  // não está resolvendo nome nenhum). Só depois disso o teste encosta no nome do WhatsApp e do banco, já sem saída.
  const sonda = (alvos) => page.evaluate(async (alvos) => {
    const saida = {};
    for (const [k, u] of Object.entries(alvos)) { try { await fetch(u, { mode: 'no-cors' }); saida[k] = true; } catch (_) { saida[k] = false; } }
    return saida;
  }, alvos);
  const r = { comandado: await page.evaluate(() => navigator.webdriver), wa: true, banco: true, ...(await sonda({ local: BANCO + '/sonda', porNome: 'http://localhost:' + banco.address().port + '/sonda' })) };
  ok(r.local && !r.porNome, 'o Chrome do teste alcança 127.0.0.1 e não resolve nomes (nem "localhost")');
  if (r.local && !r.porNome) Object.assign(r, await sonda({ wa: 'https://wa.me/', banco: BANCO_REAL + '/' }));
  ok(r.local && !r.wa && !r.banco, 'por isso não alcança o WhatsApp nem o banco de verdade');
  ok(r.comandado === false, 'o Chrome do teste não leva a marca de navegador comandado (senão o site não registraria nada)');
  ok(JS_TESTE.includes(BANCO + RPC) && JS_TESTE.includes(CHAVE_TESTE) && !JS_TESTE.includes(BANCO_REAL + '/rest/'), 'o script.js servido no teste aponta o registro para o banco de mentira (' + BANCO + ')');
  ok(ESTATICOS.length >= 25 && ESTATICOS.every(e => e.servico && e.texto.startsWith(PREFIXO)), ESTATICOS.length + ' links de WhatsApp no HTML, todos com (site/<serviço>) e o começo combinado');
  await ctx.close();
  if (r.wa || r.banco || !r.local) { console.error('A rede de segurança não funcionou: paro antes de abrir o site.'); await fechar(1); }
}

// Um cenário que quebrar no meio (erro de programa, não conferência reprovada) conta como falha, com o nome da seção, e
// a suíte fecha o navegador e os dois servidores antes de sair.
try {
/* ================================================================
   1. Chegada com gclid
   ================================================================ */
titulo('chegada com gclid (anúncio do Google)');
{
  definir({ codigo: 'K7M2P' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?gclid=' + GCLID);
  const a = await estado(page);
  ok(a.guardado && igual(a.guardado.dados, { gclid: GCLID, pagina: '/', referencia_tipo: 'anuncio' }) && a.guardado.codigo === '' && Math.abs(Date.now() - a.guardado.quando) < 60000,
    'a chegada fica guardada no aparelho: gclid inteiro (' + GCLID.length + ' caracteres), página "/" e tipo "anuncio"; ainda sem código');
  ok(igual(a.utmSessao, { gclid: GCLID.slice(0, 80) }), 'o formato antigo (sessionStorage indycar_utm) continua sendo gravado para quem ainda lê dele');
  ok(problemasNosLinks(a.links).length === 0, 'antes do registro os ' + a.links.length + ' botões saem como sempre: (site/<serviço>)' + resumo(problemasNosLinks(a.links)));
  cedo(a, a.rastreios.length === 0 && posts().length === 0, 'antes de a pessoa mexer na página nada vai para o banco (robô que só baixa a página não gera registro)');
  await page.keyboard.press('Shift');
  ok(await ate(() => visitas().length === 1), 'a primeira tecla dispara o registro');
  ok(await comCodigo(page, 'K7M2P'), 'a resposta do banco chega e os botões são remarcados');
  const d = await estado(page);
  const v = visitas()[0] || { cabecalhos: {}, corpo: null };
  ok(v.metodo === 'POST' && v.caminho === RPC && v.cabecalhos.apikey === CHAVE_TESTE && v.cabecalhos.authorization === 'Bearer ' + CHAVE_TESTE && String(v.cabecalhos['content-type']).startsWith('application/json'),
    'chamada como o contrato pede: POST ' + RPC + ' com apikey, Authorization: Bearer e Content-Type: application/json');
  ok(igual(v.corpo, { p_dados: { evento: 'visita', gclid: GCLID, pagina: '/', referencia_tipo: 'anuncio' } }), 'corpo: { p_dados: { evento: "visita", gclid, pagina, referencia_tipo } } e mais nada');
  const r0 = d.rastreios[0] || {};
  ok(d.rastreios.length === 1 && r0.keepalive === false && r0.em + 5 >= Math.min(d.interacao === null ? Infinity : d.interacao, 3950), 'o registro só sai depois da primeira interação (ou dos 4 s), uma vez');
  if (d.interacao !== null && d.interacao < 3500) ok(r0.em - d.interacao < 400, 'e sai na hora da interação (' + Math.round(r0.em - d.interacao) + ' ms depois da tecla)');
  ok(d.guardado.codigo === 'K7M2P' && d.marca === String(d.guardado.quando), 'o código (K7M2P) vai para o aparelho e a sessão fica marcada como já registrada');
  const p = problemasNosLinks(d.links, { codigo: 'K7M2P' });
  ok(p.length === 0 && d.links.some(l => l.texto.endsWith(' (site/hero--direto--r-k7m2p)')), 'os ' + d.links.length + ' botões passam a terminar com (site/<serviço>--direto--r-k7m2p), em minúsculas, com a mensagem igual' + resumo(p));
  ok(d.links.every(l => /\(site\/[a-z0-9_-]{1,40}\)$/.test(l.texto) && /--r-[a-z0-9]{5}\)$/.test(l.texto)), 'todo botão continua lido pelo gatilho antigo ((site/…) com até 40 de [a-z0-9_-]) e pelo novo (--r-xxxxx))');
  const [x, y] = await pontoNeutro(page);
  await page.mouse.click(x, y); // um clique no título (não é link nem botão)
  await page.mouse.wheel({ deltaY: 300 });
  await page.keyboard.press('Shift');
  await espera(500);
  ok(posts().length === 1, 'clicar, rolar e teclar de novo não registra outra vez (uma vez por sessão)');
  await page.reload({ waitUntil: 'networkidle2' });
  const e = await estado(page);
  ok(problemasNosLinks(e.links, { codigo: 'K7M2P' }).length === 0, 'recarregar: os botões já nascem com o código guardado');
  await page.keyboard.press('Shift');
  await espera(600);
  ok(posts().length === 1 && e.guardado.quando === d.guardado.quando, 'recarregar a mesma chegada não registra de novo nem renova a data');
  ok(e.sw <= e.iw, 'sem rolagem lateral em 1440 px (scrollWidth ' + e.sw + ' <= ' + e.iw + ')');
  await page.screenshot({ path: path.join(OUT, 'qa-r8-1440-com-codigo.png'), fullPage: false });
  ok(erros.length === 0 && e.csp.length === 0 && e.rejeicoes.length === 0, 'sem erro de console, sem violação da política de segurança' + (erros.length ? ': ' + erros[0] : '') + (e.csp.length ? ': ' + e.csp[0] : ''));
  ok(sondagens >= 1, 'o navegador fez a sondagem OPTIONS antes (a chamada é entre domínios, como será no ar)');
  await ctx.close();
}

/* ================================================================
   2. Chegada com fbclid (celular, sinal = rolagem; o banco responde em minúsculas)
   ================================================================ */
titulo('chegada com fbclid (anúncio da Meta), no celular');
{
  definir({ codigo: 'q4wzt' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 375, 812, '/?fbclid=' + FBCLID, {}, { ate: 'networkidle2' });
  const a = await estado(page);
  ok(a.guardado && igual(a.guardado.dados, { fbclid: FBCLID, pagina: '/', referencia_tipo: 'anuncio' }), 'fbclid inteiro guardado (' + FBCLID.length + ' caracteres), tipo "anuncio"');
  await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'instant' }));
  ok(await ate(() => visitas().length === 1), 'rolar a página dispara o registro');
  ok(igual((visitas()[0] || {}).corpo, { p_dados: { evento: 'visita', fbclid: FBCLID, pagina: '/', referencia_tipo: 'anuncio' } }), 'corpo com o fbclid e mais nada');
  ok(await comCodigo(page, 'Q4WZT'), 'código devolvido em minúsculas é aceito');
  const d = await estado(page);
  ok(d.guardado.codigo === 'Q4WZT' && problemasNosLinks(d.links, { codigo: 'Q4WZT' }).length === 0, 'guardado em maiúsculas (Q4WZT) e escrito em minúsculas nos botões (--direto--r-q4wzt)' + resumo(problemasNosLinks(d.links, { codigo: 'Q4WZT' })));
  ok(d.sw <= d.iw, 'sem rolagem lateral em 375 px com o código nos botões (scrollWidth ' + d.sw + ' <= ' + d.iw + ')');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(OUT, 'qa-r8-375-com-codigo.png'), fullPage: false });
  ok(erros.length === 0 && d.csp.length === 0 && d.rejeicoes.length === 0, 'sem erro de console no celular' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

/* ================================================================
   3. Chegada com utm de anúncio (celular, sinal = toque)
   ================================================================ */
titulo('chegada com utm de anúncio');
{
  definir({ codigo: 'P9RSA' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 375, 812, '/?utm_source=google&utm_medium=cpc&utm_campaign=cambio-taubate&utm_content=anuncio-2&utm_term=troca%20de%20oleo%20cambio');
  const a = await estado(page);
  const dados = { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'cambio-taubate', utm_content: 'anuncio-2', utm_term: 'troca de oleo cambio', pagina: '/', referencia_tipo: 'anuncio' };
  ok(a.guardado && igual(a.guardado.dados, dados), 'os cinco utm_* guardados e o tipo "anuncio" (utm_medium=cpc)');
  ok(igual(a.utmSessao, { source: 'google', medium: 'cpc', campaign: 'cambio-taubate', content: 'anuncio-2', term: 'troca de oleo cambio' }), 'formato antigo na sessão igual ao das rodadas 5 a 7');
  const pa = problemasNosLinks(a.links, { source: 'google' });
  ok(pa.length === 0 && a.links.some(l => l.texto.endsWith(' (site/hero--google)')), 'sem código, os botões saem como hoje: (site/<serviço>--google)' + resumo(pa));
  const [x, y] = await pontoNeutro(page);
  await page.touchscreen.tap(Math.max(x, 5), Math.max(y, 5));
  ok(await ate(() => visitas().length === 1), 'o primeiro toque na tela dispara o registro');
  ok(igual((visitas()[0] || {}).corpo, { p_dados: { evento: 'visita', ...dados } }), 'corpo com os utm_*, a página e o tipo');
  ok(await comCodigo(page, 'P9RSA'), 'código recebido');
  const d = await estado(page);
  const pd = problemasNosLinks(d.links, { codigo: 'P9RSA', source: 'google' });
  ok(pd.length === 0 && d.links.some(l => l.texto.endsWith(' (site/hero--google--r-p9rsa)')), 'com código: (site/<serviço>--google--r-p9rsa)' + resumo(pd));
  ok(erros.length === 0 && d.rejeicoes.length === 0, 'sem erro de console' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

/* ================================================================
   4. Chegada direta depois de anúncio (não apaga) e as outras trocas
   ================================================================ */
titulo('chegada direta depois de anúncio: o anúncio continua valendo');
{
  definir({ codigo: 'ANT2M' });
  const ctx = await browser.createBrowserContext();
  let { page } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&utm_campaign=freios&gclid=G-ONTEM');
  await page.keyboard.press('Shift');
  await comCodigo(page, 'ANT2M');
  // faz de conta que o clique no anúncio foi ontem
  const ontem = await page.evaluate(() => { const g = JSON.parse(localStorage.getItem('indycar_rastreio')); g.quando -= 26 * 3600 * 1000; localStorage.setItem('indycar_rastreio', JSON.stringify(g)); return g; });
  await page.close();
  const doAnuncio = { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'freios', gclid: 'G-ONTEM', pagina: '/', referencia_tipo: 'anuncio' };
  ok(igual(ontem.dados, doAnuncio) && ontem.codigo === 'ANT2M', 'ontem: anúncio guardado com o código ANT2M');

  definir({ codigo: 'HJE3K' });
  ({ page } = await abrir(ctx, 1440, 900, '/')); // outra aba = outra sessão; sem marca e sem site de origem = chegada direta
  const a = await estado(page);
  ok(igual(a.guardado, ontem), 'hoje, chegando direto: o que estava guardado não muda');
  const pa = problemasNosLinks(a.links, { codigo: 'ANT2M', source: 'google' });
  ok(pa.length === 0, 'os botões já abrem com o anúncio de ontem: (site/<serviço>--google--r-ant2m), sem esperar nada' + resumo(pa));
  cedo(a, a.rastreios.length === 0, 'nada vai para o banco antes de a pessoa mexer');
  await page.keyboard.press('Shift');
  ok(await comCodigo(page, 'HJE3K'), 'a visita de hoje é registrada (outra sessão) e recebe código novo');
  const d = await estado(page);
  ok(visitas().length === 1 && igual(visitas()[0].corpo, { p_dados: { evento: 'visita', ...doAnuncio } }), 'o registro de hoje leva os dados do anúncio de ontem (a visita continua sendo do anúncio)');
  ok(d.guardado.codigo === 'HJE3K' && d.guardado.quando === ontem.quando && igual(d.guardado.dados, doAnuncio), 'a data da chegada pelo anúncio não é renovada (os 30 dias contam do clique no anúncio)');
  await page.close();

  ({ page } = await abrir(ctx, 1440, 900, '/', {}, { referer: 'https://www.google.com/' }));
  const b = await estado(page);
  ok(b.veioDe.startsWith('https://www.google.com'), 'cenário de busca montado (a página enxerga que veio de google.com)');
  ok(igual(b.guardado.dados, doAnuncio) && b.guardado.codigo === 'HJE3K', 'voltar pela busca do Google (sem marca) também não apaga o anúncio');
  await page.close();

  ({ page } = await abrir(ctx, 1440, 900, '/agendar?utm_source=pwa&utm_medium=atalho'));
  const c = await estado(page);
  ok(igual(c.guardado.dados, doAnuncio) && c.guardado.codigo === 'HJE3K', 'atalho do app instalado (utm_source=pwa) vale como chegada direta: não apaga o anúncio');
  await page.close();

  ({ page } = await abrir(ctx, 1440, 900, '/?fbclid=ANUNCIO-NOVO'));
  const n = await estado(page);
  ok(igual(n.guardado.dados, { fbclid: 'ANUNCIO-NOVO', pagina: '/', referencia_tipo: 'anuncio' }) && n.guardado.codigo === '' && n.guardado.quando > ontem.quando + 3600000,
    'um anúncio novo substitui o guardado inteiro (nada do antigo fica, e o código antigo não é reaproveitado)');
  ok(problemasNosLinks(n.links).length === 0, 'até o registro novo responder, os botões voltam ao formato sem código' + resumo(problemasNosLinks(n.links)));
  await page.close();

  ({ page } = await abrir(ctx, 1440, 900, '/?utm_source=comunicar&utm_campaign=revisao'));
  const m = await estado(page);
  ok(igual(m.guardado.dados, { utm_source: 'comunicar', utm_campaign: 'revisao', pagina: '/', referencia_tipo: 'whatsapp' }), 'link marcado da própria oficina (utm_source=comunicar) substitui: vale o último link marcado, e o tipo é "whatsapp"');
  await page.close();

  ({ page } = await abrir(ctx, 1440, 900, '/', {}, { referer: 'https://www.bing.com/search?q=oficina' }));
  const s = await estado(page);
  ok(igual(s.guardado.dados, m.guardado.dados), 'chegada só com site de origem (bing.com) não apaga link marcado');
  await ctx.close();
}
titulo('chegadas sem marca: site de origem e direta');
{
  const ctx = await browser.createBrowserContext();
  let { page } = await abrir(ctx, 1440, 900, '/', {}, { referer: 'https://www.bing.com/search?q=oficina+taubate' });
  const a = await estado(page);
  ok(igual(a.guardado.dados, { referencia: 'bing.com', pagina: '/', referencia_tipo: 'busca' }), 'veio do Bing: guarda só o domínio (bing.com, sem a busca que a pessoa fez) e o tipo "busca"');
  await page.close();
  ({ page } = await abrir(ctx, 1440, 900, '/'));
  const b = await estado(page);
  ok(igual(b.guardado, a.guardado), 'chegada direta depois não apaga a busca');
  await page.close();
  ({ page } = await abrir(ctx, 1440, 900, '/', {}, { referer: 'https://l.instagram.com/' }));
  const c = await estado(page);
  ok(igual(c.guardado.dados, { referencia: 'l.instagram.com', pagina: '/', referencia_tipo: 'instagram' }) && c.guardado.quando > a.guardado.quando, 'outro site de origem (Instagram) substitui o anterior, que também era só site de origem');
  await page.reload({ waitUntil: 'domcontentloaded' });
  const r = await estado(page);
  ok(r.guardado.quando === c.guardado.quando, 'recarregar a página não conta como outra chegada');
  await ctx.close();
}

/* ================================================================
   5. Como o tipo da chegada é calculado (tabela)
   ================================================================ */
titulo('tipo da chegada (referencia_tipo)');
{
  const casos = [
    ['/?gbraid=GB1', '', 'anuncio', { gbraid: 'GB1' }],
    ['/?wbraid=WB1', '', 'anuncio', { wbraid: 'WB1' }],
    ['/?ttclid=TT1', '', 'anuncio', { ttclid: 'TT1' }],
    ['/?msclkid=MS1', '', 'anuncio', { msclkid: 'MS1' }],
    ['/?utm_source=meta&utm_medium=paid_social', '', 'anuncio', { utm_source: 'meta', utm_medium: 'paid_social' }],
    ['/?utm_source=instagram&utm_medium=bio', '', 'instagram', { utm_source: 'instagram', utm_medium: 'bio' }],
    ['/?utm_source=facebook&utm_medium=post', '', 'facebook', { utm_source: 'facebook', utm_medium: 'post' }],
    ['/?utm_source=whatsapp&utm_medium=status', '', 'whatsapp', { utm_source: 'whatsapp', utm_medium: 'status' }],
    ['/?utm_source=atendimento&utm_campaign=garantia', '', 'whatsapp', { utm_source: 'atendimento', utm_campaign: 'garantia' }],
    ['/?utm_source=google&utm_medium=organic', '', 'busca', { utm_source: 'google', utm_medium: 'organic' }],
    ['/?utm_source=panfleto', '', 'outro_site', { utm_source: 'panfleto' }],
    ['/agendar?utm_source=pwa&utm_medium=atalho', '', 'direto', { utm_source: 'pwa', utm_medium: 'atalho' }],
    ['/', 'https://www.google.com.br/', 'busca', { referencia: 'google.com.br' }],
    ['/', 'https://duckduckgo.com/', 'busca', { referencia: 'duckduckgo.com' }],
    ['/', 'https://m.facebook.com/', 'facebook', { referencia: 'm.facebook.com' }],
    ['/', 'https://web.whatsapp.com/', 'whatsapp', { referencia: 'web.whatsapp.com' }],
    ['/', 'https://www.exemplo.com.br/blog/oficinas?x=1', 'outro_site', { referencia: 'exemplo.com.br' }],
    ['/', '', 'direto', {}],
    ['/', SITE + '/privacidade.html', 'direto', {}], // andar dentro do próprio site não é chegada
  ];
  const erradas = [];
  for (const [caminho, referer, tipo, mais] of casos) {
    const ctx = await browser.createBrowserContext();
    const { page } = await abrir(ctx, 1440, 900, caminho, {}, { referer });
    const e = await estado(page);
    const quer = { ...mais, pagina: caminho.startsWith('/agendar') ? '/agendar' : '/', referencia_tipo: tipo };
    if (!e.guardado || !igual(e.guardado.dados, quer)) erradas.push(caminho + (referer ? ' vindo de ' + referer : '') + ' → ' + JSON.stringify(e.guardado && e.guardado.dados));
    await ctx.close();
  }
  ok(erradas.length === 0, casos.length + ' chegadas classificadas certo (anuncio, busca, instagram, facebook, whatsapp, outro_site, direto)' + resumo(erradas));

  definir();
  const ctx = await browser.createBrowserContext();
  const comprido = 'x'.repeat(300);
  const { page } = await abrir(ctx, 1440, 900, '/?utm_source=' + comprido + '&gclid=' + comprido + '&nome=Maria%20Teste&telefone=12999990000&email=maria%40exemplo.com&cpf=11122233344&utm_campaign=ok');
  const e = await estado(page);
  const d = (e.guardado && e.guardado.dados) || {};
  ok(d.utm_source && d.utm_source.length === 100 && d.gclid.length === 255 && Object.keys(d).every(k => CAMPOS.includes(k)) && !/Maria|12999990000|exemplo\.com|11122233344/.test(e.bruto),
    'só os campos do contrato são guardados, com tamanho máximo (utm 100, identificador de clique 255); nome, telefone, e-mail e CPF do endereço ficam de fora');
  await page.keyboard.press('Shift');
  await ate(() => visitas().length === 1);
  const corpo = JSON.stringify((visitas()[0] || {}).corpo || {});
  ok(visitas().length === 1 && !/Maria|12999990000|exemplo\.com|11122233344/.test(corpo) && Object.keys(visitas()[0].corpo.p_dados).every(k => k === 'evento' || CAMPOS.includes(k)), 'e nada disso vai para o banco');
  await ctx.close();
}

/* ================================================================
   6. Sem localStorage (modo privado, armazenamento bloqueado ou cheio)
   ================================================================ */
titulo('sem armazenamento no aparelho');
for (const [cfg, rotulo, recarrega] of [[{ semLocal: true }, 'localStorage bloqueado', true], [{ semLocal: true, semSessao: true }, 'localStorage e sessionStorage bloqueados', false], [{ cheio: true }, 'armazenamento cheio (gravar dá erro)', false]]) {
  definir({ codigo: 'M3MRA' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=SEM-GUARDAR', cfg);
  const a = await estado(page);
  ok(problemasNosLinks(a.links, { source: 'google' }).length === 0, rotulo + ': a página abre e os botões saem no formato de sempre' + resumo(problemasNosLinks(a.links, { source: 'google' })));
  await page.keyboard.press('Shift');
  const chegou = await comCodigo(page, 'M3MRA');
  const d = await estado(page);
  ok(chegou && visitas().length === 1 && problemasNosLinks(d.links, { codigo: 'M3MRA', source: 'google' }).length === 0, rotulo + ': o registro acontece e o código vale na memória da página');
  ok(erros.length === 0 && d.rejeicoes.length === 0, rotulo + ': nenhum erro de console' + (erros.length ? ': ' + erros[0] : ''));
  if (recarrega) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Shift');
    ok(await ate(() => visitas().length === 2, 4000), rotulo + ': depois de recarregar a memória se perde e a visita é registrada de novo (sem aparelho para guardar, é uma vez por página)');
  }
  await ctx.close();
}

/* ================================================================
   7. Registro que falha
   ================================================================ */
titulo('registro que falha: o site segue no formato antigo');
for (const [modo, rotulo] of [['erro500', 'banco responde erro 500'], ['erro404', 'função ainda não existe no banco (404)'], ['lixo', 'resposta que não é JSON'], ['sem-codigo', 'resposta sem código'], ['codigo-ruim', 'código com caracteres estranhos'], ['codigo-comprido', 'código de 6 caracteres'], ['nulo', 'resposta nula'], ['cai', 'conexão cai no meio']]) {
  definir({ modo });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=F-' + modo);
  await page.keyboard.press('Shift');
  await ate(() => posts().length >= 1, 4000);
  await espera(450);
  await page.keyboard.press('Shift');
  await page.mouse.wheel({ deltaY: 200 });
  const c = await clicarWa(page, 'hero');
  await espera(350);
  const e = await estado(page);
  const p = problemasNosLinks(e.links, { source: 'google' });
  const graves = soDoBanco(erros);
  ok(e.rastreios.length === 1 && e.guardado.codigo === '' && p.length === 0 && c && c.texto.endsWith(' (site/hero--google)') && !c.prevenido && graves.length === 0 && e.rejeicoes.length === 0,
    rotulo + ': uma tentativa só, nenhum código, botões e clique no formato antigo, nenhum erro de página' + resumo(p) + (graves.length ? ': ' + graves[0] : '') + (e.rejeicoes.length ? ': ' + e.rejeicoes[0] : ''));
  await ctx.close();
}

/* ================================================================
   8. Registro que demora + o clique no botão
   ================================================================ */
titulo('registro que demora e o clique no botão de WhatsApp');
{
  definir({ codigo: 'D3M9R', atraso: 2500 });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=G-LENTO');
  await page.keyboard.press('Shift');
  ok(await ate(() => visitas().length === 1, 3000), 'o pedido de registro saiu e o banco está demorando 2,5 s');
  const c1 = await clicarWa(page, 'hero');
  const t1 = await estado(page);
  ok(c1 && c1.texto === ESTATICOS.find(x => x.servico === 'hero').texto + ' (site/hero--google)' && c1.alvo === '_blank', 'clique antes da resposta: a mensagem sai no formato antigo, (site/hero--google)');
  ok(c1 && !c1.prevenido && t1.rastreios.length === 1 && cliquesNoBanco().length === 0, 'sem código não há registro de clique, e ninguém segura a abertura do WhatsApp');
  ok(await comCodigo(page, 'D3M9R'), 'quando a resposta chega, os botões são remarcados');
  const c2 = await clicarWa(page, 'hero');
  ok(await ate(() => cliquesNoBanco().length === 1, 3000), 'clique com código: o banco recebe o segundo registro');
  const t2 = await estado(page);
  const r2 = t2.rastreios[1] || {};
  ok(c2 && c2.texto === ESTATICOS.find(x => x.servico === 'hero').texto + ' (site/hero--google--r-d3m9r)', 'a mensagem do mesmo botão agora termina com (site/hero--google--r-d3m9r)');
  ok(c2 && !c2.prevenido && c2.rastreios === 2 && r2.keepalive === true && r2.metodo === 'POST', 'o registro do clique sai na hora do toque, com keepalive, sem cancelar nem atrasar a abertura do WhatsApp');
  ok(igual(r2.corpo, { p_dados: { codigo: 'D3M9R', evento: 'clique', servico: 'hero' } }) && igual((cliquesNoBanco()[0] || {}).corpo, r2.corpo) && cliquesNoBanco()[0].cabecalhos.apikey === CHAVE_TESTE, 'corpo do clique: { p_dados: { codigo, evento: "clique", servico } }, com a mesma chave pública');
  ok(t2.rastreios[0].keepalive === false, 'o registro da visita não usa keepalive (só o do clique precisa sobreviver à saída da página)');
  // um clique de mouse de verdade, com a aba nova liberada: o WhatsApp abre na hora com o mesmo endereço
  await page.evaluate(() => { window.__deixarAbrir = true; window.scrollTo({ top: 0, behavior: 'instant' }); });
  const nova = new Promise(r => browser.once('targetcreated', r));
  await page.click('a[href*="site%2Fhero"]');
  const alvo = await Promise.race([nova, espera(4000).then(() => null)]);
  const t3 = await estado(page);
  const c3 = t3.cliques[t3.cliques.length - 1] || {};
  ok(!!alvo && c3.href && c3.href.startsWith('https://wa.me/' + PHONE + '?text=') && decodeURIComponent(c3.href).includes('(site/hero--google--r-d3m9r)') && !c3.prevenido, 'clique de mouse de verdade: abre outra aba para wa.me/' + PHONE + ' com a mensagem e o código');
  ok(await ate(() => cliquesNoBanco().length === 2, 3000), 'e o registro desse clique também chega ao banco');
  ok(soDoBanco(erros).length === 0 && t3.rejeicoes.length === 0, 'sem erro de console' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

/* ================================================================
   9. Limite de 40 caracteres dentro de (site/…)
   ================================================================ */
titulo('limite de 40 caracteres dentro de (site/…)');
{
  definir({ codigo: 'W8XZ4' });
  const FONTE = 'Instagram Stories_Promo.2026 Verão';
  const ctx = await browser.createBrowserContext();
  let { page } = await abrir(ctx, 1440, 900, '/?utm_source=' + encodeURIComponent(FONTE) + '&utm_medium=social');
  const a = await estado(page);
  const pa = problemasNosLinks(a.links, { source: FONTE });
  ok(pa.length === 0 && a.links.every(l => dentro(l).length >= 1 && dentro(l).length <= 40) && a.links.some(l => dentro(l).length === 40), 'sem código, fonte comprida: o conjunto é cortado em 40, como já era' + resumo(pa));
  await page.keyboard.press('Shift');
  await comCodigo(page, 'W8XZ4');
  const d = await estado(page);
  const pd = problemasNosLinks(d.links, { codigo: 'W8XZ4', source: FONTE });
  const dentros = d.links.map(dentro);
  ok(pd.length === 0 && dentros.every(x => x.length <= 40 && /^[a-z0-9]+(-[a-z0-9]+)*--instagram_stories_pr--r-w8xz4$/.test(x)), 'com código: a fonte vira só [a-z0-9_] com até 20 (instagram_stories_pr) e nenhum botão passa de 40' + resumo(pd));
  ok(dentros.includes('cambio-di--instagram_stories_pr--r-w8xz4') && dentros.includes('hero--instagram_stories_pr--r-w8xz4') && Math.max(...dentros.map(x => x.length)) === 40, 'quem é cortado é o serviço (cambio-dialise vira cambio-di; hero fica inteiro), nunca a fonte nem o código');
  const c = await clicarWa(page, 'cambio-di');
  await ate(() => cliquesNoBanco().length === 1, 3000);
  ok(c && cliquesNoBanco().length === 1 && cliquesNoBanco()[0].corpo.p_dados.servico === 'cambio-dialise', 'o registro do clique leva o serviço inteiro (cambio-dialise), mesmo com o texto cortado');
  await page.close();
  definir({ codigo: 'W8XZ5' });
  ({ page } = await abrir(await browser.createBrowserContext(), 1440, 900, '/?utm_source=' + encodeURIComponent('🔥🔥 !!')));
  const s = await estado(page);
  await page.keyboard.press('Shift');
  await comCodigo(page, 'W8XZ5');
  const t = await estado(page);
  ok(problemasNosLinks(s.links).length === 0 && problemasNosLinks(t.links, { codigo: 'W8XZ5' }).length === 0, 'fonte só com símbolos não deixa sobra no código: (site/hero) e depois (site/hero--direto--r-w8xz5)');
  await page.browserContext().close();
  await ctx.close();
}

/* ================================================================
   10. Formulário
   ================================================================ */
titulo('formulário: o pedido leva a origem e o código');
async function pedir(page) {
  await page.evaluate(() => document.querySelector('[data-open-modal]').click());
  await page.type('#fName', 'Teste Rastreio');
  await page.type('#fPhone', '12996830272');
  await page.select('#fService', 'Pneus');
  await espera(2700);
  await page.evaluate(() => document.querySelector('#leadForm button[type=submit]').click());
  await page.waitForSelector('#formOk:not([hidden])', { timeout: 6000 }).catch(() => {});
  await espera(200);
}
for (const [largura, altura] of [[375, 812], [1440, 900]]) {
  definir();
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, largura, altura, '/');
  await page.evaluate(() => document.querySelector('[data-open-modal]').click());
  await page.waitForSelector('#formBackdrop button[data-hora]');
  await page.type('#fName', 'Teste Horario');
  await page.type('#fPhone', '12996830272');
  await page.select('#fService', 'Pneus');
  await espera(2700);
  const rotulo = await page.evaluate(() => {
    const horario = document.querySelector('#formBackdrop button[data-hora]');
    const enviar = document.querySelector('#fEnviar');
    const fetch = window.fetch;
    window.fetch = async (...args) => {
      if (args[1]?.method === 'POST' && String(args[0]).includes('/site-lead')) {
        await new Promise(resolve => { window.__soltarPedido = resolve; });
      }
      return fetch(...args);
    };
    horario.click();
    enviar.click();
    enviar.click();
    horario.click();
    window.__soltarPedido();
    return horario.dataset.rotulo;
  });
  await page.waitForSelector('#formOk:not([hidden])', { timeout: 3000 }).catch(() => {});
  const e = await estado(page);
  ok(e.envios.length === 1, largura + ' px: dois cliques durante o envio geram um POST');
  const confirmado = await page.$eval('#formOk', el => !el.hidden && el.textContent.trim());
  ok(Boolean(confirmado && confirmado.includes(rotulo)) && erros.length === 0,
    largura + ' px: desmarcar o horário enquanto o pedido está em trânsito preserva a confirmação original');
  await ctx.close();
}
{
  definir({ codigo: 'F2RMA' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&utm_campaign=pneus-taubate&gclid=G-FORM');
  await page.keyboard.press('Shift');
  await comCodigo(page, 'F2RMA');
  await pedir(page);
  const e = await estado(page);
  const corpo = (e.envios[0] || {}).body || {};
  const origem = { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'pneus-taubate', gclid: 'G-FORM', pagina: '/', referencia_tipo: 'anuncio' };
  ok(e.envios.length === 1 && e.envios[0].url === SITE_LEAD && igual(corpo.rastreio, { codigo: 'F2RMA', ...origem }), 'o pedido leva "rastreio" com o código (F2RMA) e os campos de origem do contrato');
  ok(corpo.codigo === 'pneus' && igual(corpo.utm, { source: 'google', medium: 'cpc', campaign: 'pneus-taubate', gclid: 'G-FORM' }) && corpo.nome === 'Teste Rastreio' && corpo.telefone === '12996830272', 'o resto do pedido não mudou: "codigo" segue sendo o do serviço, "utm" no formato antigo, nome e telefone nos campos de sempre');
  ok(!/Teste Rastreio|12996830272/.test(JSON.stringify(corpo.rastreio)) && Object.keys(corpo.rastreio || {}).every(k => k === 'codigo' || CAMPOS.includes(k)), 'dentro de "rastreio" não entra nome nem telefone');
  const ok1 = e.links.find(l => l.id === 'formOkWa') || { texto: '' };
  ok(ok1.texto.endsWith(' (site/formulario-pneus--google--r-f2rma)') && ok1.campanha === 'formulario-pneus--google--r-f2rma', 'o botão "abrir no WhatsApp" da confirmação leva o código: (site/formulario-pneus--google--r-f2rma)');
  ok(!JSON.stringify(visitas().concat(cliquesNoBanco()).map(c => c.corpo)).match(/Teste Rastreio|12996830272/), 'nome e telefone não aparecem em nenhuma chamada do rastreio');
  ok(soDoBanco(erros).length === 0 && e.rejeicoes.length === 0, 'sem erro de console' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}
{
  definir({ modo: 'erro404' });
  const ctx = await browser.createBrowserContext();
  const { page } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=G-SEMCOD');
  await page.keyboard.press('Shift');
  await ate(() => posts().length >= 1, 4000);
  await pedir(page);
  const e = await estado(page);
  const corpo = (e.envios[0] || {}).body || {};
  const ok1 = e.links.find(l => l.id === 'formOkWa') || { texto: '' };
  ok(igual(corpo.rastreio, { utm_source: 'google', utm_medium: 'cpc', gclid: 'G-SEMCOD', pagina: '/', referencia_tipo: 'anuncio' }) && ok1.texto.endsWith(' (site/formulario-pneus--google)'), 'sem código: o pedido leva a origem do mesmo jeito (sem "codigo") e o botão da confirmação fica no formato antigo');
  await ctx.close();
}
{
  definir({ codigo: 'R3DMA' });
  const ctx = await browser.createBrowserContext();
  const { page } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=G-SEMREDE', { envioFalha: true });
  await page.keyboard.press('Shift');
  await comCodigo(page, 'R3DMA');
  await pedir(page);
  await ate(() => cliquesNoBanco().length === 1, 3000);
  const e = await estado(page);
  const u = e.aberto[0] ? new URL(e.aberto[0]) : null;
  ok(u && u.hostname === 'wa.me' && (u.searchParams.get('text') || '').endsWith(' (site/formulario-pneus--google--r-r3dma)'), 'pedido sem rede: o WhatsApp abre com a mesma mensagem e o código');
  ok(cliquesNoBanco().length === 1 && igual(cliquesNoBanco()[0].corpo, { p_dados: { codigo: 'R3DMA', evento: 'clique', servico: 'formulario-pneus' } }), 'e essa abertura conta como clique (serviço formulario-pneus)');
  await ctx.close();
}

/* ================================================================
   11. Navegador comandado por programa não registra
   ================================================================ */
titulo('navegador comandado por programa (suítes antigas, Lighthouse)');
{
  definir();
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=G-ROBO', { comandado: true });
  await page.keyboard.press('Shift');
  await page.mouse.wheel({ deltaY: 300 });
  await espera(4700);
  const e = await estado(page);
  ok(posts().length === 0 && e.rastreios.length === 0 && sondagens === 0, 'com navigator.webdriver ligado nada é mandado ao banco, nem com interação nem depois de 4 s');
  ok(e.guardado && e.guardado.dados.gclid === 'G-ROBO' && problemasNosLinks(e.links, { source: 'google' }).length === 0 && erros.length === 0, 'e a página segue igual: origem guardada no aparelho, botões no formato antigo, sem erro');
  await ctx.close();
}

/* ================================================================
   12. Guarda de 30 dias e armazenamento adulterado
   ================================================================ */
titulo('guarda de 30 dias e dados estragados no aparelho');
{
  const DIA = 86400000;
  const guardado = (dias, dados, codigo) => ({ local: { indycar_rastreio: JSON.stringify({ dados, codigo, quando: Date.now() - dias * DIA }) } });
  definir({ codigo: 'N2VAA' });
  let ctx = await browser.createBrowserContext();
  let { page, erros } = await abrir(ctx, 1440, 900, '/', { guardar: guardado(31, { utm_source: 'google', gclid: 'VENCIDO', pagina: '/', referencia_tipo: 'anuncio' }, 'VEXH2') });
  let e = await estado(page);
  ok(igual(e.guardado.dados, { pagina: '/', referencia_tipo: 'direto' }) && e.guardado.codigo === '' && problemasNosLinks(e.links).length === 0, 'guardado há 31 dias: vencido, some (a chegada de hoje é direta e os botões saem sem código)');
  await ctx.close();

  ctx = await browser.createBrowserContext();
  ({ page, erros } = await abrir(ctx, 1440, 900, '/', { guardar: guardado(29, { utm_source: 'google', utm_medium: 'cpc', gclid: 'VALE', pagina: '/', referencia_tipo: 'anuncio' }, 'B29DM') }));
  e = await estado(page);
  ok(e.guardado.dados.gclid === 'VALE' && problemasNosLinks(e.links, { codigo: 'B29DM', source: 'google' }).length === 0, 'guardado há 29 dias: ainda vale (botões com --google--r-b29dm)');
  await ctx.close();

  ctx = await browser.createBrowserContext();
  ({ page, erros } = await abrir(ctx, 1440, 900, '/', { guardar: guardado(-2, { gclid: 'FUTURO' }, 'B29DM') }));
  e = await estado(page);
  ok(igual(e.guardado.dados, { pagina: '/', referencia_tipo: 'direto' }) && e.guardado.codigo === '', 'data no futuro (relógio do aparelho errado ou dado mexido): descartado');
  await ctx.close();

  ctx = await browser.createBrowserContext();
  ({ page, erros } = await abrir(ctx, 1440, 900, '/'));
  const agora = Date.now();
  const estragos = ['{', 'null', '[]', '"texto"', '123', '{"dados":"x","codigo":["ABCDE"],"quando":"ontem"}',
    JSON.stringify({ dados: { utm_source: { a: 1 }, gclid: 123, fbclid: ['x'], pagina: '/x', nome: 'Maria', telefone: '12999990000' }, codigo: '<b>', quando: agora }),
    JSON.stringify({ dados: { utm_source: 'A'.repeat(5000), gclid: 'G'.repeat(5000) }, codigo: 'k7m2p', quando: agora })];
  const ruins = [];
  for (const [i, valor] of estragos.entries()) {
    await page.evaluate((v) => { localStorage.setItem('indycar_rastreio', v); sessionStorage.removeItem('indycar_rastreio'); sessionStorage.removeItem('indycar_utm'); }, valor);
    await page.reload({ waitUntil: 'domcontentloaded' });
    e = await estado(page);
    const semCodigo = e.links.every(l => !/--r-/.test(l.texto));
    if (erros.length || e.rejeicoes.length || e.links.length !== ESTATICOS.length || !semCodigo) ruins.push('caso ' + i + (erros.length ? ' (' + erros[0] + ')' : ''));
  }
  ok(ruins.length === 0, estragos.length + ' valores estragados em localStorage: a página abre sem erro, com todos os botões e sem código inventado' + resumo(ruins));
  await page.keyboard.press('Shift');
  await ate(() => visitas().length === 1, 4000);
  const d = ((visitas()[0] || {}).corpo || {}).p_dados || {};
  ok(d.utm_source && d.utm_source.length === 100 && d.gclid.length === 255 && Object.keys(d).every(k => k === 'evento' || CAMPOS.includes(k)), 'o que foi mexido no aparelho passa pela mesma limpeza antes de ir ao banco (tamanho máximo, só os campos do contrato)');
  await ctx.close();

  ctx = await browser.createBrowserContext();
  ({ page, erros } = await abrir(ctx, 1440, 900, '/', { guardar: { sessao: { indycar_utm: JSON.stringify({ source: 'meta', medium: 'cpc', campaign: 'promo', fbclid: 'FB-ANTIGO' }) } } }));
  e = await estado(page);
  ok(igual(e.guardado.dados, { utm_source: 'meta', utm_medium: 'cpc', utm_campaign: 'promo', fbclid: 'FB-ANTIGO', pagina: '/', referencia_tipo: 'anuncio' }) && problemasNosLinks(e.links, { source: 'meta' }).length === 0, 'página aberta desde a versão antiga (só sessionStorage indycar_utm): a campanha da sessão continua valendo');
  await ctx.close();

  ctx = await browser.createBrowserContext();
  ({ page, erros } = await abrir(ctx, 1440, 900, '/', { guardar: { sessao: { indycar_utm: '{"source":{"x":1},"gclid":5,"campaign":["a"]}' } } }));
  e = await estado(page);
  ok(erros.length === 0 && igual(e.guardado.dados, { pagina: '/', referencia_tipo: 'direto' }) && problemasNosLinks(e.links).length === 0, 'sessão antiga com valores que não são texto: ignorados, sem erro');
  await ctx.close();
}

/* ================================================================
   13. Página de chegada pelos atalhos (/s/<serviço>, /agendar)
   ================================================================ */
titulo('página de chegada pelos atalhos');
{
  definir({ codigo: 'S4FRE' });
  const ctx = await browser.createBrowserContext();
  let { page, erros } = await abrir(ctx, 375, 812, '/s/freios?gclid=G-ATALHO&utm_source=google&utm_medium=cpc');
  await espera(700);
  let e = await estado(page);
  const quer = { utm_source: 'google', utm_medium: 'cpc', gclid: 'G-ATALHO', pagina: '/s/freios', referencia_tipo: 'anuncio' };
  ok(igual(e.guardado.dados, quer) && e.endereco === '/', '/s/freios?gclid=…: o clique sobrevive ao redirecionamento e a página de chegada guardada é "/s/freios" (não "/")');
  await page.keyboard.press('Shift');
  await comCodigo(page, 'S4FRE');
  ok(visitas().length === 1 && igual(visitas()[0].corpo, { p_dados: { evento: 'visita', ...quer } }) && erros.length === 0, 'e é assim que vai para o banco');
  await page.reload({ waitUntil: 'domcontentloaded' });
  e = await estado(page);
  ok(e.guardado.dados.pagina === '/s/freios' && e.guardado.codigo === 'S4FRE', 'recarregar (o endereço já está limpo) não troca a página de chegada');
  await ctx.close();
  const ctx2 = await browser.createBrowserContext();
  ({ page, erros } = await abrir(ctx2, 375, 812, '/agendar?utm_source=instagram&utm_medium=bio'));
  await espera(500);
  e = await estado(page);
  ok(igual(e.guardado.dados, { utm_source: 'instagram', utm_medium: 'bio', pagina: '/agendar', referencia_tipo: 'instagram' }), '/agendar?utm_…: página de chegada "/agendar"');
  await ctx2.close();
}

/* ================================================================
   14. Os 4 segundos com a página à vista
   ================================================================ */
titulo('sem interação: 4 s com a página à vista');
{
  definir({ codigo: 'T4SEG' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?gclid=G-4S');
  ok(await ate(() => visitas().length === 1, 9000), 'sem ninguém tocar em nada, o registro sai sozinho');
  const e = await estado(page);
  const r = e.rastreios[0] || { em: 0 };
  ok(e.interacao === null && r.em >= 3950 && r.em < 9000, 'e só depois de 4 s de página aberta (saiu aos ' + (r.em / 1000).toFixed(1) + ' s)');
  ok(erros.length === 0, 'sem erro de console' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}
{
  definir({ codigo: 'T4VER' });
  const ctx = await browser.createBrowserContext();
  const { page } = await abrir(ctx, 1440, 900, '/?gclid=G-OCULTA', { oculta: true });
  await espera(5200);
  ok(posts().length === 0, 'aba em segundo plano (página não está à vista): 5 s depois, nada foi registrado');
  const mostrou = await page.evaluate(() => { window.__oculta = false; document.dispatchEvent(new Event('visibilitychange')); return performance.now(); });
  await espera(1500);
  await page.evaluate(() => { window.__oculta = true; document.dispatchEvent(new Event('visibilitychange')); });
  await espera(3200);
  ok(posts().length === 0, 'apareceu por 1,5 s e voltou para o fundo: o relógio para, nada é registrado');
  const voltou = await page.evaluate(() => { window.__oculta = false; document.dispatchEvent(new Event('visibilitychange')); return performance.now(); });
  ok(await ate(() => visitas().length === 1, 8000), 'quando a página volta a ficar à vista, o registro sai');
  const e = await estado(page);
  ok(e.rastreios.length === 1 && e.rastreios[0].em - voltou >= 3950 && voltou > mostrou, '4 s contados desde que a página ficou à vista (' + ((e.rastreios[0].em - voltou) / 1000).toFixed(1) + ' s)');
  await ctx.close();
}

/* ================================================================
   15. O arquivo como está no repositório e o arquivo minificado
   ================================================================ */
titulo('script.js como está no repositório (chave ' + (CHAVE_REAL ? 'preenchida' : 'vazia') + ')');
{
  variante = 'como-esta';
  definir();
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 1440, 900, '/?utm_source=google&utm_medium=cpc&gclid=G-COMO-ESTA');
  await page.keyboard.press('Shift');
  await page.mouse.wheel({ deltaY: 300 });
  await espera(CHAVE_REAL ? 1200 : 4600);
  const c = await clicarWa(page, 'hero');
  const e = await estado(page);
  if (CHAVE_REAL) {
    ok(e.rastreios.length >= 1 && e.rastreios.every(r => r.url === URL_REAL) && posts().length === 0, 'com a chave preenchida o site tenta registrar no endereço de verdade (aqui a rede está fechada: nada chega a lugar nenhum)');
    ok(problemasNosLinks(e.links, { source: 'google' }).length === 0 && c && c.texto.endsWith(' (site/hero--google)'), 'sem resposta do banco os botões ficam no formato antigo');
  } else {
    ok(e.rastreios.length === 0 && posts().length === 0, 'com a chave vazia o site não chama banco nenhum (nem na interação, nem depois de 4 s, nem no clique)');
    ok(problemasNosLinks(e.links, { source: 'google' }).length === 0 && c && c.texto.endsWith(' (site/hero--google)') && !c.prevenido && erros.length === 0, 'e funciona como antes: botões com (site/<serviço>--google), sem erro de console' + (erros.length ? ': ' + erros[0] : ''));
    ok(e.guardado && e.guardado.dados.gclid === 'G-COMO-ESTA' && e.guardado.codigo === '', 'a origem já fica guardada no aparelho (pronta para quando a chave for preenchida)');
  }
  await ctx.close();
  variante = 'teste';
}
titulo('script.js minificado (como vai para o ar)');
{
  variante = 'minificado';
  definir({ codigo: 'M7NFY' });
  const ctx = await browser.createBrowserContext();
  const { page, erros } = await abrir(ctx, 375, 812, '/?utm_source=google&utm_medium=cpc&gclid=G-MIN');
  const a = await estado(page);
  await page.keyboard.press('Shift');
  const chegou = await comCodigo(page, 'M7NFY');
  const c = await clicarWa(page, 'hero');
  await ate(() => cliquesNoBanco().length === 1, 3000);
  const d = await estado(page);
  ok(problemasNosLinks(a.links, { source: 'google' }).length === 0 && chegou && problemasNosLinks(d.links, { codigo: 'M7NFY', source: 'google' }).length === 0, 'depois da minificação: antes (site/…--google), depois (site/…--google--r-m7nfy)');
  ok(c && c.texto.endsWith(' (site/hero--google--r-m7nfy)') && cliquesNoBanco().length === 1 && cliquesNoBanco()[0].corpo.p_dados.servico === 'hero' && erros.length === 0, 'clique registrado e nenhum erro de console no arquivo minificado' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
  variante = 'teste';
  const semChave = transformSync(JS, MINIFICAR).code.length, comChave = transformSync(JS.replace(achados.chave[0][0], "const RASTREIO_CHAVE = '" + 'x'.repeat(208) + "';"), MINIFICAR).code.length;
  ok(semChave <= 64 * 1024 && comChave <= 64 * 1024, 'script.js minificado cabe no orçamento de 64 KB do publicar: ' + semChave + ' bytes hoje, ' + comChave + ' com uma chave de 208 caracteres');
}

/* ================================================================
   16. Pulo do menu enquanto a lista de horários chega (semana de feriado)
   ================================================================ */
titulo('pulo do menu no celular enquanto os horários chegam');
{
  const pular = async (rotulo, cfg, alvo) => {
    const ctx = await browser.createBrowserContext();
    const { page } = await abrir(ctx, 375, 812, '/', { ...cfg, segurarHorarios: true }, { ate: 'networkidle2' });
    await espera(400);
    const h0 = await page.evaluate(() => document.getElementById('horarios').offsetHeight);
    await page.evaluate(a => document.querySelector('a[href="#' + a + '"]').click(), alvo);
    await espera(700);
    await page.evaluate(() => window.__soltarHorarios()); // a Agenda responde com a pessoa a caminho da seção
    await espera(1400);
    const r = await page.evaluate(a => ({ topo: Math.round(document.getElementById(a).getBoundingClientRect().top), h: document.getElementById('horarios').offsetHeight }), alvo);
    ok(r.topo >= 60 && r.topo <= 100, rotulo + ': o menu leva até #' + alvo + ' com o título logo abaixo da barra (topo ' + r.topo + ' px; a caixa de horários foi de ' + h0 + ' para ' + r.h + ' px no caminho)');
    await ctx.close();
    return r.h - h0;
  };
  await pular('semana comum', { dias: DIAS_NORMAIS }, 'contato');
  const cresceu = await pular('semana de feriado', { dias: DIAS_FERIADO }, 'contato');
  await pular('semana de feriado', { dias: DIAS_FERIADO }, 'faq');
  await pular('semana de feriado', { dias: DIAS_FERIADO }, 'garantia');
  const sumiu = await pular('Agenda fora do ar', { horariosFalha: true }, 'contato');
  ok(cresceu > 40 && sumiu < -100, 'os cenários mexem mesmo na altura da página no meio do pulo (feriado: +' + cresceu + ' px; Agenda fora: ' + sumiu + ' px)');

  const ctx = await browser.createBrowserContext();
  const { page } = await abrir(ctx, 375, 812, '/', { dias: DIAS_FERIADO, segurarHorarios: true }, { ate: 'networkidle2' });
  await espera(400);
  await page.evaluate(() => document.querySelector('a[href="#contato"]').click());
  await espera(1600);
  await page.mouse.wheel({ deltaY: -260 }); // a pessoa rola por conta própria
  await espera(700);
  const meio = await page.evaluate(() => Math.round(document.getElementById('contato').getBoundingClientRect().top));
  await page.evaluate(() => window.__soltarHorarios());
  await espera(1200);
  const fim = await page.evaluate(() => Math.round(document.getElementById('contato').getBoundingClientRect().top));
  ok(meio > 200 && fim > 200, 'depois que a pessoa rola por conta própria, a chegada dos horários não puxa a tela de volta (título em ' + meio + ' px antes, ' + fim + ' px depois)');
  await ctx.close();
}

/* ================================================================
   17. Conferências do código (sem navegador)
   ================================================================ */
titulo('conferências do código');
{
  ok(URL_REAL === BANCO_REAL + RPC, 'RASTREIO_URL aponta para o banco da oficina, função trafego_rastreio_registrar');
  if (!CHAVE_REAL) info('RASTREIO_CHAVE está vazia no repositório: o site não registra nada até a chave pública ser preenchida (script.js, uma linha)');
  else {
    let publica = /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(CHAVE_REAL);
    if (!publica) { try { publica = JSON.parse(Buffer.from(CHAVE_REAL.split('.')[1], 'base64url').toString('utf8')).role === 'anon'; } catch (_) {} }
    ok(publica, 'RASTREIO_CHAVE é a chave PÚBLICA do banco (sb_publishable_… ou JWT de papel "anon"); a de serviço nunca pode vir para o site');
  }
  ok(/connect-src 'self' https:\/\/nppfqhavqahapmugnyng\.supabase\.co(;|$)/.test(CSP_REAL), 'netlify.toml: a política de segurança continua deixando o site falar só com ele mesmo e com o banco da oficina');
  const dominios = [...new Set((JS.match(/https?:\/\/[A-Za-z0-9.-]+/g) || []).map(u => u.replace(/^https?:\/\//, '')).filter(Boolean))];
  const conhecidos = ['nppfqhavqahapmugnyng.supabase.co', 'wa.me', 'indycar-patio.netlify.app', 'indycar-taubate.netlify.app', 'indycar-orcador.netlify.app'];
  ok(dominios.every(d => conhecidos.includes(d)), 'script.js não cita nenhum domínio novo (' + dominios.join(', ') + ')');
  ok(!/sendBeacon|document\.cookie|gtag\(|fbq\(|googletagmanager|google-analytics|connect\.facebook\.net/.test(JS + HTML), 'nada de pixel, cookie ou script de terceiros');
  ok(/Guardamos por qual anúncio ou link você chegou/.test(PRIV) && /não tem nome, telefone nem e-mail/.test(PRIV) && /30 dias/.test(PRIV) && /90 dias/.test(PRIV) && !/cookie de rastreio/.test(PRIV),
    'privacidade.html diz que guardamos por qual anúncio a pessoa chegou (30 dias no aparelho, sem nome, telefone ou e-mail, some do sistema em 90 dias) e não promete mais "sem cookie de rastreio"');
  ok(!/[—]|prezad|efetu|comparec|ve[ií]culo/i.test(PRIV.replace(/<style>[\s\S]*?<\/style>/, '')), 'privacidade.html sem travessão e sem as palavras proibidas');
}

} catch (e) {
  ok(false, 'a suíte parou no meio de "' + secaoAtual + '": ' + String((e && e.message) || e).split(NL)[0]);
}

console.log('');
console.log(falhas ? falhas + ' falha(s) em ' + feitos + ' conferências (rodada 8).' : 'rodada 8: tudo certo (' + feitos + ' conferências).');
await fechar(falhas ? 1 : 0);
