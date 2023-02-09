/* -------------------------------------------------------------------------- *\
    Variable Declarations
\* -------------------------------------------------------------------------- */

const favorites = document.getElementById('favorites');
const filter = document.getElementById('filter');
const search = document.getElementById('search');
const sortDistance = document.getElementById('sortDistance');
const sortName = document.getElementById('sortName');
const theme = document.getElementById('theme');

let firstRender = true;
let hearts = [];
let heartsDisplay = false;
let lat;
let lon;
let master = [];
let sortDistanceOrder = true;
let sortNameOrder = false;
let temp = [];
let themeType = 0;

/* -------------------------------------------------------------------------- *\
    Geolocation API
\* -------------------------------------------------------------------------- */

async function geolocation(num = 50) {
    const g = navigator.geolocation;
    const gps = document.getElementById('gps');

    gps.innerHTML = '<div id="loading">Loading... please wait...</div>';

    await new Promise(res => {
        function writePos(pos) {
            lat = pos.coords.latitude.toFixed(5);
            lon = pos.coords.longitude.toFixed(5);

            if (lat[0] !== '-') lat = `+${lat}`;
            if (lon[0] !== '-') lon = `+${lon}`;

            gps.innerHTML = `<p>Latitude: &nbsp;${lat}</p>`;
            gps.innerHTML += `<p>Longitude: ${lon}</p>`;

            res();
        }

        function errorPos(err) {
            if (!navigator.onLine) gps.innerHTML = 'Error... please check your connection...';
            else if (err.PERMISSION_DENIED) {
                gps.innerHTML = 'Error... please enable location services...';
            }
        }

        if (g) g.getCurrentPosition(pos => {
            gps.innerHTML = `${pos.coords.latitude} / ${pos.coords.longitude}`;
            console.log(gps.innerHTML);
        });
        else gps.innerHTML = 'Your browser does not support geolocation.';

        if (g) g.watchPosition(writePos, errorPos);
        else gps.innerHTML = 'Your browser does not support geolocation.';
    });

    await fetch(`https://api.openbrewerydb.org/breweries?by_dist=${lat},${lon}&per_page=${num}`)
        .then(res => res.json())
        .then(data => { master = data; })
        .then(() => render())
        .catch(err => console.log(err));

    heartSystem();
    toggleButtons();
}

/* -------------------------------------------------------------------------- *\
    Render Page
\* -------------------------------------------------------------------------- */

function render() {
    const breweries = document.getElementById('breweries');

    breweries.innerHTML = null;

    if (firstRender) {
        addDistance();
        cleanup();

        firstRender = false;
    }

    master.forEach(e => {
        if (e.hidden) return;

        const card = document.createElement('div');
        let heart = 'heart_plus';
        let heartClass = 'unhearted';

        if (e.heart) {
            heart = 'heart_minus';
            heartClass = 'hearted';
        }

        card.innerHTML += `<p class="distance">${e.distance} miles <output>away</output></p>`;
        card.innerHTML += `<p class="name">${e.name}</p>`;
        card.innerHTML += '<p class="type">'
            + `<i class="material-symbols-outlined ${heartClass}">${heart}</i>\t${e.type}</p>`;
        card.innerHTML += '<p class="address">'
            + `<span>Address: </span>${e.street}, ${e.city}`
            + `<span>, ${e.state}, ${e.postal}</span></p>`;
        card.innerHTML += `<p class="phone"><span>Phone: </span>${e.phone}</p>`;
        card.innerHTML += '<p class="website"><span>Website: </span>'
            + `<a href="https://${e.website}" target="_blank">`
            + `<output>${e.website.slice(0, 4)}</output>${e.website.slice(4)}</a></p>`;

        card.setAttribute('class', 'card');
        breweries.append(card);
    });
}

/* -------------------------------------------------------------------------- *\
    Favorites System
\* -------------------------------------------------------------------------- */

function heartSystem() {
    for (const e of document.getElementsByTagName('i')) {
        const name = e.parentElement.previousElementSibling.textContent;

        e.addEventListener('click', () => {
            if (e.innerText === 'heart_plus') {
                e.className = 'material-symbols-outlined hearted';
                e.innerText = 'heart_minus';

                for (const v of master) {
                    if (v.name === name) {
                        v.heart = true;
                        hearts.push(v);
                        break;
                    }
                }
            } else {
                e.className = 'material-symbols-outlined unhearted';
                e.innerText = 'heart_plus';

                for (const v of master) {
                    if (v.name === name) {
                        v.heart = false;
                        break;
                    }
                }

                hearts = hearts.filter(v => v.name !== name);
            }
        });

        e.addEventListener('click', () => {
            if (heartsDisplay) e.parentElement.parentElement.remove();
        });
    }
}

