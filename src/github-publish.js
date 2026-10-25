import { deriveCatalog, changeSet, changeCount } from "./catalog-edit.js";
function decodeContent(data) {
  const bytes = Uint8Array.from(atob(data.content.replace(/\s/g, "")), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function githubRequest(path, token, body, method = body ? "POST" : "GET") {
  const response = await fetch("https://api.github.com" + path, { method, headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + token, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {} });
  const result = await response.json();
  if (!response.ok) {
    const error = Error(response.status === 401 ? "GitHub did not accept this access token." : response.status === 403 ? "This token needs Contents: read and write for venueradar-bd." : response.status === 422 || response.status === 409 ? "The repository changed while saving. Reload the latest data before publishing." : result.message || "GitHub request failed.");
    error.status = response.status;
    throw error;
  }
  return result;
}
async function publishCatalog({ token, baseline, venues, collections, areas, request = githubRequest }) {
  if (!token) throw Error("Connect GitHub to publish, or download the JSON instead.");
  const user = await request("/user", token);
  if (user.login !== "tanzilamd") throw Error("Only the repository owner tanzilamd can publish from this editor.");
  const changes = changeSet(baseline, venues);
  if (!changeCount(changes)) throw Error("No changes to publish.");
  const repo = "/repos/tanzilamd/venueradar-bd";
  const ref = await request(repo + "/git/ref/heads/main", token);
  const sha = ref.object.sha;
  const file = await request(repo + "/contents/public/data/venues.json?ref=" + sha, token);
  if (JSON.stringify(decodeContent(file)) !== JSON.stringify(baseline)) throw Error("Venue data changed on GitHub. Download your draft as a backup, then reload the latest data and apply your changes again. Nothing was overwritten.");
  const base = await request(repo + "/git/commits/" + sha, token), derived = deriveCatalog(venues, collections, areas);
  const files = { "public/data/venues.json": venues, "public/data/collections.json": derived.collections, "public/data/areas.json": derived.areas };
  if (changes.removed.length || changes.modified.length) {
    let archive = [];
    try {
      archive = decodeContent(await request(repo + "/contents/docs/archive/venues.json?ref=" + sha, token));
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    files["docs/archive/venues.json"] = [...archive, ...changes.removed.map((record) => ({ removed_at: (/* @__PURE__ */ new Date()).toISOString(), reason: "Removed by repository owner through the visual directory editor.", record })), ...changes.modified.map((v) => ({ archived_at: (/* @__PURE__ */ new Date()).toISOString(), reason: "Previous version before an owner-approved visual edit.", record: baseline.find((r) => r.id === v.id) }))];
  }
  const tree = await request(repo + "/git/trees", token, { base_tree: base.tree.sha, tree: Object.entries(files).map(([path, value]) => ({ path, mode: "100644", type: "blob", content: JSON.stringify(value, null, 2) + "\n" })) });
  const identity = { name: "Tanzil Ahmed", email: "59307135+tanzilamd@users.noreply.github.com" };
  const commit = await request(repo + "/git/commits", token, { message: `Update venue directory: ${changes.added.length} added, ${changes.modified.length} edited, ${changes.removed.length} removed`, tree: tree.sha, parents: [sha], author: identity, committer: identity });
  await request(repo + "/git/refs/heads/main", token, { sha: commit.sha, force: false }, "PATCH");
  return commit;
}
export {
  decodeContent,
  githubRequest,
  publishCatalog
};
