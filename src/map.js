import * as maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

maplibregl.setWorkerUrl(workerUrl);

// The public OpenFreeMap service needs no account or API key. Keep the style URL
// in one place so a provider change never touches venue data or map controls.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const tileFailure = "Map imagery could not load. Switch to the list or use a venue’s Google Maps link.";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasWebGL = () => {
  try { return !!document.createElement("canvas").getContext("webgl2"); }
  catch { return false; }
};
const coordinates = (v) => [v.coordinates.lon, v.coordinates.lat];

// Small, deliberate palette changes on top of Positron. Ignore unknown layer
// names if OpenFreeMap updates its style; the stock style is still usable.
function tuneStyle(map) {
  const paint = {
    background: ["background-color", "#f8f9f4"],
    water: ["fill-color", "#c8dfd9"],
    park: ["fill-color", "#dcebdc"],
    landcover_wood: ["fill-color", "#dbe9db"],
    building: ["fill-color", "#e7e9df"],
  };
  for (const [layer, [property, color]] of Object.entries(paint)) {
    if (map.getLayer(layer)) map.setPaintProperty(layer, property, color);
  }
}
function makeMap(container, { preview = false, onError }) {
  const map = new maplibregl.Map({
    container, style: STYLE_URL, center: [90.41, 23.76], zoom: 11.5,
    minZoom: 9, maxZoom: 19, scrollZoom: false, dragRotate: false,
    pitchWithRotate: false, interactive: !preview, attributionControl: false,
    fadeDuration: 0,
  });
  // OpenFreeMap's style already supplies OpenFreeMap, OpenMapTiles and OSM
  // attribution through source metadata; do not repeat it in the control.
  map.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-right");
  if (!preview) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
  map.on("style.load", () => tuneStyle(map));
  map.on("error", () => onError?.(tileFailure));
  return map;
}
function venueElement(v, active, onSelect) {
  const node = document.createElement(onSelect ? "button" : "div");
  if (onSelect) node.type = "button";
  node.className = "venue-marker" + (active ? " is-selected" : "");
  node.dataset.venueId = v.id;
  node.dataset.label = v.name;
  node.setAttribute("aria-label", onSelect ? `Select ${v.name} on the map` : `${v.name} map point`);
  if (onSelect) node.setAttribute("aria-pressed", String(active));
  else node.setAttribute("role", "img");
  const pin = document.createElement("span");
  pin.className = "map-pin";
  pin.setAttribute("aria-hidden", "true");
  node.append(pin);
  if (onSelect) node.addEventListener("click", (event) => { event.stopPropagation(); onSelect(v.id); });
  return node;
}
function clusterElement(count, onActivate) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "marker-cluster";
  node.tabIndex = 0;
  node.setAttribute("aria-label", `${count} venues. Activate to zoom in or list them.`);
  const label = document.createElement("span");
  label.textContent = String(count);
  node.append(label);
  node.addEventListener("click", (event) => { event.stopPropagation(); onActivate(); });
  return node;
}

