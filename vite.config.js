import { defineConfig } from "vite";
import fs from "node:fs";
import {resolve} from "node:path";
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
  build: {rollupOptions: {input: {directory: resolve("index.html"), manage: resolve("manage.html")}}},
  plugins: [
    {
      name: "accessible-static-directory",
      transformIndexHtml(html, context) {
        if (context.filename.endsWith("manage.html")) return html;
        const venues = JSON.parse(
          fs.readFileSync("public/data/venues.json", "utf8"),
        ).filter((v) => v.city === "Dhaka");
        const records = venues
          .map(
            (v) =>
              `<article><h3>${escape(v.name)}</h3><p>${escape(v.area || "Area not assigned")} · ${escape(v.address)}</p><p>${escape(v.phones[0]?.number || "Phone not sourced yet")}</p>${v.review_notice ? `<p>${escape(v.review_notice)}</p>` : ""}<a href="${escape(v.website || v.evidence[0].url)}" rel="noopener noreferrer">Open business information</a></article>`,
          )
          .join("");
        return html.replace(
          "</main>",
          `<noscript><section class="empty"><h2>Dhaka venue directory</h2><p>Enable JavaScript for search, maps, favorites and comparisons. Find venue names, areas, contacts and map links below. Confirm booking details directly.</p>${records}</section></noscript></main>`,
        );
      },
    },
  ],
});
