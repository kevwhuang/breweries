const g = navigator.geolocation;
const gps = document.getElementById('gps');
let updates = 0;

const getPos = function () {
    if (g) g.getCurrentPosition(pos =>
        console.log(gps.innerHTML = pos.coords.latitude + ' / ' + pos.coords.longitude));
    else gps.innerHTML = 'Your browser does not support geolocation.';
}

const watchPos = function () {
    if (g) g.watchPosition(writePos, errorPos);
    else gps.innerHTML = 'Your browser does not support geolocation.';
}

const writePos = function (pos) {
    updates += 1;
    gps.innerHTML = 'Latitude: ' + pos.coords.latitude + '<br>';
    gps.innerHTML += 'Longitude: ' + pos.coords.longitude + '<br>';
    gps.innerHTML += 'Accuracy: ' + pos.coords.accuracy + '<br>';
    gps.innerHTML += 'Updates: ' + updates;
}

const errorPos = function (err) {
    gps.innerHTML = 'Error: ' + err;
}

getPos();
watchPos();
