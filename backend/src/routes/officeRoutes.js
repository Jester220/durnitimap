const express = require("express");
const { listOffices, getFilters, getOffice } = require("../controllers/officeController");

const router = express.Router();

router.get("/", listOffices);
router.get("/filters", getFilters); // must stay above "/:id"
router.get("/:id", getOffice);

module.exports = router;