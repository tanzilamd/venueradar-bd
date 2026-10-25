export const $ = (id) => document.getElementById(id);
export function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
export function button(text, action, cls) {
  const b = el("button", text, cls);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
export function external(text, url, cls) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.username || u.password) throw Error();
    const a = el("a", text, cls);
    a.href = u.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  } catch {
    return el("span", "Link unavailable", cls);
  }
}
export const phoneLink = (p, label, cls) => {
  const a = el("a", label || p.number.replace(/^\+880/, "0"), cls);
  a.href = "tel:" + p.number;
  return a;
};
export const displayName = (v) => v.name.replace(/[\s,.]+$/g, "").replace(/\s+/g, " ").replace(/^[a-z]/, (c) => c.toUpperCase());
export const dateText = (value) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(value + "T00:00:00Z"));
export const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  phone: '<path d="M8 3H4v4c0 7 6 13 13 13h4v-4l-5-2-2 2c-3-1-5-3-6-6l2-2z"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  save: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  compare: '<path d="M4 5h6v14H4zM14 5h6v14h-6z"/>',
  share: '<path d="M8 12v8h12V8h-8M4 8V4h12M4 4l10 10"/>'
};
export function icon(name) {
  const span = el("span", null, "icon");
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (icons[name] || "") + "</svg>";
  return span;
}
export function withIcon(node, name) {
  node.prepend(icon(name));
  return node;
}
export function sourceLabel(source) {
  const u = new URL(source.url), host = u.hostname.replace(/^www\./, "");
  if (host.includes("google.com") || host === "maps.app.goo.gl") return "Google Maps business listing";
  if (host === "nominatim.openstreetmap.org") return "OpenStreetMap address review";
  if (host.includes("openstreetmap.org")) return "OpenStreetMap listing";
  if (source.kind === "official") return "Venue / operator website \xB7 " + host;
  return "Published business source \xB7 " + host;
}
