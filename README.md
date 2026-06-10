# IndyCar Centro Automotivo — Site Oficial

Landing page (one-page) da **IndyCar Centro Automotivo Taubaté**.
HTML, CSS e JavaScript puros — site estático, sem build.

## Arquivos
- `index.html` — página
- `styles.css` — estilos
- `script.js` — interações (partículas, contadores, carrossel, modais, prova social)
- `logo.png`, `oficina-fachada.png`, `oficina-2.png` — imagens

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
