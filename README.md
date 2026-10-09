# IndyCar Centro Automotivo — Site Oficial

Landing page (one-page) da **IndyCar Centro Automotivo Taubaté**.
HTML, CSS e JavaScript puros — site estático, sem build.

## Arquivos
- `index.html` — página
- `styles.css` — estilos
- `script.js` — interações (partículas, contadores, carrossel, modais, prova social)
- `privacidade.html` — política de privacidade (LGPD)
- `404.html` — página de erro
- `logo.png`, `oficina-fachada.*` (jpg/webp/png), `fachada-recorte*` (png/webp), `og-indycar.jpg` (1200x630) — imagens
- `scripts/qa.mjs` — teste automático (não vai para o ar)

## Rodar localmente
Basta abrir o `index.html` no navegador. (Ou: `npx serve .`)

## Publicar

### GitHub Pages
1. Crie um repositório no GitHub e dê `git push`
2. Settings → Pages → Source: branch `main`, pasta `/ (root)` → Save
3. Sai no ar em `https://SEU-USUARIO.github.io/REPO/`
   (o arquivo `.nojekyll` já está incluído para servir tudo corretamente)

### Render
1. Suba o repositório no GitHub
2. Render → New → Static Site → conecte o repo
3. Build Command: *(vazio)* · Publish Directory: `.`
4. Nomeie o serviço como **indycartaubateoficial** → fica `indycartaubateoficial.onrender.com`
   (ou use o `render.yaml` incluído via New → Blueprint)

### Domínio próprio
Registre `indycartaubateoficial.com.br` no registro.br e aponte o DNS para o host escolhido.

## Produção oficial
https://indycar-taubate.netlify.app/

Publicar de dentro desta pasta: `npx netlify-cli link --name indycar-taubate` (só na 1ª vez) e `npm run publicar` — monta `dist/` só com os arquivos do site e roda `npx netlify-cli deploy --prod --dir dist`. Não use `--dir .`: o netlify-cli ignora o .netlifyignore e publicaria scripts, package.json e .md. Depois confira com `QA_URL=https://indycar-taubate.netlify.app npm test`. Sem build. Conteúdo aprovado e lista da rodada em MELHORIAS.md.

## Testar
`npm install` uma vez e `npm test`: abre o site no Chrome instalado (puppeteer-core) em 375 e 1440 px e confere rolagem horizontal, erros de console, links de WhatsApp (mensagem pronta + código "(site/<serviço>)" + UTM), JSON-LD, FAQ, imagens, mapa sob demanda, formulário, vocabulário e CLS. Capturas em `qa-out/` (fora do git e do deploy).

## WhatsApp e origem do contato
O wa.me não repassa UTM para o CRM, então cada mensagem pronta termina com um código curto, ex.: "(site/cambio)", "(site/formulario)". O atendente/IA reconhece por ele que o contato veio do site e de qual botão.

## Regras de conteúdo
Nada de depoimento ou nota inventada (avaliações só no Google), nada de preço/prazo, leva e traz sempre "consulte condições". O que a oficina faz ou não faz vem do `catalogo_servicos` do Supabase.
