import "./style.css";
import "./admin.css";
import { $, el, button, dateText } from "./ui.js";
import { editVenue, deriveCatalog, changeSet, changeCount } from "./catalog-edit.js";
import { validateData } from "./data-validation.js";
import { githubRequest, decodeContent, publishCatalog } from "./github-publish.js";
import schema from "../schemas/venue.schema.json";
import regions from "../docs/reference/bangladesh-areas.json";
let rows = [], baseline = [], collections, areas, boundary, selected = null, token = "", ready = false, olderDraft = null;
const draftKey = "vr-admin-draft-v1";
const message = (text, bad = false) => {
  $("adminMessage").textContent = text;
  $("adminMessage").classList.toggle("error", bad);
};
const validation = (next) => {
  if (!boundary) return ["Location validation is unavailable. Reload the editor."];
  if (!next.length) return ["The directory cannot be empty."];
  return validateData(next, regions, schema, boundary);
};
function draft() {
  if (olderDraft) {
    download(olderDraft, "venues-older-draft.json");
    olderDraft = null;
    $("recoverDraft").hidden = true;
  }
  try {
    localStorage.setItem(draftKey, JSON.stringify({ baseline, rows }));
  } catch {
    message("Draft is available in this tab only. Download JSON before closing.");
  }
}
function render() {
  const search = $("adminSearch").value.toLowerCase().trim();
  const queue = /^(missing:(?:phone|address|map|area)|needs:review)(?:\s|$)/.exec(search)?.[1] || "";
  const q = queue ? search.slice(queue.length).trim() : search;
  const list = $("adminList");
  list.replaceChildren();
  const shown = rows.filter((v) => (v.name + " " + (v.area || "")).toLowerCase().includes(q)
    && (!$('reviewOnly').checked || !!v.review_notice)
    && (!queue || queue === "missing:phone" && !v.phones.length
      || queue === "missing:address" && v.address_status !== "published"
      || queue === "missing:map" && !v.coordinates
      || queue === "missing:area" && !v.area
      || queue === "needs:review" && !!v.review_notice)).sort((a, b) => a.name.localeCompare(b.name));
  $("adminCount").textContent = `${shown.length} of ${rows.length} venues`;
  for (const v of shown) {
    const b = button("", () => open(v), "manager-row");
    b.setAttribute("aria-pressed", String(selected === v.id));
    b.append(el("strong", v.name), el("span", (v.area || "Area to confirm") + " · " + (v.phones[0]?.number.replace(/^\+880/, "0") || "No phone")));
    if (v.review_notice) b.append(el("span", "Needs review", "review-badge"));
    list.append(b);
  }
  if (!shown.length) list.append(el("p", "No match. Try another name or add a venue.", "hint"));
  const c = changeSet(baseline, rows), count = changeCount(c);
  $("changeSummary").textContent = count ? `${c.added.length} added · ${c.modified.length} edited · ${c.removed.length} removed` : "No changes yet.";
  $("changeList").replaceChildren();
  for (const [k, label] of [["added", "Add"], ["modified", "Edit"], ["removed", "Remove"]]) for (const v of c[k]) {
    const li = el("li", label + " · " + v.name);
    if (k === "modified") {
      const old = baseline.find((x) => x.id === v.id);
      const text = (x) => Array.isArray(x) ? x.map((p) => p.number).join(", ") : String(x ?? "Unavailable");
      const fields = ["name", "area", "address", "phones", "maps_url", "website", "review_notice"].filter((f) => JSON.stringify(old[f]) !== JSON.stringify(v[f]) && !(f === "review_notice" && !v.review_notice));
      if (fields.length) li.append(el("br"), el("small", fields.map((f) => f.replace("_", " ") + ": " + text(old[f]) + " → " + text(v[f])).join("; "), "hint"));
      if (old.review_notice && !v.review_notice) li.append(el("br"), el("small", "Review notice cleared after public source check.", "hint"));
    }
    $("changeList").append(li);
  }
  $("publishChanges").disabled = !count || !token;
  $("discardDraft").disabled = !count;
  $("exportData").disabled = !ready;
}
function open(v = null) {
  selected = v?.id || null;
  $("editorEmpty").hidden = true;
  $("venueForm").hidden = false;
  $("editorTitle").textContent = v ? "Edit venue" : "Add a venue";
  $("deleteVenue").hidden = !v;
  const vals = { Id: v?.id || "", Name: v?.name || "", Area: v?.area || "", Collection: v?.collection || collections?.groups.find((g) => g.venue_ids.includes(v?.id))?.id || "community-halls", Address: v?.address || "", AddressStatus: v?.address_status || "partial", Phones: v?.phones.map((p) => p.number).join("\n") || "", Maps: v?.maps_url || "", Website: v?.website || "", Lat: v?.coordinates?.lat ?? "", Lon: v?.coordinates?.lon ?? "", Source: v?.review_notice ? "" : v?.maps_url || v?.evidence.at(-1)?.url || "", SourceKind: "independent", Notice: v?.review_notice || "" };
  for (const [k, value] of Object.entries(vals)) $("edit" + k).value = value;
  $("reviewPanel").hidden = !v?.review_notice;
  $("existingNotice").textContent = v?.review_notice || "";
  $("editConfirmNotice").checked = false;
  $("noticeField").hidden = false;
  $("formError").textContent = "";
  render();
  $("editName").focus();
  if (innerWidth < 800) $("venueForm").scrollIntoView({ block: "start" });
}
$("editMaps").addEventListener("input", () => {
  if (!$("editSource").value) $("editSource").value = $("editMaps").value;
});
$("adminSearch").oninput = render;
$("reviewOnly").onchange = render;
$("editConfirmNotice").onchange = () => {
  $("noticeField").hidden = $("editConfirmNotice").checked;
};
$("newVenue").onclick = () => open();
$("venueForm").onsubmit = (e) => {
  e.preventDefault();
  try {
    const input = {};
    for (const k of ["Id", "Name", "Area", "Collection", "Address", "AddressStatus", "Phones", "Maps", "Website", "Lat", "Lon", "Source", "SourceKind", "Notice"]) input[k[0].toLowerCase() + k.slice(1)] = $("edit" + k).value;
    input.confirmNotice = $("editConfirmNotice").checked;
    const next = editVenue(rows, input);
    const errors = validation(next);
    if (errors.length) throw Error(errors.slice(0, 4).join("\n"));
    rows = next;
    selected = input.id || rows.at(-1).id;
    draft();
    open(rows.find((v) => v.id === selected));
    message("Saved to draft. Review your changes below, then publish.");
  } catch (e2) {
    $("formError").textContent = e2.message;
  }
};
$("deleteVenue").onclick = () => {
  const v = rows.find((r) => r.id === selected);
  if (!v || !confirm(`Remove ${v.name} from the public directory? It will be archived when published. This change stays in your draft until you publish.`)) return;
  rows = rows.filter((r) => r.id !== v.id);
  selected = null;
  $("venueForm").hidden = true;
  $("editorEmpty").hidden = false;
  draft();
  render();
  message("Removal saved to draft. You can discard the draft to restore it.");
};
function download(data = rows, name = "venues.json") {
  const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" }), url = URL.createObjectURL(blob), a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
$("exportData").onclick = () => download();
$("recoverDraft").onclick = () => download(olderDraft, "venues-older-draft.json");
$("importData").onchange = async () => {
  try {
    const f = $("importData").files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) throw Error("Choose a venue JSON file smaller than8MB.");
    const next = JSON.parse(await f.text());
    if (!Array.isArray(next)) throw Error("Choose venues.json, containing the full venue list.");
    const errors = validation(next);
    if (errors.length) throw Error(errors.slice(0, 4).join("\n"));
    if (!confirm(`Import ${next.length} records into your draft? Your current draft will be replaced.`)) return;
    rows = next;
    draft();
    render();
    message("Import validated. Review changes before publishing.");
  } catch (e) {
    message("Import failed: " + e.message, true);
  } finally {
    $("importData").value = "";
  }
};
$("discardDraft").onclick = () => {
  if (!confirm("Discard all unpublished changes?")) return;
  rows = structuredClone(baseline);
  try {
    localStorage.removeItem(draftKey);
  } catch {
  }
  selected = null;
  $("venueForm").hidden = true;
  $("editorEmpty").hidden = false;
  render();
  message("Draft discarded. Published data is unchanged.");
};
$("connectGithub").onclick = async () => {
  const value = $("githubToken").value.trim();
  $("githubToken").value = "";
  if (!value) return;
  try {
    $("connectGithub").disabled = true;
    const user = await githubRequest("/user", value);
    if (user.login !== "tanzilamd") throw Error("Connect as the repository owner tanzilamd.");
    const file = await githubRequest("/repos/tanzilamd/venueradar-bd/contents/public/data/venues.json?ref=main", value);
    const latest = decodeContent(file);
    if (JSON.stringify(latest) !== JSON.stringify(baseline)) {
      if (changeCount(changeSet(baseline, rows))) throw Error("GitHub has newer data. Download your draft backup, discard it and reload before connecting.");
      baseline = latest;
      rows = structuredClone(latest);
    }
    token = value;
    $("githubStatus").textContent = "Connected as " + user.login + " · token kept in this tab only";
    $("githubAccess").open = false;
    render();
    message("GitHub connected. Review your draft and select Publish changes.");
  } catch (e) {
    message(e.message, true);
  } finally {
    $("connectGithub").disabled = false;
  }
};
$("publishChanges").onclick = async () => {
  const changes = changeSet(baseline, rows);
  if (!changeCount(changes)) return;
  const removed = changes.removed.map((v) => v.name).join(", ");
  if (!confirm(`Publish ${changes.added.length} additions, ${changes.modified.length} edits and ${changes.removed.length} removals to GitHub?${removed ? " Remove and archive: " + removed + "." : ""}`)) return;
  try {
    $("publishChanges").disabled = true;
    const errors = validation(rows);
    if (errors.length) throw Error(errors.slice(0, 4).join("\n"));
    message("Publishing validated changes to GitHub…");
    const result = await publishCatalog({ token, baseline, venues: rows, collections, areas });
    baseline = structuredClone(rows);
    try {
      localStorage.removeItem(draftKey);
    } catch {
    }
    render();
    message("Published commit " + result.sha.slice(0, 7) + ". GitHub Pages is building; the live directory will update after its checks pass.");
    const link = el("a", "View deployment");
    link.href = "https://github.com/tanzilamd/venueradar-bd/actions";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    $("adminMessage").append(el("br"), link);
  } catch (e) {
    message(e.message, true);
    render();
  }
};
window.addEventListener("beforeunload", (e) => {
  if (ready && changeCount(changeSet(baseline, rows))) {
    e.preventDefault();
    e.returnValue = "";
  }
});
async function load() {
  try {
    const result = await Promise.all(["venues.json", "collections.json", "areas.json", "dhaka-boundary.geojson"].map(async (n) => {
      const r = await fetch("./data/" + n);
      if (!r.ok) throw Error("Directory data unavailable. Reload to try again.");
      return r.json();
    }));
    [rows, collections, areas, boundary] = result;
    baseline = structuredClone(rows);
    let restored = false, draftProblem = "";
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (d && Array.isArray(d.rows) && JSON.stringify(d.baseline) === JSON.stringify(baseline) && !validation(d.rows).length) {
        rows = d.rows;
        restored = true;
      } else if (d && Array.isArray(d.rows)) {
        olderDraft = d.rows;
        $("recoverDraft").hidden = false;
        draftProblem = "Newer data is published. Your older draft is preserved: download it with the backup button before importing or editing.";
      }
    } catch {
    }
    const list = $("areaNames");
    for (const a of areas.neighborhoods) {
      const o = el("option");
      o.value = a.name;
      list.append(o);
    }
    ready = true;
    $("adminSearch").disabled = false;
    $("newVenue").disabled = false;
    render();
    message(restored ? "Your unpublished draft has been restored." : draftProblem || "Ready. Choose a venue or add a new one. Published data changes only when you publish.");
  } catch (e) {
    message(e.message, true);
  }
}
load();
