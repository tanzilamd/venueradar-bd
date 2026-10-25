import { defineConfig } from "vite";
import fs from "node:fs";
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "accessible-static-directory",
      transformIndexHtml(html) {
        const venues = JSON.parse(
          fs.readFileSync("public/data/venues.json", "utf8"),
        ).filter((v) => v.city === "Dhaka");
        const records = venues
          .map(
            (v) =>
              `<article><h3>${escape(v.name)}</h3><p>${escape(v.address)}</p><p>${escape(v.phones[0]?.number || "Phone not available")}</p><a href="${escape(v.website || v.evidence[0].url)}" rel="noopener noreferrer">${v.website ? "Official venue information" : "Map listing · confirm with operator"}</a></article>`,
          )
          .join("");
        return html.replace(
          "</main>",
          `<noscript><section class="empty"><h2>Dhaka venue directory</h2><p>Enable JavaScript for search, maps, favorites and comparisons. Venue evidence links are available below; map-only listings need operator confirmation.</p>${records}</section></noscript></main>`,
        );
      },
    },
  ],
});
