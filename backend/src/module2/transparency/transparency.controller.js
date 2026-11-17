const pool = require("../../config/db");
const { toId } = require("../utils");
const { computeIndicators, saveSnapshots, FORMULA } = require("./indicator.service");

const order = { high: 0, moderate: 1, low: 2, not_enough_data: 3 };

// GET /api/transparency/offices?division=&type=
async function listIndicators(req, res, next) {
  try {
    const division = String(req.query.division || "").trim().slice(0, 50);
    const type = String(req.query.type || "").trim().slice(0, 80);
    const list = await computeIndicators(pool, { division, type });
    await saveSnapshots(pool, list);
    list.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || order[a.level] - order[b.level] || a.office.name.localeCompare(b.office.name));
    res.json({ offices: list, formula: FORMULA });
  } catch (err) {
    next(err);
  }
}

// GET /api/transparency/offices/:id
async function getIndicator(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid office id" });
    const list = await computeIndicators(pool, { officeId: id });
    if (list.length === 0) return res.status(404).json({ message: "Office not found" });
    await saveSnapshots(pool, list);
    res.json({ indicator: list[0], formula: FORMULA });
  } catch (err) {
    next(err);
  }
}

module.exports = { listIndicators, getIndicator };
