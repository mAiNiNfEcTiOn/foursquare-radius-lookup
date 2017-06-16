const CLIENT_ID = '<YOUR CLIENT ID>';
const CLIENT_SECRET = '<YOUR CLIENT SECRET>';
const FOURSQUARE_VENUES_URL = 'https://api.foursquare.com/v2/venues/explore';
const GEOLOCATION_PROVIDER_URL = 'http://ip-api.com/json';

const radiusFilter = document.getElementById('radius');
const radiusFilterOutput = document.getElementById('radiusOutput');
let radiusFilterValue = null;
let geolocationDataCache;

function makeRequest(method, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        resolve(xhr.responseText);
      }
    };

    xhr.onerror = reject;
    xhr.send();
  });
}

function fetchPosition() {
  return makeRequest('GET', GEOLOCATION_PROVIDER_URL)
    .then(responseText => JSON.parse(responseText))
    .then((geolocationData) => {
      geolocationDataCache = geolocationData;
      return geolocationData;
    });
}

function fetchVenues(geolocationData) {
  let foursquareVenuesUrl = `${FOURSQUARE_VENUES_URL}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&v=20170616&m=foursquare&ll=${geolocationData.lat},${geolocationData.lon}`;

  if (radiusFilterValue !== null) {
    foursquareVenuesUrl += `&radius=${radiusFilterValue}`;
  }

  return makeRequest('GET', foursquareVenuesUrl)
    .then(responseText => JSON.parse(responseText));
}

function createVenueObject(item) {
  const { name, location, categories, stats, rating, ratingColor, photos } = item.venue;
  return {
    categories,
    location,
    name,
    photos,
    rating,
    ratingColor,
    stats,
  };
}

function createVenuesCollection(venuesData) {
  if (radiusFilterValue === null) {
    radiusFilter.value = venuesData.response.suggestedRadius;
    radiusFilterOutput.value = venuesData.response.suggestedRadius;
  } else {
    radiusFilterOutput.value = radiusFilterValue;
  }

  const { items } = venuesData.response.groups.pop();
  return Promise.resolve(items.map(createVenueObject));
}

function generateCard(item) {
  const { name, location } = item;
  return `<div class="card">
  <h3>${name}</h3>
  <address>${location.formattedAddress}</address>
</div>`;
}

function generateCardsFromCollection(collection) {
  return Promise.resolve(collection.map(generateCard));
}

function addCollectionToDOM(collection, domElement) {
  let markup = collection.join('\n');
  for (let i = 0; i < (collection.length % 4); i += 1) {
    markup += '<div class="empty-space"></div>';
  }
  domElement.innerHTML = markup; // eslint-disable-line
  return Promise.resolve();
}

function processVenues(geolocationData) {
  fetchVenues(geolocationData)
    .then(createVenuesCollection)
    .then(generateCardsFromCollection)
    .then(collection => addCollectionToDOM(collection, document.querySelector('.results')))
    .catch(console.error); // eslint-disable-line
}

let timer;
function handleRadiusChange(e) {
  if (timer) {
    clearTimeout(timer);
  }

  radiusFilterValue = e.target.value;

  setTimeout(() => {
    processVenues(geolocationDataCache);
  }, 300);
}

radiusFilter.addEventListener('change', handleRadiusChange);

fetchPosition()
  .catch(console.error) // eslint-disable-line
  .then(processVenues);
