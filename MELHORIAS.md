# Melhorias — 09/10/2026

1. Horário corrigido em toda a página: segunda a sábado, 8h às 17h30.
2. Horário corrigido no JSON-LD AutoRepair.
3. isBusinessHours corrigido com fuso America/Sao_Paulo e fechamento às 17h30.
4. Garantia de 12 meses em peças e mão de obra no hero e FAQ.
5. Slogan oficial Quem conhece, Indyca! 🏎 no rodapé.
6. Parcelamento fixo em 10x substituído por condições sob consulta.
7. Leva e traz em Taubaté sob consulta, sem gratuidade fixa.
8. Oferta digital gratuita com scanner + foto e duração aproximada de 30 minutos.
9. FAQ estruturado gerado com as mesmas respostas da página.
10. Notificações simuladas de clientes substituídas por informações da oficina.
11. Vocabulário carro aplicado na página e na mensagem do formulário.
12. Canonical de produção incluído.
13. robots.txt e sitemap.xml criados.
14. AutoRepair recebeu identificador, área atendida e logo.
15. Metadados Twitter e Open Graph complementados.
16. Atalho de teclado para pular aos serviços.
17. Foco visível de alto contraste nos controles.
18. Menu móvel fecha com Escape e devolve foco ao botão.
19. Movimento reduzido respeitado nos estilos, revelações e voltar ao topo.
20. Notificações pausadas com aba oculta e movimento reduzido.
21. Links de agendamento pelo WhatsApp nos cards de serviço, com mensagem específica.
22. WhatsApp flutuante oferece diagnóstico digital gratuito.
23. Imagem inferior carrega sob demanda com decodificação assíncrona.
24. Texto alternativo descritivo na foto do rodapé.
25. Autocompletar, teclado de telefone e limites de entrada no formulário.
26. Diagnóstico digital gratuito incluído no seletor do formulário.
27. Página 404 com retorno ao site.
28. Manifesto com nome, idioma e cores da oficina.
29. Headers de segurança e cache de imagens na Netlify.
30. Redirecionamento www para endereço oficial.
31. Escassez não comprovada removida das chamadas finais e promoção.
32. Documentação de publicação oficial atualizada.
33. Transbordamento horizontal decorativo corrigido e botões longos passam a quebrar linha no celular.

## Rodada 2 (09/10/2026)

34. Depoimentos inventados (10 nomes fictícios com selo "Local Guide · Google") removidos; a seção Avaliações leva às avaliações reais no Google.
35. Popover de avaliações por serviço não mostra mais depoimento: nota do Google, link para o Google e WhatsApp rastreável.
36. Botões "★ 4,8" dos cards viram "Avaliações" / "Avaliações no Google" (não sugerem nota por serviço).
37. Nota autoatribuída (aggregateRating) retirada do JSON-LD.
38. Contador "+1.200 Clientes Satisfeitos" corrigido para "Avaliações no Google".
39. Nova seção "Como funciona o diagnóstico gratuito" em 4 passos (WhatsApp, traz o carro, scanner + foto ~30 min, você decide) com chamada.
40. Nova seção de garantia: 12 meses em peças e mão de obra, nacionais e importados, cobertura confirmada no orçamento.
41. Todos os 27 links de WhatsApp com mensagem pronta por serviço/contexto, código "(site/<serviço>)" no texto e UTM (utm_source=site, utm_medium=whatsapp, utm_campaign=<serviço>).
42. Formulário abre o WhatsApp com "(site/formulario)" e UTM, em janela noopener.
43. Formulário confere telefone com DDD (10 ou 11 dígitos), mostra o erro e marca aria-invalid.
44. Opções do formulário iguais aos serviços do site (saiu "Direção", entraram embreagem, correia, bicos, alinhamento).
45. Leva e traz sem promessa: pilar "Leva e Traz Exclusivo", CTA final ("a gente busca o seu carro") e FAQ reescritos com "consulte condições".
46. Câmbio descrito como troca de óleo por diálise (o catálogo marca reparo interno de câmbio como não feito).
47. FAQ nova "Tem algum serviço que vocês não fazem?" baseada no catalogo_servicos (fazemos = false).
48. Faixa "Também fazemos" com serviços reais do catálogo e convite para perguntar no WhatsApp.
49. Cards compactos de serviço ganham descrição curta visível (antes só no tooltip, invisível no celular).
50. Textos de serviço mais claros (scanner, revisão de motor, bicos, câmbio, chamada da seção).
51. JSON-LD do FAQ gerado a partir do FAQ visível (11 perguntas, sincronia conferida no teste).
52. JSON-LD da oficina com slogan, dois telefones (contactPoint), hasMap, catálogo de 12 serviços e descrição atualizada.
53. Imagem Open Graph própria 1200x630 (og-indycar.jpg) com largura, altura, tipo e alt.
54. Fotos em WebP com fallback (<picture>): fachada 483 KB → 172 KB (86 KB na versão 720 px), recortes 154 → 58 KB e 44 → 20 KB.
55. Todas as imagens com width e height (sem pulo de layout).
56. Fontes de reserva calibradas (Arial Black/Arial/Arial Narrow com size-adjust): CLS do carregamento caiu de 0,15 para 0,001 no desktop e 0,28 para ~0,02 no celular.
57. Google Fonts fora do caminho crítico (preload + media=print/onload, com noscript).
58. Letras do título do hero entram mais rápido (atraso por letra 26 → 12 ms).
59. Mapa do Google só carrega quando o visitante pede ("Ver mapa aqui") e ganhou botão "Traçar rota".
60. Página de privacidade simples (LGPD) com link no rodapé e no formulário, e no sitemap.
61. Landmark <main>, atalho "Pular para o conteúdo" e <aside> para os botões flutuantes.
62. Ordem de títulos corrigida (h4 → h3 nos pilares e diferenciais; rodapé sem h5 soltos).
63. Contraste AA: cinza claro de apoio escurecido; axe-core sem nenhuma violação em 1440 e 375 px.
64. Ícones decorativos dos botões escondidos do leitor de tela; menu com aria-controls; popover com aria-modal; formulário com aria-describedby.
65. Pop-up "Oferta da semana" vira "Para começar" e não abre se a pessoa já clicou no WhatsApp ou está com outro diálogo aberto; sessionStorage protegido.
66. Hero mais direto: subtítulo enxuto e botão "Agendar Diagnóstico Grátis"; formulário "Agende seu Diagnóstico Grátis".
67. Menu com "Diagnóstico" e rodapé com links para diagnóstico, garantia e privacidade.
68. Página 404 refeita com a cara da oficina e botão de WhatsApp rastreável.
69. Netlify: Permissions-Policy (câmera, microfone, localização, pagamento desligados) e cache de WebP/JPG.
70. .netlifyignore exclui testes, package.json, qa-out, sobras .publicacao/.publicacao.zip e foto não usada.
71. Manifesto com descrição e ícone.
72. Teste automático versionado (scripts/qa.mjs, `npm test`): 375 e 1440 px, rolagem horizontal, console, links de WhatsApp, JSON-LD, FAQ, imagens, mapa, formulário, popover, vocabulário, CLS, privacidade e 404.
73. Ações da faixa "Limpeza de Bicos" não ficam mais cortadas no celular.
74. Carrossel e mira do cursor protegidos (sem erro sem depoimentos; mira só some sobre o mapa carregado).
75. Publicação por `npm run publicar` (pasta dist/ só com o site): o deploy por `--dir .` expunha scripts/, package.json, .md e qa-out (o netlify-cli não respeita o .netlifyignore); conferido 404 em produção.
76. Teste roda também contra produção (`QA_URL=https://indycar-taubate.netlify.app npm test`): tudo certo no ar.

## Rodada 3 (13/10/2026)

Segurança, qualidade e conectividade, sem backend novo e sem páginas novas.

### Segurança
77. CSP completa no `netlify.toml`: script só do próprio site, estilos + Google Fonts, fontes do gstatic, mapa do Google só em iframe (`frame-src`), `form-action` para o wa.me, `frame-ancestors 'self'`, `base-uri`, `object-src 'none'` e `upgrade-insecure-requests` — mapa, fontes e WhatsApp conferidos funcionando com ela (local e em produção).
78. HSTS explícito de 1 ano com preload.
79. Permissions-Policy ampliada: também USB, sensores (magnetômetro, giroscópio, acelerômetro) e `browsing-topics` desligados.
80. Cross-Origin-Opener-Policy `same-origin-allow-popups` (o wa.me continua abrindo em janela própria).
81. HTML sem nenhum `onload`/`onerror` embutido: as fontes do Google (media print → all) e a imagem de reserva da fachada/rodapé passaram para o `script.js` (`data-fontes`, `data-reserva`, `data-reserva-remover`), condição para a CSP sem `unsafe-inline` em script.
82. SRI: nenhum script de CDN na página (verificado no teste); a folha do Google Fonts muda por navegador e não aceita SRI — documentado no README.

### Formulário (anti-spam sem backend)
83. Campo-isca invisível (fora da tela, fora do Tab e do leitor de tela): robô que preenche recebe "Pedido enviado!" e nada abre.
84. Tempo mínimo de 2,5 s entre começar a preencher e enviar; rápido demais mostra "Confere os dados?" no próprio formulário (role=status) e não abre o WhatsApp.

### Conectividade
85. Formulário manda o código do serviço escolhido: `(site/formulario-freios)`, `(site/formulario-cambio)`… (antes era sempre `formulario`), no formato que o gatilho `at_origem_pelo_site` do Atendimento reconhece; UTM igual.
86. Todas as 12 opções do formulário com código único (`data-codigo`) e todo card de serviço com WhatsApp de código próprio (conferido no teste).
87. README com a tabela de todos os códigos `(site/…)` e onde cada um está, e a regra do gatilho (a-z 0-9 _ -, até 40).

