const express = require("express");
const { listServices, analyzeService } = require("./analysis.controller");

const router = express.Router();
router.get("/services", listServices);
router.get("/services/:id", analyzeService);

module.exports = { mountPath: "/analysis", router };
