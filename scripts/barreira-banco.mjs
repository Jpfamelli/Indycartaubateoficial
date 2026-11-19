// Rodada 8: os testes de navegador nunca gravam no banco de verdade.
// Achado em 19/11/2026: a fila de reenvio do site (guardada no navegador do teste) reenviava o pedido "Teste QA"
// ao site-lead real antes de a resposta falsa entrar na página; virou 2 contatos de teste no CRM. Leitura (GET) segue
// livre; qualquer envio ao Supabase da oficina recebe uma resposta falsa aqui e fica anotado em `barrados`.
export const BANCO = 'https://nppfqhavqahapmugnyng.supabase.co/';
export const barrados = [];

const LIVRES = new Set(['GET', 'HEAD', 'OPTIONS']);
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };

export async function barrarEnvioAoBanco(page) {
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (r.isInterceptResolutionHandled()) return;
    if (r.url().startsWith(BANCO) && !LIVRES.has(r.method())) {
      barrados.push(r.method() + ' ' + r.url().slice(BANCO.length));
      return r.respond({ status: 200, contentType: 'application/json', headers: CORS,
        body: JSON.stringify({ ok: true, protocolo: 'QA0000', mensagem: 'Teste: nada foi para o banco.' }) });
    }
    return r.continue();
  });
}

// Toda página nova do navegador passa pela barreira.
export function protegerNavegador(browser) {
  const nova = browser.newPage.bind(browser);
  browser.newPage = async (...a) => { const p = await nova(...a); await barrarEnvioAoBanco(p); return p; };
}

export function relatarBarrados() {
  if (barrados.length) console.log(`  info ${barrados.length} envio(s) ao banco de verdade barrado(s) pela barreira do teste: ${[...new Set(barrados)].join(' · ')}`);
}
