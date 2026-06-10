/* ====================================================================
   INDYCAR — script.js
   Tudo em JS puro: navbar, reveals, contadores, canvas de velocidade,
   carrossel de depoimentos, modais, prova social e cursor interativo.
   ==================================================================== */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ================================================================
     1. NAVBAR — muda de estilo ao rolar + barra de progresso
     ================================================================ */
  const navbar = $('#navbar');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');

  const bgGrid = $('#bgGrid');
  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    toTop.classList.toggle('show', y > 600);

    // progresso de leitura
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

    // parallax sutil do grid de fundo
    if (bgGrid) bgGrid.style.transform = `translateY(${y * 0.08}px)`;
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

  if (hasFinePointer) {
    // brilho de cursor com seguimento SUAVE (lerp) -> sensação premium
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', (e) => { glow.style.opacity = '1'; tx = e.clientX; ty = e.clientY; });
    window.addEventListener('pointerleave', () => (glow.style.opacity = '0'));
    (function followGlow() {
      gx += (tx - gx) * 0.15; gy += (ty - gy) * 0.15;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      requestAnimationFrame(followGlow);
    })();

    // SPOTLIGHT que segue o cursor dentro de cada card
    $$('.service-card, .review-card').forEach(card => {
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
     6. HERO CANVAS — REDE DE PARTÍCULAS INTERATIVA (reage ao mouse)
        Pontos derivam para a direita (sensação de velocidade), se
        conectam por linhas quando próximos e reagem ao cursor.
     ================================================================ */
  const canvas = $('#heroCanvas');
  const ctx = canvas.getContext('2d');
  let nodes = [], streaks = [], W, H, rafId, frame = 0;
  const mouse = { x: -9999, y: -9999, active: false };

  function resizeCanvas() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  function makeNodes() {
    const count = Math.min(120, Math.max(40, Math.floor((W * H) / 11000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0.3 + Math.random() * 1.1,         // deriva p/ direita = velocidade
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
      gold: Math.random() > 0.78
    }));
  }

  function spawnStreak() {
    streaks.push({
      x: -60, y: Math.random() * H * 0.9,
      len: 120 + Math.random() * 200,
      speed: 9 + Math.random() * 11,
      gold: Math.random() > 0.6,
      life: 1
    });
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    // ---- estrelas-cadentes (riscos de velocidade) ----
    if (frame % 48 === 0 && streaks.length < 7) spawnStreak();
    for (let s = streaks.length - 1; s >= 0; s--) {
      const st = streaks[s];
      st.x += st.speed;
      const col = st.gold ? '255,255,255' : '229,9,20';
      const grad = ctx.createLinearGradient(st.x - st.len, st.y, st.x, st.y);
      grad.addColorStop(0, `rgba(${col},0)`);
      grad.addColorStop(1, `rgba(${col},.85)`);
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(st.x - st.len, st.y); ctx.lineTo(st.x, st.y); ctx.stroke();
      // cabeça brilhante
      ctx.fillStyle = `rgba(${col},.95)`; ctx.shadowColor = `rgba(${col},.9)`; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(st.x, st.y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (st.x - st.len > W) streaks.splice(s, 1);
    }

    // ---- rede de partículas ----
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];

      // interação: empurra os pontos para longe do cursor
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 24000 && d2 > 0) {
          const f = (1 - d2 / 24000) * 1.1, d = Math.sqrt(d2);
          p.x += (dx / d) * f; p.y += (dy / d) * f;
        }
      }

      // movimento + wrap nas bordas
      p.x += p.vx; p.y += p.vy;
      if (p.x > W + 6) { p.x = -6; p.y = Math.random() * H; }
      if (p.y < -6) p.y = H + 6;
      if (p.y > H + 6) p.y = -6;

      const color = p.gold ? '255,255,255' : '229,9,20';
      // ponto nítido (glow vem do halo do cursor + estrelas-cadentes, mais leve)
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color},.95)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // linhas entre vizinhos próximos
      for (let j = i + 1; j < nodes.length; j++) {
        const q = nodes[j];
        const dx = p.x - q.x, dy = p.y - q.y, dist = dx * dx + dy * dy;
        if (dist < 15000) {
          ctx.strokeStyle = `rgba(${color},${0.28 * (1 - dist / 15000)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }

      // linha conectando ao cursor (feedback interativo)
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = dx * dx + dy * dy;
        if (dist < 22000) {
          ctx.strokeStyle = `rgba(229,9,20,${0.5 * (1 - dist / 22000)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    // halo ao redor do cursor (mais forte)
    if (mouse.active) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140);
      g.addColorStop(0, 'rgba(229,9,20,.26)'); g.addColorStop(.5, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(229,9,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2); ctx.fill();
    }

    rafId = requestAnimationFrame(drawCanvas);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    resizeCanvas(); makeNodes(); drawCanvas();
    window.addEventListener('resize', () => { resizeCanvas(); makeNodes(); });

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

  function startAuto() { autoTimer = setInterval(next, 3800); }
  function restartAuto() { clearInterval(autoTimer); startAuto(); }
  startAuto();

  // pausa no hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', startAuto);
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

  const openEl  = (el) => { el.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeEl = (el) => {
    el.classList.remove('open');
    if (!promoBackdrop.classList.contains('open') && !formBackdrop.classList.contains('open'))
      document.body.style.overflow = '';
  };

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

  // promo aparece após 3s (uma vez por sessão)
  if (!sessionStorage.getItem('indycar_promo')) {
    setTimeout(() => {
      if (!formBackdrop.classList.contains('open')) openEl(promoBackdrop);
      sessionStorage.setItem('indycar_promo', '1');
    }, 3000);
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
    ['⭐', 'Rodrigo avaliou 5★', 'há 2 minutos no Google'],
    ['🛞', 'Família Souza', 'comprou Pneus e fez Alinhamento 3D na Toro'],
    ['🏁', 'Thiago, do Parque Paduan', 'aprovou o orçamento do Civic'],
    ['🚗', 'Juliana, de Pindamonhangaba', 'usou o Leva e Traz com o Kwid'],
    ['🔩', 'Fernando, de Caçapava', 'trocou a Correia Dentada do Palio'],
    ['🧰', 'Bruna, do Jardim das Nações', 'fez Diagnóstico com Scanner no Creta'],
    ['⭐', 'Carlos avaliou 5★', 'há 8 minutos no Google'],
    ['🛠️', 'Mariana, de Taubaté', 'trocou a Embreagem do Uno'],
    ['💧', 'Eduardo, da Estiva', 'fez Limpeza de Bicos no Argo'],
    ['🔧', 'Vanessa, do Gurilândia', 'fez Revisão de Suspensão do Mobi'],
    ['🏎️', 'Rafael, de Tremembé', 'fez Revisão de Motor no Cruze'],
    ['🛞', 'Aline, do Independência', 'fez Balanceamento no Sandero'],
    ['🚙', 'Gustavo, de São José dos Campos', 'trouxe a Compass para revisão'],
    ['⭐', 'Tatiane avaliou 5★', 'há 15 minutos no Google'],
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
    ['⭐', 'Vinícius avaliou 5★', 'há 21 minutos no Google'],
    ['🏎️', 'Adriana, da Cidade Jardim', 'fez Revisão de Motor no Yaris'],
    ['🚗', 'Paulo, de Lorena', 'usou o Leva e Traz com a S10'],
    ['🧰', 'Letícia, do Bonfim', 'fez Diagnóstico com Scanner no Nivus'],
    ['🛠️', 'Roberto, do Jardim Eulália', 'trocou a Embreagem da Saveiro'],
    ['⚙️', 'Fabiana, de Campos Elíseos', 'fez diálise no câmbio do Kicks'],
    ['🛞', 'Henrique, da Vila Aparecida', 'fez Alinhamento 3D no Fastback'],
    ['🔧', 'Natália, do Jd. Maria Augusta', 'fez Revisão de Suspensão do Spin'],
    ['⭐', 'Alexandre avaliou 5★', 'há 27 minutos no Google'],
    ['🛢️', 'Roberta, de Redenção da Serra', 'fez Troca de Óleo na Ranger'],
    ['🛑', 'Daniel, da Água Quente', 'resolveu os Freios do Pulse'],
    ['🏁', 'Michele, de Jambeiro', 'fechou orçamento e parcelou em 10x'],
    ['🔋', 'Sérgio, da Esplanada', 'fez Diagnóstico no Corolla Cross'],
    ['🚙', 'Beatriz, de Monteiro Lobato', 'trouxe o Tiguan para revisão'],
  ];
  let proofIdx = 0, proofStopped = false;

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
    if (proofStopped) return;
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
    if (!proofStopped) setTimeout(loop, 24000);
  }, 12000);

  spClose.addEventListener('click', () => { proofStopped = true; sp.classList.remove('show'); });

  /* ================================================================
     11. TOAST genérico (reaproveita o componente de prova social)
     ================================================================ */
  function showToast(emoji, title, text) {
    proofStopped = true;            // pausa a rotação para não conflitar
    spEmoji.textContent = emoji;
    spName.textContent = title;
    spAction.textContent = text;
    sp.classList.add('show');
    setTimeout(() => { sp.classList.remove('show'); proofStopped = false; }, 5000);
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
     14. RIPPLE — onda ao clicar em qualquer botão
     ================================================================ */
  $$('.btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.left = (e.clientX - r.left) + 'px';
      span.style.top = (e.clientY - r.top) + 'px';
      btn.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  });

  /* ================================================================
     15. CONFETE de bandeira quadriculada (chamado no envio do form)
     ================================================================ */
  function launchConfetti() {
    if (reduceMotion) return;
    const colors = ['#e50914', '#d4a853', '#ffffff', 'checker'];
    for (let i = 0; i < 72; i++) {
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
     16. PARALAXE leve no hero (camadas seguem o mouse = profundidade)
     ================================================================ */
  if (hasFinePointer) {
    const heroEl = $('#hero');
    const content = $('.hero-content');
    const lines = $('.diagonal-lines');
    heroEl.addEventListener('pointermove', e => {
      const cx = e.clientX / innerWidth - 0.5;
      const cy = e.clientY / innerHeight - 0.5;
      if (content) content.style.transform = `translate(${cx * 14}px, ${cy * 10}px)`;
      if (lines) lines.style.transform = `translate(${cx * -34}px, ${cy * -22}px)`;
    });
    heroEl.addEventListener('pointerleave', () => {
      if (content) content.style.transform = '';
      if (lines) lines.style.transform = '';
    });
  }

})();
