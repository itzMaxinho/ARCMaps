const searchInput = document.getElementById('item-search');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();

  if (!window.markerGroups) return;

  Object.values(window.markerGroups).forEach(group => {
    group.eachLayer(marker => {
      if (marker.itemName.includes(query)) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });
  });
});


// map config
const mapImages = {
  1: "assets/maps/DamBattlegrounds.jpg",
  2: "assets/maps/BuriedCity.jpg",
  3: "assets/maps/TheSpaceport.jpg",
  4: "assets/maps/BlueGate.jpg",
  5: "assets/maps/map5.jpg",
};

// px size
const mapDimensions = {
  1: [1000, 1000],
  2: [1000, 1000],
  3: [1000, 1000],
  4: [1000, 1000],
  5: [1000, 1000],
};

// Leaflet init
let map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -1,
  maxZoom: 4,
  zoomSnap: 0.25,
  zoomControl: false
});

L.control.zoom({
  position: 'topright'
}).addTo(map);

let currentLayer;

// map load func
function loadMap(mapId) {
  const img = mapImages[mapId];
  const [width, height] = mapDimensions[mapId];
  const bounds = [[0, 0], [height, width]];

  if (!img) {
    console.error(`Nie znaleziono obrazu dla mapy ${mapId}`);
    return;
  }

  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  currentLayer = L.imageOverlay(img, bounds);

  currentLayer.addTo(map);
  map.setMaxBounds(bounds);
  map.fitBounds(bounds);

  loadMarkers(mapId, height);
}

const toggleBtn = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  toggleBtn.innerHTML = sidebar.classList.contains('collapsed') ? '&#9654;' : '&#9664;';
});

// markers load func
let markerGroups = {};

async function loadMarkers(mapId, height) {
  if (window.markerGroups) {
    Object.values(window.markerGroups).forEach(group => map.removeLayer(group));
  }
  window.markerGroups = {};

  const url = `data/map${mapId}.json`;
  try {
    const res = await fetch(url);
    const markers = await res.json();

    markers.forEach((m) => {
      const icon = L.icon({
        iconUrl: `assets/icons/${m.icon || "marker.png"}`,
        iconSize: [24, 24],
      });

      const lat = height - m.y;
      const lng = m.x;

      const marker = L.marker([lat, lng], { icon });

      marker.itemName = m.name.toLowerCase();
      marker.itemDesc = m.desc;

      marker.on('mouseover', function () {
        marker.bindPopup(`<strong>${m.name}</strong><br>${m.desc}`).openPopup();
      });

      marker.on('mouseout', function () {
        marker.closePopup();
      });

      const popupContent = `<strong>${m.name}</strong><br>${m.desc}`;

      marker.on('mouseover', function () {
        marker.bindPopup(popupContent).openPopup();
      });

      marker.on('mouseout', function () {
        marker.closePopup();
      });

      const type = m.type || "other";
      if (!window.markerGroups[type]) {
        window.markerGroups[type] = L.layerGroup().addTo(map);
      }
      marker.addTo(window.markerGroups[type]);
    });
  } catch (err) {
    console.warn(`Brak danych markerów dla mapy ${mapId}`);
  }
}

const mapButtons = document.querySelectorAll(".map-btn");

mapButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    mapButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const mapId = btn.dataset.map;
    loadMap(mapId);
  });
});

const allCheckboxes = document.querySelectorAll('#filters input[type="checkbox"][value]');
const checkAllBtn = document.getElementById('check-all-btn');
const uncheckAllBtn = document.getElementById('uncheck-all-btn');

checkAllBtn.addEventListener('click', () => {
  allCheckboxes.forEach(cb => {
    cb.checked = true;
    const type = cb.value;
    if (window.markerGroups && window.markerGroups[type]) {
      window.markerGroups[type].addTo(map);
    }
  });
});

uncheckAllBtn.addEventListener('click', () => {
  allCheckboxes.forEach(cb => {
    cb.checked = false;
    const type = cb.value;
    if (window.markerGroups && window.markerGroups[type]) {
      map.removeLayer(window.markerGroups[type]);
    }
  });
});

// filters
document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const type = cb.value;
    if (window.markerGroups && window.markerGroups[type]) {
      if (cb.checked) {
        window.markerGroups[type].addTo(map);
      } else {
        map.removeLayer(window.markerGroups[type]);
      }
    }
  });
});

// default start
loadMap(1);
