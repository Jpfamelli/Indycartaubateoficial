-- Rodada 6 (X1): o rastro do pedido do site guarda a placa e o horário escolhido (auditoria; RLS segue ligado sem política).
alter table public.site_pedidos
  add column if not exists placa text,
  add column if not exists horario_data date,
  add column if not exists horario_hora text,
  add column if not exists horario_livre boolean;
comment on column public.site_pedidos.horario_livre is 'true = o horário escolhido ainda estava livre na Agenda quando o servidor conferiu; false = já tinha sido ocupado.';
