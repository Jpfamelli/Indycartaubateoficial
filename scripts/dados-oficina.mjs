// Um só lugar para os números da oficina — CONFIRMADOS pelo João em 16/10/2026 (4,8 no Google, +1.200 avaliações, +18 anos):
// nota no Google, quantidade de avaliações e anos de estrada. Mudou? Edite aqui e rode
// `node scripts/gerar-numeros.mjs` — ele reescreve index.html (todos os <span data-num>, os contadores
// data-target e os data-* do <body> que o script.js lê). `npm test` confere que a página está igual.
export const NUMEROS = {
  nota: '4,8',          // nota média no Google (texto, com vírgula)
  avaliacoes: '1.200',  // quantidade de avaliações no Google (texto, com ponto de milhar; a página mostra "+")
  anos: '18',           // anos de estrada (a página mostra "+18")
};
export const NOTA_NUMERO = Number(NUMEROS.nota.replace(',', '.'));
export const AVALIACOES_NUMERO = Number(NUMEROS.avaliacoes.replace(/\D/g, ''));
export const ANOS_NUMERO = Number(NUMEROS.anos);
