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
