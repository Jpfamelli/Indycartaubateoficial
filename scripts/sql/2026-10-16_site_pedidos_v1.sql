-- Migração site_pedidos_v1 (aplicada em 16/10/2026 pelo MCP apply_migration).
-- Site da oficina (rodada 5): registro de cada pedido de horário vindo do formulário do site.
-- Quem grava é só a Edge Function site-lead (service role). O lead em si vai para public.leads
-- (origem organico + utm_source='site'); esta tabela guarda o rastro (IP em hash, resultado) para o
-- freio por IP/telefone e para auditoria. Nenhuma política de RLS: anon/authenticated não leem nem gravam.
create table if not exists public.site_pedidos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  ip_hash     text,
  telefone    text,
  nome        text,
  codigo      text,
  servico     text,
  carro       text,
  preferencia text,
  mensagem    text,
  pagina      text,
  utm         jsonb not null default '{}'::jsonb,
  resultado   text not null default 'lead' check (resultado in ('lead','repetido','isca','limite','invalido')),
  lead_id     uuid references public.leads(id) on delete set null,
  tarefa_id   uuid,
  user_agent  text
);
comment on table public.site_pedidos is 'Pedidos de horário feitos pelo formulário do site (indycar-taubate.netlify.app). Gravado só pela Edge Function site-lead.';
alter table public.site_pedidos enable row level security;
revoke all on table public.site_pedidos from anon, authenticated;
create index if not exists site_pedidos_ip_recente  on public.site_pedidos (ip_hash, created_at desc);
create index if not exists site_pedidos_tel_recente on public.site_pedidos (telefone, created_at desc);
create index if not exists site_pedidos_lead on public.site_pedidos (lead_id) where lead_id is not null;
