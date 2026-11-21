// Regras puras da Edge Function site-lead (horários livres, placa, links da equipe). Roda com `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { proximosHorarios, horarioLivre, extrairPlaca, placaDoCampo, linksDaEquipe, rotuloHorario, agoraSP, venceEm } from '../supabase/functions/site-lead/logica.ts';

// 2026-10-21 é quarta-feira.
const base = (min = 7 * 60) => ({ agora: { data: '2026-10-21', min }, agendamentos: [], capacidade: 1 });

test('hoje só a partir de 30 min de agora, espaçado e dentro do expediente', () => {
  const r = proximosHorarios({ ...base(10 * 60), dias: 1 });
  assert.equal(r[0].rotulo, 'hoje');
  assert.deepEqual(r[0].horas, ['10:30', '12:30', '14:30', '16:30']);
});
test('domingo não abre e o último começo é 17h', () => {
  assert.equal(horarioLivre('2026-10-25', '09:00', base()), false);
  assert.equal(horarioLivre('2026-10-22', '17:00', base()), true);
  assert.equal(horarioLivre('2026-10-22', '17:30', base()), false);
  assert.equal(horarioLivre('2026-10-22', '07:30', base()), false);
  assert.equal(horarioLivre('2026-10-22', '09:15', base()), false);
});
test('horário ocupado (e status que seguram a casa) some; cancelado e não veio liberam', () => {
  const ags = [
    { data: '2026-10-22', hora: '08:00:00', status: 'confirmado' },
    { data: '2026-10-22', hora: '08:30', status: 'cancelado' },
    { data: '2026-10-22', hora: '09:00', status: 'nao_veio' },
  ];
  const o = { ...base(), agendamentos: ags };
  assert.equal(horarioLivre('2026-10-22', '08:00', o), false);
  assert.equal(horarioLivre('2026-10-22', '08:30', o), true);
  assert.equal(horarioLivre('2026-10-22', '09:00', o), true);
  assert.equal(horarioLivre('2026-10-22', '08:00', { ...o, capacidade: 2 }), true);
});
test('dia lotado pula para o próximo e a resposta só tem data e hora', () => {
  const ags = [];
  for (let t = 480; t <= 1020; t += 30) ags.push({ data: '2026-10-21', hora: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, status: 'confirmado' });
  const r = proximosHorarios({ ...base(), agendamentos: ags, dias: 2 });
  assert.equal(r[0].rotulo, 'amanhã');
  assert.deepEqual(Object.keys(r[0]).sort(), ['data', 'horas', 'rotulo']);
});
test('pula o domingo', () => {
  const r = proximosHorarios({ agora: { data: '2026-10-24', min: 18 * 60 }, agendamentos: [], capacidade: 1, dias: 2 });
  assert.equal(r[0].data, '2026-10-26');
});
test('placa antiga, Mercosul e campo próprio', () => {
  assert.equal(extrairPlaca('Civic 2018 abc-1d23'), 'ABC1D23');
  assert.equal(extrairPlaca('Gol ABC1234 prata'), 'ABC1234');
  assert.equal(extrairPlaca('Corolla 2020'), null);
  assert.equal(extrairPlaca('HB20 2019'), null);
  assert.equal(placaDoCampo('abc 1d23'), 'ABC1D23');
  assert.equal(placaDoCampo('123'), null);
});
test('links da equipe levam telefone em dígitos e nome codificado', () => {
  const l = linksDaEquipe({ leadId: 'abc', telefone: '12996830272', nome: 'João & Cia' });
  assert.equal(l.conversa, 'https://indycar-agendamentos.onrender.com/atendimento/?tel=12996830272');
  assert.match(l.orcamento, /#\/cotacao\?tel=12996830272&nome=Jo%C3%A3o%20%26%20Cia$/);
  assert.equal(l.lead, 'https://indycar-agendamentos.onrender.com/crm/?lead=abc');
});
test('rótulo e fuso', () => {
  assert.equal(rotuloHorario('2026-10-22', '08:30'), 'qui 22/10 às 08:30');
  assert.deepEqual(agoraSP(new Date('2026-10-21T15:05:00Z')), { data: '2026-10-21', min: 12 * 60 + 5 });
});
test('todo código do formulário tem serviço no cadastro (exceto "outro")', async () => {
  const { NOME_NO_CATALOGO } = await import('../supabase/functions/site-lead/logica.ts');
  const html = (await import('node:fs')).readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const codigos = [...html.matchAll(/<option data-codigo="([a-z-]+)"/g)].map(m => m[1]).filter(c => c !== 'outro-servico');
  assert.equal(codigos.length, 11);
  for (const c of codigos) assert.ok(NOME_NO_CATALOGO[c], 'sem serviço no cadastro: ' + c);
});
test('a tarefa vence antes do horário pedido (hoje) e nunca antes de 15 min', () => {
  const agora = Date.parse('2026-10-21T13:00:00-03:00');
  assert.equal(venceEm(agora, null, false), agora + 2 * 3600_000);
  assert.equal(venceEm(agora, { data: '2026-10-21', hora: '14:00' }, true), Date.parse('2026-10-21T13:30:00-03:00'));
  assert.equal(venceEm(agora, { data: '2026-10-21', hora: '13:30' }, true), agora + 15 * 60_000);
  assert.equal(venceEm(agora, { data: '2026-10-21', hora: '16:30' }, true), agora + 2 * 3600_000);
  assert.equal(venceEm(agora, { data: '2026-10-22', hora: '08:00' }, true), agora + 2 * 3600_000);
  assert.equal(venceEm(agora, { data: '2026-10-21', hora: '14:00' }, false), agora + 2 * 3600_000);
});
test('texto do site: sem caracteres de controle ou invisíveis, mensagem mantém as quebras', async () => {
  const { semControle } = await import('../supabase/functions/site-lead/logica.ts');
  assert.equal(semControle('Jo​ão\u0000  Silva‮'), 'Jo ão Silva');
  assert.equal(semControle('  linha 1\n\n\n\nlinha 2\t ​ fim  ', true), 'linha 1\n\nlinha 2 fim');
  assert.equal(semControle('a\nb'), 'a b');
});
test('horário a mais de 30 dias não vale', () => {
  assert.equal(horarioLivre('2026-11-20', '10:00', base()), true);
  assert.equal(horarioLivre('2026-11-23', '10:00', base()), false);
});

/* ---------------- Rodada 8: origem do contato (rastreio do anúncio até o formulário) ---------------- */
const { origemDoPedido, aplicarOrigem, RPC_ORIGEM, CODIGO_RASTREIO } = await import('../supabase/functions/site-lead/logica.ts');
const CAMPOS_DA_ORIGEM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid', 'pagina', 'referencia', 'referencia_tipo', 'codigo', 'servico'];
const GCLID = 'Cj0KCQjw-_SampleDeTeste_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_BwE'; // 102 caracteres (mais que os 80 do formato antigo), com maiúsculas e minúsculas

test('origem: chegada com gclid passa inteira, com o identificador como chegou e o código em maiúsculas', () => {
  const o = origemDoPedido({
    rastreio: { codigo: 'k7m2p', utm_source: 'google', utm_medium: 'cpc', utm_campaign: '21345678901', utm_content: '700123', utm_term: 'oficina taubaté', gclid: GCLID,
      pagina: '/s/freios', referencia: 'www.Google.com.br', referencia_tipo: 'anuncio' },
    utm: { source: 'ignorado' }, pagina: '/outra', servico: 'formulario-freios',
  });
  assert.deepEqual(o, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: '21345678901', utm_content: '700123', utm_term: 'oficina taubaté', gclid: GCLID,
    pagina: '/s/freios', referencia: 'www.google.com.br', referencia_tipo: 'anuncio', codigo: 'K7M2P', servico: 'formulario-freios' });
  assert.equal(o.gclid.length, 102, 'identificador de clique não é cortado em 80 como no formato antigo');
});
test('origem: fbclid, gbraid, wbraid, ttclid e msclkid também passam', () => {
  const r = { fbclid: 'IwY2xjawExemplo_-AbC', gbraid: '0AAAAAExemplo-_x', wbraid: 'CjgKExemplo_x', ttclid: 'E.C.P.CsExemplo-_1', msclkid: '0123456789abcdef0123456789abcdef' };
  assert.deepEqual(origemDoPedido({ rastreio: r, servico: 'formulario-cambio' }), { ...r, servico: 'formulario-cambio' });
});
test('origem: nada do que o site manda é de confiança (só os campos do contrato, no formato e no tamanho)', () => {
  const o = origemDoPedido({
    rastreio: {
      nome: 'Fulano', telefone: '12996830272', email: 'a@b.c', __proto__: { x: 1 }, constructor: 'x', lead_id: 'uuid', origem_paga: true,
      utm_source: 'me' + String.fromCharCode(0x200B) + 'ta' + String.fromCharCode(0) + ' ', utm_campaign: 'c'.repeat(300), utm_medium: 42, utm_term: { a: 1 }, utm_content: ['x'],
      gclid: 'abc def', fbclid: '"><script>', ttclid: 'x'.repeat(256), msclkid: "a'; drop table leads;--",
      pagina: 'https://evil.example/x', referencia: 'evil.example/<b>', referencia_tipo: 'pago', codigo: 'ABCDO',
    },
    servico: 'formulario-freios',
  });
  assert.deepEqual(Object.keys(o).sort(), ['servico', 'utm_campaign', 'utm_source']);
  assert.equal(o.utm_source, 'me ta', 'caractere invisível e de controle viram espaço');
  assert.equal(o.utm_campaign.length, 100);
  for (const k of Object.keys(o)) assert.ok(CAMPOS_DA_ORIGEM.includes(k), 'campo fora do contrato: ' + k);
});
test('origem: página sem a parte depois de "?", referência só com cara de domínio, tipo e código só os válidos', () => {
  const o = origemDoPedido({ rastreio: { pagina: '/s/freios?utm_source=x#agendar', referencia: 'l.instagram.com', referencia_tipo: 'instagram', codigo: 'ABCDE' }, servico: 'formulario-freios' });
  assert.deepEqual(o, { pagina: '/s/freios', referencia: 'l.instagram.com', referencia_tipo: 'instagram', codigo: 'ABCDE', servico: 'formulario-freios' });
  for (const ruim of ['ABCD', 'ABCDEF', 'ABCDI', 'ABCDL', 'ABCD0', 'ABCD1', 'AB-DE', '', null, 12345, ['ABCDE']]) {
    assert.equal('codigo' in origemDoPedido({ rastreio: { codigo: ruim } }), false, 'código inválido passou: ' + JSON.stringify(ruim));
  }
  assert.ok(CODIGO_RASTREIO.test('K7M2P') && !CODIGO_RASTREIO.test('k7m2p'));
  assert.equal(origemDoPedido({ rastreio: { pagina: '/' + 'a'.repeat(300) } }).pagina.length, 120);
});
test('origem: rastreio que não é objeto é ignorado e o site antigo (só utm) continua valendo', () => {
  for (const lixo of [null, undefined, 'texto', 7, true, ['utm_source', 'x']]) {
    const o = origemDoPedido({ rastreio: lixo, utm: { source: 'meta', campaign: 'freios-outubro', fbclid: 'abc' }, pagina: '/s/freios', servico: 'formulario-freios' });
    assert.deepEqual(o, { utm_source: 'meta', utm_campaign: 'freios-outubro', fbclid: 'abc', pagina: '/s/freios', servico: 'formulario-freios' });
  }
  // no formato antigo o identificador vinha cortado em 80 caracteres: cortado ele não casa com clique nenhum, então não passa
  assert.equal('gclid' in origemDoPedido({ utm: { source: 'google', gclid: GCLID.slice(0, 80) } }), false);
  assert.equal(origemDoPedido({ utm: { gclid: 'abc123' } }).gclid, 'abc123');
  assert.deepEqual(origemDoPedido({}), {});
  assert.deepEqual(origemDoPedido({ servico: 'Formulário com espaço' }), {});
});