export async function createMap(container, { onSelect, onError, onViewportChange }) {
  if (!hasWebGL()) return (await import("./map-fallback.js")).createMap(container, { onSelect, onError, onViewportChange });
  let map;
  try { map = makeMap(container, { onError }); }
  catch { return (await import("./map-fallback.js")).createMap(container, { onSelect, onError, onViewportChange }); }
  const index = new Supercluster({ radius: 48, maxZoom: 18 });
  let rows = [], key = "", selected = null, popup = null, userMarker = null;
  const markers = new Map();
  const byId = new Map();
  function clearMarkers() {
    for (const marker of markers.values()) marker.remove();
    markers.clear();
  }
  function showClusterList(cluster) {
    popup?.remove();
    const list = document.createElement("div");
    list.className = "cluster-venue-list";
    const title = document.createElement("strong");
    title.textContent = `${cluster.properties.point_count} venues at this location`;
    list.append(title);
    for (const leaf of index.getLeaves(cluster.properties.cluster_id, Infinity)) {
      const v = byId.get(leaf.properties.venueId);
      if (!v) continue;
      const choice = document.createElement("button");
      choice.type = "button";
      choice.textContent = v.name;
      choice.addEventListener("click", () => { popup?.remove(); onSelect(v.id); });
      list.append(choice);
    }
    popup = new maplibregl.Popup({ closeButton: true, maxWidth: "250px", className: "venue-cluster-popup" })
      .setLngLat(cluster.geometry.coordinates).setDOMContent(list).addTo(map);
  }
  function renderMarkers() {
    if (!rows.length) { clearMarkers(); return; }
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const clusters = index.getClusters(bbox, Math.min(19, Math.max(0, Math.floor(map.getZoom()))));
    const visible = new Set();
    for (const cluster of clusters) {
      const lngLat = cluster.geometry.coordinates;
      if (cluster.properties.cluster) {
        const key = `cluster:${cluster.properties.cluster_id}`;
        visible.add(key);
        if (markers.has(key)) { markers.get(key).setLngLat(lngLat); continue; }
        const activate = () => {
          const zoom = index.getClusterExpansionZoom(cluster.properties.cluster_id);
          if (zoom > 18 || (zoom <= map.getZoom() && map.getZoom() >= 18)) showClusterList(cluster);
          else map.easeTo({ center: lngLat, zoom: Math.min(zoom, 19), duration: reducedMotion() ? 0 : 300 });
        };
        markers.set(key, new maplibregl.Marker({ element: clusterElement(cluster.properties.point_count, activate), anchor: "center" }).setLngLat(lngLat).addTo(map));
      } else {
        const v = byId.get(cluster.properties.venueId);
        if (!v) continue;
        const key = `venue:${v.id}`;
        visible.add(key);
        if (markers.has(key)) { markers.get(key).setLngLat(lngLat); continue; }
        markers.set(key, new maplibregl.Marker({ element: venueElement(v, v.id === selected, onSelect), anchor: "center" }).setLngLat(lngLat).addTo(map));
      }
    }
    for (const [key, marker] of markers) if (!visible.has(key)) { marker.remove(); markers.delete(key); }
  }
  function visibleIds() {
    const bounds = map.getBounds();
    return rows.filter((v) => bounds.contains(coordinates(v))).map((v) => v.id);
  }
  map.on("moveend", () => { renderMarkers(); onViewportChange?.(visibleIds()); });
  function fit() {
    if (!rows.length) return;
    const lons = rows.map((v) => v.coordinates.lon), lats = rows.map((v) => v.coordinates.lat);
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
      { padding: { top: 66, bottom: 48, left: 70, right: 48 }, maxZoom: 15, duration: 0 });
    renderMarkers();
  }
  function setResults(allRows) {
    const nextRows = allRows.filter((v) => v.coordinates);
    const nextKey = nextRows.map((v) => `${v.id}:${v.coordinates.lat},${v.coordinates.lon}`).sort().join("|");
    if (nextKey === key) return;
    key = nextKey;
    rows = nextRows;
    byId.clear();
    const points = rows.map((v) => {
      byId.set(v.id, v);
      return { type: "Feature", properties: { venueId: v.id }, geometry: { type: "Point", coordinates: coordinates(v) } };
    });
    index.load(points);
    popup?.remove();
    clearMarkers();
    if (rows.length) fit();
    else onViewportChange?.([]);
  }
  function select(id, { zoom = false } = {}) {
    selected = id;
    for (const marker of markers.values()) {
      const node = marker.getElement(), active = node.dataset.venueId === id;
      if (!node.dataset.venueId) continue;
      node.classList.toggle("is-selected", active);
      node.setAttribute("aria-pressed", String(active));
    }
    const v = byId.get(id);
    if (v && zoom) map.jumpTo({ center: coordinates(v), zoom: Math.max(map.getZoom(), 16) });
  }
  function focusLocation(point) {
    userMarker?.remove();
    const dot = document.createElement("div");
    dot.className = "map-user-dot";
    dot.setAttribute("role", "img");
    dot.setAttribute("aria-label", "Your approximate location");
    userMarker = new maplibregl.Marker({ element: dot, anchor: "center" }).setLngLat([point.lon, point.lat]).addTo(map);
    map.easeTo({ center: [point.lon, point.lat], zoom: 14, duration: reducedMotion() ? 0 : 350 });
  }
  const resizeObserver = new ResizeObserver(() => {
    if (!container.clientWidth || !container.clientHeight) return;
    map.resize();
    renderMarkers();
    onViewportChange?.(visibleIds());
  });
  resizeObserver.observe(container);
  return { setResults, select, fit, visibleIds, focusLocation, invalidate() { map.resize(); renderMarkers(); onViewportChange?.(visibleIds()); } };
}

// The selected-venue preview shares the same vector style, but makes no map
// request until its explicit Show location map action is used.
export async function createLocationPreview(container, onError) {
  if (!hasWebGL()) return (await import("./map-fallback.js")).createLocationPreview(container, onError);
  let map;
  try { map = makeMap(container, { preview: true, onError }); }
  catch { return (await import("./map-fallback.js")).createLocationPreview(container, onError); }
  let marker = null, position = "";
  return {
    setVenue(v) {
      const next = `${v.coordinates.lat},${v.coordinates.lon}`;
      if (next !== position) {
        position = next;
        marker?.remove();
        marker = new maplibregl.Marker({ element: venueElement(v, false, null), anchor: "center" })
          .setLngLat(coordinates(v)).addTo(map);
        map.jumpTo({ center: coordinates(v), zoom: 15 });
      }
      requestAnimationFrame(() => map.resize());
    },
  };
}
