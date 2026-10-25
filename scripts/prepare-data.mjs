import fs from "node:fs";
import { deriveCatalog } from "../src/catalog-edit.js";
const read = (n) => JSON.parse(fs.readFileSync("public/data/" + n + ".json", "utf8"));
const derived = deriveCatalog(read("venues"), read("collections"), read("areas"));
for (const [name, value] of Object.entries(derived)) {
  const file = "public/data/" + name + ".json", text = JSON.stringify(value, null, 2) + "\n";
  if (fs.readFileSync(file, "utf8") !== text) fs.writeFileSync(file, text);
}
console.log("Area index and collection membership synchronized from venue records.");
