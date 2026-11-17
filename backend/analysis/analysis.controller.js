// FR2 (Saif): statistics of reported expenses, waiting times and repeated visits for one service.
// Uses APPROVED reports only; numbers are shown only when there are enough reports.
const pool = require("../../config/db");
const { MIN_APPROVED_REPORTS, REPORT_STATUS_PUBLIC } = require("../constants");
const { round, toId, percentile } = require("../utils");

const MAX_ROWS = 5000;

function summary(values, digits = 2) {
  const s = [...values].sort((a, b) => a - b);
  const sum = s.reduce((t, v) => t + v, 0);
  return {
    average: round(sum / s.length, digits),
    median: round(percentile(s, 0.5), digits),
    min: round(s[0], digits),
    max: round(s[s.length - 1], digits),
    p25: round(percentile(s, 0.25), digits),
    p75: round(percentile(s, 0.75), digits),
  };
}

// 5 equal-width bins between min and max (one bin when all values are equal)
function histogram(values, unit) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: `${min}${unit}`, from: min, to: max, count: values.length }];
  const bins = 5;
  const width = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => {
    const from = Math.round(min + i * width);
    const to = Math.round(min + (i + 1) * width);
    return { label: `${from}-${to}${unit}`, from, to, count: 0 };
  });
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    out[idx].count++;
  }
  return out;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthly(rows, months) {
  const now = new Date();
  const list = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({ month: monthKey(d), count: 0, sumPaid: 0, sumWait: 0, repeated: 0 });
  }
  const byKey = Object.fromEntries(list.map((m) => [m.month, m]));
  for (const r of rows) {
    const m = byKey[monthKey(new Date(r.created_at))];
    if (!m) continue;
    m.count++;
    m.sumPaid += Number(r.amount_paid);
    m.sumWait += Number(r.waiting_days);
    if (Number(r.visit_count) > 1) m.repeated++;
  }
  return list.map((m) => ({
    month: m.month,
    count: m.count,
    avg_amount_paid: m.count ? round(m.sumPaid / m.count) : null,
    avg_waiting_days: m.count ? round(m.sumWait / m.count, 1) : null,
    repeat_visit_percent: m.count ? round((m.repeated / m.count) * 100, 1) : null,
  }));
}

// GET /api/analysis/services?q=&office_id=   (for the service selector)
async function listServices(req, res, next) {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const officeId = toId(req.query.office_id);
    const where = ["s.is_active = 1"];
    const params = [];
    if (q) {
      where.push("(s.name LIKE ? OR s.name_bn LIKE ? OR o.name LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (officeId) { where.push("o.id = ?"); params.push(officeId); }
    const [rows] = await pool.query(
      `SELECT s.id, s.name, o.id AS office_id, o.name AS office_name, COUNT(r.id) AS approved_reports
       FROM services s
       JOIN offices o ON o.id = s.office_id AND o.is_active = 1
       LEFT JOIN reports r ON r.service_id = s.id AND r.status = ?
       WHERE ${where.join(" AND ")}
       GROUP BY s.id
       ORDER BY approved_reports DESC, o.name, s.name
       LIMIT 200`,
      [REPORT_STATUS_PUBLIC, ...params]
    );
    res.json({ services: rows.map((r) => ({ ...r, approved_reports: Number(r.approved_reports) })), min_reports: MIN_APPROVED_REPORTS });
  } catch (err) {
    next(err);
  }
}

// GET /api/analysis/services/:id?months=12
async function analyzeService(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid service id" });
    const months = [6, 12, 24].includes(Number(req.query.months)) ? Number(req.query.months) : 12;

    const [svc] = await pool.query(
      `SELECT s.id, s.name, s.name_bn, o.id AS office_id, o.name AS office_name, o.district, o.division,
              i.official_fee, i.processing_days
       FROM services s
       JOIN offices o ON o.id = s.office_id AND o.is_active = 1
       LEFT JOIN service_info i ON i.service_id = s.id
       WHERE s.id = ? AND s.is_active = 1`,
      [id]
    );
    if (svc.length === 0) return res.status(404).json({ message: "Service not found" });
    const s = svc[0];

    const [rows] = await pool.query(
      `SELECT amount_paid, waiting_days, visit_count, created_at
       FROM reports WHERE service_id = ? AND status = ?
       ORDER BY created_at LIMIT ${MAX_ROWS}`,
      [id, REPORT_STATUS_PUBLIC]
    );

    const result = {
      service: { id: s.id, name: s.name, name_bn: s.name_bn },
      office: { id: s.office_id, name: s.office_name, district: s.district, division: s.division },
      official: { fee: s.official_fee === null ? null : Number(s.official_fee), processing_days: s.processing_days },
      approved_reports: rows.length,
      min_reports: MIN_APPROVED_REPORTS,
      has_enough_data: rows.length >= MIN_APPROVED_REPORTS,
      months,
    };
    if (!result.has_enough_data) return res.json(result);

    const paid = rows.map((r) => Number(r.amount_paid));
    const wait = rows.map((r) => Number(r.waiting_days));
    const visits = rows.map((r) => Number(r.visit_count));
    const repeated = visits.filter((v) => v > 1).length;
    const dist = ["1", "2", "3", "4", "5+"].map((label) => ({ label, count: 0 }));
    for (const v of visits) dist[Math.min(v, 5) - 1].count++;

    res.json({
      ...result,
      expenses: { ...summary(paid), histogram: histogram(paid, "") },
      waiting: { ...summary(wait, 1), histogram: histogram(wait, "d") },
      visits: {
        average: round(visits.reduce((t, v) => t + v, 0) / visits.length, 1),
        repeat_visit_percent: round((repeated / visits.length) * 100, 1),
        distribution: dist,
      },
      monthly: monthly(rows, months),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listServices, analyzeService };
