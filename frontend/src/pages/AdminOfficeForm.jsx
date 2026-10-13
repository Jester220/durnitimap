import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { DIVISIONS } from "../constants";

const EMPTY = {
  name: "",
  name_bn: "",
  type: "",
  division: "",
  district: "",
  upazila: "",
  address: "",
  contact_info: "",
  is_active: true,
};

export default function AdminOfficeForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/admin/offices/${id}`)
      .then((d) => {
        const o = d.office;
        setForm({
          name: o.name ?? "",
          name_bn: o.name_bn ?? "",
          type: o.type ?? "",
          division: o.division ?? "",
          district: o.district ?? "",
          upazila: o.upazila ?? "",
          address: o.address ?? "",
          contact_info: o.contact_info ?? "",
          is_active: !!o.is_active,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function validate() {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (form.type.trim().length < 2) e.type = "Enter the office type, e.g. Passport Office";
    if (!form.division) e.division = "Select a division";
    if (form.district.trim().length < 2) e.district = "Enter the district";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError("Please fix the highlighted fields below.");
      return;
    }

    setBusy(true);
    try {
      if (id) {
        await apiFetch(`/admin/offices/${id}`, { method: "PUT", body: form });
        navigate(`/admin/offices/${id}`);
      } else {
        const d = await apiFetch("/admin/offices", { method: "POST", body: form });
        navigate(`/admin/offices/${d.id}`);
      }
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-center py-10">Loading...</p>;

  const input = (name, label, extra = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" value={form[name]} onChange={change} {...extra} />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4">
        <h1 className="font-display text-2xl font-bold text-forest">
          {id ? "Edit office" : "Add office"}
        </h1>
        {error && <div className="alert-error">{error}</div>}

        {input("name", "Office name (English)", { maxLength: 150 })}
        {input("name_bn", "Office name (Bangla, optional)", { maxLength: 150 })}
        {input("type", "Office type (e.g. Passport Office)", { maxLength: 80 })}

        <div>
          <label className="label" htmlFor="division">Division</label>
          <select id="division" name="division" className="input" value={form.division} onChange={change}>
            <option value="">Select a division</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.division && <p className="field-error">{errors.division}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {input("district", "District", { maxLength: 50 })}
          {input("upazila", "Upazila (optional)", { maxLength: 50 })}
        </div>
        {input("address", "Address (optional)", { maxLength: 255 })}
        {input("contact_info", "Contact info (optional)", { maxLength: 150 })}

        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active (visible to the public)
        </label>

        <div className="flex gap-3">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save office"}
          </button>
          <Link to={id ? `/admin/offices/${id}` : "/admin"} className="btn btn-light">Cancel</Link>
        </div>
      </form>
    </div>
  );
}