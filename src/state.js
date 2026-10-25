const defaultFilters = (tab) => ({ search: "", collection: tab === "explore" ? "community-halls" : "", area: "", includeNearby: false, category: "", phone: false, airConditioning: false, catering: false, size: "", capacity: false, parking: false, evidence: "", verified: false, reviewStatus: "all", sort: "name" });
const keys = { search: "q", collection: "collection", area: "area", sort: "sort" };
const bools = { phone: "phone" };
function readURL(url, validIds = /* @__PURE__ */ new Set()) {
  const p = new URL(url).searchParams;
  const tab = p.has("list") ? "shared" : p.get("tab") === "saved" ? "saved" : "explore";
  const filters = defaultFilters(tab);
  for (const [key, param] of Object.entries(keys)) if (p.has(param)) filters[key] = p.get(param).slice(0, 180);
  for (const [key, param] of Object.entries(bools)) filters[key] = p.get(param) === "1";
  if (p.has("nearby")) filters.includeNearby = p.get("nearby") === "1";
  if (!["", "community-halls", "hotels"].includes(filters.collection)) filters.collection = defaultFilters(tab).collection;
  if (!["", "Small", "Medium", "Large", "Unknown"].includes(filters.size)) filters.size = "";
  if (!["name", "distance"].includes(filters.sort)) filters.sort = "name";
  if (!["all", "no-notice", "needs-review"].includes(filters.reviewStatus)) filters.reviewStatus = "all";
  if (!["", "operator", "mapped"].includes(filters.evidence)) filters.evidence = "";
  if (!["", "Community Center", "Wedding Venue", "Banquet Hall", "Convention Center", "Event Hall"].includes(filters.category)) filters.category = "";
  const venueId = p.get("venue");
  return {
    tab,
    filters,
    view: p.get("view") === "map" ? "map" : "list",
    detailId: validIds.has(venueId) ? venueId : null,
    sharedIds: [...new Set((p.get("list") || "").split(",").filter((id) => validIds.has(id)))]
  };
}
function stateURL(base, state) {
  const u = new URL(base);
  u.search = "";
  u.hash = "";
  const f = state.filters, defaults = defaultFilters(state.tab);
  for (const [key, param] of Object.entries(keys)) if (f[key] !== defaults[key]) u.searchParams.set(param, f[key]);
  for (const [key, param] of Object.entries(bools)) if (f[key]) u.searchParams.set(param, "1");
  if (!f.includeNearby) u.searchParams.set("nearby", "0");
  if (state.tab === "saved") u.searchParams.set("tab", "saved");
  if (state.tab === "shared") u.searchParams.set("list", state.sharedIds.join(","));
  if (state.view === "map") u.searchParams.set("view", "map");
  if (state.detailId) u.searchParams.set("venue", state.detailId);
  return u.href;
}
export {
  defaultFilters,
  readURL,
  stateURL
};
