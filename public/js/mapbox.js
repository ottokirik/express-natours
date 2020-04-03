/* eslint-disable no-undef */
const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoicGV0cm92aWNoMDEwMyIsImEiOiJjazhhNGhtc2owY3ZhM2VvZm41azh6dHRkIn0.tvJjaOQa0lQVXy5gqN1Lhg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/petrovich0103/ck8a56vrx0qj11io1yfoccg27',
  scrollZoom: false
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
  const el = document.createElement('div');
  el.className = 'marker';

  // eslint-disable-next-line no-new
  new mapboxgl.Marker({
    //Добавление своих маркеров на карту
    element: el,
    anchor: 'bottom'
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  new mapboxgl.Popup({
    offset: 30
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day: ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  bounds.extend(loc.coordinates); //Установка границ, чтобы все маркеры были видны
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100
  }
});
