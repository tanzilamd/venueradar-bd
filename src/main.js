import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./style.css";
import {
  filterVenues,
  sizeOf,
  readIds,
  mapsURL,
  hasCapacity,
  capacityText,
} from "./model.js";
const $ = (id) => document.getElementById(id),
  bn = (n) =>
    new Intl.NumberFormat("en-BD", { maximumFractionDigits: 1 }).format(n);
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const external = (label, url) => {
  const a = el("a", label);
  try {
    if (new URL(url).protocol !== "https:")
      return el("span", "Link unavailable");
  } catch {
    return el("span", "Link unavailable");
  }
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
};
let venues = [],
  areas,
  collections,
  results = [],
  favorites = [],
  compare = [],
  location = null,
  saved = false,
  map,
  clusters,
  markers = new Map(),
  selected = null;
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error();
    },
  };
}
const labels = {
  "Community Center": "Community Center",
  "Wedding Venue": "Wedding Venue",
  "Banquet Hall": "Banquet Hall",
  "Convention Center": "Convention Center",
  "Event Hall": "Event Hall",
  Small: "Small",
  Medium: "Medium",
  Large: "Large",
  Unknown: "Unknown",
  Parking: "Parking",
  "Air conditioning": "Air conditioning",
  Catering: "Catering",
  "Accessible entrance": "Accessible entrance",
  Accommodation: "Accommodation",
  Stage: "Stage",
  "source-checked": "Source checked",
  "cross-checked": "Cross-checked",
  "open-data-listed": "Map listing · not operator-confirmed",
};
const tr = (s) => labels[s] || s;
for (const o of $("category").options)
  if (o.value) {
    const value = o.value;
    o.value = value;
    o.textContent = tr(value);
  }
