# IndyCar Centro Automotivo — Site Oficial

Landing page (one-page) da **IndyCar Centro Automotivo Taubaté**.
HTML, CSS e JavaScript puros — site estático, sem build (o `npm run publicar` só minifica para o ar).

## Arquivos
- `index.html` — página
- `styles.css` — estilos (inclui a folha de impressão)
- `script.js` — interações (fundo, contadores, modais, formulário → Edge Function, status aberto/fechado, menu com seção atual)
- `privacidade.html` — política de privacidade (LGPD)
- `404.html` — página de erro (com os caminhos mais procurados e a Área do Cliente)
- `logo.png`, `icone-192/512(.maskable).png`, `oficina-fachada.*` (avif/webp/jpg/png), `fachada-recorte*` (avif/webp/png), `og-indycar.jpg` (1200x630) — imagens
- `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, `netlify.toml` (cabeçalhos, cache e atalhos)
- `scripts/mensagens-whatsapp.mjs` — **a** tabela das mensagens prontas do WhatsApp (`npm run whatsapp` reescreve o HTML)
- `scripts/dados-oficina.mjs` — **o** lugar dos números da oficina: nota 4,8 · +1.200 avaliações · +18 anos (`npm run numeros` reescreve o HTML)
- `scripts/qa.mjs` (`npm test`), `scripts/vitais.mjs` (`npm run vitais`, Lighthouse), `scripts/publicar.mjs` — não vão para o ar
- `supabase/functions/site-lead/index.ts` — Edge Function que recebe o formulário (publicada no Supabase da oficina); `scripts/sql/` — migrações

## Rodar localmente
Basta abrir o `index.html` no navegador. (Ou: `npx serve .`)

## Produção oficial
https://indycar-taubate.netlify.app/

Publicar de dentro desta pasta: `npx netlify-cli link --name indycar-taubate` (só na 1ª vez) e **`npm run publicar`** — monta `dist/` só com os arquivos do site (CSS e JS minificados pelo esbuild e chamados com `?v=<hash>`, por isso o `netlify.toml` deixa `/*.css` e `/*.js` em cache por um ano) e roda `npx netlify-cli deploy --prod --dir dist`. Não use `--dir .`: o netlify-cli ignora o .netlifyignore e publicaria scripts, package.json e .md. Depois confira com `QA_URL=https://indycar-taubate.netlify.app npm test` e `npm run vitais -- --prod`.

Atalhos no ar (netlify.toml): `/acompanhar` e `/minha` → Área do Cliente (indycar-patio), `/area-cliente`, `/whatsapp` (mensagem com código `atalho`), `/agendar` (abre o formulário), `/servicos`, `/contato`, `/privacidade`.

## Testar
`npm install` uma vez e:
- `npm test`: abre o site no Chrome instalado (puppeteer-core) em 375 e 1440 px e confere rolagem horizontal, erros de console, CSP, links de WhatsApp (prefixo + tabela + código + UTM), JSON-LD, FAQ, imagens (AVIF), mapa sob demanda, formulário (com **fetch falso** da Edge Function: nada vai para o banco; caminho sem rede abre o WhatsApp), entradas por endereço (`/?servico=`, `/?abrir=form`, UTM), Área do Cliente, status aberto/fechado, menu atual, tabelas de mensagens/números iguais ao HTML, `dist/` minificado, 404, axe-core. Capturas em `qa-out/`.
- `npm run vitais`: Lighthouse (celular e computador) sobre o `dist/` local; `-- --prod` mede o site no ar. Falha se alguma nota ficar abaixo de 95. Relatórios em `qa-out/lighthouse-*.json`.

## Formulário → banco da oficina (rodada 5)
O "Pedir meu horário" manda `POST https://nppfqhavqahapmugnyng.supabase.co/functions/v1/site-lead` com `{ nome, telefone, servico, codigo, carro?, preferencia?, mensagem?, pagina?, utm?, decorrido, empresa }` (sem chave nenhuma no site; a função é pública, `verify_jwt: false`). A função:
- valida tudo (telefone com DDD, 10/11 dígitos, sem 55; nome; serviço), ignora quem preencheu o campo-isca `empresa` (responde ok e não grava nada) e quem enviou em menos de 1,5 s;
- freia por IP (6 pedidos/hora, IP guardado só em hash) e por telefone (1 lead por dia: o 2º envio só acrescenta uma nota no lead e responde "já recebemos");
- cria o **lead** em `public.leads` com `origem = organico`, `utm_source = 'site'`, `utm_medium = 'formulario'`, `utm_campaign = 'formulario-<serviço>'` (se a pessoa veio de anúncio, vira `formulario-<serviço>--<utm_source>-<utm_campaign>`), observações com preferência de horário, carro, o que o carro está fazendo, campanha e página;
- cria uma **tarefa** (`tarefas`, origem `automacao`, prioridade 1, vence em 2 h) para quem cuida do cliente (o gatilho do banco herda o responsável da conversa); sem responsável, **notifica os gestores** (`notificar`, app crm, link `/?lead=`);
- registra o rastro em `public.site_pedidos` (RLS ligado, sem política: só a função lê/grava);
- responde `{ ok, protocolo, mensagem }` e nunca devolve ids internos. `GET /saude` responde `{ ok: true }`.
Se a rede falhar, o site abre o WhatsApp com a mesma mensagem (comportamento das rodadas anteriores): nada se perde.
Publicar de novo: MCP `deploy_edge_function` com `verify_jwt: false` (conferir `get_edge_function` depois).

## WhatsApp e origem do contato
Toda mensagem pronta começa com o prefixo estável **"Olá! Vim pelo site"**; pedidos de serviço seguem **"quero orçar: <serviço>."** (a IA do Atendimento identifica o serviço por esse trecho) e terminam com o código **"(site/<código>)"**, que o gatilho `at_origem_pelo_site` lê da primeira mensagem (só `a-z 0-9 _ -`, até 40 caracteres) e grava no lead `utm_source=site`, `utm_medium=whatsapp`, `utm_campaign=<código>`. Se a pessoa chegou por anúncio (`?utm_source=meta`), o site anexa a fonte ao código: `(site/cambio--meta)`.

A tabela única está em `scripts/mensagens-whatsapp.mjs`; `npm run whatsapp` reescreve todos os links do `index.html` e do `404.html`, e o `npm test` falha se a página divergir da tabela.

| Código | Onde está |
|---|---|
| `hero` · `diagnostico` · `contato-botao` · `flutuante` · `404` · `atalho` (/whatsapp) | botões de diagnóstico gratuito |
| `cambio` `scanner` `motor` `oleo-motor` `freios` `amortecedores` `suspensao` `correia` `pneus` `alinhamento` `embreagem` `bicos` | cards de serviço (ids `#svc-<código>`) |
| `cambio-dialise` · `nao-fazemos` · `garantia` · `pagamento` · `acompanhar` · `duvida` · `agendar` | FAQ, garantia e topo do FAQ |
| `outro-servico` | faixa "Também fazemos" |
| `avaliacao` · `avaliacao-<serviço>` (popover) | avaliações |
| `contato` · `rodape` · `area-cliente` | seção de contato, rodapé e "não recebeu o seu link?" |
| `formulario-<serviço>` | formulário (montado pelo script.js; também é o `utm_campaign` do lead criado pela Edge Function) |

Entradas por endereço: `/?servico=freios` rola até o card e deixa o serviço escolhido no formulário; `/?abrir=form` abre o formulário; `utm_*`, `gclid` e `fbclid` ficam na sessão e vão no pedido.

## Área do Cliente (sistema Pátio, 16/10/2026)
Links fixos para https://indycar-patio.netlify.app/acompanhar/ (etapa do carro na oficina, fotos, extras para aprovar) e https://indycar-patio.netlify.app/minha/ (histórico, próxima revisão, pedir horário, indicar amigo) na seção `#area-cliente`, no menu, no rodapé, na FAQ "Como acompanho o serviço do meu carro?" e no 404. O cliente não tem senha: o link chega pelo WhatsApp quando o carro entra.

## Segurança
- Cabeçalhos no `netlify.toml` (o `npm test` aplica os mesmos no servidor local, então uma CSP que quebre algo falha o teste): CSP completa (script, estilos e fontes só do próprio site; `connect-src` só o Supabase da oficina; mapa do Google só em iframe; `frame-ancestors 'self'`), HSTS de 1 ano com preload, Permissions-Policy fechando câmera, microfone, localização, pagamento, sensores e rastreio, COOP `same-origin-allow-popups` (o wa.me abre em janela própria), nosniff e Referrer-Policy.
- Nenhum script embutido nem `onload`/`onerror` no HTML; nenhuma chave no site.
- Formulário: campo-isca, tempo mínimo (2,5 s no site, 1,5 s na função), validação no site e na função, freios por IP e telefone.
- Desempenho: fontes no próprio site com preload, AVIF→WebP→JPG/PNG com `sizes`, efeitos de canvas depois do `load`, aurora/grão/manchas de fundo sem animação contínua, no celular o mar de metal fica num quadro só e título/botões sem pulso, `content-visibility: auto` abaixo da dobra, CSS/JS minificados e versionados.

## Regras de conteúdo
Nada de depoimento ou nota inventada (avaliações só no Google), nada de preço/prazo, leva e traz sempre "consulte condições". O que a oficina faz ou não faz vem do `catalogo_servicos` do Supabase. Os números 4,8 · +1.200 · +18 anos são pendência do João: ficam em `scripts/dados-oficina.mjs` e trocam em todos os lugares com `npm run numeros`.
