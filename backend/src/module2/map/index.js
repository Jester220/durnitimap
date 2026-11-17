const express = require("express");
const { getMapOffices } = require("./map.controller");

const router = express.Router();
router.get("/offices", getMapOffices);

module.exports = { mountPath: "/map", router };
