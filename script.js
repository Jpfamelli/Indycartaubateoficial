/* ====================================================================
   INDYCAR — script.js
   Tudo em JS puro: navbar, reveals, contadores, canvas de velocidade,
   carrossel de depoimentos, modais, prova social e cursor interativo.
   ==================================================================== */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Rodada 4 (Core Web Vitals): efeitos de canvas que rodam sem parar começam depois do "load", com o navegador
  // ocioso; a primeira pintura e o primeiro toque não disputam o processador com eles.
  // Rodada 5: os efeitos entram numa fila e rodam UM POR VEZ em períodos ociosos (antes, todos de uma vez numa
  // tarefa longa de ~1 s no celular; tarefas curtas deixam a página responder ao toque — TBT do Lighthouse).
  const filaOciosa = [];
  let filaAgendada = false;
  function rodarFila(deadline) {
    filaAgendada = false;
    const inicio = performance.now();
    while (filaOciosa.length) {
      const fn = filaOciosa.shift();
      const t1 = performance.now();
      try { fn(); } catch (e) { console.error(e); }
      // cada efeito deixa uma medida (performance.measure) para o teste/Lighthouse apontar quem pesou
      try { performance.measure('efeito:' + (fn.name || 'anonimo'), { start: t1, end: performance.now() }); } catch (_) {}
      if (performance.now() - inicio > 8 || (deadline && deadline.timeRemaining && deadline.timeRemaining() < 4)) break;
    }
    if (filaOciosa.length) agendarFila();
  }
  function agendarFila() {
    if (filaAgendada) return;
    filaAgendada = true;
    if (window.requestIdleCallback) window.requestIdleCallback(rodarFila, { timeout: 1500 }); else setTimeout(() => rodarFila(null), 40);
  }
  const aposCarregar = (fn) => {
    filaOciosa.push(fn);
    if (document.readyState === 'complete') agendarFila(); else window.addEventListener('load', agendarFila, { once: true });
  };
  // Rodada 5: os efeitos que redesenham a tela a cada quadro (mar de metal, borda elétrica, faíscas, brilho das letras)
  // só começam quando a pessoa interage (mexe o mouse, rola, toca) — ou 7 s depois do load, para quem só olha.
  // Até lá a primeira dobra fica quieta: a página termina de pintar e responde antes (Speed Index / TBT).
  const interagiu = new Promise((resolver) => {
    const eventos = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'];
    const ligar = () => {
      eventos.forEach(e => window.removeEventListener(e, ligar, true));
      document.documentElement.classList.add('interagiu');
      resolver();
    };
    eventos.forEach(e => window.addEventListener(e, ligar, { capture: true, passive: true }));
    const depois = () => setTimeout(ligar, 7000);
    if (document.readyState === 'complete') depois(); else window.addEventListener('load', depois, { once: true });
  });
  const aoInteragir = (fn) => { interagiu.then(() => aposCarregar(fn)); };
  // No celular o título do hero não é dividido em letras (ele é o LCP e entra só com o deslize do CSS).
  const heroLeve = window.matchMedia('(max-width: 768px)').matches;
  // Rodada 7: economia de dados (Save-Data ligado ou rede 2G): efeitos pesados desligados e nada de consulta antecipada.
  const REDE = navigator.connection || {};
  const POUPAR = REDE.saveData === true || /(^|-)2g$/.test(REDE.effectiveType || '');
  const sessao = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} }
  };
  // Rodada 5: a campanha que trouxe a pessoa (utm_*, gclid, fbclid) fica guardada na sessão e vai junto no pedido
  // do formulário e no código dos links de WhatsApp — o CRM enxerga "site" e, se houver, o anúncio de origem.
  const PARAMS = new URLSearchParams(location.search);
  // Rodada 7: /s/<serviço>, /agendar e /orcamento (netlify.toml) chegam como /#agendar[-serviço] com a query intacta
  // (utm_*, gclid, fbclid): abrem o formulário já com o serviço, sem rolar para lugar nenhum.
  const ATALHO_RE = /^#agendar(?:-([^?#]{1,80}))?$/;
  // Nomes que os outros sistemas usam (cadastro `servicos` do banco, Comunicar, Atendimento) e o código do formulário.
  const ALIAS_SERVICO = {
    'alinhamento-3d': 'alinhamento', 'alinhamento-e-balanceamento': 'alinhamento', 'balanceamento': 'alinhamento',
    'correia-dentada': 'correia', 'diagnostico-com-scanner': 'diagnostico', 'diagnostico-eletronico': 'diagnostico', 'scanner': 'diagnostico',
    'revisao-completa': 'motor', 'revisao-de-motor': 'motor', 'troca-de-oleo': 'oleo-motor', 'troca-de-oleo-de-motor': 'oleo-motor',
    'troca-de-oleo-cambio': 'cambio', 'troca-de-oleo-cambio-automatico': 'cambio', 'troca-de-oleo-de-cambio': 'cambio', 'dialise': 'cambio',
    'limpeza-de-bicos': 'bicos', 'pastilhas': 'freios', 'pastilha': 'freios', 'amortecedores': 'suspensao', 'amortecedor': 'suspensao',
    'pneu': 'pneus', 'ar-condicionado': 'outro-servico', 'direcao': 'outro-servico', 'oleo': 'oleo-motor'
  };
  // Horário que o Atendimento sugeriu: /s/freios?h=2026-10-27T10:00 (só data e hora, nada de pessoa)
  let slotPedido = null, avisoSlot = '';
  { const m = /^(\d{4}-\d{2}-\d{2})[T_ ](\d{2}:\d{2})$/.exec(PARAMS.get('h') || ''); if (m) slotPedido = { data: m[1], hora: m[2] }; }
  const UTM = (() => {
    const u = {};
    for (const k of ['source', 'medium', 'campaign', 'content', 'term']) { const v = PARAMS.get('utm_' + k); if (v) u[k] = v.slice(0, 80); }
    for (const k of ['gclid', 'fbclid']) { const v = PARAMS.get(k); if (v) u[k] = v.slice(0, 80); }
    if (Object.keys(u).length) { sessao.set('indycar_utm', JSON.stringify(u)); return u; }
    try { return JSON.parse(sessao.get('indycar_utm') || '{}') || {}; } catch (_) { return {}; }
  })();
  const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  // Código de origem com a campanha paga anexada: "(site/cambio--meta)" (o gatilho do banco aceita [a-z0-9_-]{1,40}).
  function codigoComCampanha(codigo) {
    if (!UTM.source) return codigo;
    return (codigo + '--' + slug(UTM.source)).slice(0, 40).replace(/-+$/, '');
  }
  if (UTM.source) {
    $$('a[href*="wa.me"]').forEach(a => {
      try {
        const u = new URL(a.href);
        const c = u.searchParams.get('utm_campaign');
        const t = u.searchParams.get('text') || '';
        if (!c || !t.endsWith('(site/' + c + ')')) return;
        const novo = codigoComCampanha(c);
        u.searchParams.set('text', t.slice(0, -(c.length + 7)) + '(site/' + novo + ')');
        u.searchParams.set('utm_campaign', novo);
        a.href = u.toString();
      } catch (_) {}
    });
  }
  // Mensagem padrão ao atendimento. O prefixo é o contrato com a IA do Atendimento (identifica o serviço por "quero orçar:").
  const PREFIXO_WA = 'Olá! Vim pelo site';
  function linkWhatsApp(texto, codigo) {
    return 'https://wa.me/5512996830272?text=' + encodeURIComponent(texto + ' (site/' + codigo + ')') +
      '&utm_source=site&utm_medium=whatsapp&utm_campaign=' + encodeURIComponent(codigo);
  }
  // As seções abaixo da dobra usam content-visibility (styles.css). Antes de pular para uma âncora, todas ganham o
  // tamanho real (html.cv-off), senão o pulo cairia no lugar errado. Com âncora já no endereço, vale desde o início.
  const semAtalhoDeLayout = () => document.documentElement.classList.add('cv-off');
  if (location.hash.length > 1 && !ATALHO_RE.test(location.hash)) semAtalhoDeLayout();
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1) semAtalhoDeLayout();
  }, true);
  window.addEventListener('hashchange', semAtalhoDeLayout);

  /* ================================================================
     0. CSP sem script embutido: o que antes era onload/onerror no HTML
     ================================================================ */
  // Desde a rodada 4 as fontes ficam no próprio site (styles.css). Se alguma página ainda tiver um link
  // data-fontes (media=print), ele vira "all" aqui.
  $$('link[data-fontes]').forEach(l => {
    const ligar = () => { l.media = 'all'; };
    if (l.sheet) ligar(); else { l.addEventListener('load', ligar); setTimeout(ligar, 3000); }
  });
  // Imagem que não carregou: troca pela reserva (data-reserva) ou some com o bloco (data-reserva-remover).
  function reservaDaImagem(img) {
    if (img.dataset.reserva && !img.dataset.reservaUsada) {
      img.dataset.reservaUsada = '1';
      const pic = img.closest('picture');
      if (pic) pic.querySelectorAll('source').forEach(s => s.remove());
      img.src = img.dataset.reserva;
      const [alvo, classe] = String(img.dataset.reservaClasse || '').split('|');
      if (alvo && classe) img.closest(alvo)?.classList.add(classe);
    } else if (img.dataset.reservaRemover) {
      img.closest(img.dataset.reservaRemover)?.remove();
    }
  }
  $$('img[data-reserva], img[data-reserva-remover]').forEach(img => {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) reservaDaImagem(img);
    else img.addEventListener('error', () => reservaDaImagem(img));
  });

  /* ================================================================
     1. NAVBAR — muda de estilo ao rolar + barra de progresso
     ================================================================ */
  const navbar = $('#navbar');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');

  const bgGrid = $('#bgGrid');
  const GRID_STEP = 56, GRID_PAR = 0.08;
  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    toTop.classList.toggle('show', y > 600);

    // progresso de leitura
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

    // parallax sutil do grid de fundo (módulo do passo: a grade nunca sai da tela)
    if (bgGrid && !reduceMotion) bgGrid.style.transform = `translateY(${(y * GRID_PAR) % GRID_STEP}px)`;
  }
  // Um quadro por rolagem (antes cada evento media a página inteira) e a primeira medida depois da primeira pintura.
  let scrollRaf = 0;
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; onScroll(); }); }, { passive: true });
  requestAnimationFrame(onScroll);

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ================================================================
     2. MENU MOBILE (hamburger)
     ================================================================ */
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');

  function closeMenu() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && navLinks.classList.contains('open')) { closeMenu(); hamburger.focus(); } });
  // fecha ao clicar num link
  $$('.nav-link', navLinks).forEach(a => a.addEventListener('click', closeMenu));
  // Rodada 5: o menu marca a seção em que a pessoa está (aria-current) enquanto rola.
  (function marcarSecaoAtual() {
    const links = $$('.nav-link[href^="#"]', navLinks);
    const alvos = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    if (!alvos.length || !('IntersectionObserver' in window)) return;
    const visiveis = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => visiveis.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let melhor = null, maior = 0;
      visiveis.forEach((v, id) => { if (v > maior) { maior = v; melhor = id; } });
      links.forEach(a => {
        const atual = melhor && a.getAttribute('href') === '#' + melhor;
        a.classList.toggle('atual', !!atual);
        if (atual) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { threshold: [0.1, 0.3, 0.6], rootMargin: '-80px 0px -40% 0px' });
    alvos.forEach(s => io.observe(s));
  })();

  /* ================================================================
     3. REVEAL ON SCROLL (Intersection Observer + stagger)
     ================================================================ */
  const revealEls = $$('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        // pequeno atraso escalonado entre irmãos visíveis
        const delay = (e.target.dataset.delay || (i % 6) * 90);
        setTimeout(() => e.target.classList.add('in'), delay);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ================================================================
     4. CONTADORES ANIMADOS (dispara quando entra na tela)
     ================================================================ */
  const counters = $$('.counter-num');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      animateCount(e.target);
      counterIO.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterIO.observe(c));

  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals).replace('.', ',')
                                : Math.floor(val).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals).replace('.', ',')
                                     : target.toLocaleString('pt-BR');
    }
    requestAnimationFrame(tick);
  }

  /* ================================================================
     5. CURSOR GLOW + tilt 3D nos cards (background interativo)
     ================================================================ */
  const glow = $('#cursorGlow');
  let hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  let glowStrength = '1'; // o TargetCursor reduz para .5 quando ativo

  if (hasFinePointer) {
    // brilho de cursor com seguimento SUAVE (lerp) -> sensação premium
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, glowRaf = null;
    function followGlow() {
      gx += (tx - gx) * 0.15; gy += (ty - gy) * 0.15;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.1) glowRaf = requestAnimationFrame(followGlow);
      else glowRaf = null;
    }
    window.addEventListener('pointermove', (e) => {
      glow.style.opacity = glowStrength; tx = e.clientX; ty = e.clientY;
      if (!glowRaf) glowRaf = requestAnimationFrame(followGlow);
    });
    window.addEventListener('pointerleave', () => (glow.style.opacity = '0'));

    // SPOTLIGHT que segue o cursor dentro de cada card
    // (SpotlightCard do React Bits: também nos pilares de #sobre e itens de #diferenciais)
    $$('.service-card, .about-pillar, .why-item').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });

    // efeito tilt nos cards de serviço
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-10px) rotateX(${ -y * 8 }deg) rotateY(${ x * 8 }deg)`;
      });
      card.addEventListener('pointerleave', () => (card.style.transform = ''));
    });
  }

  /* ================================================================
     6. MAR DE METAL FUNDIDO (#bgLive) — motor portado do "mar de ouro"
        da Eletronic, com a cara da IndyCar: campo caustico fold() com
        3 senos, 2 passadas 'lighter' (corpo em vermelho profundo +
        filamentos laranja-brasa que somam em branco-quente), 3 trens
        de vaga viajantes, maré (~20s) + paralaxe de scroll, fagulhas
        de solda subindo, vento local no mouse com rastro decaindo
        (~1.5s) e splash no clique. Rasterizado num offscreen a ~0.6x.
        Perf: governor EMA>26ms com histerese e recuperação; pausa com
        a aba oculta; reduced-motion = 1 frame estático; pointer:coarse
        fica autônomo (sem efeitos de mouse).
     ================================================================ */
  aposCarregar(function metalFundido() {
    var canvas = document.getElementById('bgLive');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var off = document.createElement('canvas');
    var octx = off.getContext('2d');

    var COARSE = !hasFinePointer;
    var PEQUENO = matchMedia('(max-width:480px)').matches;

    /* --- constantes do mar --- */
    var BAND_BASE = 0.42;                 /* topo da faixa caustica (fracao de H) */
    var MARE_AMP = 0.04;                  /* respiracao: ±4% de H */
    var MARE_T = 20;                      /* periodo da mare (s) */
    var MARE_SCROLL = 0.05;               /* mare extra no fundo da pagina */
    var PARALAXE = 0.06;                  /* faixa acompanha o scroll */
    var TAU = 6.28318530718;
    /* trens de vaga: [comprimento px, periodo s, amplitude, direcao, fase] */
    var VAGAS = [[860, 9, 1.0, 1, 0], [1520, 14, 0.75, -1, 2.1], [2400, 23, 0.55, 1, 4.4]];
    var VNORM = 1 / (1.0 + 0.75 + 0.55);
    var VENTO_R2 = -1 / (2 * 110 * 110);  /* gaussiana vertical do vento (~raio 200px) */
    var VENTO_AMP = 0.6;                  /* +60% de amplitude local */
    var VENTO_DECAI = 450;                /* ms — rastro some em ~1.5s */
    var TCELLS = 96;
    var SPLASH_MS = 1200, SPLASH_R = 460, SPLASH_AMP = 26;
    var SPLASH_K = TAU / 90;
    var SPLASH_S2 = -1 / (2 * 58 * 58);

    /* densidade (PEQUENO <=480px reduzida) */
    var N1_BASE = PEQUENO ? 92 : (COARSE ? 128 : 160); /* corpo em vermelho fundido */
    var N2_BASE = PEQUENO ? 30 : (COARSE ? 42 : 52);   /* filamentos laranja-brasa */
    var PASSO0 = PEQUENO ? 11 : 9;
    var N_FAISCAS = PEQUENO ? 24 : 46;

    var W = 0, H = 0, dpr = 1;
    var marS = PEQUENO ? 0.55 : 0.6;      /* escala do offscreen do mar */
    var marS0 = marS;
    var docH = 1, rolagem = window.scrollY || 0;
    var fator = 1, passoX = PASSO0, nivel = 0, emaDt = 16.7, lastDrop = 0, bomDesde = 0;
    /* Rodada 4: no celular começa um degrau abaixo (menos filamentos); se o aparelho
       aguentar (3s de quadros bons), o governor sobe sozinho para o desenho completo. */
    if (COARSE) { nivel = 1; fator = 0.66; }
    var lastT = 0, raf = 0, rodando = false, t0 = performance.now();
    var spanAtual = 0;

    /* vento (rastro do mouse) */
    var tE = new Float32Array(TCELLS), tY = new Float32Array(TCELLS);
    var temVento = false, ventoGlow = 0;
    var mx = -1e4, my = -1e4, mxS = -1e4, myS = -1e4, lmx = -1e4, lmy = -1e4, temMouse = false;

    /* splash */
    var ondas = [], borrifos = [];

    /* fagulhas de solda (espuma) */
    var FAISCAS = [];
    for (var fi = 0; fi < N_FAISCAS; fi++) {
      FAISCAS.push({
        x: Math.random(), p: Math.random(),
        s: 0.018 + Math.random() * 0.035,
        r: 0.8 + Math.random() * 1.4,
        tw: Math.random() * TAU
      });
    }

    /* brilho quente submerso (forja) + linha de horizonte, pre-renderizado a 1/4 */
    var amb = document.createElement('canvas');
    function pintarAmb() {
      amb.width = Math.max(2, W >> 2); amb.height = Math.max(2, H >> 2);
      var c = amb.getContext('2d'), w = amb.width, h = amb.height;
      c.clearRect(0, 0, w, h);
      var g = c.createRadialGradient(w * .60, h * 1.12, h * .05, w * .60, h * 1.12, h * .85);
      g.addColorStop(0, 'rgba(220,52,22,0.26)');
      g.addColorStop(.5, 'rgba(150,22,12,0.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, h * .3, w, h * .7);
      var hz = c.createLinearGradient(0, h - 28, 0, h);
      hz.addColorStop(0, 'rgba(0,0,0,0)');
      hz.addColorStop(1, 'rgba(255,120,64,0.12)');
      c.fillStyle = hz; c.fillRect(0, h - 28, w, 28);
    }

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      off.width = Math.ceil(W * marS); off.height = Math.ceil(H * marS);
      octx.setTransform(marS, 0, 0, marS, 0, 0);
      /* altura do documento só quando o mar anima (a leitura força o layout; no quadro parado não precisa) */
      if (rodando) docH = Math.max(1, (document.documentElement.scrollHeight || H) - H);
      pintarAmb();
    }

    /* campo de dobras — senos cruzados com fase nao-linear */
    function fold(x, k, t) {
      var u = x * 0.0036 + t * 0.34;
      var v = x * 0.0074 - t * 0.47;
      var w = x * 0.0014 + t * 0.12;
      return Math.sin(u + k * 11.0 + Math.sin(v + k * 5.5) * 2.1) * 0.55
           + Math.sin(v * 1.6 + k * 19.0 - Math.sin(w * 2.3 + t * 0.26) * 1.5) * 0.34
           + Math.sin(w * 3.4 + k * 7.0 + t * 0.6) * 0.42;
    }

    /* fases das vagas — recalculadas 1x por frame */
    var vk1 = 0, vk2 = 0, vk3 = 0, vq1 = 0, vq2 = 0, vq3 = 0, vA1 = 0, vA2 = 0, vA3 = 0;
    function prepararVagas(t) {
      vk1 = TAU * VAGAS[0][3] / VAGAS[0][0]; vq1 = -t * TAU / VAGAS[0][1] + VAGAS[0][4]; vA1 = VAGAS[0][2] * VNORM;
      vk2 = TAU * VAGAS[1][3] / VAGAS[1][0]; vq2 = -t * TAU / VAGAS[1][1] + VAGAS[1][4]; vA2 = VAGAS[1][2] * VNORM;
      vk3 = TAU * VAGAS[2][3] / VAGAS[2][0]; vq3 = -t * TAU / VAGAS[2][1] + VAGAS[2][4]; vA3 = VAGAS[2][2] * VNORM;
    }
    function vagaEm(x) {
      return Math.sin(x * vk1 + vq1) * vA1 + Math.sin(x * vk2 + vq2) * vA2 + Math.sin(x * vk3 + vq3) * vA3;
    }

    function desenharPasse(t, n, baseAlpha, lw, corFn, fase, interativo) {
      octx.lineWidth = lw;
      var cellInv = TCELLS / W;
      var nOndas = ondas.length;
      for (var i = 0; i < n; i++) {
        var k = n === 1 ? 1 : i / (n - 1);
        var yBase = H + 14 - spanAtual * Math.pow(k, 1.18) + Math.sin(t * 0.4 + k * 6.0) * 6;
        var amp = (30 + 55 * k) * (0.9 + 0.1 * Math.sin(t * 0.3 + k * 11));
        var flick = 0.80 + 0.20 * Math.sin(t * 0.9 + k * 21 + fase * 40);
        var a = baseAlpha * (0.45 + 0.55 * (1 - k)) * flick;
        if (a < 0.004) continue;
        var heave = 10 + 24 * k;
        octx.strokeStyle = corFn(k, a);
        octx.beginPath();
        for (var x = -24; x <= W + 24; x += passoX) {
          var swn = Math.sin(x * vk1 + vq1) * vA1 + Math.sin(x * vk2 + vq2) * vA2 + Math.sin(x * vk3 + vq3) * vA3;
          var ampL = amp * (1 + 0.35 * swn);
          var foldV = fold(x, k + fase, t);
          var y = yBase + swn * heave + foldV * ampL;
          if (interativo) {
            if (temVento) {
              var c = (x * cellInv) | 0;
              if (c < 0) c = 0; else if (c >= TCELLS) c = TCELLS - 1;
              var e = tE[c];
              if (e > 0.02) {
                var dvy = yBase - tY[c];
                var g = e * Math.exp(dvy * dvy * VENTO_R2);
                if (g > 0.01) {
                  if (g > 1) g = 1;
                  y += foldV * ampL * VENTO_AMP * g + g * 7 * Math.sin(x * 0.045 + t * 7.3);
                }
              }
            }
            for (var oi = 0; oi < nOndas; oi++) {
              var od = ondas[oi];
              var dx = x - od.x;
              if (dx > od.win || dx < -od.win) continue;
              var dyy = yBase - od.y;
              var dd = Math.sqrt(dx * dx + dyy * dyy) - od.R;
              if (dd > 130 || dd < -130) continue;
              y += Math.exp(dd * dd * SPLASH_S2) * Math.sin(dd * SPLASH_K) * SPLASH_AMP * od.fade;
            }
          }
          if (x === -24) octx.moveTo(x, y); else octx.lineTo(x, y);
        }
        octx.stroke();
      }
    }

    function quadro(now, estatico) {
      var t = (now - t0) / 1000 + 11.3;
      prepararVagas(t);

      if (docH === 1 && !estatico) docH = Math.max(1, (document.documentElement.scrollHeight || H) - H);
      var fracScroll = rolagem / docH; if (fracScroll > 1) fracScroll = 1;
      var mare = MARE_AMP * Math.sin(t * TAU / MARE_T) + MARE_SCROLL * fracScroll;
      var bandTop = H * (BAND_BASE - mare) - rolagem * PARALAXE;
      var minTop = H * 0.20;
      if (bandTop < minTop) bandTop = minTop;
      spanAtual = H - bandTop;

      octx.clearRect(0, 0, W, H);
      octx.globalCompositeOperation = 'lighter';
      octx.drawImage(amb, 0, 0, W, H);

      var interativo = !estatico;

      /* passada 1 — corpo caustico em VERMELHO FUNDIDO (#e50914 → #b00710) */
      desenharPasse(t, (N1_BASE * fator) | 0, 0.148, 1.4, function (k, a) {
        var r = 234 - 38 * k, g = 36 - 20 * k, b = 22 - 12 * k;
        return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a + ')';
      }, 0, interativo);

      /* passada 2 — filamentos LARANJA-BRASA (#ff5a1f); o 'lighter' soma
         os cruzamentos em branco-quente (picos do metal derretido) */
      desenharPasse(t, (N2_BASE * fator) | 0, 0.20, 1.0, function (k, a) {
        return 'rgba(255,' + ((124 - 44 * k) | 0) + ',' + ((48 - 24 * k) | 0) + ',' + a + ')';
      }, 0.006, interativo);

      /* fagulhas de solda — spray quando a crista da vaga passa */
      for (var si = 0; si < FAISCAS.length; si++) {
        var s = FAISCAS[si];
        var aF;
        if (!estatico) {
          var swS = vagaEm(s.x * W);
          var spray = swS > 0.3 ? (swS - 0.3) * 1.6 : 0;
          s.p += s.s * (1 + spray * 1.5) / 60;
          if (s.p > 1) { s.p = 0; s.x = Math.random(); }
          aF = Math.sin(Math.PI * s.p) * (0.28 + 0.22 * Math.sin(t * 3 + s.tw)) * (1 + spray);
        } else {
          aF = Math.sin(Math.PI * s.p) * 0.3;
        }
        if (aF <= 0) continue;
        if (aF > 0.9) aF = 0.9;
        octx.fillStyle = 'rgba(255,176,104,' + aF.toFixed(3) + ')';
        octx.beginPath();
        octx.arc(s.x * W, H - s.p * H * 0.55, s.r, 0, TAU);
        octx.fill();
      }

      if (interativo) {
        /* aneis do splash + flash central (respingo de metal) */
        for (var oi2 = ondas.length - 1; oi2 >= 0; oi2--) {
          var od2 = ondas[oi2];
          var aA = od2.fade * 0.45;
          if (aA > 0.005) {
            octx.strokeStyle = 'rgba(255,140,72,' + aA.toFixed(3) + ')';
            octx.lineWidth = 2.2;
            octx.beginPath(); octx.arc(od2.x, od2.y, od2.R, 0, TAU); octx.stroke();
            octx.strokeStyle = 'rgba(255,224,190,' + (aA * 0.55).toFixed(3) + ')';
            octx.lineWidth = 1.2;
            octx.beginPath(); octx.arc(od2.x, od2.y, od2.R * 0.82, 0, TAU); octx.stroke();
            var rFl = 70 + od2.R * 0.45;
            var gf = octx.createRadialGradient(od2.x, od2.y, 0, od2.x, od2.y, rFl);
            gf.addColorStop(0, 'rgba(255,190,130,' + (od2.fade * od2.fade * 0.34).toFixed(3) + ')');
            gf.addColorStop(0.55, 'rgba(230,64,22,' + (od2.fade * od2.fade * 0.13).toFixed(3) + ')');
            gf.addColorStop(1, 'rgba(0,0,0,0)');
            octx.fillStyle = gf;
            octx.fillRect(od2.x - rFl, od2.y - rFl, rFl * 2, rFl * 2);
          }
        }
        /* coroa de fagulhas do splash */
        for (var bi = borrifos.length - 1; bi >= 0; bi--) {
          var b = borrifos[bi], pb = (now - b.t) / 900;
          if (pb >= 1) { borrifos.splice(bi, 1); continue; }
          var bx = b.x + b.vx * pb, by = b.y + b.vy * pb + 260 * pb * pb;
          var ab = (1 - pb) * (1 - pb) * 0.8;
          octx.fillStyle = 'rgba(255,182,110,' + ab.toFixed(3) + ')';
          octx.beginPath(); octx.arc(bx, by, b.r * (1 - pb * 0.5) * 1.3, 0, TAU); octx.fill();
        }
        /* brilho que segue o cursor (a "mao na forja"): +40% de luz local */
        if (ventoGlow > 0.02 && mxS > -9e3) {
          var bandTopAtual = H - spanAtual;
          var fadeV = 1 - (bandTopAtual - myS) / 260;
          if (fadeV > 1) fadeV = 1;
          if (fadeV > 0.02) {
            var gm = octx.createRadialGradient(mxS, myS, 0, mxS, myS, 210);
            gm.addColorStop(0, 'rgba(255,150,84,' + (0.20 * ventoGlow * fadeV).toFixed(3) + ')');
            gm.addColorStop(0.55, 'rgba(220,50,18,' + (0.08 * ventoGlow * fadeV).toFixed(3) + ')');
            gm.addColorStop(1, 'rgba(0,0,0,0)');
            octx.fillStyle = gm;
            octx.fillRect(mxS - 210, myS - 210, 420, 420);
          }
        }
      }

      octx.globalCompositeOperation = 'source-over';

      /* blit: offscreen ~0.6x ampliado (o upscale suaviza o brilho) */
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, W, H);
    }

    function passo(now) {
      raf = 0;
      if (!rodando) return;
      var dt = lastT ? now - lastT : 16.7;
      if (dt > 100) dt = 16.7;
      lastT = now;
      emaDt += (dt - emaDt) * 0.08;
      /* governor: filamentos → escala do offscreen → passo. COM RECUPERACAO:
         cai com EMA>26ms; 3s de frames bons (EMA<19ms) desfazem 1 degrau.
         Os primeiros 4s pos-load nao contam (EMA poluida pela carga). */
      if (emaDt > 26 && now - t0 > 4000 && now - lastDrop > 1500 && nivel < 3) {
        nivel++; lastDrop = now; emaDt = 16.7; bomDesde = 0;
        if (nivel === 1) fator = 0.66;
        else if (nivel === 2) { marS = Math.max(0.42, marS0 - 0.12); medir(); }
        else { fator = 0.5; passoX = PASSO0 + 3; }
      } else if (nivel > 0) {
        if (emaDt < 19) {
          if (!bomDesde) bomDesde = now;
          else if (now - bomDesde > 3000) {
            nivel--; lastDrop = now; emaDt = 16.7; bomDesde = 0;
            if (nivel === 2) { fator = 0.66; passoX = PASSO0; }
            else if (nivel === 1) { marS = marS0; medir(); }
            else fator = 1;
          }
        } else if (emaDt > 21) bomDesde = 0;
      }
      /* decaimento do rastro do vento (~1.5s) e do brilho do cursor */
      if (temVento || ventoGlow > 0.01) {
        var dk = Math.exp(-dt / VENTO_DECAI), maxE = 0;
        for (var c = 0; c < TCELLS; c++) {
          var e = tE[c];
          if (e > 0.001) { e *= dk; tE[c] = e; if (e > maxE) maxE = e; }
          else if (e) tE[c] = 0;
        }
        temVento = maxE > 0.02;
        ventoGlow *= dk;
      }
      /* cursor suavizado (lerp) */
      if (temMouse) {
        if (mxS < -9e3) { mxS = mx; myS = my; }
        mxS += (mx - mxS) * 0.22; myS += (my - myS) * 0.22;
      }
      /* aneis do splash avancam e esmaecem */
      for (var i = ondas.length - 1; i >= 0; i--) {
        var od = ondas[i], p = (now - od.t) / SPLASH_MS;
        if (p >= 1) { ondas.splice(i, 1); continue; }
        var ease = 1 - (1 - p) * (1 - p);
        od.R = 36 + (SPLASH_R - 36) * ease;
        od.fade = (1 - p) * (1 - p);
        od.win = od.R + 150;
      }
      quadro(now, false);
      raf = requestAnimationFrame(passo);
    }
    /* o mar so aparece atras das secoes translucidas (hero, #diferenciais,
       #contato); no miolo claro da pagina e no rodape ele fica 100% coberto
       por secoes opacas — o motor dorme para nao queimar frame invisivel */
    var marVisivel = true;

    function liga() {
      var quer = !document.hidden && marVisivel;
      if (quer === rodando) return;
      rodando = quer;
      lastT = 0;
      if (rodando && !raf) raf = requestAnimationFrame(passo);
    }

    medir();

    /* Rodada 5: no celular (ponteiro grosso) o mar fica num quadro só — a forja aparece, mas o processador e a
       bateria ficam para a página (TBT/Speed Index do Lighthouse). No computador segue animado. */
    if (reduceMotion || COARSE) { /* forja congelada num instante bonito — sem animacao */
      quadro(t0 + 4000, true);
      window.addEventListener('resize', function () { medir(); quadro(t0 + 4000, true); });
      return;
    }
    /* No computador, o quadro parado aparece já; a animação começa quando a pessoa interage (ou 7 s depois). */
    if (!document.documentElement.classList.contains('interagiu')) {
      quadro(t0 + 4000, true);
      aoInteragir(metalFundido);
      return;
    }

    (function vigiarCobertura() {
      var alvos = document.querySelectorAll('#hero, #diferenciais, #contato');
      if (!alvos.length || !('IntersectionObserver' in window)) return;
      var estado = new WeakMap();
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) estado.set(entries[i].target, entries[i].isIntersecting);
        var algum = false;
        for (var j = 0; j < alvos.length; j++) if (estado.get(alvos[j])) { algum = true; break; }
        marVisivel = algum;
        liga();
      }, { rootMargin: '80px 0px' });
      for (var k = 0; k < alvos.length; k++) io.observe(alvos[k]);
    })();

    window.addEventListener('resize', function () { medir(); });
    window.addEventListener('scroll', function () { rolagem = window.scrollY || 0; }, { passive: true });

    if (!COARSE) { /* pointer:coarse fica autonomo: vagas + mare seguem sozinhas */
      window.addEventListener('mousemove', function (ev) {
        mx = ev.clientX; my = ev.clientY; temMouse = true;
        if (lmx > -9e3) {
          var dxm = mx - lmx, dym = my - lmy;
          var spd = Math.sqrt(dxm * dxm + dym * dym);
          if (spd > 0) {
            var dep = spd * 0.022; if (dep > 0.5) dep = 0.5;
            var c0 = (mx / W * TCELLS) | 0;
            for (var o = -2; o <= 2; o++) {
              var cc = c0 + o;
              if (cc < 0 || cc >= TCELLS) continue;
              var wgt = o === 0 ? 1 : (o === -1 || o === 1) ? 0.62 : 0.25;
              var nv = tE[cc] + dep * wgt;
              tY[cc] = tE[cc] > 0.01 ? tY[cc] + (my - tY[cc]) * 0.45 : my;
              tE[cc] = nv > 1 ? 1 : nv;
            }
            temVento = true;
            ventoGlow += spd * 0.006; if (ventoGlow > 1) ventoGlow = 1;
          }
        }
        lmx = mx; lmy = my;
      });
      document.documentElement.addEventListener('mouseleave', function () {
        temMouse = false; mx = my = lmx = lmy = -1e4;
      });
      window.addEventListener('pointerdown', function (ev) {
        ondas.push({ x: ev.clientX, y: ev.clientY, t: performance.now(), R: 36, fade: 1, win: 190 });
        if (ondas.length > 3) ondas.shift();
        for (var i = 0; i < 14; i++) {
          var ang = -Math.PI * (0.15 + Math.random() * 0.7);
          var vel = 90 + Math.random() * 220;
          borrifos.push({
            x: ev.clientX, y: ev.clientY,
            vx: Math.cos(ang) * vel * (Math.random() < 0.5 ? 1 : -1),
            vy: Math.sin(ang) * vel,
            r: 0.8 + Math.random() * 1.4,
            t: performance.now()
          });
        }
        if (borrifos.length > 60) borrifos.splice(0, borrifos.length - 60);
      });
    }

    document.addEventListener('visibilitychange', liga);
    liga();
  });

  /* 7. (carrossel de depoimentos removido na rodada 2: o site não publica depoimento; código morto saiu na rodada 5) */

  /* ================================================================
     8. MODAIS — promoção (ao carregar) e agendamento/orçamento
     ================================================================ */
  const promoBackdrop = $('#promoBackdrop');
  const formBackdrop = $('#formBackdrop');
  let lastFocus = null;

  // Rodada 7: com um modal aberto o resto da página fica inerte (o leitor de tela e o Tab não saem do diálogo).
  function fundoInerte() {
    const aberto = promoBackdrop.classList.contains('open') || formBackdrop.classList.contains('open');
    $$('#navbar, main, footer, aside[aria-label="Atalhos de contato"]').forEach(e => { if (aberto) e.setAttribute('inert', ''); else e.removeAttribute('inert'); });
  }
  const openEl = (el) => {
    if (!el.classList.contains('open')) lastFocus = document.activeElement;
    el.classList.add('open');
    fundoInerte();
    document.body.style.overflow = 'hidden';
    const first = el === formBackdrop ? $('#fName') : $('.modal-close', el);
    if (first) first.focus();
  };
  const closeEl = (el) => {
    if (!el.classList.contains('open')) return;
    el.classList.remove('open');
    fundoInerte();
    if (!promoBackdrop.classList.contains('open') && !formBackdrop.classList.contains('open')) {
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
      lastFocus = null;
    }
  };

  // trap de Tab dentro do modal aberto
  [promoBackdrop, formBackdrop].forEach(bd => bd.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !bd.classList.contains('open')) return;
    const focusables = $$('button, [href], input, select, textarea', bd)
      .filter(f => !f.disabled && f.offsetWidth > 0);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }));

  // Rodada 5: o botão pode já escolher o serviço no formulário (data-servico="cambio" = option[data-codigo=cambio]).
  function escolherServico(codigo) {
    const sel = $('#fService');
    if (!sel || !codigo) return false;
    const op = $$('option', sel).find(o => o.dataset.codigo === codigo);
    if (!op) return false;
    sel.value = op.value; sel.classList.remove('invalid'); sel.removeAttribute('aria-invalid');
    return true;
  }
  // abre modal de orçamento via qualquer [data-open-modal]
  $$('[data-open-modal]').forEach(b => b.addEventListener('click', () => {
    if (b.hasAttribute('data-close-promo')) closeEl(promoBackdrop);
    if (b.dataset.servico && !$('#fService').value) escolherServico(b.dataset.servico);
    openEl(formBackdrop);
  }));
  // Endereço vindo de anúncio ou do WhatsApp: /?servico=cambio rola até o card e deixa o serviço escolhido;
  // /?abrir=form abre o formulário direto (ex.: /?servico=freios&abrir=form).
  function entradaPorEndereco() {
    const atalho = ATALHO_RE.exec(location.hash);
    let servico = (PARAMS.get('servico') || '').toLowerCase();
    if (atalho && atalho[1]) servico = atalho[1];
    if (servico) { try { servico = decodeURIComponent(servico); } catch (_) {} servico = slug(servico); servico = ALIAS_SERVICO[servico] || servico; }
    if (servico && /^[a-z0-9-]{1,30}$/.test(servico)) {
      // serviço que não existe no formulário (link antigo ou digitado errado): cai no diagnóstico, nunca num formulário sem nada
      const achou = escolherServico(servico);
      if (!achou && atalho) escolherServico('diagnostico');
      const card = document.getElementById('svc-' + servico);
      if (card && !location.hash && !atalho) {
        semAtalhoDeLayout();
        card.classList.add('svc-destaque');
        setTimeout(() => card.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }), 350);
      }
    } else if (atalho) escolherServico('diagnostico');
    // o CRM fica sabendo por qual atalho a pessoa chegou (ex.: /s/freios mandado pelo Atendimento ou pelo Comunicar)
    if (atalho) sessao.set('indycar_entrada', servico && /^[a-z0-9-]{1,30}$/.test(servico) ? '/s/' + servico : '/agendar');
    if (slotPedido) setTimeout(() => montarHorarios(), 400);
    if (atalho || PARAMS.get('abrir') === 'form') setTimeout(() => openEl(formBackdrop), atalho ? 300 : 600);
    if (servico || atalho || PARAMS.has('abrir')) {
      // o endereço fica limpo (sem perder a campanha, que já está na sessão)
      try { history.replaceState(null, '', location.pathname + (atalho ? '' : location.hash || '')); } catch (_) {}
    }
  }
  entradaPorEndereco();
  window.addEventListener('hashchange', () => { if (ATALHO_RE.test(location.hash)) entradaPorEndereco(); });
  // Rodada 7: quem chega por #contato, #faq... cai no lugar certo mesmo quando imagens, fontes e horários mudam a altura
  // da página depois da primeira pintura (antes o #contato podia parar 20 px acima do título no celular).
  (function realinharAncora() {
    const h = location.hash;
    if (h.length < 2 || ATALHO_RE.test(h)) return;
    let alvo = null;
    try { alvo = document.getElementById(decodeURIComponent(h.slice(1))); } catch (_) {}
    if (!alvo) return;
    let mexeu = false;
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => window.addEventListener(ev, () => { mexeu = true; }, { once: true, passive: true }));
    const ajustar = () => {
      if (mexeu) return;
      if (Math.abs(alvo.getBoundingClientRect().top - 80) > 8) alvo.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    window.addEventListener('load', () => { ajustar(); setTimeout(ajustar, 900); }, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
  })();

  // botões de fechar
  $$('[data-close-form]').forEach(b => b.addEventListener('click', () => closeEl(formBackdrop)));
  $$('[data-close-promo]').forEach(b => b.addEventListener('click', () => closeEl(promoBackdrop)));

  // clique no fundo fecha
  [promoBackdrop, formBackdrop].forEach(bd => bd.addEventListener('click', e => {
    if (e.target === bd) closeEl(bd);
  }));
  // ESC fecha
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeEl(promoBackdrop); closeEl(formBackdrop); }
  });

  // promo aparece após 8s (uma vez por sessão)
  // quem já clicou no WhatsApp não precisa do convite
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('a[href*="wa.me"]')) sessao.set('indycar_promo', '1');
  });
  if (!sessao.get('indycar_promo')) {
    setTimeout(() => {
      if (sessao.get('indycar_promo')) return;
      const algoAberto = formBackdrop.classList.contains('open') || ($('#revPop') && !$('#revPop').hidden);
      if (!algoAberto) openEl(promoBackdrop);
      sessao.set('indycar_promo', '1');
    }, 8000);
  }

  /* ================================================================
     9. FORMULÁRIO → monta mensagem e envia para o WhatsApp
     ================================================================ */
  const form = $('#leadForm');
  const WPHONE = '5512996830272';
  // Rodada 5: o pedido vai para o banco da oficina pela Edge Function site-lead (lead no CRM + tarefa para a equipe).
  // Se a rede falhar, o caminho antigo continua valendo: abre o WhatsApp com a mesma mensagem — nada se perde.
  const SITE_LEAD_URL = 'https://nppfqhavqahapmugnyng.supabase.co/functions/v1/site-lead';
  const formOk = $('#formOk');
  const formHead = $('.form-modal-head');

  // Anti-spam: campo-isca invisível + tempo mínimo entre começar a preencher e enviar (o servidor confere de novo).
  const TEMPO_MINIMO_MS = 2500;
  let comecouEm = 0, enviando = false;
  form.addEventListener('focusin', () => { if (!comecouEm) comecouEm = Date.now(); });
  form.addEventListener('input', () => { if (!comecouEm) comecouEm = Date.now(); });

  // Máscara leve do telefone: só dígitos, formatados como (12) 99683-0272 enquanto digita.
  $('#fPhone').addEventListener('input', (e) => {
    const el = e.target;
    let d = el.value.replace(/\D/g, '').replace(/^55(?=\d{10,11})/, '').slice(0, 11);
    let v = d;
    if (d.length > 2) v = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) v = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length > 10 ? 7 : 6) + '-' + d.slice(d.length > 10 ? 7 : 6);
    if (el.value !== v && /^[\d\s()\-+]*$/.test(el.value)) el.value = v;
  });

  function mostrarAviso(texto) {
    const aviso = $('#fEnvioMsg');
    if (aviso) { aviso.textContent = texto; aviso.hidden = !texto; }
  }
  function estadoEnviando(on) {
    enviando = on;
    const b = $('#fEnviar');
    if (!b) return;
    b.disabled = on; b.setAttribute('aria-busy', String(on));
    b.classList.toggle('enviando', on);
    if (on) { b.dataset.rotulo = b.dataset.rotulo || b.textContent.trim(); b.lastChild.textContent = ' Enviando…'; }
    else if (b.dataset.rotulo) b.lastChild.textContent = ' ' + b.dataset.rotulo;
  }
  function mostrarSucesso(resposta, waHref) {
    if (!formOk) return;
    form.hidden = true;
    if (formHead) formHead.hidden = true;
    $('#formOkTitulo').textContent = resposta.repetido ? 'Já estamos com o seu pedido!' : 'Pedido enviado!';
    $('#formOkTexto').textContent = (resposta.mensagem || 'A equipe confirma o horário com você pelo WhatsApp, de segunda a sábado, das 8h às 17h30.') + (resposta.horarioPedido ? ' Horário pedido: ' + resposta.horarioPedido + '.' : '');
    const proto = $('#formOkProto');
    if (proto) { proto.hidden = !resposta.protocolo; if (resposta.protocolo) $('b', proto).textContent = resposta.protocolo; }
    const copiar = $('#formOkCopiar');
    if (copiar) { copiar.hidden = !resposta.protocolo; copiar.textContent = 'Copiar protocolo'; }
    const wa = $('#formOkWa');
    if (wa) { wa.href = waHref; wa.textContent = resposta.direto ? 'Abrir no WhatsApp' : 'Quer adiantar? Abrir no WhatsApp'; }
    formOk.hidden = false;
    formOk.focus?.();
    $('.form-ok-fechar', formOk)?.focus();
  }
  // Copiar o protocolo (para colar no WhatsApp se a pessoa quiser adiantar a conversa).
  (function () {
    const b = $('#formOkCopiar');
    if (!b) return;
    b.addEventListener('click', async () => {
      const codigo = ($('b', $('#formOkProto')) || {}).textContent || '';
      try { await navigator.clipboard.writeText('Protocolo ' + codigo); b.textContent = 'Copiado!'; }
      catch (_) { b.textContent = 'Protocolo: ' + codigo; }
    });
  })();
  function voltarAoFormulario() {
    if (!formOk || formOk.hidden) return;
    formOk.hidden = true;
    form.hidden = false;
    if (formHead) formHead.hidden = false;
  }
  formBackdrop.addEventListener('transitionend', () => { if (!formBackdrop.classList.contains('open')) voltarAoFormulario(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    const name = $('#fName'), phone = $('#fPhone'), service = $('#fService');

    // Robô preencheu o campo-isca: finge que deu certo e não abre nada.
    if ($('#fEmpresa') && $('#fEmpresa').value.trim()) {
      closeEl(formBackdrop); form.reset(); comecouEm = 0;
      showToast('✅', 'Pedido enviado!', 'Continue a conversa pelo WhatsApp.');
      return;
    }

    // validação simples com feedback visual
    let ok = true;
    const digitos = phone.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    const foneOk = (digitos.length === 10 || digitos.length === 11) && !/^(\d)\1+$/.test(digitos) && /^[1-9][1-9]/.test(digitos) && digitos[2] !== '0' && (digitos.length === 10 || digitos[2] === '9'); // mesma regra da Edge Function
    [name, phone, service].forEach(f => {
      const bad = !f.value.trim() || (f === phone && !foneOk) || (f === name && !/[A-Za-zÀ-ÿ]{2}/.test(f.value));
      f.classList.toggle('invalid', bad);
      f.setAttribute('aria-invalid', String(bad));
      if (bad) ok = false;
    });
    $('#fPhoneErr').hidden = foneOk || !phone.value.trim();
    $('#fNameErr').hidden = !name.classList.contains('invalid');
    $('#fServiceErr').hidden = !service.classList.contains('invalid');
    if (!ok) {
      const faltam = [[name, 'nome'], [phone, 'telefone com DDD'], [service, 'serviço']].filter(([f]) => f.classList.contains('invalid')).map(([, n]) => n);
      mostrarAviso('Confira: ' + faltam.join(', ') + '.');
      [name, phone, service].find(f => f.classList.contains('invalid')).focus(); return;
    }

    // Rápido demais para uma pessoa (preenchimento automático de robô): pede para conferir.
    if (!comecouEm || Date.now() - comecouEm < TEMPO_MINIMO_MS) {
      comecouEm = comecouEm || Date.now();
      mostrarAviso('Confere os dados? Se estiver tudo certo, toque em enviar de novo.');
      return;
    }
    mostrarAviso('');

    const car = $('#fCar').value.trim();
    const quando = ($('#fQuando') || {}).value || '';
    const mensagem = (($('#fMsg') || {}).value || '').trim();
    const placa = placaDoForm();
    const horario = horarioEscolhido ? { data: horarioEscolhido.data, hora: horarioEscolhido.hora } : null;
    // Código de origem por serviço: o Atendimento lê "(site/formulario-freios)" e marca a UTM do lead.
    const codigoServico = (service.selectedOptions[0] && service.selectedOptions[0].dataset.codigo) || 'servico';
    const codigo = codigoComCampanha('formulario-' + codigoServico);
    const textoWa = PREFIXO_WA + ', quero orçar: ' + service.value + '.\n' +
      'Nome: ' + name.value.trim() + ' · Telefone: ' + phone.value.trim() +
      (car ? ' · Carro: ' + car : '') + (placa ? ' · Placa: ' + placa : '') + (horario ? ' · Horário: ' + horarioEscolhido.rotulo : quando ? ' · Quando: ' + quando : '') +
      (mensagem ? '\nO carro está: ' + mensagem : '');
    const waHref = linkWhatsApp(textoWa, codigo);

    estadoEnviando(true);
    let resposta = null;
    const pedido = {
      nome: name.value.trim(), telefone: digitos, servico: service.value, codigo: codigoServico, carro: car || null,
      preferencia: quando || null, placa, horario, mensagem: mensagem || null, pagina: (sessao.get('indycar_entrada') || (location.pathname + location.search)).slice(0, 200),
      utm: UTM, decorrido: Date.now() - comecouEm, empresa: ($('#fEmpresa') || {}).value || '',
    };
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch(SITE_LEAD_URL, {
        method: 'POST', mode: 'cors', signal: ctrl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(pedido),
      });
      clearTimeout(t);
      const corpo = await r.json().catch(() => ({}));
      if (r.status === 400 && corpo.erro) { estadoEnviando(false); mostrarAviso(corpo.erro); return; } // campo errado: a pessoa corrige
      if (r.ok && corpo.ok) resposta = corpo;
    } catch (_) { /* sem rede ou servidor fora: segue pelo WhatsApp */ }
    estadoEnviando(false);

    launchConfetti();                 // 🎉 bandeira quadriculada
    if (!resposta) {
      // O banco não respondeu: abre o WhatsApp com a mesma mensagem (comportamento das rodadas anteriores).
      window.open(waHref, '_blank', 'noopener');
      resposta = { ok: true, direto: true, mensagem: 'Seu pedido abriu no WhatsApp da oficina. Se a janela não apareceu, toque no botão abaixo.' };
      // Rodada 7: o pedido também fica numa fila no aparelho e é reenviado ao banco quando a rede volta (nada se perde)
      window.dispatchEvent(new CustomEvent('indycar:pedido-offline', { detail: { pedido } }));
    }
    sessao.set('indycar_promo', '1');
    resposta.horarioPedido = horario ? horarioEscolhido.rotulo : '';
    horariosPromessa = null; horariosEm = 0; // a Agenda mudou: a próxima consulta traz a lista nova
    window.dispatchEvent(new CustomEvent('indycar:pedido', { detail: { resposta, pedido, horarioRotulo: horario ? horarioEscolhido.rotulo : '' } }));
    mostrarSucesso(resposta, waHref);
    form.reset();
    limparHorario();
    comecouEm = 0;
  });

  // limpa o estado inválido ao digitar
  $$('#leadForm input, #leadForm select, #leadForm textarea').forEach(f =>
    f.addEventListener('input', () => {
      f.classList.remove('invalid'); f.removeAttribute('aria-invalid');
      if (f.id === 'fPhone') $('#fPhoneErr').hidden = true;
      if (f.id === 'fName') $('#fNameErr').hidden = true;
      if (f.id === 'fService') $('#fServiceErr').hidden = true;
    }));

  /* ================================================================
     9b. RODADA 6 — horários livres da Agenda, placa e roteador de links
     ================================================================ */
  // Horários livres de verdade: GET site-lead/horarios (data e hora livres na Agenda; nunca dado de cliente).
  // Se a consulta falhar, as duas caixas ficam escondidas e o formulário segue como sempre.
  let horarioEscolhido = null; // { data, hora, rotulo }
  let horariosPromessa = null, horariosEm = 0, horariosPintados = '';
  function carregarHorarios() {
    if (horariosPromessa && Date.now() - horariosEm < Number(window.__horariosTtl ?? 60000)) return horariosPromessa;
    horariosEm = Date.now();
    horariosPromessa = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 7000);
        const r = await fetch(SITE_LEAD_URL + '/horarios', { mode: 'cors', signal: ctrl.signal });
        clearTimeout(t);
        const corpo = await r.json();
        if (!r.ok || !corpo || !Array.isArray(corpo.dias)) return null;
        return corpo; // dias vazio = agenda cheia nos próximos dias (mostrada com aviso, sem esconder)
      } catch (_) { return null; }
    })();
    return horariosPromessa;
  }
  function pintarHorarios(alvo, corpo, modo) {
    if (!alvo) return;
    alvo.textContent = '';
    let temFeriado = false;
    corpo.dias.slice(0, modo === 'form' && window.innerWidth <= 480 ? 2 : 3).forEach(dia => {
      const linha = document.createElement('div'); linha.className = 'horarios-dia';
      const rot = document.createElement('span'); rot.className = 'horarios-dia-rot'; rot.textContent = dia.rotulo;
      const feriadoDia = FERIADOS[dia.data];
      if (feriadoDia) { const f = document.createElement('small'); f.className = 'feriado'; f.textContent = 'feriado'; rot.appendChild(f); temFeriado = true; }
      const horas = document.createElement('div'); horas.className = 'horarios-horas';
      dia.horas.slice(0, 4).forEach(hora => {
        const b = document.createElement('button');
        const longo = dia.rotulo + ' às ' + hora;
        b.type = 'button'; b.className = 'horario-chip'; b.textContent = hora;
        b.dataset.data = dia.data; b.dataset.hora = hora; b.dataset.rotulo = longo;
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', 'Horário de ' + longo + (feriadoDia ? ' (feriado: a equipe confirma se a oficina abre)' : ''));
        horas.appendChild(b);
      });
      linha.append(rot, horas); alvo.appendChild(linha);
    });
    if (temFeriado) {
      const n = document.createElement('p'); n.className = 'horarios-nota';
      n.textContent = 'Em feriado a equipe confirma pelo WhatsApp se a oficina abre.';
      alvo.appendChild(n);
    }
  }
  function resumirHorarios(corpo) {
    const r = $('#horariosResumo'); if (!r) return;
    const t = corpo.dias.slice(0, 3).map(d => d.horas.length + (d.horas.length === 1 ? ' horário livre ' : ' horários livres ') + d.rotulo).join('; ');
    if (r.textContent !== t) r.textContent = t;
  }
  function marcarHorario() {
    $$('.horario-chip').forEach(b => b.setAttribute('aria-pressed', String(!!horarioEscolhido && b.dataset.data === horarioEscolhido.data && b.dataset.hora === horarioEscolhido.hora)));
    const dica = $('#fHorarioEscolhido');
    if (dica) dica.textContent = horarioEscolhido ? 'Você escolheu ' + horarioEscolhido.rotulo + '. Toque de novo no horário para tirar.' : avisoSlot;
    const q = $('#fQuando');
    if (q) q.disabled = !!horarioEscolhido; // o horário escolhido já diz quando; o campo volta se a pessoa desmarcar
  }
  function limparHorario() { horarioEscolhido = null; marcarHorario(); }
  async function montarHorarios() {
    const corpo = await carregarHorarios();
    const caixa = $('#horarios');
    if (!corpo) { if (caixa) caixa.hidden = true; $$('[data-so-horarios]').forEach(e => { e.hidden = true; }); return; } // Agenda não respondeu: a caixa some, o formulário segue igual
    if (caixa && !corpo.dias.length) {
      const l = $('#horariosLista'); l.textContent = '';
      const p = document.createElement('p'); p.className = 'horarios-carregando';
      p.textContent = 'A agenda está cheia nos próximos dias. Chame a gente no WhatsApp que a equipe encaixa o seu carro.';
      l.appendChild(p); caixa.hidden = false; caixa.removeAttribute('aria-busy');
    } else if (caixa && corpo.atualizado_em !== horariosPintados) {
      pintarHorarios($('#horariosLista'), corpo, 'secao');
      const hh = new Date(corpo.atualizado_em);
      if (!isNaN(hh)) $('#horariosAtualizado').textContent = 'Atualizado às ' + hh.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) + '.';
      caixa.hidden = false; caixa.removeAttribute('aria-busy');
    }
    const f = $('#fHorarios');
    if (f && corpo.dias.length && corpo.atualizado_em !== horariosPintados) { pintarHorarios($('#fHorariosLista'), corpo, 'form'); f.hidden = false; }
    horariosPintados = corpo.atualizado_em;
    resumirHorarios(corpo);
    if (slotPedido) {
      const { data, hora } = slotPedido; slotPedido = null;
      const dia = corpo.dias.find(d => d.data === data && d.horas.includes(hora));
      const dica = $('#fHorarioEscolhido');
      if (dia) { horarioEscolhido = { data, hora, rotulo: dia.rotulo + ' às ' + hora }; marcarHorario(); }
      else avisoSlot = 'O horário que a equipe sugeriu já não está livre. Escolha outro abaixo ou deixe em branco.';
    }
    if (horarioEscolhido && !$$('.horario-chip').some(b => b.dataset.data === horarioEscolhido.data && b.dataset.hora === horarioEscolhido.hora)) {
      // a Agenda mudou e o horário escolhido não está mais livre: solta e avisa em voz alta
      const rot = horarioEscolhido.rotulo; horarioEscolhido = null; marcarHorario();
      const d = $('#fHorarioEscolhido'); if (d) d.textContent = 'O horário ' + rot + ' acabou de ser ocupado. Escolha outro.';
      return;
    }
    marcarHorario();
    preencherPromo(corpo);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.horario-chip');
    if (!b) return;
    const mesmo = horarioEscolhido && horarioEscolhido.data === b.dataset.data && horarioEscolhido.hora === b.dataset.hora;
    horarioEscolhido = mesmo ? null : { data: b.dataset.data, hora: b.dataset.hora, rotulo: b.dataset.rotulo };
    marcarHorario();
    if (!mesmo && !formBackdrop.classList.contains('open')) {
      if (!$('#fService').value) escolherServico('diagnostico');
      openEl(formBackdrop);
    }
  });
  // Convite de 8 s: mostra o próximo horário livre de verdade (e um toque já leva ao formulário com ele marcado).
  function preencherPromo(corpo) {
    const p = $('#promoProximo'), b = $('#promoSlot');
    const dia = corpo && corpo.dias && corpo.dias[0];
    if (!p || !b || !dia || !dia.horas || !dia.horas.length) return;
    b.dataset.data = dia.data; b.dataset.hora = dia.horas[0]; b.dataset.rotulo = dia.rotulo + ' às ' + dia.horas[0];
    b.textContent = b.dataset.rotulo; p.hidden = false;
  }
  (function () {
    const b = $('#promoSlot'); if (!b) return;
    b.addEventListener('click', () => {
      horarioEscolhido = { data: b.dataset.data, hora: b.dataset.hora, rotulo: b.dataset.rotulo };
      if (!$('#fService').value) escolherServico('diagnostico');
      closeEl(promoBackdrop); openEl(formBackdrop); montarHorarios();
    });
    // aquece a consulta depois de a página assentar: o convite e o formulário já abrem com os horários
    setTimeout(() => { if (!document.hidden && !POUPAR) montarHorarios(); }, 5000);
  })();
  // "Quando prefere?" só oferece o que existe: domingo e depois das 17h30 não tem "Hoje"; sábado não tem "Amanhã" (domingo fechado).
  (function () {
    const q = $('#fQuando'); if (!q) return;
    const { dia, minutos } = agoraSP();
    const tirar = (txt) => { const o = $$('option', q).find(x => x.textContent.trim() === txt); if (o) o.remove(); };
    if (dia === 'Sun' || minutos >= 1050) tirar('Hoje');
    if (dia === 'Sat') tirar('Amanhã');
  })();
  // A caixa já nasce com o tamanho final (esqueleto com altura reservada): quando os horários chegam nada pula na tela,
  // e quem entra por #contato ou #faq não perde o lugar. Sem JavaScript ela fica escondida.
  (function () {
    const caixa = $('#horarios'), lista = $('#horariosLista');
    if (!caixa || !lista) return;
    lista.textContent = '';
    const esq = document.createElement('p'); esq.className = 'horarios-carregando'; esq.textContent = 'Consultando a Agenda…';
    lista.appendChild(esq); caixa.setAttribute('aria-busy', 'true'); caixa.hidden = false;
  })();
  // A seção de horários carrega quando chega perto da tela; o formulário carrega ao abrir.
  (function () {
    const caixa = $('#diagnostico');
    if (caixa && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => { if (en.some(x => x.isIntersecting)) { io.disconnect(); montarHorarios(); } }, { rootMargin: '600px 0px' });
      io.observe(caixa);
    }
    new MutationObserver(() => { if (formBackdrop.classList.contains('open')) montarHorarios(); })
      .observe(formBackdrop, { attributes: true, attributeFilter: ['class'] });
  })();

  // Contador de caracteres do "o que o carro está fazendo" (limite 500): a pessoa vê antes de o texto ser cortado.
  (function () {
    const m = $('#fMsg'), c = $('#fMsgConta');
    if (!m || !c) return;
    const atualizar = () => { const n = m.value.length; c.textContent = n + '/500'; c.classList.toggle('perto', n >= 450); };
    m.addEventListener('input', atualizar); form.addEventListener('reset', () => setTimeout(atualizar, 0)); atualizar();
  })();

  // Placa: maiúscula e só letras/números; vale a antiga (ABC1234) e a Mercosul (ABC1D23).
  const PLACA_RE = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
  const placaLimpa = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  function placaDoForm() { const p = placaLimpa(($('#fPlaca') || {}).value); return PLACA_RE.test(p) ? p : null; }
  (function () {
    const campo = $('#fPlaca'), dica = $('#fPlacaDica');
    if (!campo) return;
    const dicaPadrao = dica.textContent;
    campo.addEventListener('input', () => { campo.value = placaLimpa(campo.value); dica.textContent = dicaPadrao; });
    campo.addEventListener('blur', () => { if (campo.value && !PLACA_RE.test(campo.value)) dica.textContent = 'Confira a placa (ex.: ABC1D23). Se preferir, deixe em branco.'; });
  })();

  // Roteador: cole o link ou o código que a oficina mandou e caia no lugar certo (Acompanhar, Minha IndyCar ou orçamento).
  const DESTINOS = { patio: 'https://indycar-patio.netlify.app', orcador: 'https://indycar-orcador.netlify.app' };
  function rotearCodigo(entrada) {
    const s = String(entrada || '').trim();
    if (!s) return null;
    const porCodigo = (c) => {
      c = c.toLowerCase();
      if (/^[0-9a-f]{36}$/.test(c)) return { url: DESTINOS.patio + '/acompanhar/?t=' + c, rotulo: 'o acompanhamento do seu carro' };
      if (/^[0-9a-f]{48}$/.test(c)) return { url: DESTINOS.patio + '/minha/?c=' + c, rotulo: 'a Minha IndyCar' };
      if (/^[0-9a-f]{32}$/.test(c)) return { url: DESTINOS.orcador + '/#/o/' + c, rotulo: 'o seu orçamento' };
      return null;
    };
    const comEsquema = /^(indycar-taubate|indycar-patio|indycar-orcador)\.netlify\.app(\/|$)/i.test(s) ? 'https://' + s : s;
    if (/^https?:\/\//i.test(comEsquema)) {
      let u; try { u = new URL(comEsquema); } catch (_) { return null; }
      if (u.origin === location.origin || u.origin === 'https://indycar-taubate.netlify.app') { const c = u.pathname.split('/').filter(Boolean); return c.length === 2 && 'amo'.includes(c[0]) && c[0].length === 1 ? porCodigo(c[1]) : (c.length === 1 ? porCodigo(c[0]) : null); }
      if (u.protocol !== 'https:') return null;
      if (u.origin === DESTINOS.patio) return porCodigo(u.searchParams.get('t') || u.searchParams.get('c') || '');
      if (u.origin === DESTINOS.orcador) {
        const m = /^#\/o\/([A-Za-z0-9_-]{8,128})$/.exec(u.hash);
        return m ? { url: DESTINOS.orcador + '/#/o/' + m[1], rotulo: 'o seu orçamento' } : null;
      }
      return null; // qualquer outro endereço: nunca abre (sem redirecionamento aberto)
    }
    return porCodigo(s.replace(/\s+/g, ''));
  }
  (function () {
    const f = $('#areaCola'); if (!f) return;
    const campo = $('#areaColaCampo'), msg = $('#areaColaMsg'), padrao = msg.textContent;
    campo.addEventListener('input', () => { msg.textContent = padrao; msg.classList.remove('erro'); campo.removeAttribute('aria-invalid'); });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = rotearCodigo(campo.value);
      if (!r) {
        campo.setAttribute('aria-invalid', 'true'); msg.classList.add('erro');
        msg.textContent = 'Não reconheci esse link ou código. Confira se copiou inteiro, ou peça outro pelo WhatsApp.';
        campo.focus(); return;
      }
      msg.textContent = 'Abrindo ' + r.rotulo + '…';
      window.open(r.url, '_blank', 'noopener');
      campo.value = '';
    });
  })();

  /* ================================================================
     10. PROVA SOCIAL — notificações rotativas (canto inferior esq.)
     ================================================================ */
  const sp = $('#socialProof');
  const spEmoji = $('#spEmoji'), spName = $('#spName'), spAction = $('#spAction');
  const spClose = $('#spClose');

  const proofs = [
    ['🔎', 'Diagnóstico digital gratuito', 'Scanner + foto · cerca de 30 minutos'],
    ['🛠️', 'Garantia de 12 meses', 'Em peças e mão de obra'],
    ['🕗', 'Segunda a sábado', '8h às 17h30 · agende pelo WhatsApp'],
  ];
  let proofIdx = 0, proofDismissed = false, toastActive = false;

  // Rodada 7: feriados nacionais 2026–2027 (a mesma lista do Comunicar, dados.js › FERIADOS). A oficina pode ou não abrir
  // nesses dias: o site não promete nada, só avisa e manda confirmar pelo WhatsApp.
  const FERIADOS = {
    '2026-01-01': 'Confraternização Universal', '2026-02-16': 'Carnaval', '2026-02-17': 'Carnaval',
    '2026-04-03': 'Sexta-feira Santa', '2026-04-21': 'Tiradentes', '2026-05-01': 'Dia do Trabalho',
    '2026-06-04': 'Corpus Christi', '2026-09-07': 'Independência', '2026-10-12': 'Nossa Senhora Aparecida',
    '2026-11-02': 'Finados', '2026-11-15': 'Proclamação da República', '2026-11-20': 'Consciência Negra',
    '2026-12-25': 'Natal',
    '2027-01-01': 'Confraternização Universal', '2027-02-08': 'Carnaval', '2027-02-09': 'Carnaval',
    '2027-03-26': 'Sexta-feira Santa', '2027-04-21': 'Tiradentes', '2027-05-01': 'Dia do Trabalho',
    '2027-05-27': 'Corpus Christi', '2027-09-07': 'Independência', '2027-10-12': 'Nossa Senhora Aparecida',
    '2027-11-02': 'Finados', '2027-11-15': 'Proclamação da República', '2027-11-20': 'Consciência Negra',
    '2027-12-25': 'Natal',
  };
  // Horário comercial: Seg–Sáb 8h–17h30 · Dom fechado (sempre no fuso de Taubaté)
  function agoraSP() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const part = type => parts.find(p => p.type === type).value;
    return { dia: part('weekday'), minutos: Number(part('hour')) * 60 + Number(part('minute')), data: part('year') + '-' + part('month') + '-' + part('day') };
  }
  function isBusinessHours() {
    const { dia, minutos } = agoraSP();
    return dia !== 'Sun' && minutos >= 480 && minutos < 1050;
  }
  // Rodada 5: chip "Aberto agora / Fechado agora" no hero, recalculado a cada minuto.
  (function statusDaOficina() {
    const chip = $('#statusAberto');
    if (!chip) return;
    const rotulo = $('b', chip), detalhe = $('span', chip);
    function pintar() {
      const { dia, minutos, data } = agoraSP();
      const aberto = isBusinessHours();
      // Rodada 7: em feriado nacional o site não afirma "Aberto agora" (a equipe confirma pelo WhatsApp se abre)
      const feriadoHoje = FERIADOS[data];
      chip.classList.toggle('feriado', !!feriadoHoje && dia !== 'Sun');
      if (feriadoHoje && dia !== 'Sun') {
        chip.classList.remove('fechado');
        rotulo.textContent = 'Hoje é feriado (' + feriadoHoje + ')';
        detalhe.textContent = 'confirme no WhatsApp se abrimos';
        chip.hidden = false;
        return;
      }
      chip.classList.toggle('fechado', !aberto);
      rotulo.textContent = aberto ? 'Aberto agora' : 'Fechado agora';
      if (aberto) detalhe.textContent = minutos >= 990 ? 'fecha às 17h30' : 'até 17h30';
      else if (dia === 'Sat' && minutos >= 1050) detalhe.textContent = 'abre segunda, 8h';
      else if (dia === 'Sun') detalhe.textContent = 'abre segunda, 8h';
      else detalhe.textContent = minutos < 480 ? 'abre hoje, 8h' : 'abre amanhã, 8h';
      chip.hidden = false;
    }
    pintar();
    setInterval(pintar, 60000);
  })();

  function showNextProof() {
    if (proofDismissed || toastActive || document.hidden || reduceMotion) return;
    // FORA do horário comercial: não mostra "fulano agendou tal coisa"
    if (!isBusinessHours()) return;
    const [emoji, name, action] = proofs[proofIdx % proofs.length];
    spEmoji.textContent = emoji;
    spName.textContent = name;
    spAction.textContent = action;
    sp.classList.add('show');
    proofIdx++;
    setTimeout(() => sp.classList.remove('show'), 5000); // some após 5s
  }
  // primeiro após 12s, depois a cada 24s (mais lento, só dispara dentro do horário)
  setTimeout(function loop() {
    showNextProof();
    if (!proofDismissed) setTimeout(loop, 24000);
  }, 12000);

  // fechar é definitivo: a rotação não volta nesta visita
  spClose.addEventListener('click', () => { proofDismissed = true; sp.classList.remove('show'); });

  /* ================================================================
     11. TOAST genérico (reaproveita o componente de prova social)
     ================================================================ */
  function showToast(emoji, title, text) {
    toastActive = true;             // pausa a rotação sem anular o fechamento
    spEmoji.textContent = emoji;
    spName.textContent = title;
    spAction.textContent = text;
    sp.classList.add('show');
    setTimeout(() => { sp.classList.remove('show'); toastActive = false; }, 5000);
  }

  /* ================================================================
     12. Ano dinâmico no rodapé
     ================================================================ */
  $('#year').textContent = new Date().getFullYear();

  /* ================================================================
     13. BOTÕES MAGNÉTICOS — seguem o cursor de leve
     ================================================================ */
  if (hasFinePointer) {
    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.35;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.45;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ================================================================
     14. CLICKSPARK — port do React Bits (reactbits.dev)
         Faíscas radiais de esmeril/solda ao clicar em botões e links.
     ================================================================ */
  document.addEventListener('click', e => {
    if (reduceMotion) return;
    if (!e.target.closest('.btn, .service-link')) return;
    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.background = i % 2 ? '#fff' : '#e50914';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      document.body.appendChild(s);

      const ang = (360 / COUNT) * i + Math.random() * 18;
      const dist = 24 + Math.random() * 16;
      const anim = s.animate([
        { transform: `rotate(${ang}deg) translateX(4px) scaleX(1)`, opacity: 1 },
        { transform: `rotate(${ang}deg) translateX(${dist}px) scaleX(0)`, opacity: 0 }
      ], { duration: 380 + Math.random() * 80, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = () => s.remove();
    }
  });

  /* ================================================================
     15. CONFETE de bandeira quadriculada (chamado no envio do form)
     ================================================================ */
  function launchConfetti() {
    if (reduceMotion) return;

    // ClickSpark ampliado: faíscas de solda longas irradiando do centro
    const SPARKS = 22;
    const sparkColors = ['#ffffff', '#e50914', '#d4a853'];
    for (let i = 0; i < SPARKS; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.width = (22 + Math.random() * 14) + 'px';
      s.style.height = '3px';
      s.style.background = sparkColors[i % sparkColors.length];
      s.style.left = (innerWidth / 2) + 'px';
      s.style.top = (innerHeight / 2 - 40) + 'px';
      document.body.appendChild(s);

      const ang = (360 / SPARKS) * i + Math.random() * 14;
      const dist = 90 + Math.random() * 130;
      const anim = s.animate([
        { transform: `rotate(${ang}deg) translateX(8px) scaleX(1)`, opacity: 1 },
        { transform: `rotate(${ang}deg) translateX(${dist}px) scaleX(0)`, opacity: 0 }
      ], { duration: 520 + Math.random() * 160, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = () => s.remove();
    }

    const colors = ['#e50914', '#d4a853', '#ffffff', 'checker'];
    for (let i = 0; i < 104; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const c = colors[i % colors.length];
      piece.style.background = c === 'checker'
        ? 'conic-gradient(#fff 0 25%, #111 0 50%, #fff 0 75%, #111 0)'
        : c;
      piece.style.left = (innerWidth / 2 + (Math.random() - 0.5) * 240) + 'px';
      piece.style.top  = (innerHeight / 2 - 40) + 'px';
      document.body.appendChild(piece);

      const ang = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 340;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist + 260;        // gravidade: tende a cair
      const anim = piece.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }
      ], { duration: 1500 + Math.random() * 800, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = () => piece.remove();
    }
  }

  /* ================================================================
     16. PARALAXE MULTICAMADA no hero — três profundidades com lerp:
         conteúdo (perto), linhas diagonais (contra) e piso de pista
         (fundo, só no eixo X). O rAF roda apenas até assentar.
     ================================================================ */
  if (hasFinePointer && !reduceMotion) {
    const heroEl = $('#hero');
    const content = $('.hero-content');
    const lines = $('.diagonal-lines');
    const seal = $('.circular-seal');
    let hx = 0, hy = 0, hTx = 0, hTy = 0, hRaf = null;

    function heroDepth() {
      hx += (hTx - hx) * 0.07;
      hy += (hTy - hy) * 0.07;
      if (content) content.style.transform = `translate(${hx * 14}px, ${hy * 10}px)`;
      if (lines) lines.style.transform = `translate(${hx * -34}px, ${hy * -22}px)`;
      // 3º passe: o selo circular flutua em contra-fase (mais profundidade)
      if (seal) seal.style.transform = `translate(${hx * -20}px, ${hy * -14}px)`;
      if (Math.abs(hTx - hx) + Math.abs(hTy - hy) > 0.001) hRaf = requestAnimationFrame(heroDepth);
      else hRaf = null;
    }
    heroEl.addEventListener('pointermove', e => {
      // em perf-lite a paralaxe do hero descansa (repintar o H1 gigante
      // com text-shadow a cada frame custa caro em máquinas fracas)
      if (document.body.classList.contains('perf-lite')) return;
      hTx = e.clientX / innerWidth - 0.5;
      hTy = e.clientY / innerHeight - 0.5;
      if (!hRaf) hRaf = requestAnimationFrame(heroDepth);
    });
    heroEl.addEventListener('pointerleave', () => {
      hTx = hTy = 0;
      if (!hRaf) hRaf = requestAnimationFrame(heroDepth);
    });
  }

  /* ================================================================
     17. SPLITTEXT — port do React Bits (reactbits.dev) sem GSAP
         Divide o título do hero em palavras/letras e revela cada
         letra com stagger quando o título entra na tela.
     ================================================================ */
  (function splitHeroTitle() {
    const h1 = $('.hero-title');
    if (!h1 || reduceMotion || heroLeve) return;
    const originalText = h1.textContent.replace(/\s+/g, ' ').trim();
    let charIndex = 0;

    function splitNode(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const word = document.createElement('span');
            word.className = 'st-word';
            word.setAttribute('aria-hidden', 'true');
            [...part].forEach(ch => {
              const c = document.createElement('span');
              c.className = 'st-char';
              c.style.setProperty('--i', charIndex++);
              c.textContent = ch;
              word.appendChild(c);
            });
            frag.appendChild(word);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          splitNode(child);
        }
      });
    }

    splitNode(h1);
    h1.setAttribute('aria-label', originalText); // leitores de tela leem o texto inteiro
    h1.classList.add('st-split');
  })();

  /* ================================================================
     18. ELECTRICBORDER — port do React Bits (reactbits.dev)
         Borda "elétrica" desenhada em canvas ao redor do card de
         especialidade (câmbio automático). Ruído com oitavas desloca
         o traçado do retângulo arredondado a cada frame.
     ================================================================ */
  aoInteragir(function electricBorder() {
    const card = $('.service-card--star');
    // Rodada 5: no celular (ponteiro grosso) a borda elétrica não roda — é um canvas redesenhado a cada quadro.
    if (!card || reduceMotion || !hasFinePointer) return;

    // O wrapper vira o item do grid; o card mantém o estilo original dentro dele.
    const wrap = document.createElement('div');
    wrap.className = 'rb-electric';
    card.parentNode.insertBefore(wrap, card);

    const cc = document.createElement('div');
    cc.className = 'eb-canvas-container';
    const canvas = document.createElement('canvas');
    canvas.className = 'eb-canvas';
    cc.appendChild(canvas);

    const layers = document.createElement('div');
    layers.className = 'eb-layers';
    layers.innerHTML = '<div class="eb-glow-1"></div><div class="eb-glow-2"></div><div class="eb-background-glow"></div>';

    wrap.appendChild(cc);
    wrap.appendChild(layers);
    wrap.appendChild(card);

    const ctx2 = canvas.getContext('2d');
    const COLOR = '#e50914';
    const SPEED = 1, CHAOS = 0.1, RADIUS = 14;
    const OCTAVES = 6, LACUNARITY = 1.6, GAIN = 0.7, FREQUENCY = 10;
    const DISPLACEMENT = 60, OFFSET = 60;
    let raf = null, time = 0, lastFrame = 0, width = 0, height = 0;

    const rand = x => (Math.sin(x * 12.9898) * 43758.5453) % 1;
    function noise2D(x, y) {
      const i = Math.floor(x), j = Math.floor(y);
      const fx = x - i, fy = y - j;
      const a = rand(i + j * 57), b = rand(i + 1 + j * 57);
      const c = rand(i + (j + 1) * 57), d = rand(i + 1 + (j + 1) * 57);
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    }
    function octavedNoise(x, seed) {
      let y = 0, amp = CHAOS, freq = FREQUENCY;
      for (let i = 0; i < OCTAVES; i++) {
        if (i > 0) y += amp * noise2D(freq * x + seed * 100, time * freq * 0.3);
        freq *= LACUNARITY; amp *= GAIN;
      }
      return y;
    }
    function cornerPoint(cx, cy, r, start, arc, p) {
      const ang = start + p * arc;
      return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    }
    function rectPoint(t, left, top, w, h, r) {
      const sw = w - 2 * r, sh = h - 2 * r, arc = (Math.PI * r) / 2;
      const per = 2 * sw + 2 * sh + 4 * arc;
      let d = t * per, acc = 0;
      if (d <= acc + sw) return { x: left + r + (d - acc), y: top };
      acc += sw;
      if (d <= acc + arc) return cornerPoint(left + w - r, top + r, r, -Math.PI / 2, Math.PI / 2, (d - acc) / arc);
      acc += arc;
      if (d <= acc + sh) return { x: left + w, y: top + r + (d - acc) };
      acc += sh;
      if (d <= acc + arc) return cornerPoint(left + w - r, top + h - r, r, 0, Math.PI / 2, (d - acc) / arc);
      acc += arc;
      if (d <= acc + sw) return { x: left + w - r - (d - acc), y: top + h };
      acc += sw;
      if (d <= acc + arc) return cornerPoint(left + r, top + h - r, r, Math.PI / 2, Math.PI / 2, (d - acc) / arc);
      acc += arc;
      if (d <= acc + sh) return { x: left, y: top + h - r - (d - acc) };
      acc += sh;
      return cornerPoint(left + r, top + r, r, Math.PI, Math.PI / 2, (d - acc) / arc);
    }

    function updateSize() {
      const r = wrap.getBoundingClientRect();
      width = r.width + OFFSET * 2;
      height = r.height + OFFSET * 2;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }

    function draw(now) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      time += ((now - lastFrame) / 1000) * SPEED;
      lastFrame = now;

      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.clearRect(0, 0, width, height);
      ctx2.strokeStyle = COLOR;
      ctx2.lineWidth = 1;
      ctx2.lineCap = 'round';
      ctx2.lineJoin = 'round';

      const bw = width - 2 * OFFSET, bh = height - 2 * OFFSET;
      const r = Math.min(RADIUS, Math.min(bw, bh) / 2);
      const per = 2 * (bw + bh) + 2 * Math.PI * r;
      const samples = Math.floor(per / 3);

      ctx2.beginPath();
      for (let i = 0; i <= samples; i++) {
        const p = i / samples;
        const pt = rectPoint(p, OFFSET, OFFSET, bw, bh, r);
        const x = pt.x + octavedNoise(p * 8, 0) * DISPLACEMENT;
        const y = pt.y + octavedNoise(p * 8, 1) * DISPLACEMENT;
        i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
      }
      ctx2.closePath();
      ctx2.stroke();
      raf = requestAnimationFrame(draw);
    }

    function start() {
      if (raf) return;
      lastFrame = performance.now();
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    updateSize();
    new ResizeObserver(updateSize).observe(wrap);
    // só anima quando o card está visível (economia de bateria)
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(wrap);
  });

  /* ================================================================
     19. FUNDO — pausa aurora/blobs/grão quando a aba fica oculta
     ================================================================ */
  const bgFx = $('.bg-fx');
  document.addEventListener('visibilitychange', () => {
    if (bgFx) bgFx.classList.toggle('paused', document.hidden);
    // pausa também o selo giratório, os raios do hero, o marquee fantasma e os chips
    document.body.classList.toggle('fx-paused', document.hidden);
  });

  /* ================================================================
     20. SCROLLVELOCITY — port do React Bits (reactbits.dev) sem libs
         A trust bar anda sozinha (baseSpeed) e acelera com a
         velocidade do scroll, com skew limitado a ±6°. O marquee em
         CSS fica como fallback e como comportamento em reduced-motion.
     ================================================================ */
  aoInteragir(function trustVelocity() {
    const bar = $('.trust-bar');
    const trackEl = $('.trust-track');
    if (!bar || !trackEl || reduceMotion) return;
    const group = $('.trust-group', trackEl);

    trackEl.classList.add('js-marquee');
    let offset = 0, vel = 0, skew = 0, lastY = window.scrollY, raf = null;
    // Rodada 4: a largura do grupo é medida só quando muda (antes, a cada quadro forçava o layout da página).
    let larguraGrupo = group.offsetWidth;
    if ('ResizeObserver' in window) new ResizeObserver(() => { larguraGrupo = group.offsetWidth; }).observe(group);

    function frame() {
      const y = window.scrollY;
      vel += ((y - lastY) - vel) * 0.1;   // lerp do delta de scroll
      lastY = y;

      offset -= 0.6 + Math.abs(vel) * 0.15;
      const w = larguraGrupo;
      if (w > 0) offset = ((offset % w) + w) % w - w;   // wrap pelo módulo de um grupo

      const targetSkew = Math.max(-6, Math.min(6, vel * 0.35));
      skew += (targetSkew - skew) * 0.12;

      trackEl.style.transform = `translateX(${offset}px) skewX(${skew}deg)`;
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { lastY = window.scrollY; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(bar);
  });

  /* ================================================================
     21. TARGETCURSOR — port do React Bits (reactbits.dev) sem GSAP
         Mira de precisão que segue o ponteiro (lerp) girando devagar
         e trava os 4 cantos ao redor de CTAs, links e cards.
     ================================================================ */
  aposCarregar(function targetCursor() {
    if (!hasFinePointer || reduceMotion) return;

    const SEL = '.btn, .nav-link, .service-card, [data-open-modal], .faq-q';
    const root = document.createElement('div');
    root.className = 'target-cursor';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<span class="tc-dot"></span>' +
      '<span class="tc-corner tc-tl"></span>' +
      '<span class="tc-corner tc-tr"></span>' +
      '<span class="tc-corner tc-br"></span>' +
      '<span class="tc-corner tc-bl"></span>';
    document.body.appendChild(root);
    document.body.classList.add('tc-on');
    glowStrength = '.5';   // os dois cursores convivem sem poluir

    const corners = $$('.tc-corner', root);
    const HALF = 20, SIZE = 12, PAD = 6;
    const base = [
      [-HALF, -HALF], [HALF - SIZE, -HALF],
      [HALF - SIZE, HALF - SIZE], [-HALF, HALF - SIZE]
    ];
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    let rot = 0, scale = 1, targetScale = 1;
    let locked = null, tcRaf = null, tcOn = false;

    function tcShow(on) {
      tcOn = on;
      root.style.opacity = on ? '1' : '0';
      if (on && !tcRaf) tcRaf = requestAnimationFrame(loop);
    }

    function setCorners(rect) {
      const pos = rect
        ? [
            [rect.left - PAD - x, rect.top - PAD - y],
            [rect.right + PAD - SIZE - x, rect.top - PAD - y],
            [rect.right + PAD - SIZE - x, rect.bottom + PAD - SIZE - y],
            [rect.left - PAD - x, rect.bottom + PAD - SIZE - y]
          ]
        : base;
      corners.forEach((c, i) => (c.style.transform = `translate(${pos[i][0]}px, ${pos[i][1]}px)`));
    }
    setCorners(null);

    function lockTo(el) {
      locked = el;
      rot = ((rot % 360) + 360) % 360;
      if (rot > 180) rot -= 360;   // volta a 0 pelo caminho mais curto
    }
    function unlock() {
      locked = null;
      setCorners(null);
    }

    window.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      tcShow(true);
    });
    document.documentElement.addEventListener('pointerleave', () => tcShow(false));
    // sobre o iframe do mapa o pointermove não dispara: esconde a mira lá
    const mapWrap = $('.contact-map');
    if (mapWrap) {
      mapWrap.addEventListener('mouseenter', () => { if ($('iframe', mapWrap)) tcShow(false); });
      mapWrap.addEventListener('mouseleave', () => tcShow(true));
    }
    window.addEventListener('mousedown', () => (targetScale = .9));
    window.addEventListener('mouseup', () => (targetScale = 1));

    document.addEventListener('mouseover', e => {
      const t = e.target.closest(SEL);
      if (t === locked) return;
      t ? lockTo(t) : (locked && unlock());
    });
    // scroll pode tirar o alvo de baixo do ponteiro sem disparar mouseover
    window.addEventListener('scroll', () => {
      if (!locked) return;
      const el = document.elementFromPoint(x, y);
      if (!el || el.closest(SEL) !== locked) unlock();
    }, { passive: true });

    function loop() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      if (locked) rot += (0 - rot) * 0.2;
      else rot = (rot + 1.2) % 360;
      scale += (targetScale - scale) * 0.2;
      root.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
      if (locked) setCorners(locked.getBoundingClientRect());
      tcRaf = tcOn ? requestAnimationFrame(loop) : null;
    }
  });

  /* ================================================================
     22. STROKETEXT — port do React Bits (reactbits.dev) sem GSAP
         Títulos de seção em outline que "preenchem" da esquerda para
         a direita quando o bloco entra na tela (usa o .in do reveal).
     ================================================================ */
  if (!reduceMotion) {
    $$('.section-title').forEach(h2 => {
      const html = h2.innerHTML;
      h2.classList.add('stroke-title');
      h2.innerHTML =
        `<span class="stroke-layer" aria-hidden="true">${html}</span>` +
        `<span class="fill-layer">${html}</span>`;
    });
  }

  /* ================================================================
     23. GRADE TÉCNICA — port da ideia do Squares (reactbits.dev)
         O grid de fundo virou canvas: linhas grafite constantes e,
         perto do cursor, segmentos e nós acendem em vermelho.
         Só anima enquanto o ponteiro se move; depois decai e para.
     ================================================================ */
  aposCarregar(function techGrid() {
    if (!bgGrid || !bgGrid.getContext) return;
    const gtx = bgGrid.getContext('2d');
    const PAD = 60, RADIUS = 230;
    let gw = 0, gh = 0, raf = null, heat = 0, lastMove = 0;
    const pos = { x: -9999, y: -9999 };

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      gw = innerWidth + PAD * 2;
      gh = innerHeight + PAD * 2;
      bgGrid.width = gw * dpr;
      bgGrid.height = gh * dpr;
      gtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function drawBase() {
      gtx.clearRect(0, 0, gw, gh);
      gtx.lineWidth = 1;
      gtx.strokeStyle = 'rgba(255,255,255,.05)';
      gtx.beginPath();
      for (let x = .5; x <= gw; x += GRID_STEP) { gtx.moveTo(x, 0); gtx.lineTo(x, gh); }
      for (let y = .5; y <= gh; y += GRID_STEP) { gtx.moveTo(0, y); gtx.lineTo(gw, y); }
      gtx.stroke();
    }
    function frame() {
      const moving = performance.now() - lastMove < 400;
      heat += ((moving ? 1 : 0) - heat) * 0.07;
      drawBase();
      if (heat < 0.01) { raf = null; return; }

      const x0 = Math.max(0, pos.x - RADIUS), x1 = Math.min(gw, pos.x + RADIUS);
      const y0 = Math.max(0, pos.y - RADIUS), y1 = Math.min(gh, pos.y + RADIUS);
      const grad = gtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, RADIUS);
      grad.addColorStop(0, `rgba(229,9,20,${.45 * heat})`);
      grad.addColorStop(1, 'rgba(229,9,20,0)');
      gtx.strokeStyle = grad;
      gtx.beginPath();
      for (let x = Math.floor(x0 / GRID_STEP) * GRID_STEP + .5; x <= x1; x += GRID_STEP) { gtx.moveTo(x, y0); gtx.lineTo(x, y1); }
      for (let y = Math.floor(y0 / GRID_STEP) * GRID_STEP + .5; y <= y1; y += GRID_STEP) { gtx.moveTo(x0, y); gtx.lineTo(x1, y); }
      gtx.stroke();

      // nós da grade acendem conforme a distância do cursor
      for (let x = Math.floor(x0 / GRID_STEP) * GRID_STEP; x <= x1; x += GRID_STEP) {
        for (let y = Math.floor(y0 / GRID_STEP) * GRID_STEP; y <= y1; y += GRID_STEP) {
          const d = Math.hypot(x - pos.x, y - pos.y);
          if (d > RADIUS) continue;
          gtx.fillStyle = `rgba(229,9,20,${((1 - d / RADIUS) * .8 * heat).toFixed(3)})`;
          gtx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    drawBase();
    let gridResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(gridResizeTimer);
      gridResizeTimer = setTimeout(() => { size(); drawBase(); }, 150);
    });
    if (!hasFinePointer || reduceMotion) return;

    window.addEventListener('pointermove', e => {
      // em perf-lite o realce vermelho da grade sai de cena (repaint caro);
      // a grade base estática continua desenhada
      if (document.body.classList.contains('perf-lite')) return;
      pos.x = e.clientX + PAD;
      pos.y = e.clientY + PAD - (window.scrollY * GRID_PAR) % GRID_STEP;
      lastMove = performance.now();
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; drawBase(); }
    });
  });

  /* ================================================================
     24. MARCHA DE RPM — o ponteiro da barra de progresso estica e
         brilha conforme a velocidade do scroll, e assenta sozinho.
     ================================================================ */
  aposCarregar(function rpmNeedle() {
    if (reduceMotion) return;
    let rev = 0, revTarget = 0, raf = null, lastY = window.scrollY;

    function frame() {
      revTarget *= 0.92;
      rev += (revTarget - rev) * 0.18;
      progress.style.setProperty('--rev', rev.toFixed(3));
      if (rev > 0.004 || revTarget > 0.004) raf = requestAnimationFrame(frame);
      else { progress.style.setProperty('--rev', '0'); raf = null; }
    }
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      revTarget = Math.min(1, Math.abs(y - lastY) / 70);
      lastY = y;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  });

  /* ================================================================
     25. GLAREHOVER — port do React Bits (reactbits.dev)
         Brilho diagonal que atravessa os tiles do bento no hover,
         somado ao tilt existente. Sem custo fora do hover.
     ================================================================ */
  if (hasFinePointer && !reduceMotion) {
    // 3º passe: o glare também varre as fotos (sobre e diferenciais)
    $$('.service-card, .about-photo, .why-image').forEach(card => {
      const g = document.createElement('i');
      g.className = 'tile-glare';
      g.setAttribute('aria-hidden', 'true');
      card.appendChild(g);
    });
  }

  /* ================================================================
     26. SHINYTEXT — port do React Bits (reactbits.dev)
         Glint metálico que varre o H1 letra a letra (reaproveita o
         split do item 17): 1x após a entrada e no hover do CTA.
     ================================================================ */
  aoInteragir(function heroShine() {
    if (reduceMotion) return;
    const h1 = $('.hero-title');
    if (!h1 || !h1.classList.contains('st-split')) return;
    const total = 800 + $$('.st-char', h1).length * 13;
    let glintTimer = null;

    function glint() {
      if (glintTimer) return;                 // não reinicia no meio da varredura
      h1.classList.add('glint');
      glintTimer = setTimeout(() => {
        h1.classList.remove('glint');
        glintTimer = null;
      }, total + 120);
    }

    // 1x na entrada, depois que o SplitText assentar
    setTimeout(glint, 2600);
    const cta = $('.hero-cta .btn-primary');
    if (cta && hasFinePointer) cta.addEventListener('pointerenter', glint);
  });

  /* ================================================================
     27. CIRCULARTEXT — port do React Bits (reactbits.dev)
         Selo técnico giratório no hero: cada caractere é posicionado
         ao redor do círculo via rotate(); o giro é uma única animação
         CSS (pausa com a aba oculta via body.fx-paused).
     ================================================================ */
  aposCarregar(function circularSeal() {
    const rotor = $('#sealRotor');
    if (!rotor || !rotor.offsetParent) return; // o selo do hero não existe abaixo de 1100 px (CSS): não cria 48 spans à toa
    const TEXT = 'ESPECIALISTA EM MECÂNICA EM GERAL • +' + (document.body.dataset.anos || '18') + ' ANOS • ';
    const chars = [...TEXT];
    const step = 360 / chars.length;
    const frag = document.createDocumentFragment();
    chars.forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      if (ch === '•') s.className = 'hot';
      s.style.transform = `rotate(${(i * step).toFixed(2)}deg)`;
      frag.appendChild(s);
    });
    rotor.appendChild(frag);
  });

  /* ================================================================
     27b. GOVERNADOR DE FPS — qualidade adaptativa
         Mede o rAF real por ~1,8s depois do load. Se a máquina não
         sustenta ~46fps, entra em body.perf-lite: pausa as camadas
         puramente decorativas (aurora, grão, listras, blobs).
         Máquinas boas ficam com tudo.
     ================================================================ */
  aposCarregar(function perfGovernor() {
    if (reduceMotion) return;
    setTimeout(() => {
      let frames = 0;
      const t0 = performance.now();
      function probe(now) {
        frames++;
        if (now - t0 < 1800) { requestAnimationFrame(probe); return; }
        const fps = frames / ((now - t0) / 1000);
        // corta só as camadas decorativas CSS; o mar de metal fundido
        // tem governor próprio (EMA com histerese) e se adapta sozinho
        if (fps < 46) document.body.classList.add('perf-lite');
      }
      requestAnimationFrame(probe);
    }, 1500); // deixa o jank de load passar antes de medir
  });

  /* ================================================================
     28. DECRYPTEDTEXT — port do React Bits (reactbits.dev)
         Os rótulos de seção ("QUEM SOMOS", "O QUE FAZEMOS"...)
         entram como telemetria: caracteres embaralhados que travam
         no texto final da esquerda para a direita. Roda 1x por tag,
         via rAF, quando o rótulo entra na tela.
     ================================================================ */
  aposCarregar(function decryptTags() {
    if (reduceMotion) return;
    const GLYPHS = '#<>/\\_-=+*0123456789ABCDEFXYZ';
    const tags = $$('.section-tag');
    if (!tags.length) return;

    function scramble(el) {
      const finalText = el.textContent;
      const chars = [...finalText];
      const t0 = performance.now();
      const DUR = 700;
      el.style.minWidth = el.offsetWidth + 'px'; // evita jitter de largura
      function tick(now) {
        const p = Math.min((now - t0) / DUR, 1);
        const lockedCount = Math.floor(p * chars.length);
        let out = '';
        for (let i = 0; i < chars.length; i++) {
          if (i < lockedCount || chars[i] === ' ') out += chars[i];
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick);
        else { el.textContent = finalText; el.style.minWidth = ''; }
      }
      requestAnimationFrame(tick);
    }

    const tagIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        scramble(e.target);
        tagIO.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    tags.forEach(t => tagIO.observe(t));
  });

  /* ================================================================
     29. ODÔMETRO DO SELO "18+" — o badge de anos na foto de
         #diferenciais conta de 0 a 18 (mesmo easing dos contadores)
         quando entra na tela.
     ================================================================ */
  aposCarregar(function yearsOdometer() {
    const badge = $('#yearsBadge');
    if (!badge || reduceMotion) return;
    const TARGET = Number(document.body.dataset.anos) || 18, DUR = 1400;
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / DUR, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        badge.textContent = Math.round(TARGET * eased) + '+';
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.5 }).observe(badge);
  });

  /* ================================================================
     30. VARIABLEPROXIMITY — port do React Bits (reactbits.dev)
         As marcas do LogoLoop acendem conforme a distância do cursor:
         quanto mais perto, mais brancas, maiores e com glow vermelho.
         Um só rAF que decai e para sozinho quando o ponteiro sai.
     ================================================================ */
  aposCarregar(function brandProximity() {
    if (!hasFinePointer || reduceMotion) return;
    const wrap = $('.brands');
    if (!wrap) return;
    const items = $$('.brand', wrap);
    if (!items.length) return;
    const RADIUS = 180;
    const P = { x: -9999, y: -9999 };
    const ks = new Array(items.length).fill(0);
    let raf = null, lastMove = 0;

    function frame() {
      const active = performance.now() - lastMove < 400;
      let alive = false;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.hypot(cx - P.x, cy - P.y);
        const target = active ? Math.max(0, 1 - d / RADIUS) : 0;
        ks[i] += (target - ks[i]) * 0.18;
        if (ks[i] < 0.01) ks[i] = 0; else alive = true;
        items[i].style.setProperty('--k', ks[i].toFixed(3));
      }
      raf = (alive || active) ? requestAnimationFrame(frame) : null;
    }
    wrap.addEventListener('pointermove', e => {
      P.x = e.clientX; P.y = e.clientY;
      lastMove = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    });
    wrap.addEventListener('pointerleave', () => { lastMove = 0; });
  });

  /* ================================================================
     31. SCROLLREVEAL — port do React Bits (reactbits.dev) sem GSAP
         O parágrafo-chave de #sobre entra palavra a palavra: cada
         palavra desborra e sobe com stagger quando o texto aparece.
         Roda 1x; leitores de tela leem o texto inteiro via aria-label.
     ================================================================ */
  aposCarregar(function scrollRevealLead() {
    if (reduceMotion) return;
    const els = $$('.about-lead');
    if (!els.length) return;

    els.forEach(el => {
      const label = el.textContent.replace(/\s+/g, ' ').trim();
      (function walk(node) {
        [...node.childNodes].forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span');
              w.className = 'sr-word';
              w.setAttribute('aria-hidden', 'true');
              w.textContent = part;
              frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
        });
      })(el);
      $$('.sr-word', el).forEach((w, i) => w.style.setProperty('--wi', i));
      // <p> não aceita aria-label (axe: aria-prohibited-attr): o texto inteiro vai num span só para leitor de tela.
      const leitor = document.createElement('span');
      leitor.className = 'so-leitor';
      leitor.textContent = label;
      el.appendChild(leitor);
      el.classList.add('sr-split');
    });

    const srIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('sr-in');
        // quando a última palavra assentar, limpa animação/filter residuais
        // (33 spans com blur(0) permanente = camadas de filtro à toa)
        const words = $$('.sr-word', e.target);
        let done = 0;
        e.target.addEventListener('animationend', function onEnd(ev) {
          if (!ev.target.classList.contains('sr-word')) return;
          if (++done < words.length) return;
          e.target.classList.add('sr-done');
          e.target.removeEventListener('animationend', onEnd);
        });
        srIO.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    els.forEach(el => srIO.observe(el));
  });

  /* ================================================================
     32. COUNTUP no badge de avaliação do hero — o "4,8" acelera de
         0 a 4,8 quando o badge aparece (mesmo easing dos contadores).
     ================================================================ */
  (function ratingCountUp() {
    const el = $('.rating-badge-info strong');
    if (!el || !el.dataset.target || reduceMotion) return;
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      animateCount(el);
    }, { threshold: 0.5 }).observe(el);
  })();

  /* ================================================================
     33. FAÍSCAS DE PIT LANE no CTA final — canvas 2D com brasas
         vermelhas e prata subindo devagar com flicker. Pausa fora do
         viewport, off em reduced-motion, metade em perf-lite.
     ================================================================ */
  aoInteragir(function ctaEmbers() {
    const cv = $('#ctaEmbers');
    const sec = $('.final-cta');
    if (!cv || !sec || reduceMotion) return;
    const ex = cv.getContext('2d');
    const COUNT = 24;
    const SCALE = 0.5; // meia resolução: o CSS estica e as brasas ficam soft-focus
    let w = 0, h = 0, raf = null, parts = [];

    function size() {
      w = cv.width = Math.max(1, Math.round(cv.offsetWidth * SCALE));
      h = cv.height = Math.max(1, Math.round(cv.offsetHeight * SCALE));
    }
    function newP(fromBottom) {
      return {
        x: Math.random() * w,
        y: fromBottom ? h + 8 : Math.random() * h,
        r: 0.8 + Math.random() * 1.7,
        v: 0.3 + Math.random() * 0.8,
        drift: (Math.random() - 0.5) * 0.6,
        tw: Math.random() * Math.PI * 2,
        silver: Math.random() > 0.65
      };
    }
    function make() {
      const n = document.body.classList.contains('perf-lite') ? (COUNT / 2) | 0 : COUNT;
      parts = [];
      for (let i = 0; i < n; i++) parts.push(newP(false));
    }
    function frame() {
      // o governador pode ligar o perf-lite com este rAF já rodando:
      // o CSS esconde o canvas, então paramos de desenhar de vez
      if (document.body.classList.contains('perf-lite')) { raf = null; return; }
      ex.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.tw += 0.03;
        p.y -= p.v;
        p.x += Math.sin(p.tw) * p.drift;
        // flicker + fade suave no topo
        const a = (0.3 + 0.5 * Math.abs(Math.sin(p.tw * 1.7))) * Math.min(1, p.y / (h * 0.3));
        ex.fillStyle = p.silver ? `rgba(233,235,240,${a.toFixed(3)})` : `rgba(255,90,90,${a.toFixed(3)})`;
        const s = p.r * 2;
        ex.fillRect(p.x - p.r, p.y - p.r, s, s); // quadradinho meia-res = brasa soft
        if (p.y < -10) parts[i] = newP(true);
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (document.body.classList.contains('perf-lite')) return; // CSS já esconde o canvas
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size(); make();
    let emberResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(emberResizeTimer);
      emberResizeTimer = setTimeout(() => { size(); make(); }, 150);
    });
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(sec);
  });

  /* ================================================================
     34. RITMO CLARO/ESCURO — hairline vermelha que se desenha na
         fronteira das seções + variante escura do cursor de mira
         sobre fundo claro (cantos grafite).
     ================================================================ */
  aposCarregar(function lightRhythm() {
    const secs = $$('.sec-light, .why, .contact');
    if (secs.length) {
      const eio = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('edge-in');
          eio.unobserve(e.target);
        });
      }, { threshold: 0.06 });
      secs.forEach(s => eio.observe(s));
    }
    if (hasFinePointer) {
      document.addEventListener('pointerover', e => {
        const light = !!(e.target.closest && e.target.closest('.sec-light, .rev-pop-card'));
        document.body.classList.toggle('tc-light', light);
      });
    }
  });

  /* ================================================================
     35. CIRCULARTEXT genérico — monta qualquer rotor com o texto
         vindo de [data-circular-text] (usado no selo da fachada).
     ================================================================ */
  $$('[data-circular-text]').forEach(rotor => {
    const chars = [...rotor.dataset.circularText];
    const step = 360 / chars.length;
    const frag = document.createDocumentFragment();
    chars.forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      if (ch === '•') s.className = 'hot';
      s.style.transform = `rotate(${(i * step).toFixed(2)}deg)`;
      frag.appendChild(s);
    });
    rotor.appendChild(frag);
  });

  /* ================================================================
     36. PARALLAX leve nas fotos ([data-parallax]) — mede o PAI
         (não transformado) para não realimentar o próprio deslocamento.
         Um rAF por evento de scroll; nada roda com a página parada.
     ================================================================ */
  aposCarregar(function photoParallax() {
    if (reduceMotion) return;
    const els = $$('[data-parallax]');
    if (!els.length) return;
    let raf = null;
    function frame() {
      els.forEach(el => {
        const p = el.parentElement || el;
        const r = p.getBoundingClientRect();
        if (r.bottom < -80 || r.top > innerHeight + 80) return; // fora da tela: não mexe
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        const f = parseFloat(el.dataset.parallax || '0.05');
        el.style.transform = `translateY(${(-c * f * 220).toFixed(1)}px)`;
      });
      raf = null;
    }
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    frame();
  });

  /* ================================================================
     37. AVALIAÇÕES POR SERVIÇO — popover acessível.
         REGRA INEGOCIÁVEL: nada é inventado. A fonte é o próprio
         carrossel de depoimentos REAIS do site; o mapeamento liga
         cada serviço apenas a quem citou aquele assunto. Serviço sem
         depoimento correspondente mostra a nota agregada REAL (4,8 ·
         +1.200 avaliações no Google) + convite para ver no Google ou
         contar a experiência pelo WhatsApp.
     ================================================================ */
  (function serviceReviews() {
    const pop = $('#revPop');
    if (!pop) return;
    const body = $('#revPopBody');
    const title = $('#revPopTitle');
    const waLink = $('#revPopWa');
    const closeBtn = $('#revPopClose');
    let trigger = null;

    function render(key, serviceName) {
      title.textContent = 'Avaliações — ' + serviceName;
      const slug = 'avaliacao-' + (key || 'servico');
      waLink.href = 'https://wa.me/' + WPHONE + '?text=' +
        encodeURIComponent('Olá! Vim pelo site. Já fiz ' + serviceName + ' na IndyCar e quero contar como foi. (site/' + slug + ')') +
        '&utm_source=site&utm_medium=whatsapp&utm_campaign=' + slug;
      body.textContent = '';
      const box = document.createElement('div');
      box.className = 'rev-pop-empty';
      const big = document.createElement('span');
      big.className = 'rp-big';
      big.textContent = document.body.dataset.nota || '4,8'; const de5 = document.createElement('small'); de5.textContent = ' / 5'; big.appendChild(de5);
      const p = document.createElement('p');
      p.textContent = 'Nossa nota no Google é ' + (document.body.dataset.nota || '4,8') + ', com mais de ' + (document.body.dataset.avaliacoes || '1.200') + ' avaliações. Não publicamos depoimento por serviço aqui: leia as avaliações reais direto no Google.';
      box.append(big, p);
      body.appendChild(box);
    }

    function openPop(btn) {
      trigger = btn;
      render(btn.dataset.reviews, btn.dataset.serviceName || 'este serviço');
      pop.hidden = false;
      document.body.style.overflow = 'hidden';
      btn.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    }
    function closePop() {
      if (pop.hidden) return;
      pop.hidden = true;
      if (!promoBackdrop.classList.contains('open') && !formBackdrop.classList.contains('open'))
        document.body.style.overflow = '';
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        if (document.contains(trigger)) trigger.focus();
        trigger = null;
      }
    }

    $$('.svc-rev').forEach(b => b.addEventListener('click', () => openPop(b)));
    closeBtn.addEventListener('click', closePop);
    pop.addEventListener('click', e => { if (e.target === pop) closePop(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePop(); return; }
      if (e.key !== 'Tab' || pop.hidden) return;
      const f = $$('button, [href]', pop).filter(x => !x.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();

  /* ================================================================
     40. MAPA SOB DEMANDA — nada do Google carrega antes do clique.
     ================================================================ */
  (function mapaSobDemanda() {
    const box = $('#mapBox'), btn = $('#mapLoad');
    if (!box || !btn) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.title = 'Mapa da IndyCar Centro Automotivo, Av. Bandeirantes 875, Taubaté';
      f.src = box.dataset.mapSrc;
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.classList.add('map-on');
      box.appendChild(f);
      f.focus();
    }, { once: true });
  })();

  /* ================================================================
     38. PULSO 1x nos números dos contadores — dispara junto com o
         CountUp e pulsa quando o número assenta (delay no CSS).
     ================================================================ */
  $$('.counter').forEach(c => {
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      c.classList.add('pulsed');
    }, { threshold: 0.6 }).observe(c);
  });

  /* ================================================================
     39. FAQ — acordeão acessível (#faq)
         Botões reais (Enter/Space nativos), aria-expanded sincronizado,
         abertura animada no CSS via grid-template-rows (0fr -> 1fr).
     ================================================================ */
  (function faqAccordion() {
    $$('.faq-item').forEach(item => {
      const btn = $('.faq-q', item);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const open = !item.classList.contains('open');
        item.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  })();


  /* ================================================================
     40. RODADA 7 — rascunho do formulário, lembrar dados neste aparelho,
         fila de reenvio sem rede, pedido recente e economia de dados
     ================================================================ */
  (function rodada7() {
    const store = {
      get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
      del(k) { try { localStorage.removeItem(k); } catch (_) {} },
    };
    const lerJson = (txt) => { try { return JSON.parse(txt || 'null'); } catch (_) { return null; } };
    const DIA = 86400000;
    const CAMPOS = { nome: '#fName', tel: '#fPhone', carro: '#fCar', placa: '#fPlaca', msg: '#fMsg' };

    if (POUPAR) { document.body.classList.add('perf-lite'); document.documentElement.classList.add('poupar-dados'); }

    // --- Rascunho (sessão): fechou o formulário sem querer ou recarregou? O que foi digitado volta. ---
    function valores() {
      const o = {};
      for (const [k, sel] of Object.entries(CAMPOS)) o[k] = (($(sel) || {}).value || '');
      o.servico = ($('#fService') || {}).value || '';
      return o;
    }
    function preencher(d) {
      if (!d) return;
      for (const [k, sel] of Object.entries(CAMPOS)) {
        const el = $(sel);
        if (el && !el.value && d[k]) { el.value = String(d[k]).slice(0, Number(el.maxLength) > 0 ? el.maxLength : 500); if (k === 'msg') el.dispatchEvent(new Event('input')); }
      }
      const sv = $('#fService');
      if (sv && !sv.value && d.servico && $$('option', sv).some(o => o.value === d.servico)) sv.value = d.servico;
    }
    function salvarRascunho() {
      const v = valores();
      if (Object.entries(v).some(([k, x]) => k !== 'servico' && String(x).trim())) sessao.set('indycar_rascunho', JSON.stringify(v));
    }
    form.addEventListener('input', salvarRascunho);
    form.addEventListener('change', salvarRascunho);
    const rascunho = lerJson(sessao.get('indycar_rascunho'));
    if (rascunho) preencher(rascunho);

    // --- Lembrar meus dados neste aparelho (localStorage, só se a pessoa marcar) ---
    const EU = 'indycar_eu';
    const euAtual = () => { const e = lerJson(store.get(EU)); return e && e.em && Date.now() - e.em < 180 * DIA ? e : null; };
    const chk = $('#fLembrar'), esquecer = $('#fEsquecer');
    function mostrarEu() {
      const e = euAtual();
      if (chk) chk.checked = !!e;
      if (esquecer) esquecer.hidden = !e;
      if (e) preencher(e);
    }
    mostrarEu();
    if (esquecer) esquecer.addEventListener('click', () => {
      store.del(EU);
      for (const sel of Object.values(CAMPOS)) { const el = $(sel); if (el) { el.value = ''; if (el.id === 'fMsg') el.dispatchEvent(new Event('input')); } }
      try { sessionStorage.removeItem('indycar_rascunho'); } catch (_) {}
      if (chk) chk.checked = false;
      esquecer.hidden = true;
      const aviso = $('#fHorarioEscolhido'); if (aviso) aviso.textContent = 'Seus dados foram apagados deste aparelho.';
      const n = $('#fName'); if (n) n.focus();
    });
    form.addEventListener('reset', () => setTimeout(mostrarEu, 0));

    // --- Depois de um pedido: guarda o protocolo, apaga o rascunho, lembra os dados se a pessoa quis ---
    const PEDIDO = 'indycar_pedido';
    function pintarPedidoRecente() {
      const alvo = $('#areaPedido');
      if (!alvo) return;
      const p = lerJson(store.get(PEDIDO));
      if (!p || !p.em || Date.now() - p.em > 36 * 3600000 || !p.protocolo) { if (p) store.del(PEDIDO); alvo.hidden = true; return; }
      $('#areaPedidoTit').textContent = 'Seu pedido ' + p.protocolo + ' está com a equipe';
      const txt = $('#areaPedidoTxt'); txt.textContent = '';
      txt.append((p.servico ? p.servico : 'Diagnóstico') + (p.horario ? ' · ' + p.horario : '') + '. A confirmação chega pelo seu WhatsApp. Se o carro já está na oficina, ');
      const a = document.createElement('a'); a.href = 'https://indycar-patio.netlify.app/acompanhar/'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'acompanhe por aqui';
      txt.append(a, '.');
      alvo.hidden = false;
    }
    window.addEventListener('indycar:pedido', (e) => {
      const { resposta, pedido, horarioRotulo } = e.detail || {};
      try { sessionStorage.removeItem('indycar_rascunho'); } catch (_) {}
      if (chk && chk.checked && pedido) {
        store.set(EU, JSON.stringify({ em: Date.now(), nome: pedido.nome, tel: ($('#fPhone') || {}).value || '', carro: pedido.carro || '', placa: pedido.placa || '' }));
      } else if (chk && !chk.checked) store.del(EU);
      if (resposta && resposta.protocolo && !resposta.direto) {
        store.set(PEDIDO, JSON.stringify({ em: Date.now(), protocolo: String(resposta.protocolo).slice(0, 12), servico: pedido ? pedido.servico : '', horario: horarioRotulo || '' }));
        pintarPedidoRecente();
      }
    });
    pintarPedidoRecente();

    // --- Fila de reenvio: sem rede o pedido abre o WhatsApp E fica guardado; quando a rede volta, vai ao banco ---
    const FILA = 'indycar_fila';
    const lerFila = () => (lerJson(store.get(FILA)) || []).filter(x => x && x.em && x.pedido && Date.now() - x.em < DIA);
    window.addEventListener('indycar:pedido-offline', (e) => {
      const pedido = e.detail && e.detail.pedido;
      if (!pedido) return;
      const f = lerFila(); f.push({ em: Date.now(), pedido });
      store.set(FILA, JSON.stringify(f.slice(-3)));
    });
    let esvaziando = false;
    async function esvaziarFila() {
      if (esvaziando || navigator.onLine === false) return;
      const f = lerFila();
      if (!f.length) { store.del(FILA); return; }
      esvaziando = true;
      const restantes = [];
      for (const item of f) {
        try {
          const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 9000);
          const r = await fetch(SITE_LEAD_URL, { method: 'POST', mode: 'cors', signal: ctrl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(item.pedido) });
          clearTimeout(t);
          if (r.status >= 500 || r.status === 429) restantes.push(item); // servidor ocupado: tenta de novo depois
        } catch (_) { restantes.push(item); }
      }
      if (restantes.length) store.set(FILA, JSON.stringify(restantes)); else store.del(FILA);
      esvaziando = false;
    }
    window.addEventListener('online', esvaziarFila);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) esvaziarFila(); });
    setTimeout(esvaziarFila, 6000);
  })();

})();
