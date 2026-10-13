const pool = require("../config/db");

const STATUSES = ["Pending", "Approved", "Rejected", "Flagged"];

// GET /api/reports/mine?status=Pending   (login required)
// Returns only the logged-in user's own reports. user_id is never sent back.
async function getMyReports(req, res, next) {
  try {
    const status = String(req.query.status || "");
    const where = ["r.user_id = ?"];
    const params = [req.user.id];

    if (status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      where.push("r.status = ?");
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT r.id, r.amount_paid, r.waiting_days, r.visit_count, r.description,
              r.status, r.created_at,
              o.id AS office_id, o.name AS office_name,
              s.id AS service_id, s.name AS service_name
       FROM reports r
       JOIN offices o ON o.id = r.office_id
       JOIN services s ON s.id = r.service_id
       WHERE ${where.join(" AND ")}
       ORDER BY r.created_at DESC`,
      params
    );

    const [countRows] = await pool.query(
      "SELECT status, COUNT(*) AS total FROM reports WHERE user_id = ? GROUP BY status",
      [req.user.id]
    );
    const counts = { Pending: 0, Approved: 0, Rejected: 0, Flagged: 0 };
    countRows.forEach((c) => {
      counts[c.status] = c.total;
    });

    const reports = rows.map((r) => ({ ...r, amount_paid: Number(r.amount_paid) }));
    res.json({ reports, counts });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyReports };