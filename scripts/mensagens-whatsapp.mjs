// Um só lugar para as mensagens prontas do WhatsApp (rodada 5, 16/10/2026).
// Contrato com o Atendimento: toda mensagem começa com o PREFIXO estável e, quando é pedido de serviço,
// segue "quero orçar: <serviço>" — a IA do funil identifica o serviço por esse trecho. No fim vai o código
// "(site/<código>)", que o gatilho at_origem_pelo_site lê para marcar o lead com utm_source=site.
// `node scripts/gerar-whatsapp.mjs` reescreve os links do index.html e do 404.html a partir desta tabela;
// `npm test` confere que a página está igual à tabela.
export const PHONE = '5512996830272';
export const PREFIXO = 'Olá! Vim pelo site';
export const ORCAR = PREFIXO + ', quero orçar: ';

/** Nome do serviço como a IA e a equipe conhecem (mesmo vocabulário do catálogo). */
export const SERVICOS = {
  diagnostico: 'Diagnóstico digital gratuito',
  cambio: 'Troca de óleo do câmbio automático (diálise)',
  scanner: 'Diagnóstico com scanner',
  motor: 'Revisão de motor',
  'oleo-motor': 'Troca de óleo do motor',
  freios: 'Pastilhas e discos de freio',
  amortecedores: 'Troca de amortecedores',
  suspensao: 'Revisão de suspensão',
  correia: 'Correia dentada',
  pneus: 'Pneus (venda e montagem)',
  alinhamento: 'Alinhamento e balanceamento',
  embreagem: 'Troca de embreagem',
  bicos: 'Limpeza de bicos injetores',
};

/** código → texto completo (sem o "(site/código)", que é acrescentado na montagem). */
export const MENSAGENS = {
  hero: ORCAR + SERVICOS.diagnostico + '.',
  diagnostico: ORCAR + SERVICOS.diagnostico + '.',
  'contato-botao': ORCAR + SERVICOS.diagnostico + '.',
  flutuante: ORCAR + SERVICOS.diagnostico + '.',
  404: ORCAR + SERVICOS.diagnostico + '.',
  'cambio-dialise': ORCAR + SERVICOS.cambio + '. Serve para o meu carro?',
  'outro-servico': PREFIXO + ', quero orçar: outro serviço. Vocês fazem?',
  'nao-fazemos': PREFIXO + ', quero saber se vocês fazem um serviço.',
  garantia: PREFIXO + ', tenho uma dúvida sobre a garantia.',
  pagamento: PREFIXO + ', quero saber as formas de pagamento.',
  acompanhar: PREFIXO + ', tenho uma dúvida sobre o serviço do meu carro.',
  duvida: PREFIXO + ', tenho uma dúvida.',
  agendar: PREFIXO + ', quero agendar um horário.',
  avaliacao: PREFIXO + ', quero contar como foi o serviço no meu carro.',
  contato: PREFIXO + '.',
  rodape: PREFIXO + '.',
  'area-cliente': PREFIXO + ', já sou cliente e quero o link da minha área (Minha IndyCar).',
  atalho: ORCAR + SERVICOS.diagnostico + '.',
  'sem-js': ORCAR + SERVICOS.diagnostico + '.',
};
for (const [codigo, nome] of Object.entries(SERVICOS)) if (!MENSAGENS[codigo]) MENSAGENS[codigo] = ORCAR + nome + '.';

export const CODIGO_OK = /^[a-z0-9_-]{1,40}$/;

/** Texto final (com o código) e o link completo wa.me com UTM. */
export function texto(codigo) {
  const base = MENSAGENS[codigo];
  if (!base) throw new Error('mensagem sem código: ' + codigo);
  if (!CODIGO_OK.test(String(codigo))) throw new Error('código inválido: ' + codigo);
  return base + ' (site/' + codigo + ')';
}
export function link(codigo) {
  return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(texto(codigo)) +
    '&utm_source=site&utm_medium=whatsapp&utm_campaign=' + codigo;
}
