// Rodada 10 (20/11/2026): o que dá para conferir sem navegador (cabeçalhos, CSP, SEO técnico, arquivos que vão para o ar).
// Roda com `node --test`. Cada teste tem o nome citado no MELHORIAS.md (r10-...).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SITE = 'https://indycar-taubate.netlify.app';
const PAGINAS = ['index.html', '404.html', 'privacidade.html'];
const toml = ler('netlify.toml');
const csp = (/Content-Security-Policy = "([^"]+)"/.exec(toml) || [])[1] || '';
const diretiva = (nome) => ((csp.split(';').map(s => s.trim()).find(s => s.startsWith(nome + ' ')) || '').split(/\s+/).slice(1));
const index = ler('index.html');
const ld = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
/** dist/ montado uma vez (o mesmo `publicar.mjs` do `npm run publicar`, sem o envio). */
let distPronto = false;
const dist = (f) => { if (!distPronto) { execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'publicar.mjs')], { stdio: 'ignore' }); distPronto = true; } return fs.readFileSync(path.join(ROOT, 'dist', f), 'utf8'); };

test('r10-csp-estilo: estilo só do próprio site, sem \'unsafe-inline\', e nenhuma página depende de estilo embutido', () => {
  assert.deepEqual(diretiva('style-src'), ["'self'"], 'style-src é só \'self\'');
  assert.ok(!csp.includes('unsafe-inline') && !csp.includes('unsafe-eval'), 'o CSP inteiro não tem unsafe-*');
  for (const p of PAGINAS) {
    const h = ler(p);
    assert.ok(!/<style[\s>]/i.test(h), p + ' sem <style>');
    assert.ok(!/\sstyle\s*=\s*["']/i.test(h), p + ' sem style=""');
  }
  for (const js of ['script.js', '404.js']) {
    const t = ler(js);
    assert.ok(!/setAttribute\(\s*['"]style['"]|createElement\(\s*['"]style['"]|style\s*=\s*\\?["'][^"']*:/.test(t), js + ' não cria estilo embutido (mexe pelo CSSOM, que o CSP não barra)');
  }
  for (const css of ['404.css', 'privacidade.css', 'sem-js.css']) assert.ok(fs.existsSync(path.join(ROOT, css)), css + ' existe');
});

test('r10-csp-dominios: o CSP não libera domínio que o site não usa', () => {
  const mapa = new URL((/data-map-src="([^"]+)"/.exec(index) || [])[1].replace(/&amp;/g, '&'));
  assert.deepEqual(diretiva('frame-src'), [mapa.origin], 'frame-src = só a origem do mapa (' + mapa.origin + ')');
  assert.deepEqual(diretiva('form-action'), ["'self'"], 'nenhum formulário envia para fora do site');
  for (const p of PAGINAS) assert.ok(!/<form[^>]*\saction=/i.test(ler(p)), p + ' sem <form action>');
  const fontes = PAGINAS.map(ler).join('\n') + ler('script.js') + ler('404.js');
  for (const d of ['connect-src', 'frame-src', 'img-src', 'font-src', 'script-src', 'style-src']) {
    for (const h of diretiva(d).filter(x => x.startsWith('http'))) assert.ok(fontes.includes(h), d + ': ' + h + ' é usado pelo site');
  }
});

test('r10-css-versao: os estilos das páginas pequenas vão para o ar com ?v=<hash> (o cache é de um ano)', () => {
  assert.match(dist('404.html'), /href="\/404\.css\?v=[0-9a-f]{10}"/);
  assert.match(dist('privacidade.html'), /href="\/privacidade\.css\?v=[0-9a-f]{10}"/);
  assert.match(dist('index.html'), /<noscript><link rel="stylesheet" href="sem-js\.css\?v=[0-9a-f]{10}"/);
  for (const css of ['404.css', 'privacidade.css', 'sem-js.css']) assert.ok(dist(css).length > 50 && !dist(css).includes('/*'), css + ' minificado em dist/');
});
