// -------- CONFIG --------
const ISS_API_BASE = "https://api.wheretheiss.at/v1";
const ISS_NOW_URL = ISS_API_BASE + "/satellites/25544";
const POSITIONS_URL = ISS_API_BASE + "/satellites/25544/positions";
const UPDATE_INTERVAL_MS = 5000;
const MAX_TRAIL_POINTS = 50;

// Satellite icon (small ISS PNG from a GitHub repo, public asset)
const ISS_ICON_URL =
  "https://raw.githubusercontent.com/MicrosoftStudentChapter/ISS-Tracker/main/iss.png";

// -------- STATE --------
let map;
let issMarker;
let footprintCircle = null;
let historyOrbitLine = null;

let trailCoords = [];
let trailSegments = [];
let trackingEnabled = true;
let historyLoaded = false;

// -------- INIT MAP --------
function initMap() {
  // Create map with zooming allowed
  map = L.map("map", {
    center: [20, 0],     // center nicely on Earth
    zoom: 2,             // full world view
    minZoom: 2,          // avoid zooming out too far
    maxZoom: 8,
    worldCopyJump: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true
  });

  // Esri world imagery
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "&copy; Esri",
      maxZoom: 8
    }
  ).addTo(map);

  // ISS icon
  const issIcon = L.icon({
    iconUrl: ISS_ICON_URL,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  // Marker
  issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
  issMarker.bindPopup("International Space Station 🛰️");
}

// -------- TRAIL (FADING BLACK LINE) --------
function updateTrail(lat, lon) {
  trailCoords.push([lat, lon]);
  if (trailCoords.length > MAX_TRAIL_POINTS) {
    trailCoords.shift();
  }

  // remove old segments
  trailSegments.forEach(seg => map.removeLayer(seg));
  trailSegments = [];

  // create new segments with increasing opacity
  for (let i = 0; i < trailCoords.length - 1; i++) {
    const start = trailCoords[i];
    const end = trailCoords[i + 1];
    const alpha = (i + 1) / trailCoords.length; // 0..1
    const seg = L.polyline([start, end], {
      color: `rgba(0,0,0,${alpha.toFixed(2)})`,
      weight: 2,
      opacity: alpha,
    }).addTo(map);
    trailSegments.push(seg);
  }
}

// -------- HISTORY ORBIT (~90 MIN) --------
async function fetchOrbitHistory() {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const step = 9 * 60; // 9 min steps * 10 = 90 min
    const timestamps = [];
    for (let i = 9; i >= 0; i--) {
      timestamps.push(nowSec - i * step);
    }

    const url =
      `${POSITIONS_URL}?timestamps=${timestamps.join(",")}&units=kilometers`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("History API error");

    const data = await res.json();
    const coords = data.map(p => [p.latitude, p.longitude]);

    if (historyOrbitLine) {
      map.removeLayer(historyOrbitLine);
    }

    historyOrbitLine = L.polyline(coords, {
      color: "black",
      weight: 1,
      dashArray: "4 4",
      opacity: 0.5,
    }).addTo(map);
  } catch (err) {
    console.warn("Failed to load orbit history:", err);
  }
}

// -------- REVERSE GEOCODE (COUNTRY/REGION) --------
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Reverse geocode error: " + res.status);
    }

    const data = await res.json();

    const city =
      data.city ||
      data.locality ||
      (data.localityInfo && data.localityInfo.locality && data.localityInfo.locality.name) ||
      "";
    const region =
      data.principalSubdivision ||
      (data.localityInfo && data.localityInfo.principalSubdivision && data.localityInfo.principalSubdivision.name) ||
      "";
    const country =
      data.countryName ||
      (data.localityInfo && data.localityInfo.country && data.localityInfo.country.name) ||
      "";

    console.log(`City: ${data.city}`);

    const parts = [city, region, country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Unknown location";
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return "Unknown location";
  }
}

