const sizeOfNumber = (capacity) =>
  capacity == null
    ? "Unknown"
    : capacity < 300
      ? "Small"
      : capacity < 1000
        ? "Medium"
        : "Large";
export function sizeOf(capacity, range) {
  if (capacity != null) return sizeOfNumber(capacity);
  if (!range) return "Unknown";
  const low = sizeOfNumber(range.min),
    high = sizeOfNumber(range.max);
  return low === high ? low : "Unknown";
}
export const hasCapacity = (v) => v.capacity != null || !!v.capacity_range;
export function capacityText(v) {
  const number = (n) => new Intl.NumberFormat("en-BD").format(n);
  return v.capacity != null
    ? number(v.capacity) + " people"
    : v.capacity_range
      ? number(v.capacity_range.min) +
        "–" +
        number(v.capacity_range.max) +
        " people"
      : "Capacity unknown";
}
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
        ["division", "district", "category"].every(
          (k) => !f[k] || String(v[k]) === f[k],
        ) &&
        (!f.area ||
          (f.area === "__unknown__"
            ? !v.area
            : (f.areaIds || [f.area]).includes(v.area))) &&
        (!f.collectionIds || f.collectionIds.includes(v.id)) &&
        (!f.evidence ||
          (f.evidence === "mapped"
            ? v.verification === "open-data-listed"
            : v.evidence.some((e) => e.kind === "official"))) &&
        (!f.size || sizeOf(v.capacity, v.capacity_range) === f.size) &&
        (!f.phone || v.phones.length) &&
        (!f.capacity || hasCapacity(v)) &&
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
        ? (b.capacity ?? b.capacity_range?.min ?? -1) -
          (a.capacity ?? a.capacity_range?.min ?? -1)
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
export const mapsURL = (v) => {
  if (v.maps_url) {
    try {
      const u = new URL(v.maps_url);
      if (
        u.protocol === "https:" &&
        !u.username && !u.password &&
        ["maps.app.goo.gl", "www.google.com", "maps.google.com"].includes(u.hostname)
      ) return u.href;
    } catch { /* Fall back to an encoded search for invalid listing links. */ }
  }
  const locality =
    v.address_status === "not_available"
      ? [v.area, v.city || "Dhaka"].filter(Boolean).join(", ")
      : v.address;
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${v.name} ${locality} Bangladesh`)
  );
};