### Testes e qualidade
88. `npm test` aplica no servidor local os MESMOS cabeçalhos do `netlify.toml` e falha se houver qualquer violação de CSP (evento `securitypolicyviolation`) em 375 e 1440 px.
89. Checagem de links quebrados: todo link/arquivo interno responde 200, toda âncora `#…` existe e todo link externo em nova aba tem `rel=noopener`.
90. Checagem de cabeçalhos de segurança (CSP, HSTS, Permissions-Policy, nosniff, Referrer-Policy) e de HTML sem script embutido — roda também contra produção com `QA_URL`.
91. Acessibilidade conferida no teste: um h1, `lang=pt-BR`, atalho "Pular para o conteúdo", todo botão/link com nome acessível e todo campo com rótulo.
92. Testes novos do formulário: isca, envio rápido, código por serviço e formato dos 27 códigos de WhatsApp; CLS segue 0,004 no desktop com as fontes ligadas pelo script.

## Rodada 4 (14/10/2026)

Core Web Vitals medidos em produção (Lighthouse 12.8 no Chrome headless desta máquina, https://indycar-taubate.netlify.app, várias rodadas; mediana), acessibilidade e serviços mais claros, sem preço nem prazo. `npm test` (local e com `QA_URL` em produção) sem falha.

| Produção | Antes (deb57de) | Depois |
|---|---|---|
| Celular · desempenho | 67 (47–80) | 69 (62–80) |
| Celular · FCP | 3,6 s | 1,5 s |
| Celular · LCP | 3,9 s | 3,2 s |
| Celular · TBT | ~0,6 s | 0,6–1,6 s (oscila: animações do fundo; ver pendência) |
| Computador · desempenho | 89 | 95 (91–97) |
| Computador · LCP | 1,1 s | 0,7 s |
| Acessibilidade | 96 | 100 |
| Boas práticas | 96 | 100 |
| CLS | 0,001 | 0,001 |

93. Fontes no próprio site (Archivo e Inter variáveis, Barlow Condensed; só o subconjunto latino) com preload das duas da primeira dobra: some a ida ao Google na abertura (FCP no celular 3,6 s → 1,5 s).
94. CSP mais fechada: sem fonts.googleapis/gstatic em style-src e font-src (só o próprio site); cache de 1 ano para /fontes/.
95. Privacidade atualizada: o site não chama mais o Google Fonts ("abrir a página não chama nenhum servidor de fora").
96. `script.js` com `defer`.
97. No celular o título do hero (o LCP da página) nasce visível e entra só com um deslize em CSS, sem esperar o JavaScript nem a animação por letra; no computador a animação por letra continua.
98. Os 16 efeitos de canvas e de animação contínua (mar de metal, borda elétrica, mira, grade técnica, faíscas, marquee, selos, odômetro...) começam depois do "load", com o navegador ocioso: a primeira pintura e o primeiro toque não disputam o processador.
99. Rolagem: um cálculo por quadro (antes, a cada evento) e a primeira medida só depois da primeira pintura (era um layout forçado de ~1 s na abertura).
100. Faixa de confiança (marquee) sem layout forçado a cada quadro: a largura é medida só quando muda (ResizeObserver).
101. Seções abaixo da dobra com `content-visibility: auto`: o navegador só faz layout e pintura quando elas chegam perto da tela (layout+estilo na abertura 3,9 s → 2,3 s no teste com CPU 4x).
102. Menu e links internos (#contato, #faq, #garantia...) e endereço aberto já com âncora caem no lugar certo com as seções otimizadas (conferido em 375 e 1440 px).
103. Mar de metal fundido começa um degrau mais leve no celular e sobe sozinho para o desenho completo se o aparelho aguentar.
104. Foto da fachada (seção Sobre) sem distorção no celular (estava esticada para 364×356) e com versão de 480 px para telas pequenas.
105. Acessibilidade 100: o parágrafo animado da seção Sobre não usa mais `aria-label` em `<p>` (proibido); o texto inteiro vai num trecho só para leitor de tela.
106. Os 12 botões "Agende pelo WhatsApp →" dos serviços dizem ao leitor de tela qual é o serviço e que abrem o WhatsApp.
107. Serviços mais claros: "como funciona qualquer serviço" em 3 passos (diagnóstico gratuito com foto → você aprova o orçamento → só então a gente mexe no carro), sem preço nem prazo.
108. Textos sem promessa: pneus "com a montagem feita aqui na oficina" (antes "inclusas") e correia "no intervalo que o manual do carro indica" (antes "prazo").
109. Teste (`npm test`) ampliado: axe-core WCAG 2.1 AA sem violação séria/crítica, link de cada serviço com o nome, 3 passos e nenhum preço/prazo na seção, âncoras no lugar certo (375 e 1440), título do hero visível sem JavaScript, fontes do próprio site e nada do Google; mapa testado depois de rolar até ele.

**Pendências (João):** confirmar "4,8 / +1.200 avaliações" e "+18 anos". TBT no celular oscila porque o fundo animado (mar de metal, listras e brilho do título) roda o tempo todo; dá para deixar o fundo parado no celular se o João preferir velocidade a efeito. No Lighthouse, a acessibilidade às vezes marca 96 por um falso positivo de contraste em seção ainda não desenhada (content-visibility); com a página rolada o axe dá 0 violações.

## Rodada 5 (16/10/2026)

Conversão ligada ao ecossistema (pedido do site vira lead + tarefa no banco), Área do Cliente do sistema Pátio, WhatsApp com prefixo estável para a IA, desempenho (Lighthouse), SEO, acessibilidade e 375 px. Tudo abaixo está feito e conferido pelo `npm test` (119 verificações em 375/1440 px, com fetch falso da Edge Function: nada vai para o banco) e pelo `npm run vitais` (Lighthouse).

### Formulário → banco da oficina (Edge Function `site-lead`)
110. Edge Function nova `site-lead` no Supabase da oficina (`verify_jwt: false`): o formulário do site grava o pedido direto no banco, sem chave nenhuma no site.
111. Cada pedido vira um **lead** em `public.leads` com `origem = organico`, `utm_source = 'site'`, `utm_medium = 'formulario'`, `utm_campaign = 'formulario-<serviço>'` (o CRM e o Tráfego pago enxergam o site como canal, igual ao WhatsApp).
112. O lead nasce com `cliente_id` (gatilho do banco cria/acha o cliente pelo telefone) e herda o responsável da conversa do cliente, se houver.
113. Observações do lead completas: serviço, preferência de horário, carro, o que o carro está fazendo, campanha (utm/gclid/fbclid) e página de origem.
114. Cria uma **tarefa** para a equipe (`tarefas`, origem `automacao`, prioridade 1, vence em 2 h, ligada ao lead e ao cliente) com o resumo e a instrução "confirme pelo WhatsApp e marque na Agenda".
115. Sem responsável, **notifica os gestores** (`notificar`, app crm, link `/?lead=<id>`, chave única `site_lead:<id>` — não duplica).
116. Tabela `public.site_pedidos` (migração `site_pedidos_v1`, cópia em `scripts/sql/`): rastro de cada envio (resultado lead|repetido|isca|limite|invalido, IP só em hash sha256 com sal, campanha, lead/tarefa), RLS ligado sem política (só a função lê/grava), índices por IP e telefone recentes.
117. Freio por IP: 20 pedidos/min em memória e 6 por hora no banco (429 com mensagem que manda para o WhatsApp).
118. Freio por telefone: 1 lead por dia; o 2º envio do mesmo número acrescenta uma nota datada no lead existente e responde "já recebemos o seu pedido hoje" — nada duplica no CRM.
119. Campo-isca `empresa` também no servidor: robô que preenche recebe "ok" e nada é criado; envio em menos de 1,5 s é recusado com "Confere os dados?".
120. Validação no servidor: telefone 10/11 dígitos com DDD (aceita com 55 e com máscara; recusa 99999999999 e DDD inválido), nome com letras, serviço obrigatório, código no formato do gatilho, textos com limite (nome 80, carro 100, mensagem 500, UTM 80), corpo até 8 KB, JSON inválido → 400.
121. CORS só para o site (e previews `*--indycar-taubate.netlify.app` e localhost para testes), `Vary: Origin`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`; respostas nunca devolvem id interno (só um protocolo de 6 letras).
122. `GET /saude` para o vigia/testes; erros 4xx com frase em português e 500 genérico ("chame a gente no WhatsApp").
123. Se a pessoa veio de anúncio, o `utm_campaign` do lead leva a campanha paga junto: `formulario-cambio--meta-cambio-automatico`.
124. Conferido de ponta a ponta contra o banco real com um lead de teste (lead + cliente + tarefa + 2 notificações aos gestores + rastro) e tudo apagado depois.

### Formulário (site)
125. "Pedir meu horário" envia para a Edge Function com `fetch` (tempo limite 9 s) e mostra a confirmação **dentro do modal**: título, mensagem da equipe, protocolo e botão "Quer adiantar? Abrir no WhatsApp" com a mesma mensagem (o atendimento recebe o mesmo código).
126. Sem rede ou servidor fora: cai no caminho das rodadas anteriores e abre o WhatsApp com a mensagem pronta — nenhum pedido se perde (testado com fetch que falha).
127. Erro de campo devolvido pelo servidor (400) aparece no próprio formulário para a pessoa corrigir, sem fechar nada.
128. Campos novos, opcionais: "Quando prefere?" (hoje, amanhã, esta semana de manhã/à tarde, sábado) e "O que o carro está fazendo?" (500 caracteres), em grade de duas colunas no computador e uma no celular.
129. Máscara do telefone enquanto digita: `(12) 99683-0272` (aceita colar com +55); telefone com todos os dígitos iguais é barrado no site também.
130. Botão com estado "Enviando…" (desabilitado, `aria-busy`, ícone girando) — não dá para enviar duas vezes.
131. Botão do hero, do menu, de "Fazer Orçamento Grátis", do convite e do CTA final abrem o formulário já com "Diagnóstico digital gratuito" escolhido (`data-servico`), sem sobrescrever uma escolha feita pela pessoa.
132. Fechar a confirmação devolve o formulário limpo; abrir de novo nunca mostra a confirmação antiga.
133. Textos do modal e do rodapé do formulário dizem o que acontece de verdade ("a equipe recebe o pedido na hora; a confirmação vem pelo WhatsApp").
134. `autocomplete`, `enterkeyhint` e `color-scheme: dark` nos campos (o select e o teclado seguem o tema do site).
135. Campanha de origem (`utm_source/medium/campaign/content/term`, `gclid`, `fbclid`) guardada na sessão ao chegar e enviada junto no pedido; a confirmação marca `indycar_promo` (o convite de 8 s não aparece para quem já pediu).

### WhatsApp (contrato com a IA do Atendimento)
136. Toda mensagem pronta começa com o prefixo estável **"Olá! Vim pelo site"**; os 16 pedidos de serviço seguem **"quero orçar: <serviço>."** — a IA identifica o serviço por esse trecho; o código `(site/<código>)` continua no fim para o gatilho `at_origem_pelo_site`.
137. Nomes de serviço no vocabulário do catálogo ("Troca de óleo do câmbio automático (diálise)", "Pastilhas e discos de freio", "Pneus (venda e montagem)", "Limpeza de bicos injetores"…).
138. Tabela única `scripts/mensagens-whatsapp.mjs` com todas as mensagens; `npm run whatsapp` reescreve os 30 links do `index.html` e do `404.html` (idempotente) e o `npm test` falha se a página divergir da tabela.
139. Pessoa que chegou por anúncio: os links de WhatsApp levam a fonte no código, `(site/cambio--meta)` (cabe no limite de 40 do gatilho); o formulário faz o mesmo.
140. Mensagem do formulário no WhatsApp reescrita no mesmo padrão: "Olá! Vim pelo site, quero orçar: Pneus." + nome, telefone, carro, quando e o que o carro está fazendo.
141. Links novos com código próprio: `area-cliente` ("já sou cliente e quero o link da minha área") e `atalho` (`/whatsapp`).
142. README com o contrato completo (prefixo, "quero orçar:", código, sufixo de campanha) e a tabela de códigos por lugar.

### Área do Cliente (sistema Pátio, novo)
143. Seção `#area-cliente` "Seu carro na oficina, na palma da mão" com dois cartões: **Acompanhar meu carro** (https://indycar-patio.netlify.app/acompanhar/) e **Minha IndyCar** (https://indycar-patio.netlify.app/minha/), cada um explicado em uma frase.
144. Explicação honesta de como funciona: sem senha e sem cadastro, o link chega no WhatsApp quando o carro entra; "não recebeu o seu link?" com WhatsApp rastreável.
145. "Área do cliente" no menu (com ponto verde), coluna "Área do cliente" no rodapé e os dois links no 404.
146. FAQ "Como acompanho o serviço do meu carro?" reescrita: link Acompanhar meu carro, etapas, fotos e extras para aprovar — JSON-LD do FAQ atualizado igual (conferido pelo teste).
147. Atalhos no ar: `/acompanhar`, `/acompanhar/*`, `/minha`, `/minha/*` redirecionam para o Pátio; `/area-cliente` leva à seção.
148. Atalhos do manifesto (PWA): "Agendar diagnóstico grátis", "Acompanhar meu carro", "Minha IndyCar".
149. Cartões com foco visível, hover com borda vermelha e ícone preenchido, grade de uma coluna até 860 px; nenhum elemento vaza em 375 px.

### Entradas por endereço (anúncios e balcão)
150. `/?servico=freios` deixa o serviço escolhido no formulário, rola até o card e o destaca (borda vermelha); `/?abrir=form` abre o formulário direto (`/?servico=cambio&abrir=form` faz os dois).
151. Os 12 cards de serviço ganharam id estável (`#svc-cambio`, `#svc-freios`…) para links de anúncio e do atendimento.
152. O endereço fica limpo depois (`history.replaceState`), sem perder a campanha, que já está na sessão.
153. Atalhos curtos no `netlify.toml`: `/whatsapp` (abre o WhatsApp com código `atalho`), `/agendar` (abre o formulário), `/servicos`, `/contato`, `/privacidade`.

### Desempenho (Lighthouse)
154. `npm run vitais`: Lighthouse celular + computador sobre o `dist/` local (servidor com gzip, como a Netlify) ou `-- --prod` no ar; falha abaixo de 95; relatórios em `qa-out/`.
155. CSS e JS **minificados** no `dist/` pelo esbuild (103 → 77 KB e 92 → 41 KB) — os fontes continuam legíveis na pasta.
156. Links `styles.css?v=<hash>` e `script.js?v=<hash>` no HTML publicado + `Cache-Control: immutable` de um ano para `/*.css` e `/*.js` (antes `max-age=0`): visita de volta não baixa nada de novo, e mudou o conteúdo, muda o endereço.
157. Imagens em **AVIF** com WebP e JPG/PNG de reserva: fachada 168 → 108 KB (720 px: 84 → 49 KB), recorte 57 → 35 KB, miniatura 20 → 13 KB; `sizes` também na foto do CTA final (antes pedia a de 1080 px sempre).
158. Os efeitos de depois do load rodam numa **fila, um por vez em períodos ociosos** (antes, todos de uma vez numa tarefa de ~1 s no celular): TBT local no celular 670 → 340 ms.
159. Mar de metal fundido, borda elétrica, faíscas do CTA, marquee com velocidade e brilho das letras só começam **na primeira interação** (mouse, rolagem, toque) ou 7 s depois do load: a primeira dobra termina de pintar antes. Computador local: desempenho 66 → 99, TBT 440 → 0 ms, Speed Index 6,3 → 1,2 s.
160. No celular (ponteiro grosso) o mar de metal fica num quadro só (a forja aparece, sem custo por quadro) e a borda elétrica não roda.
161. Aurora desfocada, grão e manchas de luz do fundo sem animação contínua (repintavam a tela inteira a cada quadro); o visual fica o mesmo.
162. Listras do hero animadas por `transform` (compositor) em vez de `background-position` (repintura do hero a cada quadro); indicador de rolagem idem (era `top`, layout a cada quadro).
163. Até a primeira interação o título não pulsa a sombra e os botões não pulsam o brilho (animações pausadas por `html:not(.interagiu)`); no celular ficam parados sempre.
164. Selo giratório do hero não cria 48 spans quando está escondido pelo CSS (abaixo de 1100 px).
165. Código morto removido do `script.js`: carrossel de depoimentos e tilt dos cards de depoimento (o site não publica depoimento desde a rodada 2).
166. Ícone 192/512 (+ maskable) gerados da logomarca; `apple-touch-icon`; manifesto com `id`, `scope`, `dir`, categorias.
167. `dns-prefetch` do Supabase (só o formulário o usa) e `meta color-scheme`.

### SEO
168. JSON-LD `WebSite` ligado à oficina pelo `@id` (`publisher`), `inLanguage pt-BR`.
169. `meta robots` com `max-image-preview:large`, `twitter:image:alt`, sitemap com `lastmod` de hoje, `changefreq` e `priority`.
170. Página 404 refeita: caminhos mais procurados (serviços, diagnóstico, Área do Cliente, contato, dúvidas), WhatsApp rastreável, tema claro/escuro pelo sistema (`prefers-color-scheme`), `noindex`.
171. `/privacidade` (sem .html) redireciona 301 para a página.

### Acessibilidade e uso
172. Menu marca a seção em que a pessoa está (`aria-current="true"` + sublinhado vermelho) enquanto rola.
173. Botões "Avaliações" dos cards: nome acessível agora contém o texto visível ("Avaliações no Google de Correia Dentada") — o Lighthouse apontava `label-content-name-mismatch`.
174. Chip **"Aberto agora · até 17h30" / "Fechado agora · abre amanhã, 8h"** no hero, calculado no fuso de Taubaté (seg–sáb 8h–17h30), atualizado a cada minuto, com ponto verde pulsando só quando aberto.
175. Confirmação do formulário com `role=status`/`aria-live` e foco no botão Fechar; campos novos com rótulo e "opcional" visível.
176. Folha de **impressão** (`@media print`): sai o fundo, os canvases, botões flutuantes e modais; ficam endereço, horário, serviços, garantia e contato em preto no branco, com o endereço dos links externos impresso.
177. Números da oficina (4,8 · +1.200 · +18) marcados em 24 pontos (`data-num`, `data-target`, selo e `<body data-*>`) e trocáveis **em um só lugar** (`scripts/dados-oficina.mjs` + `npm run numeros`); o JS lê do `<body>`; o teste falha se o HTML divergir. Os valores continuam os de antes (pendência do João).

### Testes e publicação
178. `npm test` ampliado (92 → 119 verificações): prefixo e tabela das mensagens de WhatsApp, "quero orçar" nos serviços, JSON-LD WebSite, AVIF entregue, Área do Cliente (seção, menu, rodapé, FAQ, 404, noopener), chip aberto/fechado, `color-scheme`, números em um só lugar, ids dos cards, serviço pré-escolhido, máscara do telefone, envio para a Edge Function (payload completo), confirmação com protocolo sem abrir o WhatsApp, caminho sem rede, robô não chega ao servidor, menu com seção atual, aurora/grão/título/botões parados, `/?servico=` + UTM + sufixo `--meta`, `/?abrir=form` no celular, tabelas iguais ao HTML, atalhos do netlify.toml, cache de CSS/JS, manifesto e ícones, sitemap, impressão, AVIF menor que WebP, `dist/` minificado e sem arquivos internos, Edge Function `/saude`, CSP com `connect-src` do Supabase.
179. O teste não é mais pego pelo convite de 8 s (sessão marcada ao abrir) — o clique no mapa falhava quando a suíte demorava mais que isso.
180. `npm run publicar` confere a presença do manifesto e dos ícones, minifica, versiona e falha se não achar os links no HTML; `npm run whatsapp` e `npm run numeros` regeneram o HTML a partir das tabelas.
181. README reescrito: arquivos, publicação, atalhos, contrato do formulário/Edge Function, contrato do WhatsApp, Área do Cliente, segurança e regras de conteúdo.

### Como verifiquei
- `npm test` (119 verificações, 375 e 1440 px, fetch da Edge Function falso) sem falha; capturas em `qa-out/` (hero, Área do Cliente, formulário e confirmação nas duas larguras).
- Edge Function no ar: `/saude`, OPTIONS com CORS, 405/400 (JSON inválido, telefone, nome), isca, rápido demais, lead real de teste (lead + cliente + tarefa + notificações + rastro, conferidos por SQL) e repetição; tudo apagado depois.
- Lighthouse local (`npm run vitais`, máquina compartilhada e sem GPU, por isso pessimista): celular 69 → 86 (TBT 670 → 340 ms), computador 66 → 99 (mesma máquina, mesmo momento, código antigo × novo). Medição em produção depois de publicar: ver "Produção" abaixo.

### Pendências
- Confirmar "4,8 / +1.200 avaliações" e "+18 anos" (João) — agora é mudar `scripts/dados-oficina.mjs` e rodar `npm run numeros`.
- Lighthouse no celular: o que sobra é a primeira pintura/layout da página (HTML de 98 KB com 30 ícones SVG e CSS de 77 KB); para chegar a 95 no celular com folga, o próximo passo é dividir o CSS dos efeitos em arquivo adiado e enxugar os SVGs — não fiz nesta rodada.
- A IA do Atendimento (onda B1) deve ler "quero orçar: <serviço>" das mensagens do site; o contrato está no README.
- Tema claro/escuro: o site é escuro por marca, com seções claras intencionais ("showroom"); um botão de tema quebraria a composição — não adicionado, de propósito.

### Produção (16/10/2026, depois de publicar — Lighthouse 13.5 nesta máquina compartilhada, sem GPU; números variam entre rodadas)
| | Antes (d06df83, medido no mesmo momento) | Depois (e58f20f) |
|---|---|---|
| Celular · desempenho | 64–71 | **73** (TBT 1,2 s → 0,8 s · SI 4,3 → 3,2 s · FCP 1,8 → 1,7 s · CLS 0) |
| Computador · desempenho | 73–83 | **93–99** (TBT 370 → 80–110 ms · SI 4,9 → 1,2–2,0 s) |
| Acessibilidade · Boas práticas · SEO | 100 · 100 · 100 | 100 · 100 · 100 (sem o aviso `label-content-name-mismatch`) |

O computador bateu a meta (≥ 95 nas quatro notas, 99 na melhor rodada). No celular a meta de 95 **não** foi atingida: o que sobra é o custo de estilo+layout da página inteira (~0,5 s a cada relayout com CPU 4× mais lenta; as fontes Archivo/Inter chegando depois da primeira pintura refazem esse layout). Caminhos para a próxima rodada, em ordem: instâncias estáticas das fontes (Archivo 900 expandida e 400; hoje a variável tem 90 KB), CSS dos efeitos em arquivo adiado, HTML mais enxuto (30 ícones SVG embutidos). 182. `performance.measure('efeito:<nome>')` em cada efeito da fila: o Lighthouse/DevTools mostra quanto cada um custou (no celular, nenhum passa de 20 ms).

## Rodada 6 (21/10/2026)

Site ligado ao resto da IndyCar: horários livres da Agenda no site e no formulário, placa e horário que chegam ao CRM, links da equipe prontos na tarefa e roteador de links do cliente. Numeração continua a anterior (183 em diante). 🔗 = conexão com outro sistema.

### Horários reais (Agenda)
183. 🔗 Edge Function `site-lead` ganhou `GET /horarios`: próximos dias com vaga lidos da Agenda de verdade (seg–sáb, 8h–17h30, meia em meia hora, capacidade = consultores ativos, status que seguram a casa, hoje só daqui a 30 min). Só data e hora saem: nunca nome, telefone ou placa.
184. 🔗 Regras dos horários numa lógica pura (`logica.ts`) com 10 testes no `npm test` (domingo, 17h30, lotado, cancelado/não veio liberam, fuso de Taubaté).
185. 🔗 Seção "Próximos horários livres" (no #diagnostico) com botões de 44 px; tocar num horário abre o formulário já com o diagnóstico e o horário marcado.
186. 🔗 O mesmo seletor dentro do formulário ("Horários livres agora"), nas duas listas sincronizadas; tocar de novo desmarca.
187. 🔗 O pedido leva o horário escolhido e o servidor **confere de novo** na Agenda (se alguém ocupou nesse meio-tempo, o lead diz "já não estava livre — sugira outro" e a pessoa recebe a frase certa).
188. 🔗 Horário vai para a observação do lead, o título da tarefa e o sino de quem cuida do cliente; a mensagem do WhatsApp também leva "Horário: hoje às 10:00".
189. 🔗 A tarefa "confirme o horário" vence 30 min antes do horário pedido quando é hoje (nunca antes de 15 min), em vez de 2 h fixas.
190. Consulta com cache de 60 s no servidor e no site (uma abertura do formulário não repete a ida à Agenda), freio de 30/min por IP.
191. Caixa de horários nasce com o tamanho final (esqueleto): quando os horários chegam nada pula, e entradas por `#contato`, `#faq` e `#garantia` continuam caindo no lugar certo.
192. Agenda cheia: aviso "A agenda está cheia nos próximos dias, chame no WhatsApp" em vez de sumir sem explicar.
193. Agenda fora do ar: a caixa, o seletor do formulário e os links "Ver horários livres" somem juntos (nenhum link para o vazio); o formulário segue igual.
194. 🔗 Links "Ver horários livres" no passo 1 do diagnóstico e no contato; 404 também oferece os horários.
195. O formulário avisa em voz alta (aria-live) "Você escolheu hoje às 10:00" e "Quando prefere?" fica desativado enquanto há horário escolhido.

### Placa, cliente e serviço no CRM
196. 🔗 Campo "Placa" no formulário (maiúscula, só letras e números, aceita antiga e Mercosul, dica se estiver errada) → `leads.placa`: a busca por placa do CRM/Central acha o lead.
197. 🔗 Placa escrita no campo "Carro" ("Civic 2018 ABC-1D23") também é reconhecida no servidor.
198. 🔗 O lead nasce com `servico_id` do cadastro `servicos` (id buscado pelo nome, nunca fixo): relatórios do CRM por serviço contam o pedido do site. Teste garante um serviço do cadastro para cada código do formulário.
199. 🔗 Cliente conhecido pelo telefone: observação "Cliente já cadastrado na oficina" ou "CARRO NO PÁTIO AGORA: OS nº X (etapa)", e o título da tarefa ganha "[no pátio]" (só para a equipe; nada volta ao site).
200. 🔗 A tarefa traz os links prontos: Lead (CRM), Conversa (Atendimento, por telefone), **Criar orçamento** (Orçador `#/cotacao?tel=&nome=`, já com cliente) e Agenda.
201. 🔗 Quem já cuida do cliente também recebe o aviso no sino (antes só os gestores, e só sem responsável).
202. 🔗 Segundo envio no mesmo dia acrescenta ao lead o horário e a placa novos.
203. 🔗 `site_pedidos` guarda placa, horário e se estava livre (migração `r6_x1_site_pedidos_placa_horario`, cópia em `scripts/sql/` e `indycar-ferramentas/sql/`): auditoria dos pedidos.
204. Nome com menos de 2 letras é barrado no próprio site (antes só o servidor recusava).

### Cliente com link ou código na mão
205. 🔗 Roteador "Recebeu um link ou código da oficina? Cole aqui" (#area-cliente): código de 36 caracteres → Acompanhar meu carro; 48 → Minha IndyCar; 32 → orçamento no Orçador (`#/o/<token>`).
206. 🔗 Cola o link inteiro do Pátio ou do Orçador e ele é refeito só com o código (sem lixo de parâmetros).
207. Segurança do roteador: link de qualquer outro site, `javascript:` e lixo nunca abrem (sem redirecionamento aberto) e o campo avisa com `aria-invalid`.
208. 🔗 Atalhos no ar: `/s/<serviço>` (formulário já com o serviço — para o Atendimento e o Comunicar mandarem), `/orcamento`, `/horarios`, `/indicar` (Minha IndyCar, seção indicar amigo), `/minha-indycar`.
209. 🔗 Manifesto (PWA) com atalho "Horários livres".
210. 🔗 JSON-LD com ação `ReserveAction` apontando para `/agendar`: o Google pode oferecer "Pedir horário".

### SEO local, verdade e acessibilidade
211. Privacidade corrigida: dizia "o formulário não envia nada para servidor nenhum" (falso desde a rodada 5). Agora explica o pedido ao sistema da oficina, placa, horário, hash da rede e o roteador.
212. `priceRange: "$$"` retirado do JSON-LD (não havia preço confirmado — regra da casa).
213. `hreflang pt-BR`, `geo.region BR-SP`, `geo.placename Taubaté` e `format-detection` (telefone clicável no iPhone).
214. Aviso `<noscript>` com WhatsApp e telefone para quem está sem JavaScript.
215. Link "Ligar" (`tel:`) ao lado do WhatsApp principal no contato.
216. "Copiar protocolo" e lembrete da Minha IndyCar na confirmação do pedido.
217. Cabeçalho `Link: rel=preload` das duas fontes da primeira dobra no `netlify.toml`.
218. Alto contraste (`forced-colors`) nos novos botões e campos; impressão sem horários e sem o roteador.
219. Sitemap com `lastmod` de hoje.
220. Teste (`npm test`) com timeout de protocolo maior e rolagem instantânea nos novos cenários (a máquina compartilhada ficava lenta e derrubava o Chrome): 119 → ~200 verificações.

### Mais ligações, segurança e acabamento (lotes 4 e 5)
221. 🔗 JSON-LD: cada um dos 12 serviços da oficina tem endereço próprio (`#svc-cambio`, `#svc-freios`…), conferido pelo teste contra os ids da página (o Google pode mostrar o serviço direto).
222. `robots.txt`: os atalhos que só redirecionam (`/s/`, `/agendar`, `/orcamento`, `/horarios`, `/indicar`, `/whatsapp`, `/minha-indycar`) ficam fora do Google; o sitemap continua.
223. `application-name` e `apple-mobile-web-app-title` (nome certo ao instalar o site na tela inicial).
224. 🔗 Rodapé: "Horários livres" (some se a Agenda não responde), "Indicar um amigo" (Minha IndyCar, seção indicar) e "Colar link ou código".
225. 🔗 Área do Cliente: "Quer indicar um amigo? Indique pela Minha IndyCar" (lead com origem indicação no CRM, feito pelo Pátio).
226. Contador "0/500" no campo "o que o carro está fazendo": a pessoa vê antes de o texto ser cortado.
227. Erro por campo com frase e `aria-describedby` (nome com pelo menos 2 letras e serviço), além do telefone que já tinha.
228. 🔗 Roteador aceita o link colado sem `https://` (como chega copiado de mensagem).
229. Segurança: o servidor troca por espaço caracteres de controle e invisíveis (zero-width, marcas de direção, nulos) em nome, carro, mensagem e campanha, para ninguém esconder texto no CRM; teste cobre.
230. Segurança: a "página de origem" só vale se começar com `/` (nada de endereço de outro site gravado no lead).
231. `Retry-After: 60` nas respostas 429 (limite por minuto).
232. Horário escolhido só vale até 30 dias à frente (a lista mostra no máximo 14).
233. Privacidade: a descrição da página (meta) também deixou de dizer "contato só pelo WhatsApp".
234. `prefers-reduced-motion` também nos botões de horário e no "copiar protocolo".
235. Botão "Abrir" do roteador centralizado e em largura total no celular (conferido em captura de 375 px).
236. 🔗 O convite de 8 s mostra o próximo horário livre da Agenda ("hoje às 14:30"); tocar fecha o convite e abre o formulário com o diagnóstico e o horário marcados.
237. 🔗 A consulta de horários é aquecida aos 5 s (quando a página assentou): convite e formulário já abrem com os horários, sem espera.
238. A lista de horários é repintada quando a Agenda muda; o horário escolhido que sumiu é solto e o aviso em voz alta diz qual foi ("acabou de ser ocupado, escolha outro").
239. "Quando prefere?" só oferece o que existe: sem "Hoje" aos domingos e depois das 17h30, sem "Amanhã" aos sábados.
240. Teste: página sem JavaScript (aviso com WhatsApp e telefone, caixa de horários escondida, sem rolagem horizontal).
241. Teste contra a Edge Function de verdade (só leitura): `GET /horarios` com CORS, até 4 dias, horas de meia em meia hora e só data/hora (nenhum dado de cliente).
242. Teste do axe-core (WCAG 2.1 AA) com os horários na tela, o formulário aberto (placa, horário, contador) e o roteador: nenhuma violação séria/crítica em 375 e 1440 px.
243. README com o contrato novo (horários, placa, códigos de WhatsApp, roteador, atalhos e a Edge Function).

### Como verifiquei
- `npm test` (200 verificações em 375/1440 px com a Edge Function falsa: nada vai ao banco real) + 12 testes da lógica (`node --test`).
- Edge Function publicada (v4+): `GET /horarios` real devolve os dias e horas da Agenda; as colunas, o `servico_id`, a placa e o rastro foram testados por DO-block revertido (`TESTE_REVERTIDO`); `get_advisors` sem aviso novo.
- Nenhum pedido de teste foi gravado no banco real.

### Pendências
- Publicar o site (`npm run publicar`) depois de o coordenador liberar.
- O Atendimento/IA pode ler "Placa:" e "Horário:" da mensagem do WhatsApp do formulário (prefixo "Olá! Vim pelo site, quero orçar: …").
- Pedido ao Orçador: aceitar `&placa=` em `#/cotacao?...` (hoje só `tel` e `nome`).
- Pedido à Casa/CRM: abrir o lead mostrando a observação "CARRO NO PÁTIO AGORA".

## Rodada 7 (25/10/2026) — X1 Site

Numeração continua (244 em diante). 🔗 = conexão com outro sistema. Teste novo: `scripts/qa-r7.mjs` (+ lotes 2–4), que emula os redirecionamentos do `netlify.toml`.

### Pedido aberto: /s/<serviço> perdia o utm_*
244. 🔗 `/s/<serviço>` agora mantém `utm_*`, `gclid` e `fbclid` (o destino virou `/#agendar-<serviço>`, sem `?`; a Netlify só repassa a query nesse caso). Conferido num deploy draft real: `/s/freios?utm_source=meta&gclid=1` → `/?utm_source=meta&gclid=1#agendar-freios`.
245. 🔗 `/agendar` idem (também perdia).
246. 🔗 `/orcamento` idem.
247. 🔗 `script.js` entende `#agendar[-serviço]`: abre o formulário com o serviço e o foco no nome, guarda a campanha na sessão e limpa o endereço.
248. 🔗 `/s/` aceita o nome do cadastro `servicos` (`Troca de Óleo de Câmbio`, `Limpeza de Bicos`, `Revisão de Motor`, `Suspensão`...) e aliases, para Comunicar/Atendimento não precisarem traduzir.
249. Serviço que não existe no formulário cai no diagnóstico gratuito (nunca formulário vazio).
250. 🔗 `?h=2026-10-27T10:00` deixa marcado o horário que o Atendimento sugeriu, se ainda estiver livre na Agenda.
251. 🔗 Se esse horário já foi ocupado, o formulário avisa e não marca nada.
252. 🔗 O pedido leva `pagina = /s/<serviço>`: o lead mostra por qual atalho a pessoa veio (antes era sempre `/`).
253. `#agendar` não liga o modo sem `content-visibility` (a página abre leve).
254. Corrigido o teste que falhava de vez em quando: entrada por `#contato`/`#faq`... é realinhada depois que imagens, fontes e horários mudam a altura (antes parava 20 px acima).
255. Teste emula as regras de redirecionamento da Netlify no navegador (utm de ponta a ponta).
256. Teste garante que nenhum redirecionamento interno do `netlify.toml` tem `?` no destino.

### Links curtos e código colado
257. 🔗 `/a/<código>` → Acompanhar meu carro (Pátio).
258. 🔗 `/m/<código>` → Minha IndyCar.
259. 🔗 `/o/<código>` → orçamento no Orçador.
260. `/rota` → Google Maps com o destino da oficina (para o Atendimento mandar).
261. 🔗 Código de 36 colado na barra do site (`dominio/<código>`) abre o Acompanhar em vez da 404.
262. 🔗 Idem 48 → Minha IndyCar (aceita maiúsculas).
263. 🔗 Idem 32 → orçamento.
264. Caminhos que não são código (curto, não-hex, `/a/b/c`) continuam 404 sem redirecionar.
265. `robots.txt`: atalhos novos fora do Google.
266. 404 com "Como chegar" (/rota) e a dica do código colado.

### Formulário no celular (bug real)
267. **Corrigido:** o formulário (com horários, placa e mensagem) tinha ~1.600 px num 375×812 e o fundo não rolava: o topo era cortado e o botão "Pedir meu horário" ficava fora da tela. O fundo agora rola e o diálogo só centraliza quando cabe.
268. Formulário compacto no celular: texto de apresentação oculto, carro e placa lado a lado, 2 dias de horários (1.599 → ~1.100 px).
269. Teste: topo visível e botão alcançável em 375×667, 375×812 e 1440×700.
270. Fundo (menu, conteúdo, rodapé, botões flutuantes) fica `inert` com o diálogo aberto.
271. Rascunho: recarregar a página não perde o digitado (sessão).
272. O contador de caracteres acompanha o rascunho.
273. "Lembrar meus dados neste aparelho" (opcional, 180 dias, só localStorage).
274. "Não sou eu · limpar" apaga os dados lembrados.
275. 🔗 Sem rede: abre o WhatsApp **e** guarda o pedido; quando a rede volta ele vai ao banco (lead no CRM) uma vez; some em 24 h.
276. 🔗 Protocolo guardado por 36 h e cartão "Seu pedido XXXXXX está com a equipe" na Área do Cliente, com link para Acompanhar.
277. 🔗 A confirmação repete o horário pedido na Agenda.
278. 🔗 Depois de pedir, a próxima abertura consulta a Agenda de novo (o horário ocupado some).
279. 🔗 Resumo dos horários livres em voz alta para leitor de tela.
280. 🔗 Hero: "Já é cliente? Acompanhar meu carro · Minha IndyCar".
281. 🔗 Confirmação do pedido com link para Acompanhar meu carro (além da Minha IndyCar).
282. 🔗 Chip do hero não diz "Aberto agora" em feriado nacional (mesma lista do Comunicar): "confirme no WhatsApp se abrimos".
283. 🔗 Dia de feriado nos horários livres vem marcado, com aviso e nome acessível.
284. Economia de dados (Save-Data ou 2G): efeitos pesados desligados e sem consulta antecipada.
285. Botão do menu anuncia "Abrir menu"/"Fechar menu".

### Toque (375 px) — alvos de 44 px
286. Hambúrguer, links do menu e botão "Agendar" ≥ 44 px.
287. "Agende pelo WhatsApp →" e "★ Avaliações" ≥ 44 px.
288. Links do rodapé e "Privacidade" ≥ 44 px.
289. Links do contato (telefone, "Ligar", Instagram) ≥ 44 px.
290. Link da garantia, "Abrir" do roteador e fechar do aviso ≥ 44 px.
291. Links do formulário, indicador de rolagem, "Ver horários livres" e botões de horário ≥ 44 px.
292. "★ ESPECIALIDADE" de 11,5 para 12 px.
293. Teste: todo link, botão e campo visível ≥ 44×44 em 375 px e nenhum texto visível < 12 px (a auditoria achou ~60 alvos menores).
294. iPhone: `viewport-fit=cover` e margens seguras no WhatsApp flutuante, menu e diálogos.
295. Campos com 16 px no celular (o Safari não dá mais zoom ao tocar).
296. Hero com `100svh`.
297. `touch-action: manipulation` e cor de toque da marca.
298. `text-size-adjust` fixo.

### SEO local, peso e acessibilidade
299. Título: "Oficina Mecânica em Taubaté | Câmbio, Freios e Scanner | IndyCar" (64).
300. Descrição com endereço, cidade, diálise e horário (159).
301. `og:title`/`twitter:title` com a cidade.
302. `hreflang x-default`.
303. JSON-LD da oficina: nome alternativo, moeda BRL, idioma e especialidades (sem nota nem preço inventados — o teste garante).
304. Sitemap com imagens da fachada e lastmod de hoje.
305. Privacidade com metadados sociais e `robots`.
306. Privacidade explica rascunho, dados lembrados, protocolo e fila.
307. 🔗 Atalhos do app instalado marcam `utm_source=pwa` (e o redirecionamento mantém).
308. CSS sem sobra: 55 regras do carrossel de depoimentos removido (-5,4 KB).
309. `npm run css-morto` e teste que falha se voltar CSS de classe inexistente.
310. HTML publicado sem comentários/indentação: 103 → 84 KB (brotli ~17,7 → 15,2 KB).
311. Orçamento de peso no `npm run publicar` (HTML 96, CSS 92, JS 64 KB).
312. PNG da fachada (483 KB) que nenhuma página chama sai do `dist/`.
313. `prefers-contrast: more` nos textos e campos novos.
314. Impressão sem o cartão do pedido, a caixa de lembrar e o link do hero.
315. `404.js` versionado com `?v=` (cache de um ano não o deixa velho).
316. 🔗 README com o contrato dos atalhos para os outros sistemas.

317. 🔗 O roteador da Área do Cliente aceita também o link curto do site (`/a/<código>`, `/m/<código>`) colado inteiro.
318. Envio com campo errado anuncia em voz alta o que conferir ("Confira: nome, telefone com DDD.").
319. Barra de rolagem do formulário escura e fina.
320. `npm run publicar` escreve a data do dia no `lastmod` do sitemap (nunca fica velho).
321. 🔗 `/s` sozinho abre o formulário.
322. 🔗 `/garantia` leva à garantia (o Atendimento manda quando o cliente pergunta), mantendo a campanha.
323. 🔗 `/diagnostico` leva ao passo a passo do diagnóstico.
324. 🔗 `/duvidas` leva ao FAQ.

Total: 81 melhorias (244–324), 29 com 🔗.

### Como verifiquei
- `npm test`: qa.mjs + qa-r7.mjs (~110 verificações novas), 375/1440 px, fetch falso, nada vai ao banco.
- Redirecionamentos conferidos num deploy draft real da Netlify com `curl`.

### Pendências
- Edge Function `site-lead` não foi tocada (não publico função).
- Pedido ao Orçador: aceitar `&placa=` em `#/cotacao`. Pedido a Atendimento/Comunicar: usar `/s/<serviço>?utm_source=...&h=...`, `/a/`, `/m/`, `/o/`.

## Rodada 8 (19/11/2026): T4 Site, de qual anúncio veio o contato

Numeração continua (325 em diante). 🔗 = conexão com outro sistema. Especificação: `indycar-ferramentas/r8/CONTRATO-RASTREIO.md`. Teste novo: `scripts/qa-r8.mjs` (143 conferências), último passo do `npm test`.

### Chegada e guarda no aparelho
325. 🔗 Na chegada o site lê os 11 marcadores do contrato (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `ttclid`, `msclkid`), a página de chegada, o domínio de onde a pessoa veio e o tipo (`anuncio`, `busca`, `instagram`, `facebook`, `whatsapp`, `outro_site`, `direto`).
326. Guarda em `localStorage['indycar_rastreio']` por 30 dias (`{ dados, codigo, quando }`); vencido, some.
327. Regra de troca: link marcado substitui o guardado; chegada direta, pela busca ou só com site de origem não apaga um anúncio; recarregar não conta como chegada nova; `utm_source=pwa` (atalho do app instalado) vale como direta.
328. Sem armazenamento (modo privado, bloqueado) tudo funciona com a memória da página; todo acesso a armazenamento e à rede fica em `try/catch`.
329. O `sessionStorage['indycar_utm']` das rodadas 5 a 7 continua gravado e lido (quem estava com a página aberta não perde a campanha).
330. Tudo que vem do endereço ou do aparelho passa por limpeza: só os campos do contrato, só texto, tamanho máximo (utm 100, identificador de clique 255, página 120, referência 80). Dado estragado no aparelho não derruba a página.
331. 🔗 Pelos atalhos (`/s/<serviço>`, `/agendar`) a página de chegada fica `/s/<serviço>` ou `/agendar`, não `/`.

### Registro no banco e código
332. 🔗 Registro da visita em `trafego_rastreio_registrar` uma vez por sessão e por chegada, na primeira interação ou depois de 4 s com a página à vista (aba no fundo não conta).
333. Navegador comandado por programa (`navigator.webdriver`: suítes antigas e Lighthouse) não registra nada.
334. Só aceita código no formato do contrato (5 caracteres de `ABCDEFGHJKMNPQRSTUVWXYZ23456789`); erro 500, 404, resposta torta ou rede caída deixam o site no formato antigo, sem erro na página e sem segunda tentativa.
335. Endereço e chave pública do banco num lugar só (`RASTREIO_URL` e `RASTREIO_CHAVE`, topo do `script.js`). Chave vazia = nada é registrado e tudo sai como antes. O `npm test` reprova chave que não seja a pública.

### WhatsApp e formulário
336. 🔗 Com código, os 30 botões de WhatsApp da página, o da janela de avaliações e o da confirmação do formulário terminam com `(site/<serviço>--<fonte>--r-<código>)`; sem código, como era.
337. Limite de 40 caracteres dentro de `(site/…)`: quem é cortado é o serviço, nunca a fonte nem o código; a fonte vira só `[a-z0-9_]`, até 20.
338. 🔗 No clique, segundo registro (`evento: "clique"`) com `keepalive`, sem esperar resposta e sem atrasar a abertura do WhatsApp; leva o serviço inteiro mesmo quando o texto foi cortado.
339. Clique antes da resposta do registro sai no formato antigo; quando o código chega, os botões são remarcados.
340. 🔗 O pedido do formulário leva `rastreio: { codigo?, ...campos }`; o `utm` antigo continua indo.
341. 🔗 Função `site-lead`: `origemDoPedido` limpa o que chegou e `aplicarOrigem` chama `trafego_aplicar_origem(lead, dados, 'formulario')` com prazo de 4 s; sem a função no banco, lenta ou com erro, o pedido segue igual.

### Privacidade e acabamento
342. Privacidade: um item novo ("Guardamos por qual anúncio ou link você chegou ao site...") e um parágrafo sobre os 30 dias no aparelho; "sem cookie de rastreio" virou "sem cookie de publicidade" (o anterior deixaria de ser exato). Data da página: 19/11/2026.
343. Pulo do menu no celular: refeito se a caixa de horários mudar de altura no caminho (semana de feriado deixa a lista 82 px mais alta) e cancelado se a pessoa tocar, teclar ou rolar. Consertou 3 falhas do `qa.mjs` em 375 px (`#contato`, `#faq`, `#garantia` paravam em 162 px) que já existiam no commit `9ac92c0` e só apareciam em semana de feriado.
344. Teste da privacidade (`qa-r7-lote3.mjs`) confere que há data, não uma data fixa.

### Como verifiquei
- `scripts/qa-r8.mjs`: banco de mentira em 127.0.0.1, `script.js` servido com endereço e chave trocados, Chrome sem resolução de nomes (nada sai da máquina) e sem a marca de navegador comandado; um contexto novo por cenário. Cobre gclid, fbclid (375 px), utm de anúncio, chegada direta depois de anúncio, sem armazenamento, registro que falha (8 jeitos), registro que demora, limite de 40, formulário, 30 dias, dados estragados, 4 s à vista, pulo do menu com feriado.
- Ensaio com estragos: 14 defeitos plantados numa cópia do site (pasta temporária, nunca na árvore), em 3 lotes; a suíte reprovou todos (15, 26 e 17 falhas).
- `node --test scripts/logica-site-lead.test.mjs`: 21 testes da função (origem limpa, função do banco ausente, lenta ou com erro).
- Peso do `script.js` minificado: 59.068 → 62.291 bytes (gzip +1.143, brotli +1.125; orçamento 64 KB).
- `npm test` inteiro: 21 + 197 + 114 + 143, nenhuma falha. Lighthouse (`npm run vitais`, máquina dividida com outras frentes): celular 79 → 81 de desempenho, computador 100 → 99; acessibilidade, boas práticas e SEO 100 nos dois, antes e depois.

### Pendências
- `RASTREIO_CHAVE` vazia até a migração do banco ser aplicada (o orquestrador preenche e publica).
- Função `site-lead` não publicada (só o orquestrador publica).

## Rodada 9 (19-20/11/2026)

Frente R9-site (ramo `claude/r9`). Uma linha por melhoria, com o commit que fez a mudança. Commits de ajuste de uma
mudança anterior da própria rodada (02e878b, 8f0612c, 8e2f02b, 786808d) não contam linha.

- **R9-SITE-001** · tela · O botão "Agendar diagnóstico grátis" aparece sem rolar (antes ficava em 912 px no 375x812 e em 935 px no 1440x900); título do topo curto e em caixa de frase · `dbbd014`
- **R9-SITE-002** · conserto · Selo do topo não quebra mais entre o "+" e o "18" ("+18 anos" fica junto) · `dbbd014`
- **R9-SITE-003** · celular · "Já é cliente?" sem o "·" sobrando no fim da linha no celular · `dbbd014`
- **R9-SITE-004** · enxugar · Faixa de destaques do topo sem a nota 4,8 repetida (o selo logo abaixo já mostra) e sem "Pagamento consulte condições" · `08192c9`
- **R9-SITE-005** · conserto · Menu do computador: "Área do cliente" não quebra em duas linhas e os links não encostam no logo (921 a 1440 px, com e sem as fontes do site) · `a33a9e8`
- **R9-SITE-006** · conserto · Contadores nascem com 4,8 · 1.200 · 18 no HTML (sem JavaScript a página dizia "0★", "+0 avaliações", "+0 anos") · `b74a370`
- **R9-SITE-007** · acessibilidade · Com "menos movimento" ligado, os contadores mostram o número direto, sem contar de 0 · `b74a370`
- **R9-SITE-008** · texto · "100% Comprometidos" (número sem base) vira "12 meses de garantia" · `b74a370`
- **R9-SITE-009** · texto · Títulos e subtítulos em caixa de frase do português ("Perguntas frequentes", "Onde estamos"), não no Title Case do inglês · `a668bea`
- **R9-SITE-010** · texto · Sem travessão nos textos da página e nas respostas do FAQ (o JSON-LD acompanha) · `a668bea`
- **R9-SITE-011** · texto · Os botões que abrem o mesmo formulário tinham 5 nomes; agora "Agendar diagnóstico grátis" (e "Agendar" no menu) · `a668bea`
- **R9-SITE-012** · texto · Chamada final sem o superlativo sem prova "a oficina que Taubaté mais confia" · `a668bea`
- **R9-SITE-013** · conserto · O formulário dizia "Agende seu Diagnóstico Grátis" até para quem chegou pedindo freios (/s/freios); agora "Peça seu horário" · `a668bea`
- **R9-SITE-014** · enxugar · Os três quadros "Foto em breve" da equipe ficam escondidos até chegarem as fotos reais (pareciam site inacabado) · `a51cd7c`
- **R9-SITE-015** · enxugar · "Por que a IndyCar?" deixa de repetir leva e traz, transparência e 12 meses das outras seções · `fe11107`
- **R9-SITE-016** · enxugar · Sai a rotação de "prova social" no canto: repetia a página, cobria o conteúdo no celular e o leitor de tela anunciava cada troca · `fe53e5d`
- **R9-SITE-017** · texto · Botão flutuante diz o que faz: "Chamar no WhatsApp" (era "Fale conosco! 👋") · `219bc0f`
- **R9-SITE-018** · tela · Sem emoji decorativo no rodapé, no formulário, no convite e nos avisos; a confirmação do pedido usa um ✓ desenhado em SVG · `219bc0f`
- **R9-SITE-019** · tela · Cartão das avaliações sem a faixa vermelha grossa na lateral (o guia visual proíbe) · `58e35ea`
- **R9-SITE-020** · acessibilidade · "×" do formulário e do convite de 34 para 44 px; o do aviso do canto de 12x18 para 28x28 px e num cinza legível · `c39b074`
- **R9-SITE-021** · enxugar · Sai o botão "Avaliações" dos 12 cards de serviço e a janela dele (repetia a seção de avaliações; o celular rola ~700 px a menos) · `56742a4`
- **R9-SITE-022** · celular · Título dos cards de serviço sem o vão de 37 px entre as linhas no celular (altura de linha 1,2) · `6bfd243`
- **R9-SITE-023** · tela · Ícone dos cards largos e pequenos alinhado ao título, não solto no meio do card · `6bfd243`
- **R9-SITE-024** · acessibilidade · O aviso do canto escondido não recebe mais o foco do Tab nem deixa uma ponta de 8 px na borda · `e2447b1`
- **R9-SITE-025** · conserto · Formulário: WhatsApp em branco agora diz o porquê ("Precisamos do seu WhatsApp com DDD..."); antes só ficava vermelho · `6e1107e`
- **R9-SITE-026** · conserto · Formulário aceita o zero do interurbano ("012 99683-0272"); antes o número era barrado · `6e1107e`
- **R9-SITE-027** · texto · Rótulo do telefone diz o que a oficina precisa: "Seu WhatsApp com DDD" · `6e1107e`
- **R9-SITE-028** · celular · Exemplo do campo Carro não sai cortado no celular ("Ex: Civic 2018") · `6e1107e`
- **R9-SITE-029** · conserto · O convite de 8 s não abre por cima de quem está digitando ou com o menu aberto (roubava o foco no meio da palavra) · `3195916`
- **R9-SITE-030** · conserto · O convite não aparece para quem já abriu o formulário na visita ou mandou pedido nas últimas 36 h no aparelho · `3195916`
- **R9-SITE-031** · conserto · "Cole aqui" da área do cliente: se o navegador barrar a janela nova, aparece "Se não abriu, toque aqui" com o link certo · `b41acaa`
- **R9-SITE-032** · teste · O teste de números confere que nenhum 4,8 / 1.200 / 18 visível fica fora da marca data-num (antes só contava um mínimo de marcas) · `f5d3039`
- **R9-SITE-033** · desempenho · A fonte Inter sai (48 KB a menos e um relayout a menos na primeira dobra do celular); o corpo usa a Archivo que a página já baixa · `824d636`
- **R9-SITE-034** · acessibilidade · Rótulo vermelho pequeno das seções passa no contraste mínimo de 4,5 (escuro e claro) · `2c15c31`
- **R9-SITE-035** · conserto · WhatsApp da LGPD na Privacidade segue o contrato com o Atendimento ("Olá! Vim pelo site" + código + UTM) e o gerar-whatsapp confere a página · `dec742e`
- **R9-SITE-036** · texto · A página 404 começa pelo que aconteceu e o que fazer; a dica do código colado vem depois · `56b746a`
- **R9-SITE-037** · tela · 404 e Privacidade com a tipografia do site (Archivo), não a fonte do sistema · `18845ab`
- **R9-SITE-038** · acessibilidade · O leitor de tela não lê "seta para a direita" em 16 links; os 12 "Agende pelo WhatsApp" dizem o serviço e que abrem o WhatsApp · `c301e31`
- **R9-SITE-039** · acessibilidade · 404 e Privacidade: link do rodapé com 44 px de toque (era 18 px) e seta do "Voltar ao site" fora do leitor de tela · `2f2001e`
- **R9-SITE-040** · texto · O botão de "Como funciona" que abre o WhatsApp diz isso: "Agendar pelo WhatsApp", com o ícone (era "Agendar meu diagnóstico") · `bdd4a15`
- **R9-SITE-041** · conserto · Contadores só voltam a 0 para animar quando entram na tela; até lá mostram os números reais · `e22a47d`
- **R9-SITE-042** · texto · "Conheça a IndyCar" sem "referência em Taubaté" (superlativo sem prova) e sem o parágrafo que repetia o cartão logo abaixo · `51cc174`
- **R9-SITE-043** · tela · Contato: o celular da oficina com duas ações claras, "WhatsApp · Ligar" (tocar no número abria o WhatsApp) · `9ecb2c1`
- **R9-SITE-044** · conserto · Rodapé: "+1.200 avaliações" sem o vão de 8 px entre o "+" e o número · `1191d1e`
- **R9-SITE-045** · acessibilidade · Estrelas e ✓ decorativos não são lidos em voz alta (selo, faixa, contadores, rodapé) · `0c71cc4`
- **R9-SITE-046** · conserto · "Quando prefere?" avisa feriado no "Hoje" e, na véspera, no "Amanhã" (o valor enviado continua o mesmo) · `2664dde`
- **R9-SITE-047** · tela · "Pedir meu horário" no vermelho de ação, não no verde do WhatsApp (o botão manda o pedido, não abre o WhatsApp) · `960c36b`
- **R9-SITE-048** · segurança · O mapa do Google recebe só a origem do site (referrerPolicy), não a URL inteira com utm/gclid · `a1d4d35`
- **R9-SITE-049** · acessibilidade · Menu do celular aberto pelo teclado leva o foco ao primeiro link da gaveta · `fdd5b35`
- **R9-SITE-050** · acessibilidade · Gaveta do menu fechada sai da ordem do Tab (antes o teclado passava por 8 links invisíveis) · `183fa3f`
- **R9-SITE-051** · acessibilidade · O botão do menu volta a dizer "Abrir menu" quando a gaveta fecha por Esc ou por um link · `00af1d5`
- **R9-SITE-052** · acessibilidade · No computador os links soltos têm pelo menos 24 px de altura (WCAG 2.2, 2.5.8): eram 12 abaixo disso · `06e3446`
- **R9-SITE-053** · texto · Convite de 8 s diz o caminho de verdade ("Você escolhe o horário aqui e a equipe confirma pelo WhatsApp") e sem "gratuito" três vezes · `7288b75`
- **R9-SITE-054** · celular · Links no meio da frase do formulário ("Privacidade", "Acompanhar meu carro") sem abrir vãos de ~20 px entre as linhas, com 44 px de toque · `2618f7c`
- **R9-SITE-055** · aviso · Agenda cheia: o aviso leva ao WhatsApp (link) e some o "Toque num horário" que não tinha horário · `4f97505`
- **R9-SITE-056** · conserto · Formulário sem rede não diz mais "Pedido enviado!" (o pedido ainda não chegou): "Falta só mandar no WhatsApp", sem ✓ e sem festa · `e962c0c`
- **R9-SITE-057** · texto · FAQ: "Preciso agendar?" oferece o formulário do site e "formas de pagamento" diz quando a pessoa fica sabendo, em vez de "consulte" · `e36b68d`
- **R9-SITE-058** · celular · Links no meio das respostas do FAQ e das notas da área do cliente com 44 px de toque (tinham 17 px quando cabiam numa linha) · `c916de4`
- **R9-SITE-059** · acessibilidade · Faixa vermelha que corre volta a parar com o mouse em cima e, no celular, para e retoma com um toque · `93e8af4`
- **R9-SITE-060** · enxugar · Sai o item "Pagamento: consulte condições" da faixa vermelha que corre e o "pagamento sob consulta" da chamada final · `f2b643f`
- **R9-SITE-061** · texto · Faixa vermelha: "Garantia de 12 meses em peças e mão de obra" (dizia só "12 meses em...") e "Mecânica em geral" (era "Especialista em Mecânica em Geral") · `c15e329`
- **R9-SITE-062** · texto · Sem chavão: "Transparência absoluta" vira "Você aprova antes" e sai "scanners de última geração" (cartão e FAQ, com o JSON-LD) · `3225473`
- **R9-SITE-063** · conserto · Formulário: o Enter ("próximo" do teclado do celular) vai ao campo seguinte; antes enviava o pedido pela metade, sem "Quando" e sem mensagem · `774df15`
- **R9-SITE-064** · conserto · Sem JavaScript a página não fica vazia (10 dos 11 títulos sumiam); o aviso fica na frente do menu e o botão do menu, que não abriria, sai · `795e621`
- **R9-SITE-065** · acessibilidade · O "Voltar ao topo" escondido no topo da página sai do Tab e do leitor de tela · `340ce4d`
- **R9-SITE-066** · conserto · Chip "Fechado agora" não promete "abre amanhã, 8h" quando o próximo dia de abertura é feriado (hoje, 19/11, para 20/11) · `678e141`
- **R9-SITE-067** · celular · Em feriado o chip do topo quebra em duas linhas e não sai cortado em "confirme no Wh" no celular · `e999791`
- **R9-SITE-068** · conserto · "Cole aqui" com o campo vazio pede para colar, em vez de dizer "Não reconheci esse link ou código" · `ea43673`
- **R9-SITE-069** · aviso · O horário do contato avisa o feriado dos próximos 7 dias ("Amanhã é feriado (Consciência Negra): confirme no WhatsApp se a oficina abre") · `b296050`
- **R9-SITE-070** · acessibilidade · A caixa "Próximos horários livres" vira uma região com nome (o aria-labelledby num div sem papel era ignorado; o axe acusava) · `9009a5c`
- **R9-SITE-071** · acessibilidade · Botões de WhatsApp (contato, depois do pedido, flutuante e 404) em verde sólido escuro: contraste do branco de 1,8 a 2,6 para 5,4 · `cd27056`
- **R9-SITE-072** · teste · Novo qa-r9.mjs: o botão "Agendar diagnóstico grátis" inteiro na primeira tela em 375x812, 360x740, 1280x720 e 1440x900 · `80dd10f`
- **R9-SITE-073** · teste · Contadores mostram 4,8 · 1.200 · 18 · 12 antes de rolar e depois de animar, com e sem "menos movimento" · `80dd10f`
- **R9-SITE-074** · teste · Menu do celular pelo teclado: gaveta fechada fora do Tab, foco entra no primeiro link, Esc devolve o foco e o nome "Abrir menu" · `80dd10f`
- **R9-SITE-075** · teste · Contraste de pelo menos 4,5 no rótulo vermelho de todas as seções e nos botões de WhatsApp (sem degradê) · `80dd10f`
- **R9-SITE-076** · teste · Nenhuma estrela, ✓ ou seta decorativa exposta ao leitor de tela; a caixa de horários é região com nome · `80dd10f`
- **R9-SITE-077** · teste · No computador, nenhum link ou botão solto com menos de 24x24 px · `80dd10f`
- **R9-SITE-078** · teste · A faixa vermelha anda, para com o mouse (1440) e com um toque (375) e volta · `80dd10f`
- **R9-SITE-079** · teste · Formulário: Enter vai ao próximo campo e nunca envia pela metade; WhatsApp em branco tem aviso próprio; "012 99683-0272" vai como 12996830272 · `80dd10f`
- **R9-SITE-080** · teste · Pedido sem rede: título "Falta só mandar no WhatsApp", sem ✓ e sem a festa de concluído (faíscas contadas) · `80dd10f`
- **R9-SITE-081** · teste · Convite de 8 s (tempo acelerado): espera quem está digitando, não aparece com pedido de 2 h e volta com pedido de 40 h · `80dd10f`
- **R9-SITE-082** · teste · Agenda cheia (lista vazia): o aviso tem o link do WhatsApp e o "Toque num horário" some · `80dd10f`
- **R9-SITE-083** · teste · Feriados com data fixa (19/11, 18/11, 20/11, 25/11 e sábado antes do Carnaval de 2027): "Quando prefere?", chip do topo e horário do contato · `80dd10f`
- **R9-SITE-084** · teste · Mapa com referrerPolicy, "Cole aqui" vazio e "toque aqui" quando a janela é barrada, "Voltar ao topo" fora do Tab no topo · `80dd10f`
- **R9-SITE-085** · teste · Página 404: ações antes da dica do código, link do rodapé com 44 px e fonte Archivo · `80dd10f`
- **R9-SITE-086** · texto · Leva e traz sem o "pergunte... (consulte condições)": "pergunte no WhatsApp se o leva e traz vale para o seu caso" (passo 2 do diagnóstico e FAQ "Onde fica", com o JSON-LD) · `361ceb8`
- **R9-SITE-087** · teste · O teste do chip do topo no qa.mjs aceita o aviso de feriado: em 20/11 (Consciência Negra) o npm test falhava sem defeito no site · `d803e35`
- **R9-SITE-088** · conserto · A nota do rodapé e o ícone do Google Maps levam ao perfil da oficina com as avaliações (o ícone buscava só o endereço; a nota era texto) · `5b31d95`
- **R9-SITE-089** · acessibilidade · Sem rede, o foco vai para "Abrir no WhatsApp" (o que falta fazer), não para "Fechar"; com o pedido entregue continua no "Fechar" · `97ea26f`
- **R9-SITE-090** · conserto · Com o mapa do Google aberto, o "Traçar rota" continua à mão, por cima do mapa (sumia junto com a capa) · `5818bb7`
- **R9-SITE-091** · tela · Rodapé de contato com o telefone fixo (12) 3624-5957 e "Traçar rota" embaixo do endereço · `675dec7`
- **R9-SITE-092** · desempenho · Recorte da fachada com versão de 640 px e "sizes" com a largura real: o celular baixa 18 KB no lugar de 35 KB (o Lighthouse apontava ~30 KB sobrando) · `ff7a11d`
- **R9-SITE-093** · celular · Em telas de 320 px o selo da nota do topo não passa mais 17 px da tela · `fa78c4e`
- **R9-SITE-094** · acessibilidade · A seta do fim do topo leva a "Conheça a IndyCar" e se chama assim (apontava para a faixa que corre e era lida como "Rolar para baixo") · `fe2d2ea`
- **R9-SITE-095** · conserto · "Quando prefere?" no sábado à noite e no domingo oferece "Semana que vem, de manhã/à tarde" (antes "Esta semana" chegava à equipe para uma semana que tinha acabado) · `00f877a`
