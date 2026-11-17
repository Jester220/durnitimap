const express = require("express");
const { listComparisons, getComparison } = require("./comparison.controller");

const router = express.Router();
router.get("/services", listComparisons);
router.get("/services/:id", getComparison);

module.exports = { mountPath: "/comparison", router };
