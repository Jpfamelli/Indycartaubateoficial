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
O wa.me não repassa UTM para o CRM, então cada mensagem pronta termina com um código curto, ex.: "(site/cambio)", "(site/formulario-freios)". No banco, o gatilho `at_origem_pelo_site` lê `(site/<código>)` (só `a-z 0-9 _ -`, até 40 caracteres) da primeira mensagem do cliente e grava no lead `utm_source=site`, `utm_medium=whatsapp`, `utm_campaign=<código>`. O teste confere que todo link e toda opção do formulário têm código nesse formato.

### Tabela de códigos

| Código | Onde está |
|---|---|
| `hero` | botão principal do topo |
| `diagnostico` | seção "Como funciona o diagnóstico gratuito" |
| `cambio` | card Troca de Óleo de Câmbio (especialidade) |
| `cambio-dialise` | FAQ do câmbio por diálise |
| `scanner` | card Diagnóstico com Scanner |
| `motor` | card Revisão de Motor |
| `oleo-motor` | card Troca de Óleo de Motor |
| `freios` | card Pastilhas e Discos |
| `amortecedores` | card Troca de Amortecedores |
| `suspensao` | card Revisão de Suspensão |
| `correia` | card Correia Dentada |
| `pneus` | card Venda de Pneus |
| `alinhamento` | card Alinhamento 3D |
| `embreagem` | card Troca de Embreagem |
| `bicos` | faixa Limpeza de Bicos |
| `outro-servico` | faixa "Também fazemos" |
| `nao-fazemos` | FAQ "Tem algum serviço que vocês não fazem?" |
| `garantia` | seção de garantia |
| `pagamento` | FAQ de formas de pagamento |
| `acompanhar` | FAQ de acompanhar o serviço |
| `duvida` | link "tire sua dúvida" no topo do FAQ |
| `agendar` | resposta do FAQ sobre como agendar |
| `avaliacao` | seção de avaliações |
| `avaliacao-<serviço>` | popover "Avaliações" de cada card (`cambio`, `scanner`, `motor`, `oleo`, `freios`, `amortecedores`, `correia`, `pneus`, `alinhamento`, `embreagem`, `suspensao`, `bicos`) |
| `contato` · `contato-botao` | seção de contato |
| `rodape` | rodapé |
| `flutuante` | botão flutuante do WhatsApp |
| `404` | página de erro |
| `formulario-<serviço>` | formulário, com o serviço escolhido: `formulario-diagnostico`, `-motor`, `-oleo-motor`, `-cambio`, `-freios`, `-suspensao`, `-alinhamento`, `-pneus`, `-embreagem`, `-correia`, `-bicos`, `-outro-servico` |

## Segurança
- Cabeçalhos no `netlify.toml` (o `npm test` aplica os mesmos no servidor local, então uma CSP que quebre algo falha o teste): CSP completa (script, estilos e fontes só do próprio site; mapa do Google só em iframe; `frame-ancestors 'self'`), HSTS de 1 ano com preload, Permissions-Policy fechando câmera, microfone, localização, pagamento, sensores e rastreio, COOP `same-origin-allow-popups` (o wa.me abre em janela própria), nosniff e Referrer-Policy.
- Nenhum script embutido nem `onload`/`onerror` no HTML: a imagem de reserva é ligada pelo `script.js`.
- SRI: o site não carrega nada de CDN. Desde a rodada 4 as fontes ficam em `fontes/` (o `npm run publicar` copia a pasta).
- Desempenho (rodada 4): efeitos de canvas começam depois do `load` (`aposCarregar` no script.js), seções abaixo da dobra com `content-visibility: auto` (âncoras ligam `html.cv-off` antes do pulo). Medição antes/depois em MELHORIAS.md.
- Formulário sem backend, com anti-spam simples: campo-isca invisível (robô preenche, nada abre) e tempo mínimo de 2,5 s entre começar a preencher e enviar (rápido demais = aviso "Confere os dados?").

## Regras de conteúdo
Nada de depoimento ou nota inventada (avaliações só no Google), nada de preço/prazo, leva e traz sempre "consulte condições". O que a oficina faz ou não faz vem do `catalogo_servicos` do Supabase.
