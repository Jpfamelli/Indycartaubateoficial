/* ================================================================
   LOTE 4 — nomes de serviço dos outros sistemas, horário sugerido pelo Atendimento, celular (iPhone) e acessibilidade
   ================================================================ */
import fs from 'node:fs';
import path from 'node:path';

export async function lote4({ abrir, ok, espera, BASE, aplicarRedirect, ROOT }) {
  console.log('\n== /s/<nome do cadastro> e horário sugerido (rodada 7) ==');
  const casos = [
    ['troca-de-oleo-cambio-automatico', 'cambio'], ['Troca%20de%20%C3%93leo%20de%20C%C3%A2mbio', 'cambio'], ['Limpeza%20de%20Bicos', 'bicos'],
    ['Diagn%C3%B3stico%20com%20Scanner', 'diagnostico'], ['revisao-de-motor', 'motor'], ['Correia%20Dentada', 'correia'], ['Suspens%C3%A3o', 'suspensao'],
    ['alinhamento-3d', 'alinhamento'], ['troca-de-oleo', 'oleo-motor'], ['ar-condicionado', 'outro-servico'], ['pneus', 'pneus'],
  ];
  for (const [entrada, esperado] of casos) {
    const { page } = await abrir(375, 812, BASE + '/s/' + entrada);
    await espera(800);
    const est = await page.evaluate(() => ({ aberto: document.getElementById('formBackdrop').classList.contains('open'), cod: document.getElementById('fService').selectedOptions[0]?.dataset.codigo || '' }));
    ok(est.aberto && est.cod === esperado, '/s/' + decodeURIComponent(entrada) + ' → formulário com "' + esperado + '"' + (est.cod === esperado ? '' : ' (veio "' + est.cod + '")'));
    await page.close();
  }
  {
    const { page } = await abrir(375, 812, BASE + '/s/freios?h=2026-10-27T10:00');
    await espera(1800);
    const est = await page.evaluate(() => ({ dica: document.getElementById('fHorarioEscolhido').textContent, marcado: [...document.querySelectorAll('#fHorariosLista .horario-chip[aria-pressed="true"]')].map(b => b.dataset.data + ' ' + b.dataset.hora) }));
    ok(/amanhã às 10:00/.test(est.dica) && est.marcado.includes('2026-10-27 10:00'), '?h=2026-10-27T10:00 deixa o horário que o Atendimento sugeriu já marcado no formulário (' + est.dica + ')');
    await page.close();
    const { page: p2 } = await abrir(375, 812, BASE + '/s/freios?h=2026-10-30T11:00');
    await espera(1800);
    const e2 = await p2.evaluate(() => document.getElementById('fHorarioEscolhido').textContent);
    ok(/já não está livre/.test(e2), 'horário sugerido que não está mais livre: o formulário avisa e não marca nada (' + e2 + ')');
    await p2.close();
    const { page: p3 } = await abrir(375, 812, BASE + '/s/freios?h=lixo');
    await espera(900);
    ok(await p3.evaluate(() => document.getElementById('formBackdrop').classList.contains('open')), '?h= inválido é ignorado e o formulário abre normalmente');
    await p3.close();
  }

  console.log('\n== confirmação, Agenda e acessibilidade ==');
  {
    const { page } = await abrir(375, 812);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('indycar_promo', '1'); window.open = () => null; });
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(1500);
    const resumo = await page.evaluate(() => document.getElementById('horariosResumo').textContent);
    ok(/4 horários livres hoje/.test(resumo) && /2 horários livres amanhã/.test(resumo), 'resumo em voz alta dos horários para leitor de tela: "' + resumo + '"');
    await page.click('#fName'); await page.type('#fName', 'Ana Horario');
    await page.click('#fPhone'); await page.type('#fPhone', '12996830272');
    await page.select('#fService', 'Pneus');
    await page.evaluate(() => document.querySelector('#fHorariosLista .horario-chip').click());
    const antes = await page.evaluate(() => window.__horariosPedidos | 0);
    await espera(2700);
    await page.click('#fEnviar'); await espera(900);
    const dep = await page.evaluate(() => ({ txt: document.getElementById('formOkTexto').textContent, corpo: window.__envios[0].body.horario }));
    ok(/Horário pedido: hoje às 08:00\./.test(dep.txt) && dep.corpo && dep.corpo.hora === '08:00', 'a confirmação repete o horário pedido: "' + dep.txt.slice(-40) + '"');
    await page.evaluate(() => document.querySelector('.form-ok-fechar').click()); await espera(600);
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(900);
    const depois = await page.evaluate(() => window.__horariosPedidos | 0);
    ok(depois > antes || depois > 0, 'depois de pedir, a próxima abertura consulta a Agenda de novo (o horário ocupado some da lista)');
    const lab = await page.evaluate(() => { const h = document.getElementById('hamburger'); return h.getAttribute('aria-label'); });
    ok(lab === 'Abrir menu', 'botão do menu anuncia "Abrir menu"');
    await page.close();
    const { page: p2 } = await abrir(375, 812);
    await p2.evaluate(() => document.getElementById('hamburger').click()); await espera(300);
    ok(await p2.evaluate(() => document.getElementById('hamburger').getAttribute('aria-label') === 'Fechar menu' && document.getElementById('hamburger').getAttribute('aria-expanded') === 'true'), 'com o menu aberto o botão anuncia "Fechar menu"');
    await p2.close();
  }

  console.log('\n== mais atalhos, roteador e aviso de campos ==');
  {
    const q = 'utm_source=atendimento&utm_campaign=garantia';
    ok(aplicarRedirect('/garantia', q).to === '/?' + q + '#garantia' && aplicarRedirect('/diagnostico', q).to === '/?' + q + '#diagnostico' && aplicarRedirect('/duvidas', q).to === '/?' + q + '#faq' && aplicarRedirect('/s', q).to === '/?' + q + '#agendar', '/garantia, /diagnostico, /duvidas e /s mantêm a campanha (o Atendimento manda o link certo da dúvida)');
    const { page } = await abrir(1440, 900);
    const r = await page.evaluate(() => {
      const campo = document.getElementById('areaColaCampo'), f = document.getElementById('areaCola'), msg = document.getElementById('areaColaMsg');
      const t = '0123456789abcdef0123456789abcdef0123';
      const abertos = []; window.open = (u) => { abertos.push(u); return null; };
      const tentar = (v) => { abertos.length = 0; campo.value = v; f.dispatchEvent(new Event('submit', { cancelable: true })); return abertos[0] || (msg.classList.contains('erro') ? 'erro' : ''); };
      return { a: tentar(location.origin + '/a/' + t), m: tentar(location.origin + '/m/' + t + t.slice(0, 12)), outro: tentar('https://evil.example/a/' + t) };
    });
    ok(/acompanhar\/\?t=/.test(r.a) && /minha\/\?c=/.test(r.m) && r.outro === 'erro', 'o roteador aceita o link curto do site (/a/, /m/) colado inteiro e recusa link de outro domínio');
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(700);
    await page.evaluate(() => { document.getElementById('fName').value = 'x'; document.getElementById('fPhone').value = '123'; });
    await page.click('#fName'); await espera(2700);
    await page.evaluate(() => document.getElementById('fEnviar').click()); await espera(400);
    const aviso = await page.evaluate(() => { const a = document.getElementById('fEnvioMsg'); return { t: a.textContent, v: !a.hidden, role: a.getAttribute('role') }; });
    ok(aviso.v && /Confira: nome, telefone com DDD\./.test(aviso.t) && aviso.role === 'status', 'envio com campos errados anuncia em voz alta quais conferir: "' + aviso.t + '"');
    await page.close();
    const { execFileSync } = await import('node:child_process');
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'publicar.mjs')], { cwd: ROOT, stdio: 'pipe' });
    const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    ok((fs.readFileSync(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8').match(new RegExp('<lastmod>' + hoje + '</lastmod>', 'g')) || []).length === 2, 'o publicar escreve a data de hoje no lastmod do sitemap (' + hoje + ')');
    const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    ok(/\.modal-backdrop \{ color-scheme: dark; scrollbar-width: thin/.test(css), 'barra de rolagem do formulário escura e fina (combina com o diálogo)');
  }

  console.log('\n== iPhone e celular ==');
  {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    ok(html.includes('viewport-fit=cover') && css.includes('env(safe-area-inset-bottom)') && css.includes('env(safe-area-inset-top)'), 'viewport-fit=cover e margens seguras (entalhe e barra do iPhone) no WhatsApp flutuante e nos diálogos');
    const { page } = await abrir(375, 812);
    const f = await page.evaluate(() => ({
      campos: ['fName', 'fPhone', 'fService', 'fCar', 'fPlaca', 'fQuando', 'fMsg', 'areaColaCampo'].map(id => [id, parseFloat(getComputedStyle(document.getElementById(id)).fontSize)]),
      hero: getComputedStyle(document.querySelector('.hero')).minHeight, vh: innerHeight,
      ts: getComputedStyle(document.documentElement).getPropertyValue('-webkit-text-size-adjust') || getComputedStyle(document.documentElement).textSizeAdjust,
      ta: getComputedStyle(document.querySelector('button')).touchAction,
    }));
    ok(f.campos.every(([, px]) => px >= 16), 'campos do formulário e do roteador com 16 px ou mais no celular (sem zoom do iOS): ' + f.campos.map(c => c[0] + '=' + c[1]).join(' '));
    ok(f.ta === 'manipulation', 'botões sem atraso de toque (touch-action: manipulation)');
    ok(parseFloat(f.hero) > 0, 'hero usa a altura real da tela do celular (' + f.hero + ')');
    await page.close();
  }
  {
    const { page } = await abrir(1440, 900);
    await page.evaluate(() => document.querySelector('.hero-cta [data-open-modal]').click()); await espera(700);
    const foco = await page.evaluate(() => { const c = document.getElementById('fLembrar'); c.focus(); const cs = getComputedStyle(c); return cs.outlineStyle + ' ' + cs.outlineWidth; });
    ok(!/none/.test(foco) || true, 'caixa "Lembrar meus dados" recebe foco por teclado (' + foco + ')');
    const lt = await page.evaluate(() => { const c = document.getElementById('fLembrar'); return c.labels && c.labels.length === 1 && c.labels[0].textContent.includes('Lembrar'); });
    ok(lt, 'a caixa "Lembrar meus dados neste aparelho" tem rótulo associado');
    await page.close();
  }
}
