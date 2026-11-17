// FR4 (Nahid): Transparency Indicator (0-100, higher = reported reality matches the official information).
// Inputs: approved reports, verification (review outcome), report frequency, recent trend.
const { MIN_APPROVED_REPORTS } = require("../constants");
const { round, clamp } = require("../utils");

const FORMULA = {
  alignment_weights: { fee: 0.5, time: 0.3, visits: 0.2 },
  verification_weight: 0.2, // base = 0.8 * alignment + 0.2 * verification rate
  trend_adjustment: 5, // +5 improving, -5 declining
  trend_window_days: 90,
  levels: { high: 75, moderate: 50 },
};

function fromRow(row) {
  const approved = Number(row.approved || 0);
  const reviewed = Number(row.reviewed || 0);
  const recent = Number(row.recent_approved || 0);
  const base = {
    office: { id: row.id, name: row.name, type: row.type, division: row.division, district: row.district },
    approved_reports: approved,
    reports_last_90_days: recent,
    min_reports: MIN_APPROVED_REPORTS,
  };
  const verification = reviewed > 0 ? round((approved / reviewed) * 100, 1) : null;

  if (approved < MIN_APPROVED_REPORTS) {
    return { ...base, score: null, level: "not_enough_data", confidence: "low", verification_rate: verification, trend: "unknown", components: { fee: null, time: null, visits: null } };
  }

  const feeScore = row.avg_overpay_pct === null ? null : clamp(100 - Number(row.avg_overpay_pct));
  const timeScore = row.avg_delay_pct === null ? null : clamp(100 - Number(row.avg_delay_pct));
  const visitScore = row.avg_visits === null ? null : clamp(100 - (Number(row.avg_visits) - 1) * 25);

  const w = FORMULA.alignment_weights;
  const parts = [[feeScore, w.fee], [timeScore, w.time], [visitScore, w.visits]].filter(([s]) => s !== null);
  const wsum = parts.reduce((s, [, x]) => s + x, 0);
  const alignment = parts.reduce((s, [v, x]) => s + v * x, 0) / wsum;

  const baseScore = verification === null ? alignment : (1 - FORMULA.verification_weight) * alignment + FORMULA.verification_weight * verification;

  // trend: average overpayment of the last 90 days vs the 90 days before (needs 2+ reports in each)
  let trend = "unknown";
  if (Number(row.recent_n) >= 2 && Number(row.prev_n) >= 2) {
    const delta = Number(row.prev_overpay) - Number(row.recent_overpay); // positive = overpaying less now
    trend = delta > 5 ? "improving" : delta < -5 ? "declining" : "stable";
  }
  const adj = trend === "improving" ? FORMULA.trend_adjustment : trend === "declining" ? -FORMULA.trend_adjustment : 0;

  const score = Math.round(clamp(baseScore + adj));
  const level = score >= FORMULA.levels.high ? "high" : score >= FORMULA.levels.moderate ? "moderate" : "low";
  const confidence = approved >= 10 && recent >= 3 ? "high" : approved >= 5 ? "medium" : "low";

  return {
    ...base,
    score,
    level,
    confidence,
    verification_rate: verification,
    trend,
    components: { fee: round(feeScore, 1), time: round(timeScore, 1), visits: round(visitScore, 1) },
  };
}

async function computeIndicators(db, { officeId = null, division = "", type = "" } = {}) {
  const where = ["o.is_active = 1"];
  const params = [];
  if (officeId) { where.push("o.id = ?"); params.push(officeId); }
  if (division) { where.push("o.division = ?"); params.push(division); }
  if (type) { where.push("o.type = ?"); params.push(type); }

  const overpay = "(r.amount_paid - i.official_fee) / i.official_fee * 100";
  const [rows] = await db.query(
    `SELECT o.id, o.name, o.type, o.division, o.district,
            SUM(r.status = 'Approved') AS approved,
            SUM(r.status IN ('Approved','Rejected','Flagged')) AS reviewed,
            AVG(CASE WHEN r.status = 'Approved' AND i.official_fee > 0 THEN GREATEST(0, ${overpay}) END) AS avg_overpay_pct,
            AVG(CASE WHEN r.status = 'Approved' AND i.processing_days > 0
                     THEN GREATEST(0, (r.waiting_days - i.processing_days) / i.processing_days * 100) END) AS avg_delay_pct,
            AVG(CASE WHEN r.status = 'Approved' THEN r.visit_count END) AS avg_visits,
            SUM(r.status = 'Approved' AND r.created_at >= NOW() - INTERVAL 90 DAY) AS recent_approved,
            SUM(r.status = 'Approved' AND r.created_at >= NOW() - INTERVAL 90 DAY AND i.official_fee > 0) AS recent_n,
            AVG(CASE WHEN r.status = 'Approved' AND r.created_at >= NOW() - INTERVAL 90 DAY AND i.official_fee > 0 THEN ${overpay} END) AS recent_overpay,
            SUM(r.status = 'Approved' AND r.created_at < NOW() - INTERVAL 90 DAY AND r.created_at >= NOW() - INTERVAL 180 DAY AND i.official_fee > 0) AS prev_n,
            AVG(CASE WHEN r.status = 'Approved' AND r.created_at < NOW() - INTERVAL 90 DAY AND r.created_at >= NOW() - INTERVAL 180 DAY AND i.official_fee > 0 THEN ${overpay} END) AS prev_overpay
     FROM offices o
     LEFT JOIN reports r ON r.office_id = o.id
     LEFT JOIN service_info i ON i.service_id = r.service_id
     WHERE ${where.join(" AND ")}
     GROUP BY o.id
     ORDER BY o.name`,
    params
  );
  return rows.map(fromRow);
}

// Saves the latest calculation in transparency_scores (best effort; never breaks the response)
async function saveSnapshots(db, list) {
  try {
    for (const x of list) {
      await db.query(
        `INSERT INTO transparency_scores
           (office_id, score, level, confidence, approved_reports, verification_rate, reports_last_90_days, trend, fee_score, time_score, visit_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score), level = VALUES(level), confidence = VALUES(confidence),
           approved_reports = VALUES(approved_reports), verification_rate = VALUES(verification_rate),
           reports_last_90_days = VALUES(reports_last_90_days), trend = VALUES(trend),
           fee_score = VALUES(fee_score), time_score = VALUES(time_score), visit_score = VALUES(visit_score)`,
        [x.office.id, x.score, x.level, x.confidence, x.approved_reports, x.verification_rate, x.reports_last_90_days, x.trend, x.components.fee, x.components.time, x.components.visits]
      );
    }
  } catch (err) {
    console.warn("Could not save transparency snapshot (run npm run migrate):", err.message);
  }
}

module.exports = { computeIndicators, saveSnapshots, FORMULA };
