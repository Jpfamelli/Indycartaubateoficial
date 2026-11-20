// Rodada 10 (20/11/2026): o que a Edge Function site-lead passou a conferir no servidor. Roda com `node --test`.
// Regras puras (logica.ts), sem Deno, sem rede e sem banco.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as L from '../supabase/functions/site-lead/logica.ts';

const fn = fs.readFileSync(new URL('../supabase/functions/site-lead/index.ts', import.meta.url), 'utf8');

test('r10-horario: hora que não existe no relógio não passa para a ficha do contato', () => {
  assert.deepEqual(L.lerHorario({ data: '2026-11-23', hora: '09:30' }), { data: '2026-11-23', hora: '09:30' });
  for (const hora of ['99:99', '24:00', '12:60', '9:30', '09:30:00', 930, null]) assert.equal(L.lerHorario({ data: '2026-11-23', hora }), null, String(hora));
  for (const data of ['2026-13-40', '23/11/2026', '', null]) assert.equal(L.lerHorario({ data, hora: '09:30' }), null, String(data));
  for (const h of [null, undefined, 'amanhã', [], 7]) assert.equal(L.lerHorario(h), null);
  assert.match(fn, /const horario = lerHorario\(corpo\.horario\);/, 'a função usa a regra única');
});

test('r10-nome-link: nome com endereço de site é recusado (robô plantando link no CRM)', () => {
  for (const n of ['http://ganhe.ru', 'Compre em www.loja.xyz', 'Maria visite loja.com', 'promo.top agora']) assert.equal(L.temLink(n), true, n);
  for (const n of ['Maria Aparecida', "D'Ávila Jr.", 'José da Silva Neto', 'Ana B. Comin', 'Topázio Brito']) assert.equal(L.temLink(n), false, n);
  assert.match(fn, /temLink\(nome\)\) throw new ErroHttp\(400/, 'a função recusa com 400 e a mensagem do nome');
});

test('r10-decorrido: pedido sem o tempo de preenchimento (ou com valor torto) é tratado como robô', () => {
  for (const v of [undefined, null, '', '5000', NaN, Infinity, -1, 0, 1499, {}, []]) assert.equal(L.rapidoDemais(v), true, String(v));
  for (const v of [1500, 2500, 60000]) assert.equal(L.rapidoDemais(v), false, String(v));
  assert.match(fn, /if \(rapidoDemais\(corpo\.decorrido\)\) \{/, 'a função usa a regra única');
});

test('r10-freio: limite por chave vale e as chaves paradas saem da memória', () => {
  const f = L.criarFreio({ faxinaACada: 100 });
  let t = 1_000_000;
  for (let i = 0; i < 20; i++) assert.equal(f.passa('ip:1', 20, t), true);
  assert.equal(f.passa('ip:1', 20, t), false, 'a 21ª no mesmo minuto é barrada');
  assert.equal(f.passa('ip:2', 20, t), true, 'outra chave não paga pela primeira');
  assert.equal(f.passa('ip:1', 20, t + 60_001), true, 'passado um minuto, volta a passar');
  // 5.000 IPs diferentes ao longo de uma hora: o mapa não cresce sem fim
  for (let i = 0; i < 5000; i++) { t += 720; f.passa('ip:x' + i, 20, t); }
  assert.ok(f.tamanho() < 300, 'ficaram ' + f.tamanho() + ' chaves (só as do último minuto e pouco)');
  assert.ok(!/new Map<string, number\[\]>/.test(fn), 'a função não guarda mais um mapa próprio que só cresce');
});
