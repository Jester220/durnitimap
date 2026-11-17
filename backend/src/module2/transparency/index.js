const express = require("express");
const { listIndicators, getIndicator } = require("./transparency.controller");

const router = express.Router();
router.get("/offices", listIndicators);
router.get("/offices/:id", getIndicator);

module.exports = { mountPath: "/transparency", router };
