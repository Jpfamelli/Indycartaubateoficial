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
