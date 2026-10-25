import "./style.css";
import { filterVenues, sizeOf, hasCapacity, capacityText, readIds, mapsURL } from "./model.js";
import { defaultFilters, readURL, stateURL } from "./state.js";
import { filterPanel, areaCounts, areaNames, groupNames } from "./filters.js";
import { $, el, button, external, phoneLink, displayName, dateText, icon, withIcon, sourceLabel } from "./ui.js";
let venues = [], areas, collections, results = [], favorites = [], compare = [], sharedIds = [], ready = false, locationPoint = null, selected = null, sidebar = null, draftPanel = null, draft = null, mapController = null, mapPromise = null;
let state = { tab: "explore", filters: defaultFilters("explore"), view: "list", detailId: null, sharedIds: [] };
const contexts = { explore: { filters: defaultFilters("explore"), view: "list" }, saved: { filters: defaultFilters("saved"), view: "list" }, shared: { filters: defaultFilters("shared"), view: "list" } };
let storage = null, storageWorks = true, modalKind = null, returnFocus = null, undo = null, searchTimer = null, loading = false;
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
  $("feedbackText").textContent = text;
  undo = undoAction;
  $("undoSave").hidden = !undoAction;
  $("feedback").hidden = false;
}
$("dismissFeedback").onclick = () => {
  $("feedback").hidden = true;
};
$("undoSave").onclick = () => {
  const action = undo;
  undo = null;
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
function openModal(content, kind) {
  if (!$("dialog").open) returnFocus = document.activeElement;
  modalKind = kind;
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
  $("compareCount").textContent = compare.length === 1 ? "Select one more venue to compare" : `${compare.length} venues selected \xB7 maximum 3`;
  $("compareNames").replaceChildren();
  for (const id of compare) {
    const v = venues.find((v2) => v2.id === id);
    if (!v) continue;
    const chip = el("div", null, "compare-name");
    chip.append(el("span", displayName(v)));
    const remove = button("\xD7", () => toggleCompare(v));
    remove.setAttribute("aria-label", `Remove ${displayName(v)} from comparison`);
    chip.append(remove);
    $("compareNames").append(chip);
  }
  $("openCompare").disabled = compare.length < 2;
  $("openCompare").textContent = compare.length < 2 ? "Select one more" : `Compare ${compare.length} venues`;
  $("savedCount").textContent = String(favorites.length);
  requestAnimationFrame(() => document.documentElement.style.setProperty("--tray-height", compare.length ? `${bar.getBoundingClientRect().height + 25}px` : "0px"));
}
function renderAreas() {
  const focus = document.activeElement?.dataset?.areaChoice, scoped = scopeRows(state.filters);
  $("priorityAreas").replaceChildren();
  for (const area of areas.priority || []) {
    const c = areaCounts(scoped, area, areas);
    const b = button("", () => changeFilters({ ...state.filters, area, search: "" }), "area-choice");
    b.dataset.areaChoice = area;
    b.setAttribute("aria-pressed", String(state.filters.area === area));
    b.title = "Indexed counts in the selected collection, before other filters";
    b.append(el("strong", area), el("small", `${c.exact} here \xB7 ${c.nearby} nearby`));
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
  for (const [key, label] of [["category", f.category], ["size", f.size === "Unknown" ? "Capacity not published" : f.size && `${f.size} capacity`], ["phone", "Public phone"], ["capacity", "Published capacity"], ["parking", "Parking documented"], ["airConditioning", "Air conditioning documented"], ["catering", "Catering documented"], ["evidence", f.evidence === "operator" ? "Operator sources" : "Primary map listings"], ["verified", "Independently cross-checked"], ["reviewStatus", f.reviewStatus === "needs-review" ? "Needs checking" : "No review notice recorded"]]) if (f[key] && f[key] !== defaults[key]) entries.push([key, label]);
  $("activeFilters").replaceChildren();
  for (const [key, label] of entries) {
    const b = button("", () => changeFilters({ ...state.filters, [key]: key === "includeNearby" ? false : defaults[key] }), "filter-chip");
    b.setAttribute("aria-label", `Remove filter: ${label}`);
    b.append(el("span", label), el("span", "\xD7"));
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
  else text = `${exact} ${exact === 1 ? "match" : "matches"} in ${f.area}` + (f.includeNearby ? ` \xB7 ${nearby} in nearby neighborhoods.` : ".");
  box.append(el("p", text));
  if (f.includeNearby) {
    const names = areas.nearby?.[f.area] || [];
    if (names.length) box.append(el("p", "Nearby areas: " + names.join(", ") + ". Results keep their own neighborhood labels.", "nearby-list"));
  }
  if (areas.group_notes?.[f.area]) box.append(el("p", areas.group_notes[f.area], "nearby-list"));
  if (!f.includeNearby && (!indexed || !exact)) box.append(button("Show nearby venues", () => changeFilters({ ...f, includeNearby: true }), "text-button"));
}
function capacityContext() {
  const f = state.filters, box = $("capacityContext");
  box.replaceChildren();
  box.hidden = !(f.size || f.capacity);
  if (box.hidden) return;
  const base = filtered({ ...f, size: "", capacity: false }), known = base.filter(hasCapacity).length, unknown = base.length - known;
  box.append(el("p", `${known} of ${base.length} otherwise matching records publish capacity. ${unknown} have no published capacity${f.size && f.size !== "Unknown" ? " and are excluded from this size result" : ""}. This does not mean larger venues do not exist.`));
  if (f.size !== "Unknown" && unknown) box.append(button("Show venues with unknown capacity", () => changeFilters({ ...f, size: "Unknown", capacity: false })));
}
function card(v, { compact = false } = {}) {
  const c = el("article", null, "card" + (v.id === selected ? " selected" : "") + (v.review_notice ? " flagged" : ""));
  c.dataset.venue = v.id;
  const head = el("div", null, "card-head"), identity = el("div");
  identity.append(el("h3", displayName(v)));
  const place = el("p", null, "card-location");
  if (state.filters.area && !groupNames(state.filters.area, areas).includes(v.area)) place.append(el("span", "Nearby", "nearby-tag"));
  place.append(el("span", v.area || "Dhaka"));
  identity.append(place);
  const star = withIcon(button(favorites.includes(v.id) ? "Saved" : "Save", () => save(v), "save"), "save");
  star.setAttribute("aria-label", `${displayName(v)} \xB7 ${favorites.includes(v.id) ? "remove from saved" : "save venue"}`);
  star.setAttribute("aria-pressed", String(favorites.includes(v.id)));
  head.append(identity, star);
  c.append(head, el("p", v.address_status === "not_available" ? "Street address not published in the inspected sources." : v.address, "card-address"));
  const facts = el("div", null, "card-facts");
  if (hasCapacity(v)) facts.append(el("span", capacityText(v) + (v.capacity_layout ? " \xB7 " + v.capacity_layout : "")));
  else facts.append(el("span", v.capacity_note ? "Capacity claim needs confirmation" : "Capacity not published", "quiet"));
  if (v.facilities.includes("Parking")) facts.append(el("span", "Parking documented"));
  if (v.distance != null) facts.append(el("span", `${v.distance.toFixed(1)} km \xB7 straight-line`));
  c.append(facts);
  if (v.review_notice) c.append(el("p", v.review_notice, "review-notice"));
  const evidence = v.evidence.some((e) => e.kind === "official") ? "Includes an operator source" : v.verification === "open-data-listed" ? "Map-listed \xB7 confirm booking with the venue" : "Public business listing \xB7 confirm details";
  c.append(el("p", evidence, "evidence-summary"));
  const actions = el("div", null, "card-actions"), details = button("View details", () => detail(v), "primary");
  details.dataset.action = "details";
  actions.append(details);
  if (v.phones.length) actions.append(withIcon(phoneLink(v.phones[0], v.phones[0].number.replace(/^\+880/, "0")), "phone"));
  else actions.append(el("span", "Phone not sourced yet", "phone-missing"));
  actions.append(withIcon(external("Google Maps", mapsURL(v)), "pin"));
  const compareButton = withIcon(button(compare.includes(v.id) ? "Selected" : "Compare", () => toggleCompare(v), "compare-toggle"), "compare");
  compareButton.setAttribute("aria-label", `${compare.includes(v.id) ? "Selected" : "Compare"} ${displayName(v)}; ${compare.includes(v.id) ? "remove from" : "add to"} comparison`);
  compareButton.setAttribute("aria-pressed", String(compare.includes(v.id)));
  actions.append(compareButton);
  c.append(actions);
  return c;
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
    box.append(el("h3", state.tab === "saved" ? "No saved venues match these filters" : "No venues match this search"), el("p", f.search ? `No indexed match for \u201C${f.search}\u201D with the current filters. Try another spelling, area or remove a filter.` : "Try another neighborhood or remove an active filter. Unknown facilities are not treated as confirmed."), button("Clear filters", reset, "primary"));
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
        if (key === "needs-review") fragment.append(el("h3", "Listings that need checking", "result-group-heading"));
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
  $("search").value = state.filters.search;
  $("clearSearch").hidden = !state.filters.search;
  $("sort").value = state.filters.sort;
  $("explore").toggleAttribute("aria-current", state.tab === "explore");
  $("saved").toggleAttribute("aria-current", state.tab === "saved");
  if (state.tab === "explore") $("explore").setAttribute("aria-current", "page");
  if (state.tab === "saved") $("saved").setAttribute("aria-current", "page");
  $("breadcrumb").textContent = state.tab === "saved" ? "SAVED ON THIS BROWSER" : state.tab === "shared" ? "SHARED SHORTLIST" : "DHAKA" + (state.filters.area ? " / " + state.filters.area : "");
  $("resultHeading").textContent = state.tab === "saved" ? "Your saved venues" : state.tab === "shared" ? "Shared shortlist" : `${results.length} ${results.length === 1 ? "venue" : "venues"}`;
  $("stats").textContent = state.tab === "saved" ? `${favorites.length} saved ${storageWorks ? "in this browser" : "for this session"} \xB7 ${results.length} shown` : `${results.length} ${results.length === 1 ? "venue" : "venues"} \xB7 ${results.filter((v) => v.phones.length).length} with a public phone`;
  $("resultLabel").textContent = state.filters.search ? `Results for \u201C${state.filters.search}\u201D` : state.tab === "saved" ? "Your own shortlist, with independent filters" : state.tab === "shared" ? "Shared venue IDs only; your location is not included" : state.filters.area ? "Selected area and your applied filters" : "Community halls first; hotel venues are a separate collection";
  sidebar?.set(state.filters, scopeRows(state.filters));
  renderAreas();
  activeChips();
  areaContext();
  capacityContext();
  renderCards();
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
  document.querySelectorAll(".card").forEach((n) => n.classList.toggle("selected", n.dataset.venue === v.id));
  mapController?.select(v.id, { zoom: state.view === "map" });
  const box = el("article", null, "venue-detail");
  box.append(el("p", v.category, "detail-topline"), heading(displayName(v)), el("p", v.area || "Dhaka", "detail-area"));
  if (v.review_notice) box.append(el("p", v.review_notice, "review-notice"));
  const actions = el("div", null, "detail-actions");
  if (v.phones.length) actions.append(withIcon(phoneLink(v.phones[0], "Call \xB7 " + v.phones[0].number.replace(/^\+880/, "0"), "primary"), "phone"));
  else actions.append(el("span", "Phone not sourced yet", "quiet"));
  actions.append(withIcon(external("Google Maps", mapsURL(v), "maps-action"), "pin"));
  const saveButton = withIcon(button(favorites.includes(v.id) ? "Saved" : "Save", () => {
    save(v);
    saveButton.lastChild.textContent = favorites.includes(v.id) ? "Saved" : "Save";
    saveButton.setAttribute("aria-pressed", String(favorites.includes(v.id)));
    saveButton.setAttribute("aria-label", `${favorites.includes(v.id) ? "Saved" : "Save"} ${displayName(v)}`);
  }), "save");
  saveButton.setAttribute("aria-pressed", String(favorites.includes(v.id)));
  saveButton.setAttribute("aria-label", `${favorites.includes(v.id) ? "Saved" : "Save"} ${displayName(v)}`);
  actions.append(saveButton, button("Copy venue link", () => shareVenue(v, box)));
  box.append(actions);
  const address = el("section", null, "address-block");
  address.append(el("h3", "Location"), el("p", v.address_status === "not_available" ? "Street address not published in the inspected sources." : v.address));
  if (v.address_status !== "not_available") address.append(button("Copy address", () => copyText(v.address, "Address", address), "text-button"));
  address.append(el("p", locationNote(v), "hint"));
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
  box.append(address);
  const dl = el("dl", null, "detail-facts");
  if (hasCapacity(v)) dl.append(el("dt", "Published capacity"), el("dd", capacityText(v) + (v.capacity_layout ? " \xB7 " + v.capacity_layout : " \xB7 seating layout unspecified")));
  if (v.capacity_note) dl.append(el("dt", "Capacity note"), el("dd", v.capacity_note.text));
  dl.append(el("dt", "Venue type"), el("dd", v.category));
  if (v.contact_hours) dl.append(el("dt", v.contact_hours.kind === "booking-office-hours" ? "Published booking-office hours" : "Published business hours"), el("dd", v.contact_hours.text + " \xB7 Asia/Dhaka"));
  if (v.catering_policy) dl.append(el("dt", "Catering arrangements"), el("dd", v.catering_policy.text));
  box.append(dl);
  if (v.facilities.length) {
    box.append(el("h3", "Documented facilities"));
    const facilities = el("div", null, "facility-list");
    for (const f of v.facilities) facilities.append(el("span", f));
    box.append(facilities);
  }
  const confirm = [];
  if (!hasCapacity(v)) confirm.push("guest capacity and seating layout");
  if (!v.facilities.includes("Parking")) confirm.push("parking arrangements");
  if (!v.facilities.includes("Catering")) confirm.push("catering options");
  if (!v.facilities.includes("Air conditioning")) confirm.push("air conditioning");
  const checklist = el("section", null, "confirm-list");
  checklist.append(el("p", "Before booking, confirm directly with the venue:"));
  checklist.append(el("p", [...confirm, "current operation, availability and total charges"].join("; ") + "."));
  checklist.append(el("p", "Missing information here does not mean a facility is unavailable."));
  box.append(checklist);
  box.append(el("h3", "Business contacts"));
  if (v.phones.length) {
    const list = el("ul", null, "contact-list");
    for (const p of v.phones) {
      const item = el("li");
      item.append(phoneLink(p), button("Copy number", () => copyText(p.number, "Phone number", item)), external("Source", p.source, "phone-source"), el("p", `${p.label ? p.label + " \xB7 " : ""}Published business number \xB7 source reviewed ${dateText(p.checked)}. Line not call-tested.`, "hint"));
      list.append(item);
    }
    box.append(list);
  } else box.append(el("p", "No business number was found in the inspected sources. The Maps listing may have newer contact information."));
  if (v.website) box.append(external("Official venue / operator website", v.website));
  if (v.booking_email) {
    const a = el("a", v.booking_email.address);
    a.href = "mailto:" + v.booking_email.address;
    box.append(el("p", "Published booking email"), a);
  }
  box.append(el("p", `Sources reviewed ${dateText(v.last_checked)}. A webpage review does not confirm that a business is operating today.`, "hint"), el("p", "Check current ratings and reviews on Google Maps. Ratings are not stored in this directory.", "hint"));
  const evidence = el("details", null, "source-details");
  evidence.append(el("summary", "Sources & research notes"));
  const grouped = /* @__PURE__ */ new Map();
  for (const e of v.evidence) {
    const prior = grouped.get(e.url);
    if (prior) {
      e.fields.forEach((f) => prior.fields.add(f));
      if (e.checked > prior.checked) prior.checked = e.checked;
    } else grouped.set(e.url, { ...e, fields: new Set(e.fields) });
  }
  const ul = el("ul");
  for (const source of grouped.values()) {
    const li = el("li");
    li.append(external(sourceLabel(source), source.url), el("p", `Reviewed ${dateText(source.checked)} \xB7 supports: ${[...source.fields].map((s) => s.replace(/^facilities\./, "").replace(/_/g, " ")).join(", ")}.`, "hint"));
    ul.append(li);
  }
  evidence.append(el("p", v.verification === "open-data-listed" ? "Primary map record; event booking and current operation require direct confirmation." : "Source checked means the cited material was reviewed. It is not a venue endorsement.", "hint"), el("p", "A business listing is one source, even when it supplies several facts. Independently cross-checked requires genuinely separate supporting sources.", "hint"), ul);
  if (v.discovery) evidence.append(el("p", `OpenStreetMap record last edited ${v.discovery.osm_updated.slice(0, 10)}; that is not an operating-status check.`, "research-note"));
  if (v.notes) evidence.append(el("p", v.notes, "research-note"));
  box.append(evidence);
  const bottom = el("div", null, "detail-bottom");
  bottom.append(external("Report incorrect information", correctionURL(v)), button(compare.includes(v.id) ? "Remove from comparison" : "Add to comparison", () => {
    toggleCompare(v);
    detail(v, { write: false });
  }, "text-button"));
  box.append(bottom);
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
  box.append(heading("Compare your venues"), el("p", "Check the facts side by side. Unknown information does not mean a facility is unavailable.", "hint"), el("p", "Swipe or scroll the table horizontally to see every venue.", "compare-scroll-hint"));
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
  addRow("Area", (v) => v.area || "Not assigned");
  addRow("Phone", (v) => {
    const n = el("div");
    if (v.phones.length) for (const p of v.phones) n.append(phoneLink(p));
    else n.append(el("span", "Not sourced", "unknown"));
    return n;
  });
  addRow("Google Maps", (v) => external("Open listing & reviews", mapsURL(v)));
  addRow("Published capacity", (v) => hasCapacity(v) ? capacityText(v) + (v.capacity_layout ? " \xB7 " + v.capacity_layout : " \xB7 layout unspecified") : v.capacity_note?.text || "Not published");
  addRow("Capacity band", (v) => sizeOf(v.capacity, v.capacity_range));
  addRow("Documented facilities", (v) => v.facilities.join(", ") || "Not documented");
  addRow("Location", (v) => v.address_status === "not_available" ? "Street address not sourced" : v.address);
  addRow("Venue type", (v) => v.category);
  if (vs.some((v) => v.review_notice)) addRow("Needs confirmation", (v) => v.review_notice || "No review notice recorded");
  addRow("Official website", (v) => v.website ? external("Visit operator website", v.website) : "Not sourced");
  addRow("Research status", (v) => v.verification === "cross-checked" ? "Independently cross-checked sources" : v.verification === "open-data-listed" ? (v.evidence.some(e => e.kind === "official") ? "Primary map record; includes operator evidence" : "Primary map record; confirm with the operator") : "Published sources checked; confirm directly");
  addRow("Source reviewed", (v) => dateText(v.last_checked));
  wrap.append(table);
  box.append(wrap);
  const extra = el("details");
  extra.append(el("summary", "How to interpret missing information"), el("p", "Capacities refer to the published seating layout, not necessarily a wedding banquet. Parking, catering and air conditioning are unknown unless a cited source documents them. Call to confirm the date, guest count, layout, rent, catering, parking and current operation."));
  box.append(extra);
  openModal(box, "compare");
}
function method() {
  const box = el("section");
  box.append(heading("About the directory"));
  for (const [title, text] of [
    ["Coverage", `${venues.length} sourced Dhaka records, including ${collections.groups.find((g) => g.id === "community-halls").venue_ids.length} community/event/hall listings and a separate hotel collection. This is an incomplete index, not a list of every venue or a guarantee of wedding-only use.`],
    ["Areas and nearby results", "Neighborhoods are reviewed browsing localities, not surveyed administrative boundaries. Nearby means named adjacent areas, not a radius or travel time. Each card keeps its actual locality."],
    ["Phones and business status", "Published business numbers are sourced and dated, but have not been call-tested. WhatsApp support is not assumed. No review notice recorded does not mean confirmed open. Closure or identity conflicts are flagged for further checking."],
    ["Capacity and facilities", "Small: fewer than 300 guests. Medium: 300\u2013999. Large: 1,000 or more. Size uses sourced capacity only. Seating layouts differ; unknown capacity is not a small venue and unknown parking is not no parking. Ranges are preserved and classified only when both bounds fit the same band."],
    ["Evidence, not endorsements", "Source checked means material was inspected. One business listing is one source even if it supplies name, address and phone. Independently cross-checked requires genuinely separate corroboration. More available information does not make a venue better."],
    ["Ratings", "We do not store Google ratings, review counts, reviews or photographs. Google Maps links let you inspect current information."],
    ["Your privacy", "Favorites and comparisons stay in this browser. Location is requested once, only after Near me, and is never stored or put in share links. Shortlist links contain public venue IDs only. Map and link providers may receive your IP address. No account, analytics, paid API or backend is required."],
    ["Sources and licenses", "The venue database includes \xA9 OpenStreetMap contributors under ODbL-1.0, with separately cited operator/business facts. Map edit dates are not business-operation checks. Administrative reference data is MIT-licensed. No unlicensed venue imagery or copied marketing descriptions are used."]
  ]) box.append(el("h3", title), el("p", text));
  box.append(external("Research & update guidance", "https://github.com/tanzilamd/venueradar-bd/blob/main/docs/DATA_UPDATE_GUIDE.md"), el("p"), external("Suggest a venue", "https://github.com/tanzilamd/venueradar-bd/issues/new?title=Suggest+a+Dhaka+venue"), el("p"), external("OpenStreetMap attribution and license", "https://www.openstreetmap.org/copyright"));
  openModal(box, "about");
}
async function ensureMap() {
  if (state.view !== "map") return;
  if (!mapController) {
    $("mapMessage").textContent = "Loading the map\u2026";
    try {
      if (!mapPromise) mapPromise = import("./map.js");
      const module = await mapPromise;
      if (!mapController) mapController = module.createMap($("map"), { onSelect: (id) => selectOnMap(id), onError: (text) => {
        $("mapMessage").textContent = text;
      } });
      $("mapMessage").textContent = "Distances, when available, are straight-line estimates.";
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
  $("markerContext").textContent = `${results.filter((v) => v.coordinates).length} mapped \xB7 ${results.filter((v) => !v.coordinates).length} without a marker`;
  if (!results.some((v) => v.coordinates)) $("mapMessage").textContent = "No source-published coordinates in these results. All venues remain available in the list.";
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
  box.append(el("h3", displayName(v)), el("p", v.area + " \xB7 " + locationNote(v), "hint"));
  if (v.review_notice) box.append(el("p", v.review_notice, "review-notice"));
  const actions = el("div", null, "card-actions");
  actions.append(button("View details", () => detail(v), "primary"));
  if (v.phones.length) actions.append(phoneLink(v.phones[0], "Call"));
  actions.append(external("Google Maps", mapsURL(v)));
  box.append(actions);
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
  $("message").textContent = "Waiting for location permission\u2026";
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
    notify("Apply your filters first, then use Near me.");
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
document.querySelector(".brand").onclick = (e) => {
  e.preventDefault();
  navigate("explore");
};
$("method").onclick = method;
$("footerMethod").onclick = method;
$("reset").onclick = reset;
$("allAreas").onclick = () => changeFilters({ ...state.filters, area: "", search: "" });
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
$("clearCompare").onclick = () => {
  compare = [];
  persist("vr-compare", compare);
  render();
};
const shareButton = button("Share search", shareCurrent, "text-button share-search");
shareButton.id = "shareSearch";
document.querySelector(".result-controls").insertBefore(shareButton, document.querySelector(".result-controls label"));
$("searchIcon").append(icon("search"));
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
