"use strict";
// Hopped into this repo as i saw you followed, awesome page but see javascript used widely to manipulate the style of the site and write DOM elements, and other "imperative" approaches that increase the mental overhead for maintenance and later feature development - happy to add my ideas in a separate PR while sticking to vanilla JS if interested - piccirilloj1@gmail.com / 636-346-0118

/* -------------------------------------------------------------------------- *\
    Variable Declarations
\* -------------------------------------------------------------------------- */

let BREWERIES_API = "https://api.openbrewerydb.org/breweries";
let favorites = document.getElementById("favorites");
let filter = document.getElementById("filter");
let hamburger = document.getElementById("hamburger");
let menu = document.getElementById("menu");
let search = document.getElementById("search");
let sortDistance = document.getElementById("sortDistance");
let sortName = document.getElementById("sortName");

let firstRender = true;
let heartsDisplay = false;
let searchState = true;
let sortDistanceOrder = true;
let sortNameOrder = false;

let hearts = [];
let master = [];
let temp = [];

/* -------------------------------------------------------------------------- *\
    Geolocation API
\* -------------------------------------------------------------------------- */

// Interface with the wrapper in geolocation.js and surface errors to the DOM
async function manageGeolocation() {
  show(document.getElementById("loading"));
  try {
    if (await locator.canGeolocate()) {
      const [lat, lon] = await locator.getCoords();

      show(document.getElementById("gps-result"));
      document.getElementById("lat-result").textContent = lat;
      document.getElementById("lon-result").textContent = lon;
      return [lat, lon];
    }
  } catch (E) {
    // Catch error that occured when geolocating, and use it to toggle correct error message in DOM

    // If error is one we support - get handle for that.  Else get handle on the fallback
    const errorElement = document.getElementById(E.message)
      ? document.getElementById(E.message)
      : document.getElementById(locator.errorCodes.UNKNOWN);

    // Show it
    show(errorElement);
  } finally {
    // regardless of error or success, hide loading
    hide(document.getElementById("loading"));
  }
}

/**
 * Queries the breweries API.  Lacks any robust error handling but will tackle that later
 * @param {String} lat
 * @param {String} lon
 * @param {Number} num pages of results to retrieve from API
 */
async function queryAPI(lat, lon, num = 50) {
  const params = new URLSearchParams({
    by_dist: `${lat},${lon}`,
    per_page: num,
  });

  await fetch(`${BREWERIES_API}?${params.toString()}`)
    .then((res) => res.json())
    .then((data) => {
      master = data;
    })
    .then(() => addDistance(lat, lon)) // pass lat, lon here
    .then(render);
  heartSystem();
  toggleButtons();
}

/* -------------------------------------------------------------------------- *\
    Render Page
\* -------------------------------------------------------------------------- */

function render() {
  const breweries = document.getElementById("breweries");

  breweries.innerHTML = null;

  if (firstRender) {
    firstRender = false;
    cleanup();
  }

  master.forEach((e) => {
    if (e.hidden) return;

    const card = document.createElement("div");
    let heart = "heart_plus";
    let heartClass = "unhearted";

    if (e.heart) {
      heart = "heart_minus";
      heartClass = "hearted";
    }

    card.innerHTML += `<p class="distance">${e.distance} miles <output>away</output></p>`;
    card.innerHTML += `<p class="name">${e.name}</p>`;
    card.innerHTML +=
      '<p class="type">' +
      `<i class="material-symbols-outlined ${heartClass}">${heart}</i>\t${e.type}</p>`;
    card.innerHTML +=
      '<p class="address">' +
      `<span>Address: </span>${e.street}, ${e.city}` +
      `<span>, ${e.state}, ${e.postal}</span></p>`;
    card.innerHTML += `<p class="phone"><span>Phone: </span>${e.phone}</p>`;
    card.innerHTML +=
      '<p class="website"><span>Website: </span>' +
      `<a href="https://${e.website}" target="_blank">` +
      `<output>${e.website.slice(0, 4)}</output>${e.website.slice(4)}</a></p>`;

    card.setAttribute("class", "card");
    breweries.append(card);
  });
}

/* -------------------------------------------------------------------------- *\
    Favorites System
\* -------------------------------------------------------------------------- */

