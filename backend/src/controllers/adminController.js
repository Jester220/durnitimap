const pool = require("../config/db");

const DIVISIONS = ["Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"];

const clean = (v) => String(v ?? "").trim();
const orNull = (v) => {
  const t = clean(v);
  return t === "" ? null : t;
};
const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const toActive = (v) => (v === false || v === 0 || v === "0" ? 0 : 1);
const fail = (res, errors) => res.status(400).json({ message: "Please fix the errors", errors });

function validateOffice(body) {
  const v = {
    name: clean(body.name),
    name_bn: orNull(body.name_bn),
    type: clean(body.type),
    division: clean(body.division),
    district: clean(body.district),
    upazila: orNull(body.upazila),
    address: orNull(body.address),
    contact_info: orNull(body.contact_info),
    is_active: toActive(body.is_active),
  };
  const errors = {};
  if (v.name.length < 3 || v.name.length > 150) errors.name = "Name must be 3 to 150 characters";
  if (v.name_bn && v.name_bn.length > 150) errors.name_bn = "Bangla name is too long (max 150)";
  if (v.type.length < 2 || v.type.length > 80) errors.type = "Office type must be 2 to 80 characters";
  if (!DIVISIONS.includes(v.division)) errors.division = "Select a division";
  if (v.district.length < 2 || v.district.length > 50) errors.district = "District must be 2 to 50 characters";
  if (v.upazila && v.upazila.length > 50) errors.upazila = "Upazila is too long (max 50)";
  if (v.address && v.address.length > 255) errors.address = "Address is too long (max 255)";
  if (v.contact_info && v.contact_info.length > 150) errors.contact_info = "Contact info is too long (max 150)";
  return { v, errors };
}

function validateService(body) {
  const documents = clean(body.required_documents)
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .join("\n");

  const days = body.processing_days;
  const v = {
    name: clean(body.name),
    name_bn: orNull(body.name_bn),
    description: orNull(body.description),
    official_fee: body.official_fee === "" ? NaN : Number(body.official_fee),
    processing_days: days === "" || days === null || days === undefined ? null : Number(days),
    required_documents: documents === "" ? null : documents,
    source_note: orNull(body.source_note),
    is_active: toActive(body.is_active),
  };
  const errors = {};
  if (v.name.length < 2 || v.name.length > 150) errors.name = "Service name must be 2 to 150 characters";
  if (v.name_bn && v.name_bn.length > 150) errors.name_bn = "Bangla name is too long (max 150)";
  if (v.description && v.description.length > 2000) errors.description = "Description is too long (max 2000)";
  if (!Number.isFinite(v.official_fee) || v.official_fee < 0 || v.official_fee > 10000000)
    errors.official_fee = "Enter the official fee in BDT (0 or more)";
  if (v.processing_days !== null && (!Number.isInteger(v.processing_days) || v.processing_days < 0 || v.processing_days > 3650))
    errors.processing_days = "Processing days must be a whole number from 0 to 3650";
  if (v.required_documents && v.required_documents.length > 2000)
    errors.required_documents = "Required documents text is too long (max 2000)";
  if (v.source_note && v.source_note.length > 255) errors.source_note = "Source note is too long (max 255)";
  return { v, errors };
}


async function listOffices(req, res, next) {
  try {
    const q = clean(req.query.q).slice(0, 100);
    const like = `%${q}%`;
    const [offices] = await pool.query(
      `SELECT o.id, o.name, o.name_bn, o.type, o.division, o.district, o.is_active,
              (SELECT COUNT(*) FROM services s WHERE s.office_id = o.id AND s.is_active = 1) AS service_count
       FROM offices o
       WHERE (? = '' OR o.name LIKE ? OR o.name_bn LIKE ? OR o.district LIKE ?)
       ORDER BY o.name
       LIMIT 200`,
      [q, like, like, like]
    );
    res.json({ offices });
  } catch (err) {
    next(err);
  }
}

