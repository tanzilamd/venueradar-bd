import aliases from "./area-aliases.json" with { type: "json" };
const plain = (value) => String(value ?? "").normalize("NFKC").toLocaleLowerCase().replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 2534)).replace(/[\u200b-\u200d]/g, "").replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const entries = Object.entries(aliases).flatMap(([name, alternatives]) => [name, ...alternatives].map((alias) => [plain(alias), plain(name).replace(/ /g, "_")])).sort((a, b) => b[0].length - a[0].length).map(([alias, canonical]) => [new RegExp(`(^|\\s)${escape(alias)}(?=$|\\s)`, "g"), canonical]);
const index = /* @__PURE__ */ new WeakMap();
export function searchKey(value) {
  let text = plain(value);
  for (const [pattern, canonical] of entries)
    text = text.replace(pattern, (_, prefix) => prefix + canonical);
  return text.replace(/\bcentre\b/g, "center");
}
export function matchesSearch(venue, query) {
  const terms = searchKey(query).split(" ").filter(Boolean);
  let words = index.get(venue);
  if (!words) {
    words = searchKey([venue.name, venue.bn_name, ...venue.aliases || [], venue.address, venue.area].join(" ")).split(" ");
    index.set(venue, words);
  }
  return terms.every((term) => words.some((word) => term.length <= 2 ? word === term : word.startsWith(term)));
}
export const matchesAreaQuery = (name, query) => searchKey(name).includes(searchKey(query));
