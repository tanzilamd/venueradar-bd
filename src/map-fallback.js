import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
export function createMap(container, { onSelect, onError }) {
  const map = L.map(container, { scrollWheelZoom: false }).setView([23.76, 90.4], 12), markers = /* @__PURE__ */ new Map();
  let key = "", selected = null;
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
  tiles.on("tileerror", () => onError("Map tiles could not load. Switch to the list or use a venue\u2019s Google Maps link."));
  const clusters = L.markerClusterGroup({ chunkedLoading: true });
  map.addLayer(clusters);
  container.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const cluster = event.target.closest(".marker-cluster");
    if (!cluster) return;
    event.preventDefault();
    cluster.click();
  });
  function accessibleClusters() {
    for (const node of container.querySelectorAll(".marker-cluster")) {
      const count = node.textContent.trim();
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `${count} venues. Activate to zoom into this cluster.`);
      node.tabIndex = 0;
    }
  }
  map.on("layeradd zoomend moveend", accessibleClusters);
  const icon = (active) => L.divIcon({ html: '<span class="map-pin"></span>', className: "venue-marker" + (active ? " is-selected" : ""), iconSize: [44, 44], iconAnchor: [22, 22] });
  function fit() {
    if (markers.size) map.fitBounds(clusters.getBounds(), { padding: [30, 30], maxZoom: 15 });
  }
  function setResults(rows) {
    const next = rows.filter((v) => v.coordinates).map((v) => v.id + ":" + v.coordinates.lat + "," + v.coordinates.lon).join("|");
    if (next === key) return;
    key = next;
    clusters.clearLayers();
    markers.clear();
    for (const v of rows.filter((v2) => v2.coordinates)) {
      const marker = L.marker([v.coordinates.lat, v.coordinates.lon], { icon: icon(v.id === selected), title: v.name, alt: v.name, keyboard: true });
      const label = document.createElement("span");
      label.textContent = v.name;
      marker.bindTooltip(label, { direction: "top" });
      marker.on("click", () => onSelect(v.id));
      clusters.addLayer(marker);
      markers.set(v.id, marker);
    }
    fit();
    accessibleClusters();
  }
  function select(id, { zoom = false } = {}) {
    selected = id;
    for (const [venueId, marker2] of markers) {
      marker2.setIcon(icon(venueId === id));
      const node = marker2.getElement();
      if (node) node.setAttribute("aria-pressed", String(venueId === id));
    }
    const marker = markers.get(id);
    if (marker && zoom) clusters.zoomToShowLayer(marker, () => {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16));
      marker.openTooltip();
    });
  }
  return { setResults, select, fit, invalidate() {
    requestAnimationFrame(() => map.invalidateSize());
  } };
}

// One lazy, reusable map for the selected hall; no tiles are prefetched.
export function createLocationPreview(container, onError) {
  const map = L.map(container, { scrollWheelZoom: false, zoomControl: false, dragging: false, doubleClickZoom: false, touchZoom: false, keyboard: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).on("tileerror", onError).addTo(map);
  let marker = null, position = "";
  return {
    setVenue(v) {
      const next = `${v.coordinates.lat},${v.coordinates.lon}`;
      if (next !== position) {
        position = next;
        if (marker) marker.remove();
        const label = document.createElement("span");
        label.textContent = v.name;
        marker = L.marker([v.coordinates.lat, v.coordinates.lon], {
          icon: L.divIcon({ html: '<span class="map-pin"></span>', className: "venue-marker", iconSize: [36, 36], iconAnchor: [18, 18] }),
          title: v.name,
          alt: v.name
        }).bindTooltip(label).addTo(map);
        map.setView([v.coordinates.lat, v.coordinates.lon], 15);
      }
      requestAnimationFrame(() => map.invalidateSize());
    }
  };
}
