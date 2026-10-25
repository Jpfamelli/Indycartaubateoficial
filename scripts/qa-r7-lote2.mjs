/* ================================================================
   LOTE 2 — toque no celular, modal inerte, rascunho, lembrar dados, fila, pedido recente, feriado, economia de dados
   (este arquivo é incluído pelo qa-r7.mjs: usa abrir, ok, espera e BASE de lá)
   ================================================================ */
export async function lote2({ abrir, ok, espera, BASE }) {
  console.log('\n== toque no celular (375 px) ==');
  {
    const { page } = await abrir(375, 812);
    await page.evaluate(async () => { document.documentElement.classList.add('cv-off'); for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
    const pequenos = await page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden],[aria-hidden="true"],.campo-isca'); };
      return [...document.querySelectorAll('a[href],button,select,input:not([type=hidden]):not([type=checkbox]),textarea')].filter(vis).filter(e => {
        const r = e.getBoundingClientRect();
        return r.height < 43.5 || r.width < 43.5;
      }).map(e => e.tagName + '.' + (e.className || '') + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height) + ' "' + (e.textContent || '').trim().slice(0, 24) + '"');
    });
    ok(pequenos.length === 0, 'todo link, botão e campo visível tem pelo menos 44x44 px no celular' + (pequenos.length ? ': ' + pequenos.slice(0, 6).join(' | ') : ''));
    const fonte = await page.evaluate(() => [...document.querySelectorAll('main *, footer *')].filter(e => e.getBoundingClientRect().width > 0 && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12 && getComputedStyle(e).display !== 'none' && !e.closest('[hidden],[aria-hidden="true"]')).slice(0, 4).map(e => e.className + ' ' + getComputedStyle(e).fontSize));
    ok(fonte.length === 0, 'nenhum texto visível abaixo de 12 px' + (fonte.length ? ': ' + fonte.join(', ') : ''));
    await page.close();
  }

  console.log('\n== formulário alcançável em telas baixas ==');
  for (const [w, h] of [[375, 667], [375, 812], [1440, 700]]) {
    const { page } = await abrir(w, h);
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(1500);
    const r = await page.evaluate(() => {
      const bd = document.getElementById('formBackdrop'); const topo = document.querySelector('.form-modal').getBoundingClientRect().top;
      const rola = bd.scrollHeight > bd.clientHeight; bd.scrollTop = bd.scrollHeight;
      const b = document.getElementById('fEnviar').getBoundingClientRect();
      return { topo, rola, fundo: b.bottom, vh: innerHeight, overflow: getComputedStyle(bd).overflowY };
    });
    ok(r.topo >= 0 && r.fundo <= r.vh + 1 && r.overflow === 'auto', '[' + w + 'x' + h + '] formulário: topo não é cortado e o botão "Pedir meu horário" fica alcançável rolando o fundo (topo ' + Math.round(r.topo) + ', botão ' + Math.round(r.fundo) + ' de ' + r.vh + ')');
    await page.close();
  }

  console.log('\n== modal inerte, rascunho e lembrar dados ==');
  const abrirForm = (page) => page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click());
  async function digitar(page, nome, tel, carro) {
    await page.click('#fName'); await page.type('#fName', nome);
    await page.click('#fPhone'); await page.type('#fPhone', tel);
    if (carro) { await page.click('#fCar'); await page.type('#fCar', carro); }
  }
  for (const w of [375, 1440]) {
    const { page } = await abrir(w, 812);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.removeItem('indycar_rascunho'); });
    await abrirForm(page); await espera(500);
    const inerte = await page.evaluate(() => ['#navbar', 'main', 'footer', 'aside'].map(q => document.querySelector(q).hasAttribute('inert')));
    ok(inerte.every(Boolean), '[' + w + '] formulário aberto: menu, conteúdo, rodapé e botões flutuantes ficam inertes');
    await page.keyboard.press('Escape'); await espera(400);
    const livre = await page.evaluate(() => ['#navbar', 'main', 'footer', 'aside'].map(q => document.querySelector(q).hasAttribute('inert')));
    ok(livre.every(v => !v), '[' + w + '] fechou: nada fica inerte e a página volta a responder');
    await abrirForm(page); await espera(400);
    await digitar(page, 'Maria Teste', '12996830272', 'Civic 2018');
    await page.type('#fMsg', 'barulho ao frear');
    await page.reload({ waitUntil: 'networkidle2' }); await espera(500);
    const volta = await page.evaluate(() => ({ nome: fName.value, tel: fPhone.value, carro: fCar.value, msg: fMsg.value, conta: fMsgConta.textContent }));
    ok(volta.nome === 'Maria Teste' && volta.tel === '(12) 99683-0272' && volta.carro === 'Civic 2018' && volta.msg === 'barulho ao frear', '[' + w + '] rascunho: recarregar a página não perde o que foi digitado');
    ok(volta.conta === '16/500', '[' + w + '] o contador de caracteres acompanha o rascunho (' + volta.conta + ')');
    await page.close();
  }
  {
    const { page } = await abrir(375, 812);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('indycar_promo', '1'); window.open = () => null; });
    await abrirForm(page); await espera(400);
    await digitar(page, 'Joana Lembrada', '12996830272', 'Onix 2020');
    await page.select('#fService', 'Freios (pastilhas e discos)');
    await page.click('#fLembrar');
    await espera(2700);
    await page.click('#fEnviar'); await espera(900);
    const env = await page.evaluate(() => ({ n: window.__envios.length, corpo: window.__envios[0] && window.__envios[0].body, eu: JSON.parse(localStorage.getItem('indycar_eu') || 'null'), rasc: sessionStorage.getItem('indycar_rascunho'), pedido: JSON.parse(localStorage.getItem('indycar_pedido') || 'null') }));
    ok(env.n === 1 && env.corpo.nome === 'Joana Lembrada' && env.corpo.telefone === '12996830272', 'pedido segue para a Edge Function com nome e telefone limpos');
    ok(env.eu && env.eu.nome === 'Joana Lembrada' && env.eu.placa === '' && env.eu.carro === 'Onix 2020', 'com "Lembrar meus dados" marcado, nome, telefone e carro ficam só neste aparelho (localStorage)');
    ok(env.rasc === null, 'enviou: o rascunho da sessão é apagado');
    ok(env.pedido && env.pedido.protocolo === 'QA1234', 'o protocolo do pedido fica guardado por 36 h neste aparelho');
    await page.reload({ waitUntil: 'networkidle2' }); await espera(500);
    const depois = await page.evaluate(() => ({ nome: fName.value, tel: fPhone.value, carro: fCar.value, marcado: fLembrar.checked, limpar: !fEsquecer.hidden, pedido: !areaPedido.hidden, pedidoTxt: areaPedido.textContent, link: [...areaPedido.querySelectorAll('a')].map(a => a.href) }));
    ok(depois.nome === 'Joana Lembrada' && depois.tel === '(12) 99683-0272' && depois.carro === 'Onix 2020' && depois.marcado && depois.limpar, 'na visita seguinte o formulário já vem com os dados lembrados e o botão "Não sou eu · limpar"');
    ok(depois.pedido && /QA1234/.test(depois.pedidoTxt) && depois.link.some(h => h.startsWith('https://indycar-patio.netlify.app/acompanhar')), 'Área do Cliente mostra "Seu pedido QA1234" com o link para Acompanhar meu carro');
    await page.evaluate(() => fEsquecer.click());
    const apagado = await page.evaluate(() => ({ nome: fName.value, eu: localStorage.getItem('indycar_eu'), marcado: fLembrar.checked }));
    ok(apagado.nome === '' && apagado.eu === null && !apagado.marcado, '"Não sou eu · limpar" apaga o campo e o que estava lembrado');
    await page.close();
  }

  console.log('\n== fila de reenvio sem rede ==');
  {
    const { page } = await abrir(375, 812, BASE + '/', { antes: 'window.__fetchFalha = true;' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('indycar_promo', '1'); window.__aberturas = []; window.open = (u) => { window.__aberturas.push(u); return null; }; });
    await abrirForm(page); await espera(400);
    await digitar(page, 'Pedro Sem Rede', '12996830272', 'Gol 2015');
    await page.select('#fService', 'Pneus');
    await espera(2700);
    await page.click('#fEnviar'); await espera(1200);
    const a = await page.evaluate(() => ({ wa: window.__aberturas.length, fila: JSON.parse(localStorage.getItem('indycar_fila') || '[]'), pedido: localStorage.getItem('indycar_pedido'), envios: window.__envios.length }));
    ok(a.wa === 1 && a.fila.length === 1 && a.fila[0].pedido.nome === 'Pedro Sem Rede', 'sem rede: abre o WhatsApp e guarda o pedido na fila do aparelho');
    ok(a.pedido === null, 'sem protocolo não finge que o pedido chegou (nada em "Seu pedido")');
    await page.evaluate(() => { window.__fetchFalha = false; window.dispatchEvent(new Event('online')); });
    await espera(1200);
    const b = await page.evaluate(() => ({ fila: localStorage.getItem('indycar_fila'), envios: window.__envios.map(e => e.body.nome) }));
    ok(b.fila === null && b.envios.length === 2 && b.envios[1] === 'Pedro Sem Rede', 'rede voltou: o pedido guardado vai ao banco uma vez e a fila esvazia (fila=' + b.fila + ', envios=' + b.envios.join('|') + ')');
    await page.close();
  }

  console.log('\n== feriado, economia de dados e links do cliente ==');
  const RELOGIO = (iso) => `(() => { const R = Date; const fixo = new R('${iso}').getTime(); class F extends R { constructor(...a) { if (a.length === 0) super(fixo); else super(...a); } static now() { return fixo; } } window.Date = F; })();`;
  {
    const { page } = await abrir(375, 812, BASE + '/', { antes: RELOGIO('2026-12-25T15:00:00-03:00') });
    await espera(600);
    const chip = await page.evaluate(() => ({ txt: statusAberto.textContent.replace(/\s+/g, ' ').trim(), feriado: statusAberto.classList.contains('feriado'), oculto: statusAberto.hidden }));
    ok(!chip.oculto && chip.feriado && /feriado \(Natal\)/.test(chip.txt) && /confirme no WhatsApp/.test(chip.txt), 'em 25/12 o chip não diz "Aberto agora": ' + chip.txt);
    await page.close();
    const { page: p2 } = await abrir(375, 812, BASE + '/', { antes: RELOGIO('2026-10-28T15:00:00-03:00') });
    await espera(600);
    const normal = await p2.evaluate(() => statusAberto.textContent.replace(/\s+/g, ' ').trim());
    ok(/Aberto agora/.test(normal), 'quarta-feira comum às 15h continua "Aberto agora"');
    await p2.close();
    const { page: p3 } = await abrir(375, 812, BASE + '/', { antes: RELOGIO('2026-11-14T10:00:00-03:00') + "window.__dias = [{ data: '2026-11-15', rotulo: 'dom 15/11', horas: ['08:00'] }, { data: '2026-11-16', rotulo: 'seg 16/11', horas: ['08:00', '09:00'] }];" });
    await p3.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(1500);
    const hor = await p3.evaluate(() => ({ marca: [...document.querySelectorAll('#fHorariosLista .feriado')].map(e => e.textContent), nota: !!document.querySelector('#fHorariosLista .horarios-nota'), aria: document.querySelector('#fHorariosLista .horario-chip').getAttribute('aria-label') }));
    ok(hor.marca.length === 1 && hor.nota && /feriado/.test(hor.aria), 'horário em feriado (15/11) vem marcado como feriado, com aviso e nome acessível');
    await p3.close();
  }
  {
    const { page } = await abrir(375, 812, BASE + '/', { antes: "Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } });" });
    await espera(6500);
    const eco = await page.evaluate(() => ({ lite: document.body.classList.contains('perf-lite'), poupar: document.documentElement.classList.contains('poupar-dados'), pedidos: window.__horariosPedidos | 0 }));
    ok(eco.lite && eco.poupar, 'Save-Data ligado: efeitos pesados desligados desde o início (perf-lite)');
    await page.close();
  }
  {
    const { page } = await abrir(1440, 900);
    const links = await page.evaluate(() => ({ hero: [...document.querySelectorAll('.hero-cliente a')].map(a => a.href), ok: [...document.querySelectorAll('.form-ok-dica a')].map(a => a.href), rel: [...document.querySelectorAll('.hero-cliente a, .form-ok-dica a')].every(a => /noopener/.test(a.rel)) }));
    ok(links.hero.includes('https://indycar-patio.netlify.app/acompanhar/') && links.hero.includes('https://indycar-patio.netlify.app/minha/'), 'hero: "Já é cliente? Acompanhar meu carro · Minha IndyCar" leva direto ao Pátio');
    ok(links.ok.length === 2 && links.ok[0].includes('/acompanhar/') && links.rel, 'confirmação do pedido: links para Acompanhar meu carro e Minha IndyCar');
    await page.close();
  }
}