// -------- UI HELPERS --------
function updateInfoPanels(data, locationLabel) {
  const lat = data.latitude.toFixed(2);
  const lon = data.longitude.toFixed(2);
  const alt = data.altitude.toFixed(1);
  const speed = data.velocity.toFixed(1);
  const footprint = data.footprint.toFixed(1);
  const visibility = data.visibility || "--";

  // header
  document.getElementById("stat-lat").textContent = lat;
  document.getElementById("stat-lon").textContent = lon;
  document.getElementById("stat-alt").textContent = `${alt} km`;
  document.getElementById("stat-speed").textContent = `${speed} km/h`;
  document.getElementById("stat-vis").textContent = visibility;

  // side info
  document.getElementById("info-lat").textContent = lat;
  document.getElementById("info-lon").textContent = lon;
  document.getElementById("info-alt").textContent = `${alt} km`;
  document.getElementById("info-speed").textContent = `${speed} km/h`;
  document.getElementById("info-footprint").textContent = `${footprint} km diameter`;
  document.getElementById("info-visibility").textContent = visibility;

  document.getElementById("location-text").textContent = locationLabel;
  document.getElementById("map-location-label").textContent =
    `${locationLabel} (lat=${lat}, lon=${lon})`;

  const now = new Date().toISOString().replace("T", " ").split(".")[0];
  document.getElementById("update-time").textContent = `Last update: ${now} (UTC)`;
}

function setTrackingUI(isTracking) {
  trackingEnabled = isTracking;
  const btn = document.getElementById("btn-toggle-tracking");
  const dot = document.getElementById("track-dot");
  const label = document.getElementById("track-label");

  if (isTracking) {
    btn.classList.add("active");
    btn.textContent = "⏯ Pause Tracking";
    dot.classList.remove("paused");
    label.textContent = "Tracking";
  } else {
    btn.classList.remove("active");
    btn.textContent = "▶ Resume Tracking";
    dot.classList.add("paused");
    label.textContent = "Paused";
  }
}

// -------- MAIN FETCH LOOP --------
async function fetchAndUpdateISS(firstRun = false) {
  if (!trackingEnabled) return;

  try {
    const res = await fetch(ISS_NOW_URL + "?units=kilometers");
    if (!res.ok) throw new Error("ISS API error");
    const data = await res.json();

    const lat = data.latitude;
    const lon = data.longitude;

    // move marker
    issMarker.setLatLng([lat, lon]);
    if (firstRun) {
      // small zoom so you see ISS area nicely, but you can zoom out
      map.setView([lat, lon], 3);
    }

    // footprint circle (footprint = diameter in km)
    if (footprintCircle) map.removeLayer(footprintCircle);
    const radiusMeters = (data.footprint * 1000) / 2;
    footprintCircle = L.circle([lat, lon], {
      radius: radiusMeters,
      color: "#0ea5e9",
      fillColor: "#0ea5e9",
      fillOpacity: 0.08,
      weight: 1,
    }).addTo(map);

    // trail
    updateTrail(lat, lon);

    // reverse geocode
    const locationLabel = await reverseGeocode(lat, lon);

    // update text
    updateInfoPanels(data, locationLabel);

    // history orbit only once
    if (!historyLoaded) {
      historyLoaded = true;
      fetchOrbitHistory();
    }
  } catch (err) {
    console.error("Failed to fetch ISS data:", err);
  }
}

// -------- BOOTSTRAP --------
window.addEventListener("load", () => {
  initMap();
  setTrackingUI(true);
  fetchAndUpdateISS(true);
  setInterval(() => {
    fetchAndUpdateISS(false);
  }, UPDATE_INTERVAL_MS);
});

// -------- EVENT LISTENER --------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-toggle-tracking");
  if (btn) {
    btn.addEventListener("click", () => {
      setTrackingUI(!trackingEnabled);
    });
  }
});
