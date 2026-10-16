// Edge Function 'site-lead' — o formulário "Agende seu diagnóstico" do site da oficina
// (https://indycar-taubate.netlify.app) grava o pedido direto no banco da IndyCar.
//   POST /            { nome, telefone, servico, codigo, carro?, preferencia?, mensagem?, pagina?, utm?, empresa? (isca), decorrido? }
//   GET  /saude       → { ok: true }
// O que faz: cria o lead em public.leads (origem organico + utm_source='site', utm_medium='formulario',
// utm_campaign='formulario-<serviço>'), abre uma tarefa para a equipe (quem cuida do cliente; sem ninguém, avisa os
// gestores) e guarda o rastro em public.site_pedidos (IP só em hash). Sem login (verify_jwt false): quem protege é o
// freio por IP/telefone, o campo-isca, o tempo mínimo de preenchimento e a validação de cada campo.
// Nunca devolve dado interno (nem o id do lead): só um protocolo curto para a pessoa.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

const ORIGENS = [/^https:\/\/indycar-taubate\.netlify\.app$/, /^https:\/\/[a-z0-9-]+--indycar-taubate\.netlify\.app$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const CODIGO = /^[a-z0-9_-]{1,30}$/;
const LIMITE_IP_HORA = 6;
const LIMITE_TEL_DIA = 1; // um pedido por telefone por dia vira lead; os seguintes são "repetido" (a equipe já vai chamar)
const HORARIO = 'segunda a sábado, das 8h às 17h30';

class ErroHttp extends Error {
  status: number;
  constructor(status: number, mensagem: string) { super(mensagem); this.status = status; }
}

function cors(req: Request): Record<string, string> {
  const origem = req.headers.get('origin') ?? '';
  const ok = ORIGENS.some((re) => re.test(origem));
  return {
    'Access-Control-Allow-Origin': ok ? origem : 'https://indycar-taubate.netlify.app',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
const json = (req: Request, corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors(req), 'Content-Type': 'application/json; charset=utf-8' } });

const txt = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : null);
const linhas = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? v.trim().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').slice(0, max) : null);