const filterToggle = button(
  "More filters",
  () => {
    const expanded = document
      .querySelector(".filters")
      .classList.toggle("expanded");
    filterToggle.setAttribute("aria-expanded", String(expanded));
  },
  "filter-toggle",
);
filterToggle.setAttribute("aria-expanded", "false");
filterToggle.setAttribute("aria-controls", "category");
document.querySelector(".filterhead").append(filterToggle);
const ids = [
  "search",
  "collection",
  "evidence",
  "area",
  "category",
  "size",
  "phone",
  "capacity",
  "verified",
  "parking",
  "sort",
];
const filters = () => {
  const f = Object.fromEntries(
    ids.map((id) => [
      id,
      $(id).type === "checkbox" ? $(id).checked : $(id).value,
    ]),
  );
  f.collectionIds = f.collection
    ? collections?.groups.find((g) => g.id === f.collection)?.venue_ids || []
    : null;
  return f;
};
function persist(key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    $("message").textContent =
      "Browser storage is unavailable. Your selections will last for this session only.";
  }
}
function option(select, value, name) {
  const o = el("option", name);
  o.value = value;
  select.append(o);
}
function placeOptions() {
  areaOptions();
}
function areaOptions() {
  const old = $("area").value;
  $("area").replaceChildren();
  option($("area"), "", "All Dhaka");
  const scope = filters().collectionIds;
  const scoped = venues.filter((v) => !scope || scope.includes(v.id));
  for (const a of areas.neighborhoods) {
    const count = scoped.filter((v) => v.area === a.name).length;
    option($("area"), a.name, `${a.name} · ${count} indexed`);
  }
  const unknown = scoped.filter((v) => !v.area).length;
  if (unknown)
    option($("area"), "__unknown__", `Area not confirmed · ${unknown} indexed`);
  if ([...$("area").options].some((o) => o.value === old))
    $("area").value = old;
}
function button(text, action, cls) {
  const b = el("button", text, cls);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
function open(content) {
  $("dialogContent").replaceChildren(content);
  if (!$("dialog").open) $("dialog").showModal();
}
function method() {
  const box = el("section");
  box.append(
    el("p", "OUR RESEARCH STANDARD", "eyebrow"),
    el("h2", "Clear facts. Visible sources."),
  );
  for (const [title, text] of [
    [
      "Directory coverage",
      `${bn(venues.length)} venues are indexed in Dhaka, including ${bn(venues.filter((v) => v.verification === "open-data-listed").length)} OpenStreetMap listings. Map listings are not operator-confirmed and may be outdated. Wedding-only use and current operation are not guaranteed. The default collection prioritizes community centers and halls; hotels are available separately. Coverage is incomplete.`,
    ],
    [
      "Ratings and reviews",
      "We do not copy or store Google ratings. Open a venue’s Google Maps link to check current ratings and reviews. More documented information does not necessarily mean a better venue.",
    ],
    [
      "How size is classified",
      "Small: fewer than 300 people. Medium: 300–999. Large: 1,000 or more. Classification uses published capacity only. Always compare seating layouts: theatre and banquet capacities differ. Published ranges are preserved; a range is classified only if both bounds fall within the same size band. Capacity sorting uses the lower bound for ranges.",
    ],
    [
      "Business contacts and verification",
      "A published business number is not proof that the line is active. Check its source and review date. WhatsApp support is never assumed. Verification describes the evidence, not a quality endorsement.",
    ],
    [
      "Your privacy",
      "Saved venues and comparisons stay in your browser. With permission, your location is requested once and never stored or continuously tracked. Map and link providers may receive your IP address. No analytics or account is required.",
    ],
    [
      "Sources and licensing",
      "Venue database and mapped boundary: © OpenStreetMap contributors, ODbL-1.0, with separately cited operator facts. Bulk discovery used the 24 October 2026 Geofabrik extract; map edit dates are not operating-status checks. Administrative reference: nuhil/bangladesh-geocode (MIT). No restricted Google ratings, photographs or marketing prose are copied.",
    ],
  ]) {
    box.append(el("h3", title), el("p", text));
  }
  box.append(
    external(
      "Administrative reference",
      "https://github.com/nuhil/bangladesh-geocode",
    ),
    el(
      "p",
      "Suggest a correction or a new venue through GitHub, with supporting sources.",
    ),
    external("GitHub repository", "https://github.com/tanzilamd/venueradar-bd"),
    external(
      "OpenStreetMap attribution and license",
      "https://www.openstreetmap.org/copyright",
    ),
    external(
      "Geofabrik source extract",
      "https://download.geofabrik.de/asia/bangladesh.html",
    ),
  );
  open(box);
}
function save(v) {
  favorites = favorites.includes(v.id)
    ? favorites.filter((x) => x !== v.id)
    : [...favorites, v.id];
  persist("vr-favorites", favorites);
  render();
}
function toggleCompare(v) {
  if (compare.includes(v.id)) compare = compare.filter((x) => x !== v.id);
  else if (compare.length < 3) compare.push(v.id);
  else {
    $("message").textContent = "Compare up to three venues at a time.";
    return;
  }
  persist("vr-compare", compare);
  render();
}
function syncCompare() {
  $("compareBar").hidden = !compare.length;
  $("compareCount").textContent = `${bn(compare.length)} selected`;
  $("openCompare").disabled = compare.length < 2;
  $("savedCount").textContent = bn(favorites.length);
}
function facts(v) {
  return [
    ["Location", v.address || "Not available"],
    ["Venue type", tr(v.category)],
    [
      "Published capacity",
      hasCapacity(v)
        ? `${capacityText(v)} · ${v.capacity_layout || "Layout unspecified"}`
        : "Unknown",
    ],
    ["Size", tr(sizeOf(v.capacity, v.capacity_range))],
    ["Documented facilities", v.facilities.map(tr).join(", ") || "Unknown"],
    [
      "Phone",
      v.phones.map((p) => p.number).join(", ") || "Phone not available",
    ],
    ["Evidence status", tr(v.verification)],
    ["Source reviewed", v.last_checked || "Not checked"],
    ...(v.discovery
      ? [["Map record last edited", v.discovery.osm_updated.slice(0, 10)]]
      : []),
  ];
}
function detail(v) {
  selected = v.id;
  renderCards();
  if (map && v.coordinates) {
    map.setView([v.coordinates.lat, v.coordinates.lon], 15);
    markers.get(v.id)?.openPopup();
  }
  const box = el("article");
  box.append(
    el("p", tr(v.category), "eyebrow"),
    el("h2", v.name),
    el("p", v.area || "Dhaka"),
  );
  const dl = el("dl");
  for (const [k, val] of facts(v)) dl.append(el("dt", k), el("dd", val));
  box.append(dl);
  if (v.coordinates) {
    box.append(
      button("Show this venue on the map", () => {
        $("dialog").close();
        $("mapView").click();
        map.setView([v.coordinates.lat, v.coordinates.lon], 16);
        const marker = markers.get(v.id);
        if (marker) clusters.zoomToShowLayer(marker, () => marker.openPopup());
      }),
    );
  } else
    box.append(
      el(
        "p",
        "Map coordinates are not yet verified. Use the Google Maps search link to check the location.",
      ),
    );
  for (const p of v.phones) {
    const a = el("a", `Call · ${p.number}`, "linkbutton");
    a.href = "tel:" + p.number;
    box.append(
      a,
      el("p", `Published business number; line not call-tested. ${p.checked}`),
      external("Phone source", p.source),
    );
  }
  box.append(
    el(
      "p",
      "Ratings are not stored here. Check current reviews on Google Maps.",
    ),
    external("Google Maps · reviews & directions", mapsURL(v)),
  );
  if (v.website) box.append(el("p"), external("Official website", v.website));
  box.append(el("h3", "Sources for this record"));
  const ul = el("ul", null, "sources");
  for (const s of v.evidence) {
    const li = el("li");
    li.append(
      external(s.url, s.url),
      el("p", `${s.fields.join(", ")} · ${s.checked} · ${s.kind}`),
    );
    ul.append(li);
  }
  box.append(ul);
  if (v.notes) box.append(el("p", v.notes));
  open(box);
}
function renderCards() {
  $("results").replaceChildren();
  if (!results.length) {
    const empty = el("section", null, "empty");
    empty.append(
      el("span", "◎", "symbol"),
      el(
        "h3",
        venues.length
          ? "No venues match these filters"
          : "Research first. Verified facts only.",
      ),
      el(
        "p",
        venues.length
          ? "Try another neighborhood or remove a filter to see more indexed venues."
          : "No venue records are available yet. Unverified places will not be presented as researched venues.",
      ),
      button(
        venues.length ? "Clear all filters" : "Read our research standard",
        venues.length ? reset : method,
      ),
    );
    $("results").append(empty);
    return;
  }
  for (const v of results) {
    const c = el(
      "article",
      null,
      "card" + (selected === v.id ? " selected" : ""),
    );
    c.dataset.venue = v.id;
    const body = el("div");
    body.append(
      el("span", tr(v.category), "eyebrow"),
      el("h3", v.name),
      el("p", v.area || "Dhaka", "english"),
      el("p", v.address),
      el("p", v.capacity_layout || "Seating layout unknown", "hint"),
      el(
        "span",
        hasCapacity(v)
          ? `${capacityText(v)} · ${tr(sizeOf(v.capacity, v.capacity_range))}`
          : "Capacity unknown",
        "badge",
      ),
    );
    body.append(
      el(
        "span",
        v.verification === "open-data-listed"
          ? "Map listing · confirm wedding booking"
          : "Operator source checked",
        "badge evidence-badge",
      ),
    );
    if (v.facilities.includes("Parking"))
      body.append(el("span", "Parking documented", "badge"));
    if (v.distance != null)
      body.append(el("p", `${bn(v.distance)} km · straight-line distance`));
    const star = button(
      favorites.includes(v.id) ? "Saved ✓" : "Save +",
      () => save(v),
      "save",
    );
    star.setAttribute("aria-pressed", String(favorites.includes(v.id)));
    star.setAttribute("aria-label", `${v.name} · save venue`);
    const actions = el("div", null, "card-actions");
    actions.append(
      button("View details", () => detail(v)),
      button(compare.includes(v.id) ? "Remove comparison" : "Compare +", () =>
        toggleCompare(v),
      ),
    );
    if (v.phones.length) {
      const a = el("a", "Call venue");
      a.href = "tel:" + v.phones[0].number;
      actions.append(a);
    } else actions.append(el("span", "Phone not available", "badge"));
    actions.append(external("Google reviews", mapsURL(v)));
    c.append(body, star, actions);
    $("results").append(c);
  }
}
function render() {
  results = filterVenues(
    venues,
    { ...filters(), saved: saved ? favorites : null },
    location,
  );
  $("count").textContent = bn(results.length);
  $("resultLabel").textContent = saved
    ? "Your saved venues"
    : "Indexed venues only · coverage is incomplete";
  $("breadcrumb").textContent =
    "DHAKA / " +
    ($("area").value === "__unknown__"
      ? "AREA NOT CONFIRMED"
      : $("area").value || "ALL NEIGHBORHOODS");
  $("stats").replaceChildren();
  for (const [n, label] of [
    [results.length, "Indexed venues"],
    [results.filter(hasCapacity).length, "Capacity documented"],
    [
      results.filter((v) => sizeOf(v.capacity, v.capacity_range) === "Large")
        .length,
      "Large venues",
    ],
    [results.filter((v) => v.phones.length).length, "Business phone listed"],
  ]) {
    const d = el("div");
    d.append(el("strong", bn(n)), el("span", label));
    $("stats").append(d);
  }
  renderCards();
  syncCompare();
  updateMap();
}
function reset() {
  for (const id of ids) {
    const n = $(id);
    if (n.type === "checkbox") n.checked = false;
    else
      n.value =
        id === "sort" ? "name" : id === "collection" ? collections.default : "";
  }
  saved = false;
  $("saved").classList.remove("active");
  $("explore").classList.add("active");
  $("message").textContent = "";
  placeOptions();
  render();
}
function initMap() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 0);
    return;
  }
  map = L.map("map", { scrollWheelZoom: false }).setView([23.7, 90.3], 7);
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  tiles.on("tileerror", () => {
    $("message").textContent =
      "Map tiles could not load. All venue information is still available in the list.";
  });
  clusters = L.markerClusterGroup({ chunkedLoading: true });
  map.addLayer(clusters);
  updateMap();
}
function updateMap() {
  if (!map) return;
  clusters.clearLayers();
  markers.clear();
  for (const v of results.filter((v) => v.coordinates)) {
    const icon = L.divIcon({
      html: '<span style="display:block;border:3px solid white;border-radius:50%;background:#184e42;width:22px;height:22px;box-shadow:0 1px 5px #444"></span>',
      className: "venue-marker",
      iconSize: [22, 22],
    });
    const m = L.marker([v.coordinates.lat, v.coordinates.lon], {
      icon,
      alt: v.name,
    });
    const p = button(v.name, () => detail(v));
    m.bindPopup(p);
    m.on("click", () => {
      selected = v.id;
      renderCards();
      document
        .querySelector(`[data-venue="${v.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    clusters.addLayer(m);
    markers.set(v.id, m);
  }
  if (markers.size)
    map.fitBounds(clusters.getBounds(), { padding: [30, 30], maxZoom: 14 });
}
function compareView() {
  const box = el("section");
  box.append(
    el("h2", "Compare side by side"),
    el(
      "p",
      "Unknown information does not mean a facility is absent. Contact the venue to confirm.",
    ),
  );
  const wrap = el("div", null, "table-wrap"),
    table = el("table"),
    head = el("tr");
  head.append(el("th", "Information"));
  const vs = compare
    .map((id) => venues.find((v) => v.id === id))
    .filter(Boolean);
  for (const v of vs) head.append(el("th", v.name));
  table.append(head);
  for (let i = 0; i < facts(vs[0]).length; i++) {
    const row = el("tr");
    row.append(el("th", facts(vs[0])[i][0]));
    for (const v of vs) row.append(el("td", facts(v)[i][1]));
    table.append(row);
  }
  for (const [label, key] of [
    ["Official website", "website"],
    ["Google reviews", "maps"],
  ]) {
    const row = el("tr");
    row.append(el("th", label));
    for (const v of vs) {
      const cell = el("td");
      cell.append(
        key === "maps"
          ? external("Read reviews", mapsURL(v))
          : v.website
            ? external("Visit website", v.website)
            : el("span", "Not available"),
      );
      row.append(cell);
    }
    table.append(row);
  }
  wrap.append(table);
  box.append(wrap);
  open(box);
}
$("dialog").querySelector(".close").onclick = () => $("dialog").close();
for (const id of ["method", "footerMethod", "researchLink"])
  $(id).onclick = (e) => {
    e.preventDefault();
    method();
  };
$("reset").onclick = reset;
$("explore").onclick = reset;
$("saved").onclick = () => {
  saved = !saved;
  if (saved) {
    $("collection").value = "";
    areaOptions();
  }
  $("saved").classList.toggle("active", saved);
  $("explore").classList.toggle("active", !saved);
  render();
};
$("listView").onclick = () => {
  $("mapWrap").hidden = true;
  $("listView").setAttribute("aria-pressed", "true");
  $("mapView").setAttribute("aria-pressed", "false");
};
$("mapView").onclick = () => {
  $("mapWrap").hidden = false;
  $("mapView").setAttribute("aria-pressed", "true");
  $("listView").setAttribute("aria-pressed", "false");
  initMap();
};
$("clearCompare").onclick = () => {
  compare = [];
  persist("vr-compare", compare);
  render();
};
$("openCompare").onclick = compareView;
$("nearby").onclick = () => {
  if (!navigator.geolocation) {
    $("message").textContent =
      "Geolocation is unavailable in this browser. Search by neighborhood instead.";
    return;
  }
  $("nearby").disabled = true;
  $("message").textContent = "Waiting for location permission…";
  navigator.geolocation.getCurrentPosition(
    (p) => {
      location = { lat: p.coords.latitude, lon: p.coords.longitude };
      $("sort").value = "distance";
      $("message").textContent =
        "Distances are straight-line estimates, not travel distances. Your location has not been stored.";
      $("nearby").disabled = false;
      render();
    },
    () => {
      $("message").textContent =
        "We could not get your location. Check permission or choose a neighborhood instead.";
      $("nearby").disabled = false;
    },
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 },
  );
};
for (const id of ids)
  $(id).addEventListener(id === "search" ? "input" : "change", () => {
    if (id === "collection") areaOptions();
    if (id === "sort" && $("sort").value === "distance" && !location)
      $("message").textContent = "Choose “Near me” to enable distance sorting.";
    render();
  });
async function load() {
  try {
    const data = await Promise.all(
      ["venues", "areas", "collections"].map(async (n) => {
        const r = await fetch(`./data/${n}.json`, { cache: "no-cache" });
        if (!r.ok) throw Error(n);
        return r.json();
      }),
    );
    [venues, areas, collections] = data;
    venues = venues.filter((v) => v.city === "Dhaka");
    if (!Array.isArray(venues) || !Array.isArray(areas.neighborhoods))
      throw Error("Invalid data");
    const valid = new Set(venues.map((v) => v.id));
    favorites = readIds(storage, "vr-favorites", valid);
    compare = readIds(storage, "vr-compare", valid).slice(0, 3);
    $("collection").value = collections.default;
    placeOptions();
    $("coverageNote").textContent = venues.length
      ? `${bn(collections.groups.find((g) => g.id === "community-halls").venue_ids.length)} community centers & halls. ${bn(venues.filter((v) => v.verification === "open-data-listed").length)} map listings need operator confirmation. Hotels are listed separately.`
      : "No verified venue records have been published yet.";
    render();
  } catch {
    $("results").replaceChildren(
      el(
        "p",
        "Venue data could not load. Check your connection and try again.",
      ),
      button("Try again", load),
    );
    $("coverageNote").textContent = "Data could not load.";
    $("resultLabel").textContent = "Unable to load";
  }
}
load();
