// FR3 (Mahi): offices with coordinates + aggregated APPROVED report data.
const pool = require("../../config/db");
const { MIN_APPROVED_REPORTS, REPORT_STATUS_PUBLIC } = require("../constants");

const round = (v, d = 2) => (v === null || v === undefined ? null : Number(Number(v).toFixed(d)));

// GET /api/map/offices?division=&type=
async function getMapOffices(req, res, next) {
  try {
    const division = String(req.query.division || "").trim().slice(0, 50);
    const type = String(req.query.type || "").trim().slice(0, 80);

    // Fixed SQL text; user values only go into params.
    const where = ["o.is_active = 1"];
    const params = [];
    if (division) { where.push("o.division = ?"); params.push(division); }
    if (type) { where.push("o.type = ?"); params.push(type); }
    const whereSql = where.join(" AND ");

    const [rows] = await pool.query(
      `SELECT o.id, o.name, o.name_bn, o.type, o.division, o.district, o.upazila, o.address,
              o.latitude, o.longitude,
              COUNT(r.id) AS report_count,
              AVG(r.waiting_days) AS avg_waiting_days,
              AVG(r.visit_count)  AS avg_visit_count,
              AVG(r.amount_paid)  AS avg_amount_paid,
              COUNT(i.official_fee) AS fee_compared_count,
              AVG(CASE WHEN i.official_fee IS NOT NULL THEN r.amount_paid END) AS avg_paid_compared,
              AVG(i.official_fee) AS avg_official_fee
       FROM offices o
       LEFT JOIN reports r ON r.office_id = o.id AND r.status = ?
       LEFT JOIN service_info i ON i.service_id = r.service_id
       WHERE ${whereSql} AND o.latitude IS NOT NULL AND o.longitude IS NOT NULL
       GROUP BY o.id
       ORDER BY o.name`,
      [REPORT_STATUS_PUBLIC, ...params]
    );

    const [[{ missing }]] = await pool.query(
      `SELECT COUNT(*) AS missing FROM offices o
       WHERE ${whereSql} AND (o.latitude IS NULL OR o.longitude IS NULL)`,
      params
    );

    // Optional: Nahid's Transparency Indicator (FR4). Skipped automatically if that feature is not installed.
    let indicators = {};
    try {
      const { computeIndicators } = require("../transparency/indicator.service");
      const list = await computeIndicators(pool, { division, type });
      indicators = Object.fromEntries(list.map((x) => [x.office.id, { score: x.score, level: x.level }]));
    } catch (err) {
      if (err.code !== "MODULE_NOT_FOUND") console.warn("Indicator not added to map:", err.message);
    }

    const offices = rows.map((r) => {
      const count = Number(r.report_count);
      const enough = count >= MIN_APPROVED_REPORTS;
      const feeBase = Number(r.avg_official_fee);
      const canCompare = enough && Number(r.fee_compared_count) > 0 && feeBase > 0;
      return {
        id: r.id,
        name: r.name,
        name_bn: r.name_bn,
        type: r.type,
        division: r.division,
        district: r.district,
        upazila: r.upazila,
        address: r.address,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        approved_reports: count,
        has_enough_data: enough,
        indicator: indicators[r.id] ?? null,
        // Aggregates are sent only when there are enough approved reports.
        stats: enough
          ? {
              avg_amount_paid: round(r.avg_amount_paid),
              avg_waiting_days: round(r.avg_waiting_days, 1),
              avg_visit_count: round(r.avg_visit_count, 1),
              avg_official_fee: canCompare ? round(r.avg_official_fee) : null,
              avg_paid_compared: canCompare ? round(r.avg_paid_compared) : null,
              paid_vs_official_percent: canCompare
                ? round(((Number(r.avg_paid_compared) - feeBase) / feeBase) * 100, 1)
                : null,
            }
          : null,
      };
    });

    res.json({
      offices,
      summary: {
        offices_on_map: offices.length,
        offices_without_location: missing,
        approved_reports: offices.reduce((s, o) => s + o.approved_reports, 0),
        min_reports_for_stats: MIN_APPROVED_REPORTS,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMapOffices };
