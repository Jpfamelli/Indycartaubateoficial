// Regras PURAS da Edge Function site-lead (rodada 6): sem Deno, sem rede, sem banco — roda no `npm test` (Node).
// Os horários seguem as mesmas regras da Agenda (indycar-agendamentos/horarios.js): seg–sáb, 8h–17h30, passos de
// 30 min, cada horário ativo ocupa a meia hora em que começa, a recepção comporta tantos carros por meia hora
// quantos consultores ativos houver, hoje só a partir de 30 min de agora. Mudou na Agenda? Muda aqui.

export const EXPEDIENTE = { abre: 8 * 60, fecha: 17 * 60 + 30, passo: 30, dias: [1, 2, 3, 4, 5, 6] } as const;
/** Status que seguram a casa na Agenda (STATUS_INDICE de horarios.js). */
export const STATUS_QUE_OCUPAM = new Set(['aguardando', 'confirmado', 'compareceu', 'em_atendimento', 'concluido', 'nao_fechou']);
/** O diagnóstico digital dura cerca de 30 min: o último começa às 17h. */
export const DURACAO_DIAGNOSTICO = 30;

export interface Agendamento { data: string; hora: string; status: string }
export interface Agora { data: string; min: number }
export interface DiaLivre { data: string; rotulo: string; horas: string[] }

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const minutos = (h: unknown): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(h ?? ''));
  return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null;
};
export const dataValida = (iso: unknown): iso is string => typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T12:00:00Z`));
export const diaDaSemana = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();
export const somaDias = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** "qua 22/10" */
export function rotuloDoDia(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${SEMANA[diaDaSemana(iso)]} ${d}/${m}`;
}
/** "qua 22/10 às 08:30" */
export const rotuloHorario = (data: string, hora: string) => `${rotuloDoDia(data)} às ${hora}`;

/** Data e minutos de agora no fuso de Taubaté. */
export function agoraSP(agora: Date = new Date()): Agora {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(agora);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return { data: `${g('year')}-${g('month')}-${g('day')}`, min: Number(g('hour')) * 60 + Number(g('minute')) };
}

