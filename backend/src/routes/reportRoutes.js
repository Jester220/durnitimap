const express = require("express");
const auth = require("../middleware/auth");
const { createReport } = require("../controllers/reportController");
const { getMyReports } = require("../controllers/myReportsController");

const router = express.Router();

router.post("/", auth, createReport);
router.get("/mine", auth, getMyReports);

module.exports = router;