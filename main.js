const breweries = document.getElementById('breweries');
const g = navigator.geolocation;
const gps = document.getElementById('gps');

let lat;
let list;
let lon;
let updates = 0;

if (g) g.getCurrentPosition(pos =>
    console.log(gps.innerHTML = pos.coords.latitude + ' / ' + pos.coords.longitude));
else gps.innerHTML = 'Your browser does not support geolocation.';

if (g) g.watchPosition(writePos, errorPos);
else gps.innerHTML = 'Your browser does not support geolocation.';

function writePos(pos) {
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
    updates += 1;

    gps.innerHTML = 'Latitude: ' + lat + '<br>';
    gps.innerHTML += 'Longitude: ' + lon + '<br>';
    gps.innerHTML += 'Accuracy: ' + pos.coords.accuracy + '<br>';
    gps.innerHTML += 'Updates: ' + updates;
}

function errorPos(err) {
    gps.innerHTML = 'Error: ' + err;
}

setTimeout(() => {
    fetch(`https://api.openbrewerydb.org/breweries?by_dist=${lat},${lon}&per_page=20`)
        .then(res => res.json())
        .then(data => list = data)
        .then(() => render())
        .catch(err => console.log(err));
}, 10000);

function render() {
    list.forEach(e => {
        const pr = Math.PI / 180;
        const φ1 = lat * pr;
        const φ2 = e.latitude * pr;
        const Δφ = (e.latitude - lat) * pr;
        const Δλ = (e.longitude - lon) * pr;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const distance = 7917.5 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        breweries.innerHTML += `${distance.toFixed(2)} miles away<br>`;
        breweries.innerHTML += `Type: ${e.brewery_type.toUpperCase()}<br>`;
        breweries.innerHTML += `Name: ${e.name}<br>`;
        breweries.innerHTML += `Address: ${e.street}, ${e.city}, ${e.state}, ${e.postal_code.slice(0, 5)}<br>`;
        breweries.innerHTML += `Phone: ${e.phone}<br>`;
        breweries.innerHTML += `Website: ${e.website_url.slice(e.website_url.indexOf('//') + 2)}<br>`;
        breweries.innerHTML += `<br>`;
    });
}
