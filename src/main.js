import "./style.css";
import "./workspace.css";
import { filterVenues, sizeOf, hasCapacity, capacityText, readIds, mapsURL } from "./model.js";
import { defaultFilters, readURL, stateURL } from "./state.js";
import { filterPanel, areaCounts, areaNames, groupNames, nearbyNames } from "./filters.js";
import { $, el, button, external, phoneLink, displayName, dateText, icon, withIcon, sourceLabel } from "./ui.js";
let venues = [], areas, collections, results = [], favorites = [], compare = [], sharedIds = [], ready = false, locationPoint = null, selected = null, sidebar = null, draftPanel = null, draft = null, mapController = null, mapPromise = null, mapTileError = "";
let state = { tab: "explore", filters: defaultFilters("explore"), view: "list", detailId: null, sharedIds: [] };
const contexts = { explore: { filters: defaultFilters("explore"), view: "list" }, saved: { filters: defaultFilters("saved"), view: "list" }, shared: { filters: defaultFilters("shared"), view: "list" } };
let storage = null, storageWorks = true, modalKind = null, returnFocus = null, undo = null, searchTimer = null, feedbackTimer = null, loading = false;
let previewMap = null, previewMapLoading = null, previewMapWanted = false, previewMapError = false;
const previewMapNode = el("div", null, "inspector-map");
previewMapNode.id = "inspectorMap";
previewMapNode.setAttribute("aria-label", "Selected venue location map");
try {
  storage = window.localStorage;
} catch {
  storageWorks = false;
}
const validIds = () => new Set(venues.map((v) => v.id));
const scopeRows = (f) => venues.filter((v) => !f.collection || collections.groups.find((g) => g.id === f.collection)?.venue_ids.includes(v.id));
const activeIds = () => state.tab === "saved" ? favorites : state.tab === "shared" ? sharedIds : null;
function effectiveFilters(f = state.filters) {
  return { ...f, collectionIds: f.collection ? collections.groups.find((g) => g.id === f.collection)?.venue_ids || [] : null, areaIds: f.area ? areaNames(f.area, f.includeNearby, areas) : null, saved: activeIds() };
}
function filtered(f = state.filters) {
  return filterVenues(venues, effectiveFilters(f), locationPoint);
}
function persist(key, value) {
  try {
    if (!storage) throw Error();
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    storageWorks = false;
    $("storageWarning").hidden = false;
    return false;
  }
}
function notify(text, undoAction = null) {
  clearTimeout(feedbackTimer);
  $("feedbackText").textContent = text;
  undo = undoAction;
  $("undoSave").hidden = !undoAction;
  $("feedback").hidden = false;
  feedbackTimer = setTimeout(() => { $("feedback").hidden = true; undo = null; }, undoAction ? 8000 : 4500);
}
$("dismissFeedback").onclick = () => {
  clearTimeout(feedbackTimer);
  $("feedback").hidden = true;
};
$("undoSave").onclick = () => {
  const action = undo;
  undo = null;
  clearTimeout(feedbackTimer);
  $("feedback").hidden = true;
  action?.();
};
function urlState(overrides = {}) {
  return { ...state, sharedIds, ...overrides };
}
function syncURL(mode = "push", detailOpened = false) {
  const url = stateURL(window.location.href, urlState());
  if (url === window.location.href) return;
  history[mode === "replace" ? "replaceState" : "pushState"]({ vr: true, detailOpened }, "", url);
}
function remember() {
  contexts[state.tab] = { filters: { ...state.filters }, view: state.view };
}
function changeFilters(next, { mode = "push" } = {}) {
  clearTimeout(searchTimer);
  state.filters = { ...next };
  state.detailId = null;
  remember();
  syncURL(mode);
  render();
}
function reset() {
  changeFilters(defaultFilters(state.tab));
  $("message").textContent = "";
}
function navigate(tab) {
  if (!ready) return;
  clearTimeout(searchTimer);
  clearTimeout(feedbackTimer);
  $("feedback").hidden = true;
  remember();
  syncURL("replace");
  state = { ...state, tab, filters: { ...contexts[tab].filters }, view: contexts[tab].view, detailId: null };
  syncURL();
  render();
}
function focusFallback(venueId) {
  const target = venueId ? document.querySelector(`[data-venue="${venueId}"] [data-action="details"]`) : null;
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  else (target || $("search")).focus({ preventScroll: true });
}
function hideModal() {
  const id = selected;
  $("dialog").close();
  modalKind = null;
  queueMicrotask(() => focusFallback(id));
}
function closeDialog() {
  if (modalKind === "detail" && state.detailId) {
    if (history.state?.detailOpened) {
      history.back();
      return;
    }
    state.detailId = null;
    syncURL("replace");
  }
  hideModal();
}
$("dialog").querySelector(".close").onclick = closeDialog;
$("dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDialog();
});
$("dialog").addEventListener("click", (event) => {
  if (event.target !== $("dialog")) return;
  const bounds = $("dialog").getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
});
function openModal(content, kind) {
  if (!$("dialog").open) returnFocus = document.activeElement;
  modalKind = kind;
  $("dialog").dataset.kind = kind;
  $("dialogContent").replaceChildren(content);
  if (!$("dialog").open) $("dialog").showModal();
  $("dialog").querySelector(".close").focus({ preventScroll: true });
}
function heading(text) {
  const h = el("h2", text);
  h.id = "dialogTitle";
  return h;
}
async function copyText(text, label, parent) {
  try {
    await navigator.clipboard.writeText(text);
    notify(label + " copied.");
  } catch {
    notify("Automatic copying is unavailable. Select and copy the text below.");
    const field = el("input", null, "copy-fallback");
    field.readOnly = true;
    field.value = text;
    field.setAttribute("aria-label", label + " to copy");
    (parent || $("dialogContent")).append(field);
    field.focus();
    field.select();
  }
}
function shareVenue(v, parent) {
  const url = stateURL(window.location.href, { tab: "explore", filters: { ...defaultFilters("explore"), collection: "" }, view: "list", detailId: v.id, sharedIds: [] });
  copyText(url, "Venue link", parent);
}
function shareCurrent() {
  const snapshot = state.tab === "saved" ? { ...urlState(), tab: "shared", sharedIds: [...favorites] } : urlState();
  copyText(stateURL(window.location.href, snapshot), state.tab === "saved" ? "Saved shortlist link" : "Search link", $("directory"));
}
function save(v) {
  const had = favorites.includes(v.id);
  favorites = had ? favorites.filter((id) => id !== v.id) : [...favorites, v.id];
  const ok = persist("vr-favorites", favorites);
  render();
  notify((had ? "Removed from Saved." : `Saved ${displayName(v)}.`) + (ok ? "" : " Browser storage is unavailable; this lasts for this session only."), had ? () => {
    if (!favorites.includes(v.id)) favorites.push(v.id);
    persist("vr-favorites", favorites);
    render();
    notify("Venue restored to Saved.");
  } : null);
}
function toggleCompare(v) {
  if (compare.includes(v.id)) compare = compare.filter((id) => id !== v.id);
  else if (compare.length < 3) compare.push(v.id);
  else {
    notify("You can compare up to three venues. Remove one to add another.");
    return;
  }
  persist("vr-compare", compare);
  render();
}
function syncCompare() {
  const bar = $("compareBar");
  bar.hidden = !compare.length;
  $("compareCount").textContent = compare.length === 1 ? "Select one more venue to compare" : `${compare.length} venues selected · maximum 3`;
  $("compareNames").replaceChildren();
  for (const id of compare) {
    const v = venues.find((v2) => v2.id === id);
    if (!v) continue;
    const chip = el("div", null, "compare-name");
    chip.append(el("span", displayName(v)));
    const remove = button("×", () => toggleCompare(v));
    remove.setAttribute("aria-label", `Remove ${displayName(v)} from comparison`);
    chip.append(remove);
    $("compareNames").append(chip);
  }
  $("openCompare").disabled = compare.length < 2;
  $("openCompare").textContent = compare.length < 2 ? "Select one more" : `Compare ${compare.length} venues`;
  $("savedCount").textContent = String(favorites.length);
  $("navCompareCount").textContent = String(compare.length);
  requestAnimationFrame(() => document.documentElement.style.setProperty("--tray-height", compare.length ? `${bar.getBoundingClientRect().height + 25}px` : "0px"));
}
function renderAreas() {
  const focus = document.activeElement?.dataset?.areaChoice, scoped = scopeRows(state.filters);
  $("priorityAreas").replaceChildren();
  $("allAreas").setAttribute("aria-pressed", String(!state.filters.area));
  for (const area of areas.priority || []) {
    const c = areaCounts(scoped, area, areas);
    const b = button("", () => changeFilters({ ...state.filters, area, search: "" }), "area-choice");
    b.dataset.areaChoice = area;
    b.setAttribute("aria-pressed", String(state.filters.area === area));
    b.title = "Indexed counts in the selected collection, before other filters";
    b.append(el("strong", area), el("small", `${c.exact} indexed`));
    $("priorityAreas").append(b);
    if (focus === area) b.focus({ preventScroll: true });
  }
}
function activeChips() {
  const f = state.filters, defaults = defaultFilters(state.tab), entries = [];
  if (f.search) entries.push(["search", `Search: ${f.search}`]);
  if (f.area) entries.push(["area", f.area]);
  if (f.area && f.includeNearby) entries.push(["includeNearby", "Nearby included"]);
  if (f.collection !== defaults.collection) entries.push(["collection", f.collection === "hotels" ? "Hotel venues" : f.collection === "community-halls" ? "Community centers & halls" : "All venues"]);
  if (f.phone) entries.push(["phone", "With a phone number"]);
  $("activeFilters").replaceChildren();
  for (const [key, label] of entries) {
    const b = button("", () => changeFilters({ ...state.filters, [key]: key === "includeNearby" ? false : defaults[key] }), "filter-chip");
    b.setAttribute("aria-label", `Remove filter: ${label}`);
    b.append(el("span", label), el("span", "×"));
    $("activeFilters").append(b);
  }
  const number = entries.length;
  $("filterCount").textContent = number ? `(${number})` : "";
  return number;
}
function areaContext() {
  const f = state.filters, box = $("areaContext");
  box.replaceChildren();
  box.hidden = !f.area;
  if (!f.area) return;
  const own = groupNames(f.area, areas), exact = results.filter((v) => own.includes(v.area)).length, nearby = results.length - exact, indexed = scopeRows(f).filter((v) => own.includes(v.area)).length;
  let text;
  if (!indexed) text = `No venues indexed in ${f.area} yet. ` + (f.includeNearby ? `Showing ${nearby} matching venues in nearby neighborhoods.` : "Directory coverage is incomplete. Nearby alternatives are available.");
  else text = `${exact} ${exact === 1 ? "match" : "matches"} in ${f.area}` + (f.includeNearby ? ` · ${nearby} in nearby neighborhoods.` : ".");
  box.append(el("p", text));
  if (f.includeNearby) {
    const names = nearbyNames(f.area, areas);
    if (names.length) box.append(el("p", "Nearby areas: " + names.join(", ") + ". Results keep their own neighborhood labels.", "nearby-list"));
  }
  if (areas.group_notes?.[f.area]) box.append(el("p", areas.group_notes[f.area], "nearby-list"));
  if (!f.includeNearby && (!indexed || !exact)) box.append(button("Show nearby venues", () => changeFilters({ ...f, includeNearby: true }), "text-button"));
}
function card(v) {
  const c = el("article", null, "card" + (v.id === selected ? " selected" : ""));
  c.dataset.venue = v.id;
  c.addEventListener("click", (event) => {
    if (!event.target.closest("a, button")) previewVenue(v);
  });
  const head = el("div", null, "card-head"), identity = el("div");
  const place = el("p", null, "card-location");
  if (state.filters.area && !groupNames(state.filters.area, areas).includes(v.area)) place.append(el("span", "Nearby", "nearby-tag"));
  place.append(el("span", v.area || "Dhaka · area to confirm"));
  const title = el("h3");
  const preview = button(displayName(v), () => previewVenue(v), "venue-name");
  preview.dataset.action = "preview";
  title.append(preview);
  identity.append(place, title);
  const star = withIcon(button(favorites.includes(v.id) ? "Saved" : "Save", () => save(v), "save"), "save");
  star.setAttribute("aria-label", `${displayName(v)} · ${favorites.includes(v.id) ? "remove from saved" : "save venue"}`);
  star.setAttribute("aria-pressed", String(favorites.includes(v.id)));
  star.dataset.action = "save";
  star.title = favorites.includes(v.id) ? "Remove from Saved" : "Save venue";
  head.append(identity);
  identity.append(el("p", v.address_status === "not_available" ? "Use the map to check the address." : v.address, "card-address"));
  if (v.distance != null) identity.append(el("p", `${v.distance.toFixed(1)} km · straight-line`, "card-distance"));
  if (v.review_notice) identity.append(el("p", v.verification === "user-submitted" ? "Submitted · confirmation pending" : /^Closure reported:/i.test(v.review_notice) ? "Reported permanently closed" : /^Temporary closure reported:/i.test(v.review_notice) ? "Reported temporarily closed" : "Details need confirmation", "listing-note"));
  c.append(head);
  const actions = el("div", null, "card-actions");
  if (v.phones.length) {
    const call = phoneLink(v.phones[0], "", "primary");
    call.setAttribute("aria-label", `Call ${displayName(v)} at ${v.phones[0].number.replace(/^\+880/, "0")}`);
    call.replaceChildren(el("span", v.phones[0].number.replace(/^\+880/, "0"), "phone-number"), el("span", "Call", "phone-short"));
    actions.append(withIcon(call, "phone"));
  }
  else actions.append(el("span", "Phone unavailable", "phone-missing"));
  actions.append(withIcon(external("Map", mapsURL(v)), "pin"));
  const details = withIcon(button("Details", () => detail(v), "row-details"), "details");
  details.setAttribute("aria-label", `Details for ${displayName(v)}`);
  details.title = "All contacts and details";
  details.dataset.action = "details";
  actions.append(details);
  const compareButton = withIcon(button(compare.includes(v.id) ? "Selected" : "Compare", () => toggleCompare(v), "compare-toggle"), "compare");
  compareButton.setAttribute("aria-label", `${compare.includes(v.id) ? "Selected" : "Compare"} ${displayName(v)}; ${compare.includes(v.id) ? "remove from" : "add to"} comparison`);
  compareButton.setAttribute("aria-pressed", String(compare.includes(v.id)));
  compareButton.dataset.action = "compare";
  compareButton.title = compare.includes(v.id) ? "Remove from comparison" : "Add to comparison";
  actions.append(compareButton, star);
  c.append(actions);
  return c;
}
function previewVenue(v) {
  if (window.innerWidth < 1100 || state.view === "map") return detail(v);
  selected = v.id;
  previewMapWanted = false;
  $("selectionAnnouncement").textContent = `${displayName(v)} selected. Contact details are shown beside the list.`;
  document.querySelectorAll(".card").forEach((n) => n.classList.toggle("selected", n.dataset.venue === v.id));
  renderInspector();
}
function renderInspector() {
  const box = $("venueInspector");
  const focusAction = box.contains(document.activeElement) ? document.activeElement.dataset.inspectorAction : null;
  const v = results.find((row) => row.id === selected);
  box.hidden = window.innerWidth < 1100 || state.view !== "list" || !v;
  box.replaceChildren();
  if (box.hidden) return;
  const location = el("div", null, "inspector-location-wrap");
  box.append(el("p", "SELECTED VENUE", "inspector-eyebrow"), el("h2", displayName(v)), el("span", v.area || "Dhaka", "zone-pill"));
  box.append(withIcon(el("p", v.address_status === "not_available" ? "Check the location on Google Maps." : v.address, "inspector-address"), "pin"));
  if (v.coordinates && previewMapWanted) {
    location.append(previewMapNode);
    if (!previewMap) location.append(el("p", "Loading location…", "inspector-map-message"));
    if (previewMapError) location.append(el("p", "Map unavailable. Use Google Maps below.", "inspector-map-message"));
    ensurePreviewMap();
  } else {
    const loadMap = withIcon(button(v.coordinates ? "Show location map" : "Check location on Google Maps", () => {
      if (!v.coordinates) return window.open(mapsURL(v), "_blank", "noopener,noreferrer");
      previewMapWanted = true;
      renderInspector();
    }, "inspector-location"), "pin");
    loadMap.append(el("span", v.area || "Dhaka", "inspector-map-area"));
    location.append(loadMap);
  }
  box.append(location);
  if (v.review_notice) box.append(el("p", v.review_notice, "review-notice"));
  const contacts = el("div", null, "inspector-contacts");
  for (const p of v.phones) {
    contacts.append(withIcon(phoneLink(p, undefined, "primary"), "phone"));
    if (p.status === "submitted-not-verified") contacts.append(el("small", "Owner supplied · confirm directly", "hint"));
  }
  if (!v.phones.length) contacts.append(el("p", "Phone unavailable", "phone-missing"));
  contacts.append(withIcon(external("Open in Google Maps", mapsURL(v), "inspector-maps"), "pin"));
  box.append(contacts);
  const actions = el("div", null, "inspector-actions");
  const saved = withIcon(button(favorites.includes(v.id) ? "Saved" : "Save", () => save(v)), "save");
  saved.dataset.inspectorAction = "save";
  saved.setAttribute("aria-pressed", String(favorites.includes(v.id)));
  const comparison = withIcon(button(compare.includes(v.id) ? "Selected" : "Compare", () => toggleCompare(v)), "compare");
  comparison.dataset.inspectorAction = "compare";
  comparison.setAttribute("aria-pressed", String(compare.includes(v.id)));
  actions.append(saved, comparison);
  box.append(actions, button("More details & contacts", () => detail(v), "inspector-more"));
  if (focusAction) box.querySelector(`[data-inspector-action="${focusAction}"]`)?.focus({ preventScroll: true });
}
async function ensurePreviewMap() {
  if (previewMapLoading) return previewMapLoading;
  previewMapLoading = (async () => {
    try {
      if (!mapPromise) mapPromise = import("./map.js");
      const module = await mapPromise;
      const v = results.find((row) => row.id === selected);
      if (!v?.coordinates || $("venueInspector").hidden) return;
      if (!previewMap) previewMap = module.createLocationPreview(previewMapNode, () => {
        previewMapError = true;
        if (!$("venueInspector").querySelector(".inspector-map-message")) {
          previewMapNode.after(el("p", "Map unavailable. Use Google Maps below.", "inspector-map-message"));
        }
      });
      previewMap.setVenue(v);
      if (!previewMapError) $("venueInspector").querySelector(".inspector-map-message")?.remove();
    } catch {
      previewMapError = true;
      const message = $("venueInspector").querySelector(".inspector-map-message");
      if (message) message.textContent = "Map unavailable. Use Google Maps below.";
    }
  })();
  await previewMapLoading;
  previewMapLoading = null;
}
function emptyState() {
  const box = el("section", null, "empty"), f = state.filters;
  if (state.tab === "saved" && !favorites.length) {
    box.append(el("h3", "Your shortlist starts here"), el("p", "Save venues while you explore. They stay in this browser without an account."), button("Browse venues", () => navigate("explore"), "primary"));
  } else if (state.tab === "shared" && !sharedIds.length) {
    box.append(el("h3", "These linked venues are unavailable"), el("p", "Records may have changed since this shortlist was shared. Browse the current directory instead."), button("Browse venues", () => navigate("explore"), "primary"));
  } else if (f.area && !f.includeNearby) {
    box.append(el("h3", `No matching venues indexed in ${f.area}`), el("p", "This describes our directory coverage, not the number of venues that exist in the area."), button("Show nearby venues", () => changeFilters({ ...f, includeNearby: true }), "primary"), button("Clear other filters", () => changeFilters({ ...defaultFilters(state.tab), area: f.area, includeNearby: false })));
  } else if (f.size && f.size !== "Unknown" || f.capacity) {
    box.append(el("h3", "No published capacity matches found"), el("p", "Most indexed halls do not publish a reliably sourced capacity. This filter excludes them; it is not a claim that suitable venues do not exist."), button("Show venues with unknown capacity", () => changeFilters({ ...f, size: "Unknown", capacity: false }), "primary"), button("Remove capacity filters", () => changeFilters({ ...f, size: "", capacity: false })));
  } else {
    box.append(el("h3", state.tab === "saved" ? "No saved venues match these filters" : "No venues match this search"), el("p", f.search ? `No indexed match for “${f.search}” with the current filters. Try another spelling, area or remove a filter.` : "Try another neighborhood or remove an active filter. Use another area or clear a filter."), button("Clear filters", reset, "primary"));
  }
  return box;
}
function renderCards() {
  const focused = document.activeElement?.closest?.("[data-venue]")?.dataset.venue, action = document.activeElement?.dataset?.action;
  const fragment = document.createDocumentFragment();
  if (!results.length) fragment.append(emptyState());
  else {
    const own = state.filters.area && state.filters.sort === "name" ? groupNames(state.filters.area, areas) : null;
    let group = null;
    for (const v of results) {
      const key = v.review_notice ? "needs-review" : own && !own.includes(v.area) ? "nearby" : own ? "exact" : "normal";
      if (key !== group) {
        if (key === "needs-review") fragment.append(el("h3", "Please confirm these details", "result-group-heading"));
        else if (key === "nearby") fragment.append(el("h3", "Nearby alternatives", "result-group-heading"));
        else if (key === "exact") fragment.append(el("h3", "In " + state.filters.area, "result-group-heading"));
        group = key;
      }
      fragment.append(card(v));
    }
  }
  $("results").replaceChildren(fragment);
  if (focused && action) document.querySelector(`[data-venue="${focused}"] [data-action="${action}"]`)?.focus({ preventScroll: true });
}
function render() {
  if (!ready) return;
  results = filtered();
  if (state.filters.area && state.filters.sort === "name") {
    const own = groupNames(state.filters.area, areas);
    results.sort((a, b) => Number(!!a.review_notice) - Number(!!b.review_notice) || Number(!own.includes(a.area)) - Number(!own.includes(b.area)));
  }
  if (selected && !results.some((v) => v.id === selected)) selected = null;
  if (!selected && state.view === "list" && window.innerWidth >= 1100) selected = results[0]?.id || null;
  $("search").value = state.filters.search;
  $("directory").classList.toggle("saved-empty", state.tab === "saved" && !favorites.length);
  document.body.dataset.emptySaved = String(state.tab === "saved" && !favorites.length);
  $("clearSearch").hidden = !state.filters.search;
  $("sort").value = state.filters.sort;
  $("explore").toggleAttribute("aria-current", state.tab === "explore");
  $("saved").toggleAttribute("aria-current", state.tab === "saved");
  if (state.tab === "explore") $("explore").setAttribute("aria-current", "page");
  if (state.tab === "saved") $("saved").setAttribute("aria-current", "page");
  $("breadcrumb").textContent = state.tab === "saved" ? "SAVED ON THIS BROWSER" : state.tab === "shared" ? "SHARED SHORTLIST" : "DHAKA" + (state.filters.area ? " / " + state.filters.area : "");
  $("resultHeading").textContent = state.tab === "saved" ? "Your saved venues" : state.tab === "shared" ? "Shared shortlist" : `${results.length} ${results.length === 1 ? "venue" : "venues"}`;
  $("stats").textContent = state.tab === "saved" ? `${favorites.length} saved ${storageWorks ? "in this browser" : "for this session"} · ${results.length} shown` : `${results.filter((v) => v.phones.length).length} with phone numbers`;
  $("resultLabel").textContent = state.filters.search ? `Results for “${state.filters.search}”` : state.tab === "saved" ? "Your own shortlist, with independent filters" : state.tab === "shared" ? "Shared venue IDs only; your location is not included" : state.filters.area ? "Selected area and your applied filters" : "Find a hall. Check the location. Make the call.";
  sidebar?.set(state.filters, scopeRows(state.filters));
  renderAreas();
  activeChips();
  areaContext();
  renderCards();
  renderInspector();
  syncCompare();
  $("directory").classList.toggle("map-mode", state.view === "map");
  $("mapWrap").hidden = state.view !== "map";
  $("listView").setAttribute("aria-pressed", String(state.view === "list"));
  $("mapView").setAttribute("aria-pressed", String(state.view === "map"));
  if (state.view === "map") ensureMap();
}
function correctionURL(v) {
  const u = new URL("https://github.com/tanzilamd/venueradar-bd/issues/new");
  u.searchParams.set("title", `Correction: ${displayName(v)}`);
  u.searchParams.set("body", `Venue ID: ${v.id}
Venue: ${v.name}

What needs correcting?

Public source URL(s):

Please include public business information only. Do not include private event schedules or personal contact details. Changes are reviewed before publication.`);
  return u.href;
}
function locationNote(v) {
  if (!v.coordinates) return "A precise map point has not been sourced. Use the named business listing to check the location.";
  if (v.discovery?.geometry_method === "building_bbox_center" || v.notes?.includes("Plus Code")) return "Approximate business position / building centre. Confirm the entrance with the venue.";
  return "Source-published map point; the entrance has not been surveyed.";
}
function detail(v, { write = true } = {}) {
  if (write) {
    state.detailId = v.id;
    syncURL("push", true);
  }
  selected = v.id;
  renderInspector();
  document.querySelectorAll(".card").forEach((n) => n.classList.toggle("selected", n.dataset.venue === v.id));
  mapController?.select(v.id, { zoom: state.view === "map" });
  if (state.view === "map") renderMapSelection();
  const box = el("article", null, "venue-detail");
  box.append(el("p", v.area || "Dhaka", "detail-topline"), heading(displayName(v)));
  if (v.review_notice) box.append(el("p", v.review_notice, "review-notice"));
  box.append(withIcon(el("p", v.address_status === "not_available" ? "Street address unavailable. Check the location on Google Maps." : v.address, "detail-location-summary"), "pin"));
  const actions = el("div", null, "detail-actions");
  if (v.phones.length) actions.append(withIcon(phoneLink(v.phones[0], undefined, "primary"), "phone"));
  else box.append(el("p", "Phone unavailable. Check the venue's current Maps listing.", "phone-missing"));
  actions.append(withIcon(external("Google Maps", mapsURL(v), "maps-action"), "pin"));
  const saveButton = withIcon(button(favorites.includes(v.id) ? "Saved" : "Save", () => {
    save(v);
    saveButton.lastChild.textContent = favorites.includes(v.id) ? "Saved" : "Save";
    saveButton.setAttribute("aria-pressed", String(favorites.includes(v.id)));
  }), "save");
  saveButton.setAttribute("aria-pressed", String(favorites.includes(v.id)));
  actions.append(saveButton, withIcon(button(compare.includes(v.id) ? "Selected" : "Compare", () => {
    toggleCompare(v);
    detail(v, { write: false });
  }), "compare"));
  box.append(actions);
  if (v.phones[0]?.status === "submitted-not-verified") box.append(el("p", "Owner supplied · confirm directly", "hint"));
  const extras = el("details", null, "detail-extras");
  extras.open = window.innerWidth > 720;
  extras.append(el("summary", v.phones.length > 1 ? `${v.phones.length} phone numbers & more options` : "More contacts & options"));
  const address = el("section", null, "address-block");
  if (v.address_status !== "not_available") address.append(button("Copy address", () => copyText(v.address, "Address", address), "text-button"));
  if (v.coordinates) address.append(button("Show on directory map", () => {
    state.detailId = null;
    syncURL("replace");
    hideModal();
    if (!results.some((row) => row.id === v.id)) {
      state.tab = "explore";
      state.filters = { ...defaultFilters("explore"), collection: "" };
    }
    state.view = "map";
    remember();
    syncURL();
    render();
    ensureMap().then(() => selectOnMap(v.id, true));
  }, "text-button"));
  address.append(button("Copy venue link", () => shareVenue(v, extras), "text-button"));
  extras.append(address, el("h3", "Phone numbers"));
  if (v.phones.length) {
    const list = el("ul", null, "contact-list");
    for (const [index, p] of v.phones.entries()) {
      const item = el("li");
      if (index === 0) item.append(el("span", "Primary number above", "quiet"));
      else item.append(withIcon(phoneLink(p), "phone"));
      item.append(button("Copy number", () => copyText(p.number, "Phone number", item), "text-button"));
      if (p.status === "submitted-not-verified") item.append(el("small", "Owner supplied · confirm directly", "hint"));
      list.append(item);
    }
    extras.append(list);
  } else extras.append(el("p", "Phone unavailable in the checked sources. The business may publish newer details on its Maps listing.", "quiet"));
  if (v.website) extras.append(external("Visit website", v.website));
  extras.append(el("p", "Check current ratings and reviews on Google Maps.", "hint"));
  extras.append(external("Suggest a correction", correctionURL(v), "text-button"));
  box.append(extras);
  openModal(box, "detail");
}
function compareView() {
  const vs = compare.map((id) => venues.find((v) => v.id === id)).filter(Boolean);
  if (vs.length < 2) {
    hideModal();
    notify("Select one more venue to compare.");
    return;
  }
  const box = el("section");
  box.append(heading("Compare your venues"), el("p", "Compare locations and contacts, then confirm booking details directly.", "hint"), el("p", "Swipe or scroll the table horizontally to see every venue.", "compare-scroll-hint"));
  const wrap = el("div", null, "table-wrap");
  wrap.tabIndex = 0;
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", "Venue comparison. Scroll horizontally to see all venues.");
  const table = el("table"), thead = el("thead"), tbody = el("tbody"), head = el("tr");
  const info = el("th", "Information");
  info.scope = "col";
  head.append(info);
  for (const v of vs) {
    const th = el("th", displayName(v));
    th.scope = "col";
    const remove = button("Remove", () => {
      compare = compare.filter((id) => id !== v.id);
      persist("vr-compare", compare);
      render();
      compareView();
    });
    remove.setAttribute("aria-label", `Remove ${displayName(v)} from comparison`);
    th.append(remove);
    head.append(th);
  }
  thead.append(head);
  table.append(thead, tbody);
  const addRow = (label, content) => {
    const row = el("tr"), th = el("th", label);
    th.scope = "row";
    row.append(th);
    for (const v of vs) {
      const td = el("td");
      const value = content(v);
      if (value instanceof Node) td.append(value);
      else td.textContent = value;
      row.append(td);
    }
    tbody.append(row);
  };
  addRow("Area / zone", (v) => v.area || "To confirm");
  addRow("Address", (v) => v.address_status === "not_available" ? "Check the map" : v.address);
  addRow("Phone", (v) => {
    const n = el("div");
    if (v.phones.length) for (const p of v.phones) n.append(phoneLink(p));
    else n.append(el("span", "Unavailable", "quiet"));
    return n;
  });
  addRow("Map & reviews", (v) => external("Google Maps", mapsURL(v)));
  addRow("Website", (v) => v.website ? external("Visit website", v.website) : "Unavailable");
  if (vs.some((v) => hasCapacity(v))) addRow("Published capacity", (v) => hasCapacity(v) ? capacityText(v) + (v.capacity_layout ? ` · ${v.capacity_layout}` : "") : "Not published");
  if (vs.some((v) => v.facilities.length)) addRow("Documented facilities", (v) => v.facilities.length ? v.facilities.join(", ") : "Not documented");
  if (vs.some((v) => v.review_notice)) addRow("Please check", (v) => v.review_notice || "Confirm booking details directly");
  wrap.append(table);
  box.append(wrap);
  openModal(box, "compare");
}
function method() {
  const box = el("section");
  box.append(heading("About VenueRadar BD"));
  box.append(el("p", "Find community centers, convention halls and event venues by area in Dhaka. This is a growing directory, not a complete list of every hall."));
  box.append(el("h3", "Information & sources"), el("p", "We use public venue and operator websites, individually reviewed business listings, OpenStreetMap and clearly labelled owner contributions. Published numbers are not call-tested. Confirm the address, current operation and booking details directly. Google Maps provides current ratings and reviews; we do not copy ratings or reviews."));
  box.append(el("h3", "Your privacy"), el("p", "Saved venues and comparisons stay in this browser. Near me requests your location once and does not store it. No account is needed to explore. Maps and external websites receive normal connection information."));
  box.append(external("Data sources & research notes", "https://github.com/tanzilamd/venueradar-bd/blob/main/docs/DATA_SOURCES.md"), el("p"), external("© OpenStreetMap contributors · ODbL", "https://www.openstreetmap.org/copyright"));
  const manage = el("a", "Manage the directory", "manage-link");
  manage.href = "./manage.html";
  box.append(el("h3", "For the owner"), manage);
  openModal(box, "about");
}
async function ensureMap() {
  if (state.view !== "map") return;
  if (!mapController) {
    $("mapMessage").textContent = "Loading the map…";
    try {
      if (!mapPromise) mapPromise = import("./map.js");
      const module = await mapPromise;
      if (!mapController) mapController = module.createMap($("map"), { onSelect: (id) => selectOnMap(id), onError: (text) => {
        mapTileError = text;
        if (results.some((v) => v.coordinates)) $("mapMessage").textContent = text;
      } });
    } catch {
      mapPromise = null;
      $("mapMessage").textContent = "The map could not load. Use the list and Google Maps links.";
      return;
    }
  }
  if (state.view !== "map") return;
  mapController.setResults(results);
  mapController.invalidate();
  if (selected) mapController.select(selected);
  $("markerContext").textContent = `${results.filter((v) => v.coordinates).length} mapped · ${results.filter((v) => !v.coordinates).length} without a marker`;
  $("mapMessage").textContent = !results.length
    ? "No venues match the current search or filters. Switch to List to change them."
    : !results.some((v) => v.coordinates)
      ? "These matching venues have no source-published map point. Switch to List to view them."
      : mapTileError || "Distances, when available, are straight-line estimates.";
  renderMapSelection();
}
function selectOnMap(id, zoom = false) {
  selected = id;
  mapController?.select(id, { zoom });
  document.querySelectorAll(".card").forEach((n) => n.classList.toggle("selected", n.dataset.venue === id));
  if (window.innerWidth > 720) document.querySelector(`[data-venue="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "auto" });
  renderMapSelection();
}
function renderMapSelection() {
  const box = $("mapSelection");
  box.replaceChildren();
  const v = results.find((v2) => v2.id === selected);
  if (!v) {
    box.append(el("p", "Select a marker to see a venue and its contact actions.", "hint"));
    return;
  }
  box.append(el("h3", displayName(v)), el("p", v.area + " · " + locationNote(v), "hint"));
  if (v.review_notice) box.append(el("p", v.review_notice, "review-notice"));
  const actions = el("div", null, "card-actions");
  actions.classList.add("map-selection-actions");
  actions.append(button("View details", () => detail(v)));
  if (v.phones.length) actions.append(withIcon(phoneLink(v.phones[0], "Call", "primary"), "phone"));
  actions.append(withIcon(external("Google Maps", mapsURL(v)), "pin"));
  box.append(actions);
  requestAnimationFrame(() => {
    if (state.view !== "map" || selected !== v.id) return;
    const tray = $("compareBar"), bottom = tray.hidden ? innerHeight - 12 : Math.min(innerHeight - 12, tray.getBoundingClientRect().top - 12);
    const rect = actions.getBoundingClientRect(), overlap = rect.bottom - bottom;
    if (rect.top < innerHeight && overlap > 0) window.scrollBy({ top: overlap, behavior: "instant" });
  });
}
function setView(view) {
  state.view = view;
  remember();
  syncURL();
  render();
  if (view === "map") document.querySelector(".results-top")?.scrollIntoView?.({ block: "start" });
}
function locate() {
  if (!navigator.geolocation) {
    $("message").textContent = "Location is unavailable in this browser. Choose a neighborhood instead.";
    return;
  }
  $("message").textContent = "Waiting for location permission…";
  navigator.geolocation.getCurrentPosition((p) => {
    locationPoint = { lat: p.coords.latitude, lon: p.coords.longitude };
    $("message").textContent = "Distances are straight-line estimates, not travel distances. Your location has not been stored.";
    changeFilters({ ...state.filters, sort: "distance" });
  }, (error) => {
    $("message").textContent = error.code === 1 ? "Location permission was denied. You can still search by neighborhood." : error.code === 3 ? "Location request timed out. Try again or choose a neighborhood." : "Your location could not be determined. Choose a neighborhood instead.";
  }, { maximumAge: 0, timeout: 1e4, enableHighAccuracy: false });
}
function openFilters() {
  if (!ready) return;
  draft = { ...state.filters };
  const fieldset = $("draftFilterFields");
  fieldset.replaceChildren();
  draftPanel = filterPanel({ prefix: "draft-", values: draft, areas, rows: scopeRows(draft), onChange: (next) => {
    draft = next;
    draftPanel.set(next, scopeRows(next));
    $("applyFilters").textContent = `Show ${filtered(next).length} venues`;
  }, onLocate: () => {
    changeFilters(draft);
    $("filterDialog").close();
    $("mobileFilters").focus();
    locate();
  } });
  fieldset.append(draftPanel.node);
  $("applyFilters").textContent = `Show ${filtered(draft).length} venues`;
  $("filterDialog").showModal();
  $("cancelFilters").focus();
}
$("mobileFilters").onclick = openFilters;
$("cancelFilters").onclick = () => {
  $("filterDialog").close();
  $("mobileFilters").focus();
};
$("filterDialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  $("cancelFilters").click();
});
$("clearDraft").onclick = () => {
  draft = defaultFilters(state.tab);
  draftPanel.set(draft, scopeRows(draft));
  $("applyFilters").textContent = `Show ${filtered(draft).length} venues`;
};
$("applyFilters").onclick = () => {
  changeFilters(draft);
  $("filterDialog").close();
  $("mobileFilters").focus();
};
$("explore").onclick = () => navigate("explore");
$("saved").onclick = () => navigate("saved");
$("method").onclick = method;
$("footerMethod").onclick = method;
$("reset").onclick = reset;
$("allAreas").onclick = () => changeFilters({ ...state.filters, area: "", search: "" });
$("moreAreas").onclick = () => {
  const area = $("areaQuery");
  area?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  area?.focus({ preventScroll: true });
};
$("clearSearch").onclick = () => {
  changeFilters({ ...state.filters, search: "" });
  $("search").focus();
};
$("searchForm").onsubmit = (e) => {
  e.preventDefault();
  clearTimeout(searchTimer);
  changeFilters({ ...state.filters, search: $("search").value });
};
$("search").oninput = () => {
  const query = $("search").value;
  clearTimeout(searchTimer);
  state.filters = { ...state.filters, search: query };
  remember();
  searchTimer = setTimeout(() => {
    syncURL("replace");
    render();
  }, 120);
};
$("sort").onchange = () => {
  if ($("sort").value === "distance" && !locationPoint) $("message").textContent = "Choose Near me in the filters to enable straight-line distance sorting.";
  changeFilters({ ...state.filters, sort: $("sort").value });
};
$("listView").onclick = () => setView("list");
$("mapView").onclick = () => setView("map");
$("fitMap").onclick = () => mapController?.fit();
$("mapListFallback").onclick = () => setView("list");
$("openCompare").onclick = compareView;
$("navCompare").onclick = () => compare.length >= 2 ? compareView() : notify("Select two or three halls using their Compare buttons.");
$("clearCompare").onclick = () => {
  compare = [];
  persist("vr-compare", compare);
  render();
};
const shareButton = button("Share search", shareCurrent, "text-button share-search");
shareButton.id = "shareSearch";
document.querySelector(".result-controls").append(shareButton);
$("searchIcon").append(icon("search"));
withIcon($("saved"), "save");
withIcon($("navCompare"), "compare");
const searchRow = document.querySelector(".search-row");
const desktopQuery = window.matchMedia("(min-width: 1100px)");
const narrowQuery = window.matchMedia("(max-width: 360px)");
function adaptWorkspace() {
  (desktopQuery.matches ? $("headerSearchDock") : $("discoverySearchDock")).append(searchRow);
  $("search").placeholder = narrowQuery.matches ? "Search venues" : "Search halls or neighborhoods";
  if (ready) {
    if (!selected && desktopQuery.matches && state.view === "list") selected = results[0]?.id || null;
    renderInspector();
  }
}
desktopQuery.addEventListener("change", adaptWorkspace);
narrowQuery.addEventListener("change", adaptWorkspace);
adaptWorkspace();
window.addEventListener("popstate", () => {
  if (!ready) return;
  remember();
  state = readURL(window.location.href, validIds());
  sharedIds = state.sharedIds;
  contexts[state.tab] = { filters: { ...state.filters }, view: state.view };
  if (modalKind && state.detailId === null) hideModal();
  render();
  if (state.detailId) detail(venues.find((v) => v.id === state.detailId), { write: false });
});
async function load() {
  if (loading) return;
  loading = true;
  $("directory").setAttribute("aria-busy", "true");
  try {
    const [v, a, c] = await Promise.all(["venues", "areas", "collections"].map(async (name) => {
      const response = await fetch("./data/" + name + ".json");
      if (!response.ok) throw Error("Data unavailable");
      return response.json();
    }));
    if (!Array.isArray(v) || !a.neighborhoods || !c.groups) throw Error("Invalid directory");
    venues = v.filter((v2) => v2.city === "Dhaka");
    areas = a;
    collections = c;
    favorites = readIds(storage || { getItem: () => null }, "vr-favorites", validIds());
    compare = readIds(storage || { getItem: () => null }, "vr-compare", validIds()).slice(0, 3);
    state = readURL(window.location.href, validIds());
    if (state.filters.area && !areas.neighborhoods.some((a2) => a2.name === state.filters.area)) state.filters.area = "";
    sharedIds = state.sharedIds;
    contexts[state.tab] = { filters: { ...state.filters }, view: state.view };
    sidebar = filterPanel({ values: state.filters, areas, rows: scopeRows(state.filters), onChange: (next) => changeFilters(next), onLocate: locate });
    $("filterFields").replaceChildren(sidebar.node);
    $("searchAreaDock").replaceChildren(sidebar.areaNode);
    ready = true;
    $("search").disabled = false;
    $("allAreas").disabled = false;
    $("directory").setAttribute("aria-busy", "false");
    $("storageWarning").hidden = storageWorks;
    history.replaceState({ vr: true, detailOpened: false }, "", window.location.href);
    render();
    if (state.detailId) detail(venues.find((v2) => v2.id === state.detailId), { write: false });
  } catch {
    ready = false;
    $("directory").setAttribute("aria-busy", "false");
    $("resultHeading").textContent = "Directory unavailable";
    $("stats").textContent = "We could not load the venue data.";
    $("priorityAreas").replaceChildren();
    const box = el("section", null, "empty");
    box.append(el("h3", "Could not load the directory"), el("p", "Check your connection and try again. No venue counts are being presented from an incomplete response."), button("Try again", load, "primary"));
    $("results").replaceChildren(box);
  } finally {
    loading = false;
  }
}
load();