/** Telefone brasileiro: 10 ou 11 dígitos com DDD, sem o 55 (mesmo formato de normalizar_telefone no banco). */
function telefone(v: unknown): string | null {
  let d = String(v ?? '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (/^(\d)\1+$/.test(d)) return null; // 99999999999 não é um telefone
  if (d[2] === '0') return null;
  if (d[0] === '0' || d[1] === '0') return null; // DDD vai de 11 a 99
  if (d.length === 11 && d[2] !== '9') return null; // celular com 11 dígitos começa com 9
  return d;
}

async function sha256(s: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
/** O primeiro valor de x-forwarded-for é forjável; vale o cf-connecting-ip e, sem ele, o ÚLTIMO valor (posto pelo proxy). */
function ipDe(req: Request): string {
  const cf = (req.headers.get('cf-connecting-ip') ?? '').trim();
  if (cf) return cf;
  const lista = (req.headers.get('x-forwarded-for') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return lista[lista.length - 1] || 'sem-ip';
}

// Freio em memória por instância (barra rajadas antes de ir ao banco).
const rajadas = new Map<string, number[]>();
function freio(chave: string, porMinuto: number) {
  const agora = Date.now();
  const lista = (rajadas.get(chave) ?? []).filter((t) => agora - t < 60_000);
  if (lista.length >= porMinuto) throw new ErroHttp(429, 'Muitas tentativas seguidas. Espere um minuto e tente de novo.');
  lista.push(agora);
  rajadas.set(chave, lista);
}

function banco(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const chave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !chave) throw new Error('Função sem SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}

const primeiroNome = (n: string) => n.split(' ')[0];
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);

interface Pedido {
  nome: string; tel: string; servico: string; codigo: string; carro: string | null; preferencia: string | null;
  mensagem: string | null; pagina: string | null; utm: Record<string, string>;
}

function lerPedido(corpo: Record<string, unknown>): Pedido {
  const nome = txt(corpo.nome, 80);
  if (!nome || nome.length < 2 || !/[a-zA-ZÀ-ÿ]{2}/.test(nome)) throw new ErroHttp(400, 'Conta pra gente o seu nome.');
  const tel = telefone(corpo.telefone);
  if (!tel) throw new ErroHttp(400, 'Confira o número com DDD (10 ou 11 dígitos).');
  const servico = txt(corpo.servico, 120);
  if (!servico) throw new ErroHttp(400, 'Escolha o serviço (ou "Outro / Não sei ainda").');
  const cod = txt(corpo.codigo, 30)?.toLowerCase() ?? '';
  const codigo = 'formulario-' + (CODIGO.test(cod) ? cod : 'servico');
  const utmBruto = (corpo.utm && typeof corpo.utm === 'object' && !Array.isArray(corpo.utm) ? corpo.utm : {}) as Record<string, unknown>;
  const utm: Record<string, string> = {};
  for (const k of ['source', 'medium', 'campaign', 'content', 'term', 'gclid', 'fbclid']) {
    const v = txt(utmBruto[k], 80);
    if (v) utm[k] = v;
  }
  return {
    nome, tel, servico, codigo,
    carro: txt(corpo.carro, 100), preferencia: txt(corpo.preferencia, 60), mensagem: linhas(corpo.mensagem, 500),
    pagina: txt(corpo.pagina, 200), utm,
  };
}

async function registrar(sb: SupabaseClient, dados: Record<string, unknown>) {
  const { error } = await sb.from('site_pedidos').insert(dados);
  if (error) console.error('site_pedidos', error.message);
}

async function tratar(req: Request): Promise<Response> {
  const ip = ipDe(req);
  freio(`ip:${ip}`, 20);
  const bruto = await req.text();
  if (bruto.length > 8192) throw new ErroHttp(413, 'Pedido grande demais.');
  let corpo: Record<string, unknown>;
  try {
    const v = JSON.parse(bruto || '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error();
    corpo = v;
  } catch {
    throw new ErroHttp(400, 'Pedido inválido.');
  }

  const sb = banco();
  const ipHash = await sha256(ip + '|' + (Deno.env.get('SITE_LEAD_SAL') ?? 'indycar-site'));
  const ua = txt(req.headers.get('user-agent'), 200);
  const base = { ip_hash: ipHash, user_agent: ua, pagina: txt(corpo.pagina, 200) };

  // Robô que preencheu o campo-isca: finge que deu certo e não cria nada.
  if (txt(corpo.empresa, 200)) {
    await registrar(sb, { ...base, resultado: 'isca', telefone: telefone(corpo.telefone), nome: txt(corpo.nome, 80) });
    return json(req, { ok: true, mensagem: 'Pedido enviado!' });
  }

  let pedido: Pedido;
  try {
    pedido = lerPedido(corpo);
  } catch (e) {
    await registrar(sb, { ...base, resultado: 'invalido', telefone: telefone(corpo.telefone), nome: txt(corpo.nome, 80) });
    throw e;
  }
  // Rápido demais para uma pessoa (o site mede o tempo entre começar a preencher e enviar).
  const decorrido = Number(corpo.decorrido);
  if (Number.isFinite(decorrido) && decorrido >= 0 && decorrido < 1500) {
    await registrar(sb, { ...base, resultado: 'invalido', telefone: pedido.tel, nome: pedido.nome, codigo: pedido.codigo });
    throw new ErroHttp(400, 'Confere os dados? Se estiver tudo certo, toque em enviar de novo.');
  }

  // Freios no banco: por IP na última hora e por telefone no dia.
  const umaHora = new Date(Date.now() - 3600_000).toISOString();
  const umDia = new Date(Date.now() - 86400_000).toISOString();
  const [{ count: porIp }, { data: doTelefone }] = await Promise.all([
    sb.from('site_pedidos').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', umaHora),
    sb.from('site_pedidos').select('id,lead_id').eq('telefone', pedido.tel).eq('resultado', 'lead').gte('created_at', umDia).limit(LIMITE_TEL_DIA),
  ]);
  if ((porIp ?? 0) >= LIMITE_IP_HORA) {
    await registrar(sb, { ...base, resultado: 'limite', telefone: pedido.tel, nome: pedido.nome, codigo: pedido.codigo });
    throw new ErroHttp(429, 'Recebemos vários pedidos deste aparelho agora. Se quiser, chame a gente direto no WhatsApp.');
  }
  if ((doTelefone ?? []).length >= LIMITE_TEL_DIA) {
    // Já virou lead hoje: a equipe já vai chamar. Só acrescenta o que mudou no lead e não duplica.
    const leadId = doTelefone![0].lead_id as string | null;
    if (leadId) {
      const { data: l } = await sb.from('leads').select('observacoes').eq('id', leadId).maybeSingle();
      const extra = `[${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}] Novo envio pelo site: ${pedido.servico}` +
        (pedido.preferencia ? ` · ${pedido.preferencia}` : '') + (pedido.mensagem ? `\n${pedido.mensagem}` : '');
      await sb.from('leads').update({ observacoes: [l?.observacoes, extra].filter(Boolean).join('\n\n').slice(0, 4000) }).eq('id', leadId);
    }
    await registrar(sb, { ...base, resultado: 'repetido', telefone: pedido.tel, nome: pedido.nome, codigo: pedido.codigo, servico: pedido.servico, lead_id: leadId, utm: pedido.utm });
    return json(req, { ok: true, repetido: true, mensagem: `Já recebemos o seu pedido hoje — a equipe vai te chamar no WhatsApp (${HORARIO}).` });
  }

  // Lead (origem site + UTM). Se a pessoa chegou por anúncio, a campanha paga vai junto no utm_campaign.
  const campanha = pedido.utm.source ? `${pedido.codigo}--${slug(pedido.utm.source)}${pedido.utm.campaign ? '-' + slug(pedido.utm.campaign) : ''}`.slice(0, 60) : pedido.codigo;
  const observacoes = [
    `Pedido pelo site (formulário): ${pedido.servico}`,
    pedido.preferencia ? `Preferência de horário: ${pedido.preferencia}` : null,
    pedido.carro ? `Carro: ${pedido.carro}` : null,
    pedido.mensagem ? `O que o carro está fazendo: ${pedido.mensagem}` : null,
    Object.keys(pedido.utm).length ? 'Campanha: ' + Object.entries(pedido.utm).map(([k, v]) => `${k}=${v}`).join(' ') : null,
    pedido.pagina ? `Página: ${pedido.pagina}` : null,
  ].filter(Boolean).join('\n');
  const { data: lead, error: eLead } = await sb.from('leads').insert({
    nome: pedido.nome, telefone: pedido.tel, carro_modelo: pedido.carro, servico: pedido.servico, status: 'novo', origem: 'organico',
    utm_source: 'site', utm_medium: 'formulario', utm_campaign: campanha, observacoes,
  }).select('id,cliente_id,responsavel_id').single();
  if (eLead || !lead) throw new Error(eLead?.message ?? 'lead');

  // Tarefa para quem cuida do cliente (o gatilho do banco já herdou o responsável da conversa); sem ninguém, avisa os gestores.
  const nome = primeiroNome(pedido.nome);
  const vence = new Date(Date.now() + 2 * 3600_000).toISOString();
  const { data: tarefa, error: eT } = await sb.from('tarefas').insert({
    titulo: `Pedido de horário pelo site: ${nome}`,
    descricao: `${pedido.nome} pediu horário pelo site para: ${pedido.servico}.` +
      (pedido.preferencia ? `\nPreferência: ${pedido.preferencia}.` : '') + (pedido.carro ? `\nCarro: ${pedido.carro}.` : '') +
      (pedido.mensagem ? `\nO carro está: ${pedido.mensagem}` : '') + `\nTelefone: ${pedido.tel}. Confirme o horário pelo WhatsApp e marque na Agenda.`,
    responsavel_id: lead.responsavel_id ?? null, cliente_id: lead.cliente_id ?? null, lead_id: lead.id,
    origem: 'automacao', prioridade: 1, vence_em: vence,
  }).select('id').single();
  if (eT) console.error('tarefas', eT.message);
  if (!lead.responsavel_id) {
    const { data: gestores } = await sb.from('perfis').select('id').in('papel', ['admin', 'gestor']).eq('ativo', true);
    for (const g of gestores ?? []) {
      const { error } = await sb.rpc('notificar', {
        p_perfil: g.id, p_tipo: 'lead', p_titulo: `Pedido de horário pelo site: ${nome}`,
        p_corpo: `${pedido.servico}${pedido.preferencia ? ' · ' + pedido.preferencia : ''}`, p_link: `/?lead=${lead.id}`, p_app: 'crm', p_chave: `site_lead:${lead.id}`,
      });
      if (error) console.error('notificar', error.message);
    }
  }
  await registrar(sb, {
    ...base, resultado: 'lead', telefone: pedido.tel, nome: pedido.nome, codigo: pedido.codigo, servico: pedido.servico, carro: pedido.carro,
    preferencia: pedido.preferencia, mensagem: pedido.mensagem, utm: pedido.utm, lead_id: lead.id, tarefa_id: tarefa?.id ?? null,
  });
  return json(req, {
    ok: true, protocolo: String(lead.id).replace(/-/g, '').slice(-6).toUpperCase(),
    mensagem: `Pedido enviado, ${nome}! A equipe confirma o horário com você pelo WhatsApp (${HORARIO}).`,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const rota = new URL(req.url).pathname.split('/').filter(Boolean).pop();
    if (req.method === 'GET' && rota === 'saude') return json(req, { ok: true, servico: 'site-lead' });
    if (req.method !== 'POST') throw new ErroHttp(405, 'Use POST.');
    return await tratar(req);
  } catch (e) {
    if (e instanceof ErroHttp) return json(req, { ok: false, erro: e.message }, e.status);
    console.error('site-lead', e);
    return json(req, { ok: false, erro: 'Não conseguimos registrar agora. Chame a gente no WhatsApp.' }, 500);
  }
});
