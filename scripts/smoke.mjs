// Run the same end-to-end checks used after GitHub Pages deployment.
import fs from "node:fs";
const input = process.argv[2];
if (!input) throw Error("Supply a local build or deployed website URL");
process.env.LIVE_SITE_URL = input.endsWith("/") ? input : input + "/";
if (!process.env.CHROMIUM_PATH && fs.existsSync("/usr/bin/chromium")) process.env.CHROMIUM_PATH = "/usr/bin/chromium";
await import("./verify-live.mjs");