/** Dublê do cliente do Supabase: registra a chamada e devolve o que o teste mandar. */
function bancoFalso(resposta) {
  const chamadas = [];
  return {
    chamadas,
    rpc(nome, args) {
      const c = { nome, args, sinal: null };
      chamadas.push(c);
      return { abortSignal(sinal) { c.sinal = sinal; return typeof resposta === 'function' ? resposta(sinal) : Promise.resolve(resposta); } };
    },
  };
}
async function semLog(fn) {
  const original = console.error; const linhas = [];
  console.error = (...a) => { linhas.push(a.join(' ')); };
  try { return { valor: await fn(), linhas }; } finally { console.error = original; }
}
test('aplicarOrigem chama trafego_aplicar_origem(lead, dados, "formulario") e devolve true', async () => {
  const sb = bancoFalso({ data: true, error: null });
  const dados = { utm_source: 'google', gclid: GCLID, codigo: 'K7M2P', servico: 'formulario-freios' };
  const { valor, linhas } = await semLog(() => aplicarOrigem(sb, '11111111-2222-3333-4444-555555555555', dados));
  assert.equal(valor, true);
  assert.equal(RPC_ORIGEM, 'trafego_aplicar_origem');
  assert.deepEqual(sb.chamadas.map(c => [c.nome, c.args]), [['trafego_aplicar_origem', { p_lead: '11111111-2222-3333-4444-555555555555', p: dados, p_como: 'formulario' }]]);
  assert.ok(sb.chamadas[0].sinal instanceof AbortSignal, 'a chamada leva um limite de tempo');
  assert.deepEqual(linhas, []);
});
test('aplicarOrigem não derruba o pedido se a função ainda não existe no banco, se o banco falha ou se a chamada estoura', async () => {
  const dados = { gclid: GCLID, utm_campaign: 'campanha-secreta' };
  const casos = [
    ['função ainda não existe (migração depois)', bancoFalso({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.trafego_aplicar_origem(p, p_como, p_lead) in the schema cache' } })],
    ['banco recusou', bancoFalso({ data: null, error: { code: '42501', message: 'permission denied for function trafego_aplicar_origem' } })],
    ['rede caiu', bancoFalso(() => Promise.reject(new TypeError('fetch failed')))],
    ['cliente estourou na hora', { rpc() { throw new Error('quebrou'); } }],
    ['cliente sem abortSignal', { rpc() { return {}; } }],
    ['resposta sem formato', bancoFalso(null)],
  ];
  for (const [rotulo, sb] of casos) {
    const { valor, linhas } = await semLog(() => aplicarOrigem(sb, 'lead-1', dados));
    assert.equal(valor, false, rotulo);
    assert.equal(linhas.length, 1, rotulo + ': um aviso no log');
    assert.ok(!linhas.join(' ').includes(GCLID) && !linhas.join(' ').includes('campanha-secreta'), rotulo + ': os dados do clique não vão para o log');
  }
});
test('aplicarOrigem desiste de uma chamada que não responde (o pedido não fica pendurado)', async () => {
  let abortou = false;
  // 1) cliente que respeita o sinal: a chamada é cancelada
  const obediente = bancoFalso((sinal) => new Promise((_, rejeitar) => sinal.addEventListener('abort', () => { abortou = true; rejeitar(sinal.reason); })));
  const t0 = Date.now();
  const a = await semLog(() => aplicarOrigem(obediente, 'lead-1', { gclid: GCLID }, 60));
  assert.equal(a.valor, false);
  assert.ok(abortou && Date.now() - t0 < 1500, 'cancelou em ' + (Date.now() - t0) + ' ms');
  // 2) cliente que ignora o sinal e nunca responde: mesmo assim a função volta
  const surdo = bancoFalso(() => new Promise(() => {}));
  const t1 = Date.now();
  const b = await semLog(() => aplicarOrigem(surdo, 'lead-1', { gclid: GCLID }, 60));
  assert.equal(b.valor, false);
  assert.ok(Date.now() - t1 < 1500, 'voltou em ' + (Date.now() - t1) + ' ms');
  assert.ok(/tempo/.test(b.linhas.join(' ')));
});
test('a Edge Function grava a origem depois de criar o lead, espera antes de responder e não repete o que não deve', async () => {
  const fs = await import('node:fs');
  const fn = fs.readFileSync(new URL('../supabase/functions/site-lead/index.ts', import.meta.url), 'utf8');
  assert.match(fn, /origem: origemDoPedido\(\{ rastreio: corpo\.rastreio, utm, pagina, servico: codigo \}\)/, 'o pedido é limpo num lugar só (lerPedido)');
  const iLead = fn.indexOf("sb.from('leads').insert(");
  const iOrigem = fn.indexOf('aplicarOrigem(sb, lead.id, pedido.origem)');
  const iEspera = fn.indexOf('await origemGravada;');
  const iResposta = fn.lastIndexOf('return json(req, {');
  assert.ok(iLead > 0 && iOrigem > iLead && iEspera > iOrigem && iResposta > iEspera, 'ordem: cria o lead → aplica a origem → espera → responde');
  assert.equal(fn.split('aplicarOrigem(').length - 1, 1, 'a origem é aplicada uma vez, só quando o lead nasce (envio repetido não troca a origem)');
  assert.ok(!/console\.(log|error)\([^)]*pedido\.origem/.test(fn), 'a origem não vai para o log');
});
