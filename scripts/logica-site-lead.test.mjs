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
