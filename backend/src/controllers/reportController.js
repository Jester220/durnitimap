const pool = require("../config/db");


const toNumber = (v) => (v === "" || v === null || v === undefined ? NaN : Number(v));

async function createReport(req, res, next) {
  try {
    const officeId = toNumber(req.body.office_id);
    const serviceId = toNumber(req.body.service_id);
    const amountPaid = toNumber(req.body.amount_paid);
    const waitingDays = toNumber(req.body.waiting_days);
    const visitCount = toNumber(req.body.visit_count);
    const description = String(req.body.description || "").trim();

    const errors = {};
    if (!Number.isInteger(officeId) || officeId < 1) errors.office_id = "Select an office";
    if (!Number.isInteger(serviceId) || serviceId < 1) errors.service_id = "Select a service";
    if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > 10000000)
      errors.amount_paid = "Enter the amount you paid in BDT (0 or more)";
    if (!Number.isInteger(waitingDays) || waitingDays < 0 || waitingDays > 3650)
      errors.waiting_days = "Enter waiting time in days (0 to 3650)";
    if (!Number.isInteger(visitCount) || visitCount < 1 || visitCount > 100)
      errors.visit_count = "Enter how many visits it took (1 to 100)";
    if (description.length < 20 || description.length > 2000)
      errors.description = "Description must be 20 to 2000 characters";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Please fix the errors", errors });
    }

    const [valid] = await pool.query(
      `SELECT s.id FROM services s
       JOIN offices o ON o.id = s.office_id
       WHERE s.id = ? AND s.office_id = ? AND s.is_active = 1 AND o.is_active = 1`,
      [serviceId, officeId]
    );
    if (valid.length === 0) {
      return res.status(400).json({
        message: "Please fix the errors",
        errors: { service_id: "This service does not belong to the selected office" },
      });
    }

    
    const [[{ recent }]] = await pool.query(
      "SELECT COUNT(*) AS recent FROM reports WHERE user_id = ? AND created_at > NOW() - INTERVAL 1 DAY",
      [req.user.id]
    );
    if (recent >= 10) {
      return res.status(429).json({ message: "Daily report limit reached. Please try again tomorrow." });
    }

    const [result] = await pool.query(
      `INSERT INTO reports (user_id, office_id, service_id, amount_paid, waiting_days, visit_count, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, officeId, serviceId, amountPaid, waitingDays, visitCount, description]
    );

    res.status(201).json({
      message: "Report submitted. It will appear publicly only after review.",
      report: { id: result.insertId, status: "Pending" },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReport };