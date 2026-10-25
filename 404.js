/* Rodada 7: quem cola o código da oficina na barra do site (indycar-taubate.netlify.app/<código>) não cai no "página não encontrada":
   o código de 36 letras/números abre o Acompanhar meu carro, o de 48 abre a Minha IndyCar e o de 32 abre o orçamento.
   Mesma regra do roteador da página principal (script.js › rotearCodigo); só aceita código hexadecimal, nunca endereço. */
(function () {
  var m = /^\/([0-9a-fA-F]{32}|[0-9a-fA-F]{36}|[0-9a-fA-F]{48})\/?$/.exec(location.pathname);
  if (!m) return;
  var c = m[1].toLowerCase();
  var alvo, rotulo;
  if (c.length === 36) { alvo = 'https://indycar-patio.netlify.app/acompanhar/?t=' + c; rotulo = 'o acompanhamento do seu carro'; }
  else if (c.length === 48) { alvo = 'https://indycar-patio.netlify.app/minha/?c=' + c; rotulo = 'a Minha IndyCar'; }
  else { alvo = 'https://indycar-orcador.netlify.app/#/o/' + c; rotulo = 'o seu orçamento'; }
  var msg = document.getElementById('codigoMsg');
  if (msg) { msg.textContent = 'Isso parece um código da oficina. Abrindo ' + rotulo + '…'; msg.hidden = false; }
  location.replace(alvo);
})();
