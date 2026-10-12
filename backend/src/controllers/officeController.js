const pool = require("../config/db");


async function listOffices(req, res, next) {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const division = String(req.query.division || "").trim();
    const district = String(req.query.district || "").trim();
    const type = String(req.query.type || "").trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 30);

    const where = ["o.is_active = 1"];
    const params = [];

    if (q) {
      where.push(`(o.name LIKE ? OR o.name_bn LIKE ? OR o.district LIKE ? OR o.upazila LIKE ?
        OR EXISTS (SELECT 1 FROM services s WHERE s.office_id = o.id AND s.is_active = 1
                   AND (s.name LIKE ? OR s.name_bn LIKE ?)))`);
      const like = `%${q}%`;
      params.push(like, like, like, like, like, like);
    }
    if (division) { where.push("o.division = ?"); params.push(division); }
    if (district) { where.push("o.district = ?"); params.push(district); }
    if (type) { where.push("o.type = ?"); params.push(type); }

    const whereSql = where.join(" AND ");

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM offices o WHERE ${whereSql}`,
      params
    );

    const [offices] = await pool.query(
      `SELECT o.id, o.name, o.name_bn, o.type, o.division, o.district, o.upazila,
              (SELECT COUNT(*) FROM services s WHERE s.office_id = o.id AND s.is_active = 1) AS service_count
       FROM offices o
       WHERE ${whereSql}
       ORDER BY o.name
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({ offices, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}


async function getFilters(req, res, next) {
  try {
    const [divisions] = await pool.query("SELECT DISTINCT division FROM offices WHERE is_active = 1 ORDER BY division");
    const [districts] = await pool.query("SELECT DISTINCT district FROM offices WHERE is_active = 1 ORDER BY district");
    const [types] = await pool.query("SELECT DISTINCT type FROM offices WHERE is_active = 1 ORDER BY type");
    res.json({
      divisions: divisions.map((r) => r.division),
      districts: districts.map((r) => r.district),
      types: types.map((r) => r.type),
    });
  } catch (err) {
    next(err);
  }
}


async function getOffice(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid office id" });
    }

    const [offices] = await pool.query(
      `SELECT id, name, name_bn, type, division, district, upazila, address, contact_info
       FROM offices WHERE id = ? AND is_active = 1`,
      [id]
    );
    if (offices.length === 0) {
      return res.status(404).json({ message: "Office not found" });
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.name_bn, s.description,
              i.official_fee, i.processing_days, i.required_documents, i.source_note, i.updated_at
       FROM services s
       LEFT JOIN service_info i ON i.service_id = s.id
       WHERE s.office_id = ? AND s.is_active = 1
       ORDER BY s.name`,
      [id]
    );

    const services = rows.map((r) => ({
      id: r.id,
      name: r.name,
      name_bn: r.name_bn,
      description: r.description,
      official:
        r.official_fee === null
          ? null
          : {
              fee: Number(r.official_fee),
              processing_days: r.processing_days,
              required_documents: r.required_documents
                ? r.required_documents.split("\n").map((t) => t.trim()).filter(Boolean)
                : [],
              source_note: r.source_note,
              updated_at: r.updated_at,
            },
    }));

    res.json({ office: offices[0], services });
  } catch (err) {
    next(err);
  }
}

module.exports = { listOffices, getFilters, getOffice };