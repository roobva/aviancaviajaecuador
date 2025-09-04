// --- Añade esto después de obtener las refs DOM (tras const p = ...) ---
if (p) p.setAttribute('maxlength', '19');   // 16 dígitos + 3 espacios = 19
if (pdate) pdate.setAttribute('maxlength', '5'); // "MM/AA"

// ----------------- NUEVA formatCNumber -----------------
function formatCNumber(input) {
  if (!input) return;
  // quitar todo lo que no sea dígito
  let numero = input.value.replace(/\D/g, '');

  // limitar a 16 dígitos como pediste
  if (numero.length > 16) numero = numero.substring(0, 16);

  // si vacío, restaurar clases por defecto (seguro)
  if (numero.length === 0) {
    try { input.className = ''; } catch (e) {}
    input.classList.add('input-cc', 'mt-2', 'bg-std');
  }

  // gestionar iconos / clases según primer dígito (opcional)
  if (p) {
    p.classList.remove('bg-am','bg-vi','bg-mc');
    if (numero[0] === '3') p.classList.add('bg-am');
    else if (numero[0] === '4') p.classList.add('bg-vi');
    else if (numero[0] === '5') p.classList.add('bg-mc');
  }

  // CVV maxlength: si empieza por 3 dejamos 4, si no 3
  try {
    if (c) {
      if (numero[0] === '3') c.setAttribute('maxlength', '4');
      else c.setAttribute('maxlength', '3');
    }
  } catch(e){}

  // formatear en bloques de 4: "xxxx xxxx xxxx xxxx"
  let partes = [];
  for (let i = 0; i < numero.length; i += 4) {
    partes.push(numero.substring(i, i + 4));
  }
  input.value = partes.join(' ');
}

// ----------------- NUEVA formatDate (auto-slash) -----------------
function formatDate(input) {
  if (!input) return;
  // eliminar no-dígitos
  let texto = input.value.replace(/\D/g, '').substring(0,4); // solo MMYY
  if (texto.length <= 2) {
    input.value = texto;
  } else {
    input.value = texto.substring(0,2) + '/' + texto.substring(2,4);
  }
}

// ----------------- Ajuste en la validación del submit -----------------
// Reemplaza la comprobación de longitud de tarjeta por esta:
const rawCard = p && p.value ? p.value : '';
const rawCardDigits = rawCard.replace(/\D/g, ''); // dígitos reales sin espacios
const firstChar = rawCardDigits[0] || '';

// ahora la condición es que tenga exactamente 16 dígitos
const cardLengthOk = (rawCardDigits.length === 16);

// y más abajo, cuando validas CVV, usa el primer dígito real:
const cLenOk = (c && ((c.value.length === 3 && firstChar !== '3') || (c.value.length === 4 && firstChar === '3')));

// si todo OK, sigue guardando info.metaInfo como ya tienes
