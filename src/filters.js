import { $, el, button } from "./ui.js";
import { matchesAreaQuery } from "./search.js";
const groupNames = (area, areas) => areas.groups?.[area] || [area];
function areaNames(area, nearby, areas) {
  return [.../* @__PURE__ */ new Set([...groupNames(area, areas), ...(nearby ? areas.nearby?.[area] || [] : []).flatMap((n) => groupNames(n, areas))])];
}
function areaCounts(rows, area, areas) {
  const exact = groupNames(area, areas), near = areaNames(area, true, areas);
  return { exact: rows.filter((v) => exact.includes(v.area)).length, nearby: rows.filter((v) => near.includes(v.area) && !exact.includes(v.area)).length };
}
function areaCombobox({ id, areas, rows, value, onChange }) {
  const box = el("div", null, "area-control"), label = el("label", "Area / zone");
  label.htmlFor = id + "Query";
  const hidden = el("input");
  hidden.type = "hidden";
  hidden.id = id;
  hidden.value = value;
  const input = el("input");
  input.id = id + "Query";
  input.type = "text";
  input.autocomplete = "off";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-controls", id + "Options");
  input.setAttribute("aria-expanded", "false");
  const list = el("ul", null, "area-options");
  list.id = id + "Options";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Dhaka neighborhoods");
  list.hidden = true;
  let context = rows, options = [], active = -1, editing = false;
  const name = (a) => a === "Gulshan" && areas.groups?.Gulshan ? "Gulshan (all sectors)" : a;
  const close = () => {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    input.value = value ? name(value) : "All Dhaka";
    editing = false;
  };
  const choose = (area) => {
    value = area;
    hidden.value = area;
    close();
    onChange(area);
  };
  function highlight(index) {
    active = Math.max(0, Math.min(index, options.length - 1));
    for (let i = 0; i < list.children.length; i++) list.children[i].classList.toggle("active-option", i === active);
    if (options.length) {
      const n = list.children[active];
      input.setAttribute("aria-activedescendant", n.id);
      n.scrollIntoView({ block: "nearest" });
    }
  }
  function show(query = "") {
    const names = ["", ...areas.neighborhoods.map((a) => a.name)].filter((a) => !query || matchesAreaQuery(a || "All Dhaka", query));
    options = names;
    list.replaceChildren();
    if (!names.length) {
      const li = el("li", "No matching neighborhood. Try another spelling.", "hint");
      li.setAttribute("role", "presentation");
      list.append(li);
    }
    names.forEach((area, i) => {
      const n = el("li");
      n.id = id + "Option" + i;
      n.setAttribute("role", "option");
      n.setAttribute("aria-selected", String(area === value));
      n.dataset.value = area;
      n.append(el("span", area ? name(area) : "All Dhaka"));
      if (area) {
        const c = areaCounts(context, area, areas);
        n.append(el("small", `${c.exact} indexed here · ${c.nearby} nearby`));
      } else n.append(el("small", `${context.length} indexed`));
      n.addEventListener("mousedown", (e) => e.preventDefault());
      n.addEventListener("click", () => choose(area));
      list.append(n);
    });
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    active = -1;
    input.removeAttribute("aria-activedescendant");
  }
  input.value = value ? name(value) : "All Dhaka";
  input.addEventListener("focus", () => {
    input.select();
    show();
  });
  input.addEventListener("input", () => {
    editing = true;
    show(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      if (list.hidden) show();
      highlight(e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : active + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!list.hidden && options.length) choose(options[active < 0 ? 0 : active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close();
  });
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!box.contains(document.activeElement)) close();
    }, 0);
  });
  box.append(label, input, hidden, list);
  return { node: box, set(next, nextRows = context) {
    value = next;
    context = nextRows;
    hidden.value = next;
    if (document.activeElement !== input || !editing) input.value = next ? name(next) : "All Dhaka";
  }, close };
}
function filterPanel({ prefix = "", values, areas, rows, onChange, onLocate }) {
  const root = el("div", null, "filter-fields"), nodes = /* @__PURE__ */ new Map();
  let current = { ...values };
  const area = areaCombobox({ id: prefix + "area", areas, rows, value: current.area, onChange: (v) => change("area", v) });
  root.append(area.node);
  function change(key, value) {
    current[key] = value;
    onChange({ ...current });
  }
  function select(key, title, options, parent = root) {
    const block = el("div", null, "field"), label = el("label", title);
    label.htmlFor = prefix + key;
    const n = el("select");
    n.id = prefix + key;
    for (const [value, text] of options) {
      const o = el("option", text);
      o.value = value;
      n.append(o);
    }
    n.value = current[key];
    n.onchange = () => change(key, n.value);
    nodes.set(key, n);
    block.append(label, n);
    parent.append(block);
    return block;
  }
  function check(key, title, parent = root) {
    const label = el("label", null, "check"), n = el("input");
    n.type = "checkbox";
    n.id = prefix + key;
    n.checked = !!current[key];
    n.onchange = () => change(key, n.checked);
    label.append(n, el("span", title));
    nodes.set(key, n);
    parent.append(label);
    return label;
  }
  check("includeNearby", "Include nearby neighborhoods");
  select("collection", "Collection", [["community-halls", "Halls & centers"], ["hotels", "Hotel venues"], ["", "All venues"]]);
  check("phone", "With a phone number");
  root.append(button("Near me", onLocate, "nearby"), el("p", "One-time location access, only with permission. Your location is never saved.", "hint"));
  const sync = (next, nextRows = rows) => {
    current = { ...next };
    area.set(current.area, nextRows);
    for (const [key, node] of nodes) if (node.type === "checkbox") node.checked = !!current[key];
    else node.value = current[key];
  };
  sync(current);
  return { node: root, areaNode: area.node, set: sync };
}
export {
  areaCombobox,
  areaCounts,
  areaNames,
  filterPanel,
  groupNames
};
