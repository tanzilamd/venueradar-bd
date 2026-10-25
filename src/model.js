export const sizeOf = (capacity) =>
  capacity == null
    ? "Unknown"
    : capacity < 300
      ? "Small"
      : capacity < 1000
        ? "Medium"
        : "Large";
export const normalize = (s) =>
  String(s ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u200b-\u200d]/g, "")
    .trim();
export function distance(a, b) {
  const r = (x) => (x * Math.PI) / 180;
  const dlat = r(b.lat - a.lat),
    dlon = r(b.lon - a.lon);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function filterVenues(venues, f, location) {
  return venues
    .filter(
      (v) =>
        (!f.search ||
          normalize(
            [v.name, v.bn_name, ...v.aliases, v.address, v.area].join(" "),
          ).includes(normalize(f.search))) &&
        ["division", "district", "area", "category"].every(
          (k) => !f[k] || String(v[k]) === f[k],
        ) &&
        (!f.size || sizeOf(v.capacity) === f.size) &&
        (!f.phone || v.phones.length) &&
        (!f.capacity || v.capacity != null) &&
        (!f.verified || v.verification === "cross-checked") &&
        (!f.parking || v.facilities.includes("Parking")) &&
        (!f.saved || f.saved.includes(v.id)),
    )
    .map((v) => ({
      ...v,
      distance:
        location && v.coordinates ? distance(location, v.coordinates) : null,
    }))
    .sort((a, b) =>
      f.sort === "capacity"
        ? (b.capacity ?? -1) - (a.capacity ?? -1)
        : f.sort === "distance"
          ? (a.distance ?? Infinity) - (b.distance ?? Infinity)
          : a.name.localeCompare(b.name),
    );
}
export function readIds(storage, key, valid) {
  try {
    const a = JSON.parse(storage.getItem(key) || "[]");
    return Array.isArray(a)
      ? [...new Set(a.filter((x) => typeof x === "string" && valid.has(x)))]
      : [];
  } catch {
    return [];
  }
}
export const mapsURL = (v) =>
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${v.name} ${v.address} Bangladesh`);
