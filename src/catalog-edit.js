import { normalize } from "./model.js";
function normalizePhone(input) {
  const s = String(input).replace(/[\s().-]/g, "");
  if (!s) return "";
  const n = s.startsWith("+880") ? s : s.startsWith("00880") ? "+" + s.slice(2) : s.startsWith("880") ? "+" + s : s.startsWith("0") ? "+880" + s.slice(1) : s;
  if (!/^\+880(1[3-9][0-9]{8}|[2-9][0-9]{6,10})$/.test(n)) throw Error(`Invalid Bangladesh phone number: ${input}`);
  return n;
}
function safeURL(value, maps = false) {
  if (!value?.trim()) return null;
  let u;
  try {
    u = new URL(value.trim());
  } catch {
    throw Error("Enter a complete HTTPS link.");
  }
  if (u.protocol !== "https:" || u.username || u.password) throw Error("Links must use HTTPS and cannot include credentials.");
  if (maps && !["www.google.com", "maps.google.com", "maps.app.goo.gl"].includes(u.hostname)) throw Error("Use a Google Maps business link.");
  if (maps && u.hostname === "www.google.com" && !u.pathname.startsWith("/maps/")) throw Error("Use a Google Maps business link.");
  return u.href;
}
function editVenue(rows, input, date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const old = rows.find((v2) => v2.id === input.id), name = input.name.trim(), area = input.area.trim(), address = input.address.trim();
  if (name.length < 3 || !area || address.length < 5) throw Error("Name, Dhaka area and address are required.");
  if (rows.some((v2) => v2.id !== old?.id && normalize(v2.name) === normalize(name))) throw Error("A venue with this name already exists. Edit that record instead.");
  const source = safeURL(input.source);
  if (!source) throw Error("Add the public source link for this change. Choose Owner contribution if independent verification is pending.");
  const kind = input.sourceKind || "submission";
  const collection = input.collection || old?.collection || "community-halls";
  if (!["community-halls", "restaurant-party-centers", "hotels"].includes(collection)) throw Error("Choose a valid collection.");
  if (!["official", "independent", "submission"].includes(kind)) throw Error("Choose a source type.");
  const confirming = input.confirmNotice === true;
  if (confirming && !old?.review_notice) throw Error("This venue has no review notice to confirm.");
  if (confirming && kind === "submission") throw Error("Resolve a review notice using an inspected public business source, not an owner contribution.");
  const maps = safeURL(input.maps, true), website = safeURL(input.website);
  const numbers = [...new Set(input.phones.split(/[,;\n]/).map(normalizePhone).filter(Boolean))];
  const v = old ? structuredClone(old) : { id: "bd-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), bn_name: null, aliases: [], category: collection === "restaurant-party-centers" ? "Event Hall" : "Convention Center", city: "Dhaka", division: "6", district: "47", coordinates: null, capacity: null, capacity_layout: null, facilities: [], evidence: [], notes: null, website: null, phones: [], verification: kind === "submission" ? "user-submitted" : "source-checked" };
  if (!old && rows.some((r) => r.id === v.id)) throw Error("This venue ID already exists. Use a more specific name.");
  Object.assign(v, { name, area, address, address_status: input.addressStatus || "partial", last_checked: date });
  if (input.collection) v.collection = collection;
  v.phones = numbers.map((number) => {
    const previous = old?.phones.find((p) => p.number === number);
    if (confirming && previous?.status === "submitted-not-verified") return { number, source, checked: date, status: "published-not-call-tested" };
    return previous || { number, source, checked: date, status: kind === "submission" ? "submitted-not-verified" : "published-not-call-tested" };
  });
  if (v.phones.length) delete v.phone_review;
  else v.phone_review = { status: "not-found-in-checked-sources", checked: date, note: "No public business contact was supplied in this directory update. Check the business listing for newer information." };
  if (maps) v.maps_url = maps;
  else if (input.maps !== void 0) delete v.maps_url;
  v.website = website;
  const lat = String(input.lat ?? "").trim(), lon = String(input.lon ?? "").trim();
  if (lat || lon) {
    if (!lat || !lon || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) throw Error("Enter both valid map coordinates, or leave both blank.");
    v.coordinates = { lat: Number(lat), lon: Number(lon) };
  } else if (!old?.coordinates) v.coordinates = null;
  const notice = confirming ? "" : (input.notice ?? old?.review_notice ?? "").trim();
  if (old?.review_notice && !notice && !confirming) throw Error("Use the confirmation checkbox and a public source to clear this review notice.");
  if (notice) v.review_notice = notice;
  else delete v.review_notice;
  if (confirming && v.verification === "user-submitted") v.verification = "source-checked";
  if (!old && kind === "submission" && !v.review_notice) v.review_notice = "Owner-contributed listing. Confirm the location and business contact directly; independent verification is pending.";
  v.evidence.push({ url: source, kind, checked: date, fields: ["name", "area", "address", "category", "phones", ...v.coordinates ? ["coordinates"] : [], ...maps ? ["maps_url"] : [], ...website ? ["website"] : [], ...v.review_notice ? ["review_notice"] : []], reuse: kind === "submission" ? "Owner-supplied public business information; independent verification pending." : "Public business facts reviewed by the directory owner in the visual editor. No copied reviews, ratings, photographs or private information." });
  return old ? rows.map((r) => r.id === v.id ? v : r) : [...rows, v];
}
function deriveCatalog(rows, collections, areas) {
  const ids = new Set(rows.map((r) => r.id)), assigned = /* @__PURE__ */ new Set();
  const explicit = new Map(rows.filter((r) => r.collection).map((r) => [r.id, r.collection]));
  const groups = structuredClone(collections.groups).map((g) => ({ ...g, venue_ids: g.venue_ids.filter((id) => ids.has(id) && !explicit.has(id) && !assigned.has(id) && (assigned.add(id), true)) }));
  const hall = groups.find((g) => g.id === "community-halls");
  if (!hall) throw Error("Community hall collection is missing.");
  rows.forEach((v) => {
    if (!assigned.has(v.id)) {
      const target = v.collection ? groups.find((g) => g.id === v.collection) : hall;
      if (!target) throw Error(`Unknown collection for ${v.id}: ${v.collection}`);
      target.venue_ids.push(v.id);
      assigned.add(v.id);
    }
  });
  const nextAreas = structuredClone(areas);
  const known = new Set(nextAreas.neighborhoods.map((a) => a.name));
  let serial = Math.max(0, ...nextAreas.neighborhoods.map((a) => Number(a.id) || 0));
  for (const v of rows) if (v.area && !known.has(v.area)) {
    nextAreas.neighborhoods.push({ id: String(++serial), name: v.area });
    known.add(v.area);
  }
  return { collections: { ...collections, groups }, areas: nextAreas };
}
function changeSet(before, after) {
  const a = new Map(before.map((v) => [v.id, v])), b = new Map(after.map((v) => [v.id, v]));
  return { added: after.filter((v) => !a.has(v.id)), modified: after.filter((v) => a.has(v.id) && JSON.stringify(v) !== JSON.stringify(a.get(v.id))), removed: before.filter((v) => !b.has(v.id)) };
}
const changeCount = (c) => c.added.length + c.modified.length + c.removed.length;
export {
  changeCount,
  changeSet,
  deriveCatalog,
  editVenue,
  normalizePhone,
  safeURL
};
