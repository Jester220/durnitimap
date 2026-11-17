// Module 2 loader. Every sub-folder that has an index.js exporting
// { mountPath, router } is mounted under /api automatically, so each team
// member adds a NEW folder and never edits a shared file:
//   map/         Mahi  (FR3)  -> /api/map
//   comparison/  Nahid (FR1)  -> /api/comparison
//   transparency/ Nahid (FR4) -> /api/transparency
//   analysis/    Saif  (FR2)  -> /api/analysis
const fs = require("fs");
const path = require("path");
const express = require("express");

const router = express.Router();

for (const entry of fs.readdirSync(__dirname, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(__dirname, entry.name, "index.js");
  if (!fs.existsSync(file)) continue;
  const feature = require(file);
  router.use(feature.mountPath, feature.router);
}

module.exports = router;
