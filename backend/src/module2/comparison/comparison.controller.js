// FR1 (Nahid): official fees / processing times vs aggregated APPROVED user reports.
const pool = require("../../config/db");
const { MIN_APPROVED_REPORTS, REPORT_STATUS_PUBLIC } = require("../constants");
const { round, toId } = require("../utils");

const TOLERANCE = 10; // percent difference still called "similar"
const verdict = (pct) => (pct === null ? null : pct > TOLERANCE ? "higher" : pct < -TOLERANCE ? "lower" : "similar");

function build(row) {
  const count = Number(row.report_count);
  const enough = count >= MIN_APPROVED_REPORTS;
  const fee = Number(row.official_fee);
  const days = row.processing_days === null ? null : Number(row.processing_days);
  const out = {
    service: { id: row.service_id, name: row.service_name, name_bn: row.service_name_bn },
    office: { id: row.office_id, name: row.office_name, type: row.type, division: row.division, district: row.district },
    official: { fee, processing_days: days, source_note: row.source_note },
    approved_reports: count,
    has_enough_data: enough,
    min_reports: MIN_APPROVED_REPORTS,
    reported: null,
    comparison: null,
  };
  if (!enough) return out;
  const avgPaid = round(row.avg_paid);
  const avgWait = round(row.avg_wait, 1);
  const feePct = fee > 0 ? round(((avgPaid - fee) / fee) * 100, 1) : null;
  const timePct = days > 0 ? round(((avgWait - days) / days) * 100, 1) : null;
  out.reported = { avg_amount_paid: avgPaid, avg_waiting_days: avgWait };
  out.comparison = {
    fee_difference: round(avgPaid - fee),
    fee_difference_percent: feePct,
    fee_verdict: verdict(feePct),
    time_difference_days: days === null ? null : round(avgWait - days, 1),
    time_difference_percent: timePct,
    time_verdict: verdict(timePct),
  };
  return out;
}

const FROM = `
  FROM services s
  JOIN offices o ON o.id = s.office_id AND o.is_active = 1
  JOIN service_info i ON i.service_id = s.id`;

// GET /api/comparison/services?q=&division=&type=&office_id=&page=&limit=
async function listComparisons(req, res, next) {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const division = String(req.query.division || "").trim();
    const type = String(req.query.type || "").trim();
    const officeId = toId(req.query.office_id);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 30);

    const where = ["s.is_active = 1"];
    const params = [];
    if (q) {
      where.push("(s.name LIKE ? OR s.name_bn LIKE ? OR o.name LIKE ? OR o.name_bn LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (division) { where.push("o.division = ?"); params.push(division); }
    if (type) { where.push("o.type = ?"); params.push(type); }
    if (officeId) { where.push("o.id = ?"); params.push(officeId); }
    const whereSql = where.join(" AND ");

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM} WHERE ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT s.id AS service_id, s.name AS service_name, s.name_bn AS service_name_bn,
              o.id AS office_id, o.name AS office_name, o.type, o.division, o.district,
              i.official_fee, i.processing_days, i.source_note,
              COUNT(r.id) AS report_count, AVG(r.amount_paid) AS avg_paid, AVG(r.waiting_days) AS avg_wait
       ${FROM}
       LEFT JOIN reports r ON r.service_id = s.id AND r.status = ?
       WHERE ${whereSql}
       GROUP BY s.id
       ORDER BY o.name, s.name
       LIMIT ? OFFSET ?`,
      [REPORT_STATUS_PUBLIC, ...params, limit, (page - 1) * limit]
    );
    res.json({ items: rows.map(build), total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/comparison/services/:id
async function getComparison(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid service id" });

    const [rows] = await pool.query(
      `SELECT s.id AS service_id, s.name AS service_name, s.name_bn AS service_name_bn,
              o.id AS office_id, o.name AS office_name, o.type, o.division, o.district,
              i.official_fee, i.processing_days, i.source_note,
              COUNT(r.id) AS report_count, AVG(r.amount_paid) AS avg_paid, AVG(r.waiting_days) AS avg_wait,
              MIN(r.amount_paid) AS min_paid, MAX(r.amount_paid) AS max_paid,
              MIN(r.waiting_days) AS min_wait, MAX(r.waiting_days) AS max_wait,
              SUM(CASE WHEN r.amount_paid <= i.official_fee THEN 1 ELSE 0 END) AS at_or_under_fee,
              SUM(CASE WHEN i.processing_days IS NOT NULL AND r.waiting_days <= i.processing_days THEN 1 ELSE 0 END) AS within_time
       ${FROM}
       LEFT JOIN reports r ON r.service_id = s.id AND r.status = ?
       WHERE s.id = ? AND s.is_active = 1
       GROUP BY s.id`,
      [REPORT_STATUS_PUBLIC, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Service not found" });

    const row = rows[0];
    const result = build(row);
    if (result.has_enough_data) {
      const n = Number(row.report_count);
      result.details = {
        min_amount_paid: round(row.min_paid),
        max_amount_paid: round(row.max_paid),
        min_waiting_days: Number(row.min_wait),
        max_waiting_days: Number(row.max_wait),
        percent_at_or_under_official_fee: round((Number(row.at_or_under_fee) / n) * 100, 1),
        percent_within_official_time:
          result.official.processing_days === null ? null : round((Number(row.within_time) / n) * 100, 1),
      };
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listComparisons, getComparison };
