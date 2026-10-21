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
  if (data < o.agora.data) return false;
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
