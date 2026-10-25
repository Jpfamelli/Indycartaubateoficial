/* ================================================================
   LOTE 3 — links curtos para o ecossistema, código colado na barra, SEO local, peso e CSS sem sobra
   (incluído pelo qa-r7.mjs: usa abrir, ok, espera, BASE, aplicarRedirect, ROOT de lá)
   ================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export async function lote3({ abrir, ok, espera, BASE, aplicarRedirect, ROOT, browser }) {
  console.log('\n== links curtos no domínio da oficina (rodada 7) ==');
  {
    const tk36 = '0123456789abcdef0123456789abcdef0123';
    const tk48 = 'abcdef0123456789abcdef0123456789abcdef0123456789';
    const tk32 = '00112233445566778899aabbccddeeff';
    const a = aplicarRedirect('/a/' + tk36, '');
    ok(a && a.to === 'https://indycar-patio.netlify.app/acompanhar/?t=' + tk36, '/a/<código> abre o Acompanhar meu carro do Pátio');
    const m = aplicarRedirect('/m/' + tk48, '');
    ok(m && m.to === 'https://indycar-patio.netlify.app/minha/?c=' + tk48, '/m/<código> abre a Minha IndyCar');
    const o = aplicarRedirect('/o/' + tk32, '');
    ok(o && o.to === 'https://indycar-orcador.netlify.app/#/o/' + tk32, '/o/<código> abre o orçamento no Orçador');
    const r = aplicarRedirect('/rota', '');
    ok(r && r.to.startsWith('https://www.google.com/maps/dir/?api=1&destination=') && r.to.includes('Bandeirantes'), '/rota abre o Google Maps já com o destino da oficina');
    const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
    ok(['/a/', '/m/', '/o/', '/rota', '/acompanhar', '/minha', '/area-cliente'].every(p => robots.includes('Disallow: ' + p)), 'robots.txt: os atalhos novos ficam fora do Google');
  }

  console.log('\n== código da oficina colado na barra do site ==');
  for (const [caminho, esperado, rotulo] of [
    ['/0123456789abcdef0123456789abcdef0123', 'https://indycar-patio.netlify.app/acompanhar/?t=0123456789abcdef0123456789abcdef0123', '36 → Acompanhar meu carro'],
    ['/ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789', 'https://indycar-patio.netlify.app/minha/?c=abcdef0123456789abcdef0123456789abcdef0123456789', '48 (maiúsculas) → Minha IndyCar'],
    ['/00112233445566778899aabbccddeeff', 'https://indycar-orcador.netlify.app/#/o/00112233445566778899aabbccddeeff', '32 → orçamento'],
  ]) {
    const page = await browser.newPage();
    const tentativas = [];
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.url().startsWith('https://indycar-')) { tentativas.push(req.url()); return req.respond({ status: 200, contentType: 'text/html', body: '<title>destino</title>' }); }
      req.continue();
    });
    await page.goto(BASE + caminho, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await espera(500);
    ok(tentativas[0] === esperado, 'barra do site com código de ' + rotulo + (tentativas[0] === esperado ? '' : ' (foi para ' + tentativas[0] + ')'));
    await page.close();
  }
  {
    const page = await browser.newPage();
    const fora = [];
    await page.setRequestInterception(true);
    page.on('request', (req) => { if (req.url().startsWith('https://indycar-') || req.url().includes('evil')) { fora.push(req.url()); return req.respond({ status: 200, body: 'x' }); } req.continue(); });
    for (const lixo of ['/nao-existe', '/0123456789abcdef0123456789abcdef012', '/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', '/a/b/c']) {
      await page.goto(BASE + lixo, { waitUntil: 'load' }).catch(() => {});
      await espera(250);
    }
    ok(fora.length === 0, 'caminho que não é código (curto, não-hexadecimal, desconhecido) continua sendo a 404, sem redirecionar');
    await page.close();
  }

  console.log('\n== pedido do atalho chega ao CRM com a origem (rodada 7) ==');
  {
    const { page } = await abrir(375, 812, BASE + '/s/freios?utm_source=comunicar&utm_campaign=revisao');
    await page.evaluate(() => { localStorage.clear(); window.open = () => null; });
    await espera(700);
    await page.click('#fName'); await page.type('#fName', 'Cliente do Comunicar');
    await page.click('#fPhone'); await page.type('#fPhone', '12996830272');
    await espera(2700);
    await page.click('#fEnviar'); await espera(900);
    const env = await page.evaluate(() => window.__envios[0] && window.__envios[0].body);
    ok(env && env.pagina === '/s/freios' && env.codigo === 'freios' && env.utm.source === 'comunicar' && env.utm.campaign === 'revisao', 'pedido de quem veio por /s/freios leva pagina "/s/freios", o serviço e a campanha (utm_source=comunicar): o lead mostra de onde veio');
    await page.close();
  }

  console.log('\n== SEO local e verdade dos metadados (rodada 7) ==');
  {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const titulo = /<title>(.*?)<\/title>/.exec(html)[1];
    const desc = /name="description" content="(.*?)"/.exec(html)[1];
    ok(/Taubaté/.test(titulo) && titulo.length <= 66 && /Oficina Mecânica/i.test(titulo), 'título com a cidade e o tipo de negócio, até 66 caracteres (' + titulo.length + ')');
    ok(desc.length <= 160 && /Bandeirantes, 875/.test(desc) && /Taubaté/.test(desc) && /8h–17h30/.test(desc), 'descrição com endereço, cidade e horário, até 160 caracteres (' + desc.length + ')');
    ok(html.includes('hreflang="x-default"'), 'hreflang x-default ao lado do pt-BR');
    const ld = JSON.parse(/<script type="application\/ld\+json">\s*(\{\s*"@context": "https:\/\/schema.org",\s*"@type": "AutoRepair"[\s\S]*?)<\/script>/.exec(html)[1]);
    ok(ld.alternateName.includes('IndyCar Taubaté') && ld.currenciesAccepted === 'BRL' && ld.knowsAbout.length >= 6, 'JSON-LD da oficina com nome alternativo, moeda e especialidades (câmbio por diálise, scanner…)');
    ok(!('aggregateRating' in ld) && !('priceRange' in ld) && !('review' in ld), 'JSON-LD continua sem nota autoatribuída, sem faixa de preço e sem avaliação inventada');
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    ok(sitemap.includes('xmlns:image') && (sitemap.match(/<image:loc>/g) || []).length === 2 && sitemap.includes('Fachada da IndyCar'), 'sitemap com as imagens da fachada e da divulgação (Google Imagens local)');
    const priv = fs.readFileSync(path.join(ROOT, 'privacidade.html'), 'utf8');
    ok(/og:title/.test(priv) && /name="robots"/.test(priv) && /Lembrar meus dados/.test(priv) && /180 dias/.test(priv) && /25\/10\/2026/.test(priv), 'privacidade: metadados sociais e o texto novo (dados lembrados só com a sua marcação, fila de 24 h, protocolo de 36 h)');
    const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
    ok(man.shortcuts[0].url.startsWith('/agendar?utm_source=pwa') && man.shortcuts[1].url.startsWith('/horarios?utm_source=pwa'), 'atalhos do app instalado marcam utm_source=pwa (e o redirecionamento mantém)');
  }

  console.log('\n== peso e publicação ==');
  {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'publicar.mjs')], { cwd: ROOT, stdio: 'pipe' });
    const dist = (f) => path.join(ROOT, 'dist', f);
    const fonteHtml = fs.statSync(path.join(ROOT, 'index.html')).size;
    const distHtml = fs.readFileSync(dist('index.html'), 'utf8');
    ok(!/<!--/.test(distHtml) && distHtml.length < fonteHtml * 0.86, 'dist/index.html sem comentários nem indentação (' + Math.round(fonteHtml / 1024) + ' → ' + Math.round(distHtml.length / 1024) + ' KB)');
    ok(fs.existsSync(dist('404.js')) && !fs.existsSync(dist('oficina-fachada.png')) && !fs.existsSync(dist('qa-r7.mjs')), 'dist/ leva o 404.js e não leva o PNG de 483 KB que nenhuma página chama nem o teste');
    const jsonld = [...distHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => { try { JSON.parse(m[1]); return true; } catch (_) { return false; } });
    ok(jsonld.length === 3 && jsonld.every(Boolean), 'os 3 blocos JSON-LD continuam válidos depois de enxugar o HTML');
    ok(/<noscript>/.test(distHtml) && distHtml.includes('id="leadForm"') && distHtml.includes('<textarea'), 'noscript, formulário e textarea intactos no HTML enxuto');
    const limites = { 'index.html': 96, 'styles.css': 92, 'script.js': 64 };
    ok(Object.entries(limites).every(([f, kb]) => fs.statSync(dist(f)).size <= kb * 1024), 'orçamento de peso: HTML ≤ 96 KB, CSS ≤ 92 KB, JS ≤ 64 KB depois de minificar');
    let sobra = 0;
    try { execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'css-morto.mjs'), '--silencioso', '--falhar'], { cwd: ROOT, stdio: 'pipe' }); } catch (_) { sobra = 1; }
    ok(sobra === 0, 'styles.css sem regra para classe que nenhuma página usa (npm run css-morto)');
  }
}