/* -------------------------------------------------------------------------- *\
    Helper Functions
\* -------------------------------------------------------------------------- */

function addDistance() {
    master.forEach(e => {
        const pr = Math.PI / 180;
        const φ1 = lat * pr;
        const φ2 = e.latitude * pr;
        const Δφ = (e.latitude - lat) * pr;
        const Δλ = (e.longitude - lon) * pr;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
            + Math.cos(φ1) * Math.cos(φ2)
            * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const distance = 7917.5 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        e.distance = Number(distance.toFixed(2));
    });
}

function changeTextColor(current) {
    const css = document.styleSheets[2].cssRules;

    for (let i = 0; i < css.length; i++) {
        if (css[i].selectorText === 'a:visited') css[i].style.color = current;
        if (css[i].selectorText === 'a') css[i].style.color = current;
        if (css[i].selectorText === 'button, select') css[i].style.color = current;
    }
}

function cleanup() {
    master.forEach(e => {
        e.heart = false;
        e.hidden = false;
        e.postal = e.postal_code.slice(0, 5);
        e.type = e.brewery_type;

        if (!e.phone) e.phone = '';
        else e.phone = e.phone.replaceAll(/\D/g, '');
        if (e.phone) e.phone = `(${e.phone.slice(0, 3)})-`
            + `${e.phone.slice(3, 6)}-${e.phone.slice(6)}`;

        if (!e.website_url) e.website = '';
        else e.website = e.website_url
            .slice(e.website_url.indexOf('//') + 2)
            .replace('/', '');
        if (!e.website.startsWith('www')) e.website = `www.${e.website}`;

        delete e.address_2;
        delete e.address_3;
        delete e.brewery_type;
        delete e.country;
        delete e.county_province;
        delete e.created_at;
        delete e.id;
        delete e.latitude;
        delete e.longitude;
        delete e.postal_code;
        delete e.updated_at;
        delete e.website_url;
    });
}

function toggleButtons() {
    [favorites, filter, sortDistance, sortName].forEach(e => {
        e.disabled = false;
        e.style.cursor = 'pointer';
        e.style.opacity = 1;
    });
}

/* -------------------------------------------------------------------------- *\
    Event Listeners
\* -------------------------------------------------------------------------- */

favorites.addEventListener('click', () => {
    if (!heartsDisplay) {
        heartsDisplay = true;
        favorites.style.background = '#3f87ea';
        [master, temp] = [hearts, master];
    } else {
        heartsDisplay = false;
        favorites.style.background = 'var(--c3)';
        [master, hearts, temp] = [temp, master, []];

        for (let i = 0; i < hearts.length; i++) {
            if (!hearts[i].heart) delete hearts[i];
        }

        hearts = hearts.flat();
    }

    render();
    heartSystem();
});

filter.addEventListener('change', v => {
    const { value } = v.target;

    if (value !== 'all') filter.style.background = '#3f87ea';
    else filter.style.background = 'var(--c3)';
    if (heartsDisplay) master = [...hearts];

    master.forEach(e => {
        if ((value !== e.type) && (value !== 'all')) {
            e.hidden = true;
        } else e.hidden = false;
    });

    render();
    heartSystem();
});

search.addEventListener('click', e => {
    e.target.disabled = true;
    e.target.style.animationPlayState = 'paused';
    e.target.style.cursor = 'not-allowed';
    e.target.style.opacity = 0.25;

    geolocation();
});

sortDistance.addEventListener('click', () => {
    if (heartsDisplay) master = [...hearts];

    if (!sortDistanceOrder) {
        sortDistanceOrder = true;
        master.sort((a, b) => a.distance > b.distance ? 1 : -1);
    } else {
        sortDistanceOrder = false;
        master.sort((a, b) => a.distance > b.distance ? -1 : 1);
    }

    render();
    heartSystem();
});

sortName.addEventListener('click', () => {
    if (heartsDisplay) master = [...hearts];

    if (!sortNameOrder) {
        sortNameOrder = true;
        master.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    } else {
        sortNameOrder = false;
        master.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1);
    }

    render();
    heartSystem();
});

theme.addEventListener('click', () => {
    if (!themeType) {
        themeType = 1;
        document.body.style.background = '#eee';
        document.body.style.color = 'black';
        document.querySelector('header').style.background = '#222';
        document.querySelector('footer').style.background = '#222';

        changeTextColor('black');
    } else {
        themeType = 0;
        document.body.style.background = '#222';
        document.body.style.color = 'white';
        document.querySelector('header').style.background = '#152238';
        document.querySelector('footer').style.background = '#152238';

        changeTextColor('white');
    }
});