async function getOffice(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid office id" });

    const [offices] = await pool.query("SELECT * FROM offices WHERE id = ?", [id]);
    if (offices.length === 0) return res.status(404).json({ message: "Office not found" });

    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.name_bn, s.description, s.is_active,
              i.official_fee, i.processing_days, i.required_documents, i.source_note
       FROM services s
       LEFT JOIN service_info i ON i.service_id = s.id
       WHERE s.office_id = ?
       ORDER BY s.name`,
      [id]
    );
    const services = rows.map((r) => ({
      ...r,
      official_fee: r.official_fee === null ? null : Number(r.official_fee),
    }));

    res.json({ office: offices[0], services });
  } catch (err) {
    next(err);
  }
}


async function createOffice(req, res, next) {
  try {
    const { v, errors } = validateOffice(req.body);
    if (Object.keys(errors).length > 0) return fail(res, errors);

    const [result] = await pool.query(
      `INSERT INTO offices (name, name_bn, type, division, district, upazila, address, contact_info, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.name, v.name_bn, v.type, v.division, v.district, v.upazila, v.address, v.contact_info, v.is_active]
    );
    res.status(201).json({ id: result.insertId, message: "Office added" });
  } catch (err) {
    next(err);
  }
}


async function updateOffice(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid office id" });

    const [found] = await pool.query("SELECT id FROM offices WHERE id = ?", [id]);
    if (found.length === 0) return res.status(404).json({ message: "Office not found" });

    const { v, errors } = validateOffice(req.body);
    if (Object.keys(errors).length > 0) return fail(res, errors);

    await pool.query(
      `UPDATE offices SET name = ?, name_bn = ?, type = ?, division = ?, district = ?,
              upazila = ?, address = ?, contact_info = ?, is_active = ?
       WHERE id = ?`,
      [v.name, v.name_bn, v.type, v.division, v.district, v.upazila, v.address, v.contact_info, v.is_active, id]
    );
    res.json({ id, message: "Office updated" });
  } catch (err) {
    next(err);
  }
}


async function setOfficeActive(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid office id" });

    const [found] = await pool.query("SELECT id FROM offices WHERE id = ?", [id]);
    if (found.length === 0) return res.status(404).json({ message: "Office not found" });

    await pool.query("UPDATE offices SET is_active = ? WHERE id = ?", [toActive(req.body.is_active), id]);
    res.json({ message: "Office status updated" });
  } catch (err) {
    next(err);
  }
}

async function saveInfo(conn, serviceId, v) {
  await conn.query(
    `INSERT INTO service_info (service_id, official_fee, processing_days, required_documents, source_note)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE official_fee = VALUES(official_fee),
                             processing_days = VALUES(processing_days),
                             required_documents = VALUES(required_documents),
                             source_note = VALUES(source_note)`,
    [serviceId, v.official_fee, v.processing_days, v.required_documents, v.source_note]
  );
}


async function createService(req, res, next) {
  const officeId = toId(req.params.officeId);
  if (!officeId) return res.status(400).json({ message: "Invalid office id" });

  const { v, errors } = validateService(req.body);
  if (Object.keys(errors).length > 0) return fail(res, errors);

  let conn;
  try {
    const [found] = await pool.query("SELECT id FROM offices WHERE id = ?", [officeId]);
    if (found.length === 0) return res.status(404).json({ message: "Office not found" });

    
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO services (office_id, name, name_bn, description, is_active) VALUES (?, ?, ?, ?, ?)",
      [officeId, v.name, v.name_bn, v.description, v.is_active]
    );
    await saveInfo(conn, result.insertId, v);
    await conn.commit();

    res.status(201).json({ id: result.insertId, message: "Service added" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
}

async function updateService(req, res, next) {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid service id" });

  const { v, errors } = validateService(req.body);
  if (Object.keys(errors).length > 0) return fail(res, errors);

  let conn;
  try {
    const [found] = await pool.query("SELECT id FROM services WHERE id = ?", [id]);
    if (found.length === 0) return res.status(404).json({ message: "Service not found" });

    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query(
      "UPDATE services SET name = ?, name_bn = ?, description = ?, is_active = ? WHERE id = ?",
      [v.name, v.name_bn, v.description, v.is_active, id]
    );
    await saveInfo(conn, id, v);
    await conn.commit();

    res.json({ id, message: "Service updated" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
}


async function setServiceActive(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid service id" });

    const [found] = await pool.query("SELECT id FROM services WHERE id = ?", [id]);
    if (found.length === 0) return res.status(404).json({ message: "Service not found" });

    await pool.query("UPDATE services SET is_active = ? WHERE id = ?", [toActive(req.body.is_active), id]);
    res.json({ message: "Service status updated" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOffices,
  getOffice,
  createOffice,
  updateOffice,
  setOfficeActive,
  createService,
  updateService,
  setServiceActive,
};