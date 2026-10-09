// Monta dist/ só com o que vai para o ar (o netlify-cli ignora o .netlifyignore no deploy por pasta).
// Uso: npm run publicar  ->  npx netlify-cli deploy --prod --dir dist
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const NAO = new Set(['oficina-2.png']);
const PERMITIDO = /\.(html|css|js|png|jpg|webp|svg|txt|xml|webmanifest)$/;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
const copiados = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isFile() && PERMITIDO.test(d.name) && !NAO.has(d.name) && !d.name.startsWith('.') && !d.name.startsWith('qa-'))
  .map(d => { fs.copyFileSync(path.join(ROOT, d.name), path.join(DIST, d.name)); return d.name; });
for (const f of ['index.html', '404.html', 'privacidade.html', 'robots.txt', 'sitemap.xml', 'script.js', 'styles.css']) {
  if (!copiados.includes(f)) { console.error('faltou ' + f); process.exit(1); }
}
console.log('dist/ pronto com ' + copiados.length + ' arquivos: ' + copiados.join(', '));
