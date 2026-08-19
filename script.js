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
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

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
  });
  // fecha ao clicar num link
  $$('.nav-link', navLinks).forEach(a => a.addEventListener('click', closeMenu));

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
    $$('.service-card, .review-card, .about-pillar, .why-item').forEach(card => {
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

    // TILTEDCARD — port do React Bits: tilt 3D leve nos depoimentos.
    // Ângulo menor que o do bento; só pointer fino (não interfere no swipe).
    $$('.review-card').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-4px) rotateX(${ -y * 5 }deg) rotateY(${ x * 5 }deg)`;
      });
      card.addEventListener('pointerleave', () => (card.style.transform = ''));
    });
  }

  /* ================================================================
     6. HERO CANVAS — LIGHT TRAILS DE PISTA (3 camadas de profundidade)
        Rastros horizontais de luz em três camadas: os de cima finos,
        rápidos e translúcidos; os de baixo grossos, lentos e
        brilhantes. Perto do cursor os trails ganham velocidade e
        brilho (sensação de vácuo/aceleração). Custo por frame linear.
     ================================================================ */
  const canvas = $('#heroCanvas');
  const ctx = canvas.getContext('2d');
  let trails = [], W, H, rafId;
  const mouse = { x: -9999, y: -9999, active: false };
  const TRAIL_LAYERS = [
    { count: 10, width: 1,   speed: [8, 12], alpha: .3,  len: [70, 150] },
    { count: 8,  width: 2,   speed: [5, 8],  alpha: .55, len: [110, 220] },
    { count: 6,  width: 3.2, speed: [3, 5],  alpha: .85, len: [160, 300] }
  ];

  function resizeCanvas() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  function newTrail(layer, anywhere) {
    const len = layer.len[0] + Math.random() * (layer.len[1] - layer.len[0]);
    return {
      x: anywhere ? Math.random() * (W + len) - len : -len - Math.random() * W * 0.3,
      y: Math.random() * H,
      len,
      speed: layer.speed[0] + Math.random() * (layer.speed[1] - layer.speed[0]),
      width: layer.width,
      alpha: layer.alpha,
      white: Math.random() > 0.62,
      layer,
      boost: 0
    };
  }
  function makeTrails() {
    trails = [];
    TRAIL_LAYERS.forEach(layer => {
      for (let i = 0; i < layer.count; i++) trails.push(newTrail(layer, true));
    });
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];

      // interação: num raio de 120px do cursor o trail acelera (+60%) e brilha
      let near = 0;
      if (mouse.active) {
        const dx = t.x - mouse.x, dy = t.y - mouse.y;
        if (dx * dx + dy * dy < 14400) near = 1;
      }
      t.boost += (near - t.boost) * 0.12;

      t.x += t.speed * (1 + 0.6 * t.boost);
      const a = Math.min(1, t.alpha * (1 + 0.6 * t.boost));
      const col = t.white ? '255,255,255' : '229,9,20';

      const grad = ctx.createLinearGradient(t.x - t.len, t.y, t.x, t.y);
      grad.addColorStop(0, `rgba(${col},0)`);
      grad.addColorStop(1, `rgba(${col},${a})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = t.width;
      ctx.beginPath(); ctx.moveTo(t.x - t.len, t.y); ctx.lineTo(t.x, t.y); ctx.stroke();

      // cabeça brilhante — halo via gradiente radial (shadowBlur é caro demais
      // em raster por software; o gradiente dá o mesmo glow por fração do custo)
      const glowR = t.width * 2.6 + 3;
      const halo = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, glowR);
      halo.addColorStop(0, `rgba(${col},${Math.min(1, a + .1)})`);
      halo.addColorStop(0.35, `rgba(${col},${(a * .5).toFixed(3)})`);
      halo.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(t.x, t.y, glowR, 0, Math.PI * 2); ctx.fill();

      if (t.x - t.len > W + 20) trails[i] = newTrail(t.layer, false);
    }
    rafId = requestAnimationFrame(drawCanvas);
  }

  if (!reduceMotion) {
    resizeCanvas(); makeTrails(); drawCanvas();
    let canvasResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(canvasResizeTimer);
      canvasResizeTimer = setTimeout(() => { resizeCanvas(); makeTrails(); }, 150);
    });

    const heroSec = $('#hero');
    heroSec.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    heroSec.addEventListener('pointerleave', () => { mouse.active = false; mouse.x = mouse.y = -9999; });

    // pausa o canvas quando o hero sai da tela (economia de bateria)
    const heroIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !rafId) drawCanvas();
      else if (!e.isIntersecting) { cancelAnimationFrame(rafId); rafId = null; }
    }, { threshold: 0 });
    heroIO.observe(heroSec);
  }

  /* ================================================================
     7. CARROSSEL DE DEPOIMENTOS (auto + dots + swipe)
     ================================================================ */
  const track = $('#reviewsTrack');
  const cards = $$('.review-card', track);
  const dotsWrap = $('#reviewsDots');
  let index = 0, autoTimer;

  // cria dots
  cards.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Depoimento ' + (i + 1));
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => { goTo(i); restartAuto(); });
    dotsWrap.appendChild(b);
  });

  function cardStep() {
    // largura do card + gap
    const gap = parseFloat(getComputedStyle(track).columnGap || '24');
    return cards[0].getBoundingClientRect().width + gap;
  }
  function maxIndex() {
    const visible = Math.max(1, Math.round(track.parentElement.offsetWidth / cardStep()));
    return Math.max(0, cards.length - visible);
  }
  function goTo(i) {
    index = Math.max(0, Math.min(i, maxIndex()));
    track.style.transform = `translateX(${ -index * cardStep() }px)`;
    $$('button', dotsWrap).forEach((d, di) => d.classList.toggle('active', di === index));
  }
  function next() { goTo(index >= maxIndex() ? 0 : index + 1); }

  let reviewsVisible = false;
  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(next, 3800); }
  function restartAuto() { clearInterval(autoTimer); if (reviewsVisible) startAuto(); }

  // autoplay só com a seção visível (economia fora do viewport)
  new IntersectionObserver(([e]) => {
    reviewsVisible = e.isIntersecting;
    if (e.isIntersecting) startAuto();
    else clearInterval(autoTimer);
  }, { threshold: 0 }).observe($('#avaliacoes'));

  // pausa no hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => { if (reviewsVisible) startAuto(); });
  window.addEventListener('resize', () => goTo(index));

  // swipe no mobile
  let startX = 0;
  track.addEventListener('touchstart', e => (startX = e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : goTo(index - 1); restartAuto(); }
  }, { passive: true });

  /* ================================================================
     8. MODAIS — promoção (ao carregar) e agendamento/orçamento
     ================================================================ */
  const promoBackdrop = $('#promoBackdrop');
  const formBackdrop = $('#formBackdrop');
  let lastFocus = null;

  const openEl = (el) => {
    if (!el.classList.contains('open')) lastFocus = document.activeElement;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    const first = el === formBackdrop ? $('#fName') : $('.modal-close', el);
    if (first) first.focus();
  };
  const closeEl = (el) => {
    if (!el.classList.contains('open')) return;
    el.classList.remove('open');
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

  // abre modal de orçamento via qualquer [data-open-modal]
  $$('[data-open-modal]').forEach(b => b.addEventListener('click', () => {
    if (b.hasAttribute('data-close-promo')) closeEl(promoBackdrop);
    openEl(formBackdrop);
  }));

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
  if (!sessionStorage.getItem('indycar_promo')) {
    setTimeout(() => {
      if (!formBackdrop.classList.contains('open')) openEl(promoBackdrop);
      sessionStorage.setItem('indycar_promo', '1');
    }, 8000);
  }

  /* ================================================================
     9. FORMULÁRIO → monta mensagem e envia para o WhatsApp
     ================================================================ */
  const form = $('#leadForm');
  const WPHONE = '5512996830272';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fName'), phone = $('#fPhone'), service = $('#fService');

    // validação simples com feedback visual
    let ok = true;
    [name, phone, service].forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { (name.value ? phone : name).focus(); return; }

    const car = $('#fCar').value.trim();
    const msg =
      `*Novo pedido de orçamento — Site IndyCar* 🏁%0A%0A` +
      `*Nome:* ${encodeURIComponent(name.value.trim())}%0A` +
      `*Telefone:* ${encodeURIComponent(phone.value.trim())}%0A` +
      `*Serviço:* ${encodeURIComponent(service.value)}%0A` +
      (car ? `*Veículo:* ${encodeURIComponent(car)}%0A` : '') +
      `%0AGostaria de agendar um diagnóstico gratuito.`;

    launchConfetti();                 // 🎉 bandeira quadriculada
    window.open(`https://wa.me/${WPHONE}?text=${msg}`, '_blank');
    closeEl(formBackdrop);
    form.reset();
    showToast('✅', 'Pedido enviado!', 'Continue a conversa pelo WhatsApp.');
  });

  // limpa o estado inválido ao digitar
  $$('#leadForm input, #leadForm select').forEach(f =>
    f.addEventListener('input', () => f.classList.remove('invalid')));

  /* ================================================================
     10. PROVA SOCIAL — notificações rotativas (canto inferior esq.)
     ================================================================ */
  const sp = $('#socialProof');
  const spEmoji = $('#spEmoji'), spName = $('#spName'), spAction = $('#spAction');
  const spClose = $('#spClose');

  const proofs = [
    ['🛢️', 'Marcelo, do Centro', 'fez Troca de Óleo de Motor no Onix'],
    ['⚙️', 'Patrícia, de Taubaté', 'fez diálise no câmbio do Corolla'],
    ['🛑', 'Anderson, do Belém', 'trocou Pastilhas e Discos do HB20'],
    ['🔧', 'Camila, de Tremembé', 'trocou os Amortecedores do Gol'],
    ['🛞', 'Família Souza', 'comprou Pneus e fez Alinhamento 3D na Toro'],
    ['🏁', 'Thiago, do Parque Paduan', 'aprovou o orçamento do Civic'],
    ['🚗', 'Juliana, de Pindamonhangaba', 'usou o Leva e Traz com o Kwid'],
    ['🔩', 'Fernando, de Caçapava', 'trocou a Correia Dentada do Palio'],
    ['🧰', 'Bruna, do Jardim das Nações', 'fez Diagnóstico com Scanner no Creta'],
    ['🛠️', 'Mariana, de Taubaté', 'trocou a Embreagem do Uno'],
    ['💧', 'Eduardo, da Estiva', 'fez Limpeza de Bicos no Argo'],
    ['🔧', 'Vanessa, do Gurilândia', 'fez Revisão de Suspensão do Mobi'],
    ['🏎️', 'Rafael, de Tremembé', 'fez Revisão de Motor no Cruze'],
    ['🛞', 'Aline, do Independência', 'fez Balanceamento no Sandero'],
    ['🚙', 'Gustavo, de São José dos Campos', 'trouxe a Compass para revisão'],
    ['⚙️', 'Leandro, do Cataguá', 'aprovou reparo de câmbio da Renegade'],
    ['🛑', 'Priscila, de Taubaté', 'resolveu o chiado dos Freios do Polo'],
    ['🚗', 'Renato, do Parque Paduan', 'pediu o Leva e Traz para o Virtus'],
    ['🔋', 'Sandra, do Belém', 'fez Diagnóstico Eletrônico no T-Cross'],
    ['🏁', 'Felipe, de Quiririm', 'parcelou em 10x o serviço da Strada'],
    ['🛢️', 'Débora, do Cecap', 'fez Troca de Óleo no Tracker'],
    ['🔧', 'Wesley, do Jardim Russi', 'trocou os Amortecedores da Hilux'],
    ['⚙️', 'Cristiane, de Roseira', 'fez Troca de Óleo de Câmbio no City'],
    ['🛞', 'Márcio, da Vila São José', 'comprou 4 Pneus para o Duster'],
    ['💧', 'Larissa, de Aparecida', 'fez Limpeza de Bicos no Ka'],
    ['🛑', 'Diego, do Parque São Luís', 'trocou Pastilhas e Discos do Cronos'],
    ['🔩', 'Simone, de Guaratinguetá', 'trocou a Correia Dentada do Voyage'],
    ['🏎️', 'Adriana, da Cidade Jardim', 'fez Revisão de Motor no Yaris'],
    ['🚗', 'Paulo, de Lorena', 'usou o Leva e Traz com a S10'],
    ['🧰', 'Letícia, do Bonfim', 'fez Diagnóstico com Scanner no Nivus'],
    ['🛠️', 'Roberto, do Jardim Eulália', 'trocou a Embreagem da Saveiro'],
    ['⚙️', 'Fabiana, de Campos Elíseos', 'fez diálise no câmbio do Kicks'],
    ['🛞', 'Henrique, da Vila Aparecida', 'fez Alinhamento 3D no Fastback'],
    ['🔧', 'Natália, do Jd. Maria Augusta', 'fez Revisão de Suspensão do Spin'],
    ['🛢️', 'Roberta, de Redenção da Serra', 'fez Troca de Óleo na Ranger'],
    ['🛑', 'Daniel, da Água Quente', 'resolveu os Freios do Pulse'],
    ['🏁', 'Michele, de Jambeiro', 'fechou orçamento e parcelou em 10x'],
    ['🔋', 'Sérgio, da Esplanada', 'fez Diagnóstico no Corolla Cross'],
    ['🚙', 'Beatriz, de Monteiro Lobato', 'trouxe o Tiguan para revisão'],
  ];
  let proofIdx = 0, proofDismissed = false, toastActive = false;

  // Horário comercial: Seg–Sex 08h–18h · Sáb 08h–12h · Dom fechado
  function isBusinessHours() {
    const now = new Date();
    const day = now.getDay();                       // 0 = domingo ... 6 = sábado
    const h = now.getHours() + now.getMinutes() / 60;
    if (day >= 1 && day <= 5) return h >= 8 && h < 18;  // seg a sex
    if (day === 6) return h >= 8 && h < 12;             // sábado
    return false;                                       // domingo
  }

  function showNextProof() {
    if (proofDismissed || toastActive) return;
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
    const heroGrid = $('.hero-grid');
    const seal = $('.circular-seal');
    let hx = 0, hy = 0, hTx = 0, hTy = 0, hRaf = null;

    function heroDepth() {
      hx += (hTx - hx) * 0.07;
      hy += (hTy - hy) * 0.07;
      if (content) content.style.transform = `translate(${hx * 14}px, ${hy * 10}px)`;
      if (lines) lines.style.transform = `translate(${hx * -34}px, ${hy * -22}px)`;
      // 3º passe: o selo circular flutua em contra-fase (mais profundidade)
      if (seal) seal.style.transform = `translate(${hx * -20}px, ${hy * -14}px)`;
      if (heroGrid) heroGrid.style.setProperty('--gx', (hx * -26).toFixed(2) + 'px');
      if (Math.abs(hTx - hx) + Math.abs(hTy - hy) > 0.001) hRaf = requestAnimationFrame(heroDepth);
      else hRaf = null;
    }
    heroEl.addEventListener('pointermove', e => {
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
    if (!h1 || reduceMotion) return;
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
  (function electricBorder() {
    const card = $('.service-card--star');
    if (!card || reduceMotion) return;

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
  })();

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
  (function trustVelocity() {
    const bar = $('.trust-bar');
    const trackEl = $('.trust-track');
    if (!bar || !trackEl || reduceMotion) return;
    const group = $('.trust-group', trackEl);

    trackEl.classList.add('js-marquee');
    let offset = 0, vel = 0, skew = 0, lastY = window.scrollY, raf = null;

    function frame() {
      const y = window.scrollY;
      vel += ((y - lastY) - vel) * 0.1;   // lerp do delta de scroll
      lastY = y;

      offset -= 0.6 + Math.abs(vel) * 0.15;
      const w = group.offsetWidth;
      if (w > 0) offset = ((offset % w) + w) % w - w;   // wrap pelo módulo de um grupo

      const targetSkew = Math.max(-6, Math.min(6, vel * 0.35));
      skew += (targetSkew - skew) * 0.12;

      trackEl.style.transform = `translateX(${offset}px) skewX(${skew}deg)`;
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { lastY = window.scrollY; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(bar);
  })();

  /* ================================================================
     21. TARGETCURSOR — port do React Bits (reactbits.dev) sem GSAP
         Mira de precisão que segue o ponteiro (lerp) girando devagar
         e trava os 4 cantos ao redor de CTAs, links e cards.
     ================================================================ */
  (function targetCursor() {
    if (!hasFinePointer || reduceMotion) return;

    const SEL = '.btn, .nav-link, .service-card, [data-open-modal]';
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
      mapWrap.addEventListener('mouseenter', () => tcShow(false));
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
  })();

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
  (function techGrid() {
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
      pos.x = e.clientX + PAD;
      pos.y = e.clientY + PAD - (window.scrollY * GRID_PAR) % GRID_STEP;
      lastMove = performance.now();
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; drawBase(); }
    });
  })();

  /* ================================================================
     24. MARCHA DE RPM — o ponteiro da barra de progresso estica e
         brilha conforme a velocidade do scroll, e assenta sozinho.
     ================================================================ */
  (function rpmNeedle() {
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
  })();

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
  (function heroShine() {
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
  })();

  /* ================================================================
     27. CIRCULARTEXT — port do React Bits (reactbits.dev)
         Selo técnico giratório no hero: cada caractere é posicionado
         ao redor do círculo via rotate(); o giro é uma única animação
         CSS (pausa com a aba oculta via body.fx-paused).
     ================================================================ */
  (function circularSeal() {
    const rotor = $('#sealRotor');
    if (!rotor) return;
    const TEXT = 'ESPECIALISTA EM CÂMBIO AUTOMÁTICO • +18 ANOS • ';
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
  })();

  /* ================================================================
     27b. GOVERNADOR DE FPS — qualidade adaptativa
         Mede o rAF real por ~1,8s depois do load. Se a máquina não
         sustenta ~46fps, entra em body.perf-lite: pausa as camadas
         puramente decorativas (aurora, grão, listras, blobs) e corta
         os light trails pela metade. Máquinas boas ficam com tudo.
     ================================================================ */
  (function perfGovernor() {
    if (reduceMotion) return;
    setTimeout(() => {
      let frames = 0;
      const t0 = performance.now();
      function probe(now) {
        frames++;
        if (now - t0 < 1800) { requestAnimationFrame(probe); return; }
        const fps = frames / ((now - t0) / 1000);
        if (fps < 46) {
          document.body.classList.add('perf-lite');
          TRAIL_LAYERS.forEach(l => { l.count = Math.max(3, Math.round(l.count / 2)); });
          if (trails.length) makeTrails();
        }
      }
      requestAnimationFrame(probe);
    }, 1500); // deixa o jank de load passar antes de medir
  })();

  /* ================================================================
     28. DECRYPTEDTEXT — port do React Bits (reactbits.dev)
         Os rótulos de seção ("QUEM SOMOS", "O QUE FAZEMOS"...)
         entram como telemetria: caracteres embaralhados que travam
         no texto final da esquerda para a direita. Roda 1x por tag,
         via rAF, quando o rótulo entra na tela.
     ================================================================ */
  (function decryptTags() {
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
  })();

  /* ================================================================
     29. ODÔMETRO DO SELO "18+" — o badge de anos na foto de
         #diferenciais conta de 0 a 18 (mesmo easing dos contadores)
         quando entra na tela.
     ================================================================ */
  (function yearsOdometer() {
    const badge = $('#yearsBadge');
    if (!badge || reduceMotion) return;
    const TARGET = 18, DUR = 1400;
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
  })();

  /* ================================================================
     30. VARIABLEPROXIMITY — port do React Bits (reactbits.dev)
         As marcas do LogoLoop acendem conforme a distância do cursor:
         quanto mais perto, mais brancas, maiores e com glow vermelho.
         Um só rAF que decai e para sozinho quando o ponteiro sai.
     ================================================================ */
  (function brandProximity() {
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
  })();

  /* ================================================================
     31. SCROLLREVEAL — port do React Bits (reactbits.dev) sem GSAP
         O parágrafo-chave de #sobre entra palavra a palavra: cada
         palavra desborra e sobe com stagger quando o texto aparece.
         Roda 1x; leitores de tela leem o texto inteiro via aria-label.
     ================================================================ */
  (function scrollRevealLead() {
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
      el.setAttribute('aria-label', label);
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
  })();

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
  (function ctaEmbers() {
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
  })();

  /* ================================================================
     34. RITMO CLARO/ESCURO — hairline vermelha que se desenha na
         fronteira das seções + variante escura do cursor de mira
         sobre fundo claro (cantos grafite).
     ================================================================ */
  (function lightRhythm() {
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
  })();

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
  (function photoParallax() {
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
  })();

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

    // fonte da verdade: os depoimentos reais publicados no carrossel
    const src = $$('#reviewsTrack .review-card').map(c => ({
      stars: ($('.review-stars', c) || {}).textContent || '★★★★★',
      text: ($('.review-text', c) || {}).textContent || '',
      name: ($('.review-author strong', c) || {}).textContent || '',
      meta: ($('.review-author small', c) || {}).textContent || '',
      color: ($('.review-avatar', c) ? $('.review-avatar', c).style.getPropertyValue('--c') : '') || '#e50914',
      initials: ($('.review-avatar', c) || {}).textContent || ''
    }));

    // índices do carrossel por assunto citado no texto:
    // 0 Carlos (suspensão + diagnóstico) · 3 Juliana (freios) ·
    // 4 Marcos (revisão completa) · 5 Patrícia (alinhamento/balanceamento) ·
    // 6 Anderson (câmbio automático) · 9 Luciana (kit de embreagem)
    const MAP = {
      cambio: [6], scanner: [0], motor: [4], freios: [3],
      alinhamento: [5], embreagem: [9], suspensao: [0],
      oleo: [], amortecedores: [], correia: [], pneus: [], bicos: []
    };

    let trigger = null;
    const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

    function render(key, serviceName) {
      const idxs = MAP[key] || [];
      title.textContent = 'Avaliações — ' + serviceName;
      waLink.href = 'https://wa.me/' + WPHONE + '?text=' +
        encodeURIComponent('Olá! Já fiz ' + serviceName + ' na IndyCar e quero contar como foi.');
      if (idxs.length) {
        body.innerHTML = idxs.map(i => {
          const r = src[i];
          if (!r) return '';
          return '<div class="rev-pop-item">' +
            '<span class="rp-stars" aria-hidden="true">' + esc(r.stars) + '</span>' +
            '<p>' + esc(r.text) + '</p>' +
            '<div class="rp-author"><span class="rp-avatar" style="--c:' + esc(r.color) + '" aria-hidden="true">' + esc(r.initials) + '</span>' +
            '<span><strong>' + esc(r.name) + '</strong><small>' + esc(r.meta) + '</small></span></div>' +
            '</div>';
        }).join('');
      } else {
        body.innerHTML =
          '<div class="rev-pop-empty">' +
          '<span class="rp-big">4,8<small> / 5</small></span>' +
          '<p>Ainda não publicamos aqui um depoimento específico deste serviço — mas nossa nota agregada no Google é <strong>4,8</strong>, com <strong>+1.200 avaliações</strong> reais de clientes.</p>' +
          '</div>';
      }
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

})();
