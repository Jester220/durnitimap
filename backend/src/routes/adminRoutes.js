const express = require("express");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const c = require("../controllers/adminController");

const router = express.Router();

router.use(auth, requireRole("admin"));

router.get("/offices", c.listOffices);
router.post("/offices", c.createOffice);
router.get("/offices/:id", c.getOffice);
router.put("/offices/:id", c.updateOffice);
router.patch("/offices/:id/active", c.setOfficeActive);

router.post("/offices/:officeId/services", c.createService);
router.put("/services/:id", c.updateService);
router.patch("/services/:id/active", c.setServiceActive);

module.exports = router;