function heartSystem() {
  for (const e of document.getElementsByTagName("i")) {
    if (e.id) continue;

    const name = e.parentElement.previousElementSibling.textContent;

    e.addEventListener("click", () => {
      if (e.innerText === "heart_plus") {
        e.className = "material-symbols-outlined hearted";
        e.innerText = "heart_minus";

        for (const v of master) {
          if (v.name === name) {
            v.heart = true;
            hearts.push(v);
            break;
          }
        }
      } else {
        e.className = "material-symbols-outlined unhearted";
        e.innerText = "heart_plus";

        for (const v of master) {
          if (v.name === name) {
            v.heart = false;
            break;
          }
        }

        hearts = hearts.filter((v) => v.name !== name);
      }
    });

    e.addEventListener("click", () => {
      if (heartsDisplay) e.parentElement.parentElement.remove();
    });
  }
}

/* -------------------------------------------------------------------------- *\
    Helper Functions
\* -------------------------------------------------------------------------- */

function addDistance(lat, lon) {
  master.forEach((e) => {
    const pr = Math.PI / 180;
    const φ1 = lat * pr;
    const φ2 = e.latitude * pr;
    const Δφ = (e.latitude - lat) * pr;
    const Δλ = (e.longitude - lon) * pr;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const distance = 7917.5 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    e.distance = Number(distance.toFixed(2));
  });
}

function cleanup() {
  master.forEach((e) => {
    e.heart = false;
    e.hidden = false;
    e.postal = e.postal_code.slice(0, 5);
    e.street = e.street.trim();
    e.type = e.brewery_type;

    if (!e.phone) e.phone = "";
    else e.phone = e.phone.replaceAll(/\D/g, "");
    if (e.phone)
      e.phone =
        `(${e.phone.slice(0, 3)})-` +
        `${e.phone.slice(3, 6)}-${e.phone.slice(6)}`;

    if (!e.website_url) e.website = "";
    else
      e.website = e.website_url
        .slice(e.website_url.indexOf("//") + 2)
        .replace("/", "");
    if (!e.website.startsWith("www") && e.website)
      e.website = `www.${e.website}`;

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
  [favorites, filter, sortDistance, sortName].forEach((e) => {
    e.disabled = false;
    e.style.cursor = "pointer";
    e.style.opacity = 1;
  });

  filter.style.cursor = "ns-resize";
}

function favoritesEL() {
  if (!heartsDisplay) {
    heartsDisplay = true;
    favorites.style.background = "#3f87ea";
    [master, temp] = [hearts, master];
  } else {
    heartsDisplay = false;
    favorites.style.background = "var(--c3)";
    [master, hearts, temp] = [temp, master, []];

    for (let i = 0; i < hearts.length; i++) {
      if (!hearts[i].heart) delete hearts[i];
    }

    hearts = hearts.flat();
  }

  toggleDropdown();
  render();
  heartSystem();
}

function filterEL(v) {
  const { value } = v.target;

  if (value !== "all") filter.style.background = "#3f87ea";
  else filter.style.background = "var(--c3)";
  if (heartsDisplay) master = [...hearts];

  master.forEach((e) => {
    if (value !== e.type && value !== "all") {
      e.hidden = true;
    } else e.hidden = false;
  });

  toggleDropdown();
  render();
  heartSystem();
}

function searchEL(e) {
  searchState = false;
  e.disabled = true;
  e.style.animationPlayState = "paused";
  e.style.cursor = "not-allowed";
  e.style.opacity = 0.25;

  toggleDropdown();
  manageGeolocation().then((result) => {
    if (result) {
      let [lat, lon] = result;
      if (lat && lon) queryAPI(lat, lon);
    }
  });
}

function sortDistanceEL() {
  if (heartsDisplay) master = [...hearts];

  if (!sortDistanceOrder) {
    sortDistanceOrder = true;
    master.sort((a, b) => (a.distance > b.distance ? 1 : -1));
  } else {
    sortDistanceOrder = false;
    master.sort((a, b) => (a.distance > b.distance ? -1 : 1));
  }

  toggleDropdown();
  render();
  heartSystem();
}

function sortNameEL() {
  if (heartsDisplay) master = [...hearts];

  if (!sortNameOrder) {
    sortNameOrder = true;
    master.sort((a, b) =>
      a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
    );
  } else {
    sortNameOrder = false;
    master.sort((a, b) =>
      a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1
    );
  }

  toggleDropdown();
  render();
  heartSystem();
}

function themeEL() {
  const body = document.body;

  if (body.classList.contains("light")) {
    body.classList.remove("light");
    body.classList.add("dark");
  } else {
    body.classList.add("light");
    body.classList.remove("dark");
  }
}

/* -------------------------------------------------------------------------- *\
    Responsive Design
\* -------------------------------------------------------------------------- */

window.matchMedia("(max-width:480px)").onchange = mediaQuery;

function mediaQuery() {
  if (heartsDisplay) favorites.click();

  master.forEach((e) => {
    e.hidden = false;
  });

  render();
}