/** Quantos carros já ocupam cada meia hora, por dia. */
function ocupacao(agendamentos: Agendamento[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const a of agendamentos) {
    if (!a || !STATUS_QUE_OCUPAM.has(a.status)) continue;
    const m = minutos(a.hora);
    if (m === null) continue;
    const k = `${a.data}|${Math.floor(m / EXPEDIENTE.passo) * EXPEDIENTE.passo}`;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return mapa;
}

/** Este horário (dia + hora) está livre agora? Mesma regra do que a lista oferece. */
export function horarioLivre(data: string, hora: string, o: { agora: Agora; agendamentos: Agendamento[]; capacidade: number }): boolean {
  const t = minutos(hora);
  if (!dataValida(data) || t === null || t % EXPEDIENTE.passo !== 0) return false;
  if (!EXPEDIENTE.dias.includes(diaDaSemana(data) as never)) return false;
  if (data < o.agora.data || data > somaDias(o.agora.data, 30)) return false; // passado ou longe demais (30 dias)
  if (data === o.agora.data && t < o.agora.min + 30) return false;
  if (t < EXPEDIENTE.abre || t + DURACAO_DIAGNOSTICO > EXPEDIENTE.fecha) return false;
  return (ocupacao(o.agendamentos).get(`${data}|${t}`) ?? 0) < Math.max(1, o.capacidade);
}

/**
 * Os próximos dias com vaga: até `dias` dias com horário, no máximo `porDia` horários por dia, espaçados
 * (`intervalo` min) para a pessoa ter escolha de verdade (manhã/tarde) e não 8h, 8h30 e 9h.
 * Só entrega data e hora: nunca nome, telefone ou placa de ninguém.
 */
export function proximosHorarios(o: { agora: Agora; agendamentos: Agendamento[]; capacidade: number; dias?: number; porDia?: number; intervalo?: number; olhar?: number }): DiaLivre[] {
  const dias = o.dias ?? 4, porDia = o.porDia ?? 5, intervalo = o.intervalo ?? 120, olhar = o.olhar ?? 14;
  const saida: DiaLivre[] = [];
  for (let n = 0; n <= olhar && saida.length < dias; n++) {
    const data = somaDias(o.agora.data, n);
    const horas: string[] = [];
    let ultimo = -Infinity;
    for (let t = EXPEDIENTE.abre; t + DURACAO_DIAGNOSTICO <= EXPEDIENTE.fecha && horas.length < porDia; t += EXPEDIENTE.passo) {
      if (t - ultimo < intervalo) continue;
      if (!horarioLivre(data, hhmm(t), o)) continue;
      horas.push(hhmm(t));
      ultimo = t;
    }
    if (horas.length) saida.push({ data, rotulo: n === 0 ? 'hoje' : n === 1 ? 'amanhã' : rotuloDoDia(data), horas });
  }
  return saida;
}

/** Placa de carro escrita no campo "carro" ("Civic 2018 ABC-1D23"): antiga (AAA9999) ou Mercosul (AAA9A99). */
export function extrairPlaca(texto: unknown): string | null {
  const m = /(?:^|[^A-Za-z0-9])([A-Za-z]{3})[ -]?(\d[A-Za-z0-9]\d{2})(?![A-Za-z0-9])/.exec(String(texto ?? ''));
  if (!m) return null;
  const placa = (m[1] + m[2]).toUpperCase();
  return /^[A-Z]{3}\d{4}$/.test(placa) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(placa) ? placa : null;
}

/** Placa digitada no campo próprio (aceita "abc-1d23"): devolve normalizada ou null. */
export function placaDoCampo(valor: unknown): string | null {
  const p = String(valor ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{3}\d{4}$/.test(p) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(p) ? p : null;
}

/** Endereços dos apps (os mesmos de orcador/apps.ts: Agenda, Atendimento e CRM moram na Central). */
export const APPS = {
  central: 'https://indycar-agendamentos.onrender.com',
  orcador: 'https://indycar-orcador.netlify.app',
  patio: 'https://indycar-patio.netlify.app',
} as const;

/** Os links que a equipe usa a partir do pedido do site. Telefone só em dígitos (DDD + número), como o banco guarda. */
export function linksDaEquipe(o: { leadId: string; telefone: string; nome: string }) {
  const nome = encodeURIComponent(o.nome.slice(0, 80));
  return {
    lead: `${APPS.central}/crm/?lead=${o.leadId}`,
    conversa: `${APPS.central}/atendimento/?tel=${o.telefone}`,
    orcamento: `${APPS.orcador}/#/cotacao?tel=${o.telefone}&nome=${nome}`,
    agenda: `${APPS.central}/agenda/`,
  };
}

/** Código do site (data-codigo do formulário) → nome do serviço no cadastro `servicos` (o id é buscado pelo nome, nunca fixo). */
export const NOME_NO_CATALOGO: Readonly<Record<string, string>> = {
  diagnostico: 'Diagnóstico com Scanner',
  motor: 'Revisão de Motor',
  'oleo-motor': 'Troca de Óleo de Motor',
  cambio: 'Troca de Óleo de Câmbio',
  freios: 'Freios',
  suspensao: 'Suspensão',
  alinhamento: 'Alinhamento e balanceamento',
  pneus: 'Pneus',
  embreagem: 'Embreagem',
  correia: 'Correia Dentada',
  bicos: 'Limpeza de Bicos',
};

/**
 * Até quando a tarefa "confirme o horário" vale (ms). Padrão: 2 h. Se a pessoa pediu um horário LIVRE que é hoje,
 * vence 30 min antes dele (nunca antes de 15 min a partir de agora): a equipe confirma antes de o carro chegar.
 * O Brasil está sem horário de verão (UTC-3).
 */
export function venceEm(agoraMs: number, horario: { data: string; hora: string } | null, livre: boolean): number {
  const padrao = agoraMs + 2 * 3600_000;
  if (!horario || !livre) return padrao;
  const alvo = Date.parse(`${horario.data}T${horario.hora}:00-03:00`);
  if (Number.isNaN(alvo) || alvo - agoraMs > 4 * 3600_000) return padrao;
  return Math.min(padrao, Math.max(agoraMs + 15 * 60_000, alvo - 30 * 60_000));
}

/**
 * Texto vindo do site: troca por espaço os caracteres de controle e invisíveis (zero-width, marcas de direção, nulos...)
 * que poderiam esconder conteúdo no CRM, e normaliza os espaços. `quebras` mantém quebra de linha e tab (campo de mensagem).
 */
export function semControle(s: string, quebras = false): string {
  const limpo = s.normalize('NFC').replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, (c) => (quebras && (c === '\n' || c === '\t') ? c : ' '));
  return quebras ? limpo.replace(/[ \t]+/g, ' ').replace(/\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : limpo.replace(/\s+/g, ' ').trim();
}

/* ---------------- Rodada 8: de qual anúncio veio o contato (indycar-ferramentas/r8/CONTRATO-RASTREIO.md §6.1 e §6.4) ---------------- */

/** Código que o banco devolve quando o site registra a visita: 5 caracteres de ABCDEFGHJKMNPQRSTUVWXYZ23456789. */
export const CODIGO_RASTREIO = /^[A-HJKMNP-Z2-9]{5}$/;
const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
/** Identificadores de clique das plataformas. Maiúscula e minúscula importam: passam como chegaram ou não passam. */
const CLIQUES = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid'] as const;
export const TIPOS_DE_REFERENCIA: readonly string[] = ['anuncio', 'busca', 'instagram', 'facebook', 'whatsapp', 'outro_site', 'direto'];

/**
 * Origem do pedido do formulário, pronta para `trafego_aplicar_origem(lead, dados, 'formulario')`.
 * `rastreio` é o que o site mandou (rodada 8) e não é de confiança: só passam os campos do contrato, cada um no seu
 * formato e tamanho; o que vier fora disso é ignorado. Site ainda na versão antiga (sem `rastreio`): aproveita o `utm`
 * da rodada 5 (source, medium, campaign, content, term, gclid, fbclid, já limpos por lerPedido).
 * Nunca leva nome, telefone nem e-mail. `servico` é o código do site (`formulario-<serviço>`).
 */
export function origemDoPedido(o: { rastreio?: unknown; utm?: Record<string, unknown> | null; pagina?: string | null; servico?: string | null }): Record<string, string> {
  const r = (o.rastreio && typeof o.rastreio === 'object' && !Array.isArray(o.rastreio) ? o.rastreio : null) as Record<string, unknown> | null;
  const antigo = o.utm ?? {};
  const texto = (v: unknown, max: number) => (typeof v === 'string' ? semControle(v).slice(0, max) : '');
  const d: Record<string, string> = {};
  for (const k of UTMS) {
    const v = texto(r ? r[k] : antigo[k.slice(4)], 100);
    if (v) d[k] = v;
  }
  for (const k of CLIQUES) {
    const v = r ? r[k] : antigo[k];
    // No formato antigo o identificador vinha cortado em 80: se bateu no limite, está incompleto e não serve para nada.
    if (typeof v === 'string' && /^[\w.~-]{1,255}$/.test(v) && (r || v.length < 80)) d[k] = v;
  }
  const pagina = texto(r && typeof r.pagina === 'string' ? r.pagina : o.pagina, 200).split(/[?#]/)[0].slice(0, 120);
  if (pagina.startsWith('/')) d.pagina = pagina;
  if (r) {
    const referencia = texto(r.referencia, 80).toLowerCase();
    if (/^[a-z0-9.-]{1,80}$/.test(referencia)) d.referencia = referencia;
    const tipo = texto(r.referencia_tipo, 12);
    if (TIPOS_DE_REFERENCIA.includes(tipo)) d.referencia_tipo = tipo;
    const codigo = texto(r.codigo, 8).toUpperCase();
    if (CODIGO_RASTREIO.test(codigo)) d.codigo = codigo;
  }
  if (o.servico && /^[a-z0-9_-]{1,40}$/.test(o.servico)) d.servico = o.servico;
  return d;
}

/** Nome e parâmetros da função do banco num lugar só (contrato r8 §1.3: trafego_aplicar_origem(p_lead uuid, p jsonb, p_como text)). */
export const RPC_ORIGEM = 'trafego_aplicar_origem';

/**
 * Grava de qual anúncio veio o contato. A regra única mora no banco (força da evidência, plataforma pelo clique,
 * campanha). Se a função ainda não existir (a migração pode ser aplicada depois desta função), demorar mais que
 * `limiteMs` ou falhar, devolve `false` e NUNCA rejeita: isto não pode derrubar o envio do pedido.
 * Os dados não vão para o log (identificador de clique ligado a um contato é dado pessoal).
 * `sb` é o cliente do Supabase; em teste entra um dublê com `rpc(nome, args).abortSignal(sinal)`.
 */
// deno-lint-ignore no-explicit-any
export async function aplicarOrigem(sb: { rpc: (...a: any[]) => any }, leadId: string, dados: Record<string, string>, limiteMs = 4000): Promise<boolean> {
  let relogio: ReturnType<typeof setTimeout> | undefined;
  try {
    const chamada = sb.rpc(RPC_ORIGEM, { p_lead: leadId, p: dados, p_como: 'formulario' }).abortSignal(AbortSignal.timeout(limiteMs));
    const demorou = new Promise<{ error: { code?: string; message: string } }>((resolver) => {
      relogio = setTimeout(() => resolver({ error: { code: 'tempo', message: `sem resposta em ${limiteMs} ms` } }), limiteMs + 50);
    });
    const { error } = (await Promise.race([chamada, demorou])) as { error: { code?: string; message?: string } | null };
    if (error) { console.error(RPC_ORIGEM, error.code ?? '', error.message ?? ''); return false; }
    return true;
  } catch (e) {
    console.error(RPC_ORIGEM, e instanceof Error ? e.name : 'erro');
    return false;
  } finally {
    clearTimeout(relogio);
  }
}

/* ---------------- Rodada 10: entrada do pedido conferida no servidor ---------------- */

/** Horário escolhido no site: data de verdade e hora de relógio (antes "99:99" passava e ia parar na ficha do contato). */
export function lerHorario(h: unknown): { data: string; hora: string } | null {
  if (!h || typeof h !== 'object' || Array.isArray(h)) return null;
  const { data, hora } = h as Record<string, unknown>;
  if (!dataValida(data) || typeof hora !== 'string' || !/^\d{2}:\d{2}$/.test(hora) || minutos(hora) === null) return null;
  return { data, hora };
}

/** Nome de gente não tem endereço de site: é a marca do pedido de robô que quer plantar link no CRM. */
export const temLink = (s: string) => /:\/\/|\bwww\.|\.(com|net|org|br|ru|xyz|top|info|io)\b/i.test(s);

/**
 * O site mede o tempo entre começar a preencher e enviar e manda em `decorrido` (ms). Pessoa nenhuma preenche em menos
 * de 1,5 s. Sem o campo (ou com valor que não é número) também é robô: o site manda sempre, desde a rodada 5.
 */
export function rapidoDemais(decorrido: unknown): boolean {
  if (typeof decorrido !== 'number' || !Number.isFinite(decorrido)) return true;
  return decorrido < 1500;
}

/**
 * Freio de rajadas em memória (por instância): no máximo `porMinuto` chamadas por chave a cada 60 s.
 * Rodada 10: as chaves paradas saem do mapa (antes cada IP que passava ficava guardado até a instância morrer).
 * Devolve `false` quando a chave estourou o limite.
 */
export function criarFreio(o: { janelaMs?: number; faxinaACada?: number } = {}) {
  const janela = o.janelaMs ?? 60_000, faxina = o.faxinaACada ?? 500;
  const mapa = new Map<string, number[]>();
  let chamadas = 0;
  const passa = (chave: string, porMinuto: number, agora = Date.now()): boolean => {
    if (++chamadas % faxina === 0) {
      for (const [k, tempos] of mapa) if (!tempos.some((t) => agora - t < janela)) mapa.delete(k);
    }
    const lista = (mapa.get(chave) ?? []).filter((t) => agora - t < janela);
    if (lista.length >= porMinuto) { mapa.set(chave, lista); return false; }
    lista.push(agora);
    mapa.set(chave, lista);
    return true;
  };
  return { passa, tamanho: () => mapa.size };
}
