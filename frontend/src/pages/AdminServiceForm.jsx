import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

const EMPTY = {
  name: "",
  name_bn: "",
  description: "",
  official_fee: "",
  processing_days: "",
  required_documents: "",
  source_note: "",
  is_active: true,
};

export default function AdminServiceForm() {
  const { officeId, serviceId } = useParams(); 
  const navigate = useNavigate();
  const [officeName, setOfficeName] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch(`/admin/offices/${officeId}`)
      .then((d) => {
        setOfficeName(d.office.name);
        if (serviceId) {
          const s = d.services.find((x) => String(x.id) === serviceId);
          if (!s) {
            setError("Service not found");
            return;
          }
          setForm({
            name: s.name ?? "",
            name_bn: s.name_bn ?? "",
            description: s.description ?? "",
            official_fee: s.official_fee ?? "",
            processing_days: s.processing_days ?? "",
            required_documents: s.required_documents ?? "",
            source_note: s.source_note ?? "",
            is_active: !!s.is_active,
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [officeId, serviceId]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Service name must be at least 2 characters";
    const fee = Number(form.official_fee);
    if (form.official_fee === "" || !Number.isFinite(fee) || fee < 0)
      e.official_fee = "Enter the official fee in BDT (0 or more)";
    if (form.processing_days !== "") {
      const d = Number(form.processing_days);
      if (!Number.isInteger(d) || d < 0 || d > 3650) e.processing_days = "Enter whole days (0 to 3650)";
    }
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
      if (serviceId) {
        await apiFetch(`/admin/services/${serviceId}`, { method: "PUT", body: form });
      } else {
        await apiFetch(`/admin/offices/${officeId}/services`, { method: "POST", body: form });
      }
      navigate(`/admin/offices/${officeId}`);
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

  const textarea = (name, label, hint) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={4} maxLength={2000} className="input" value={form[name]} onChange={change} />
      {hint && <p className="text-xs text-stone-600">{hint}</p>}
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            {serviceId ? "Edit service" : "Add service"}
          </h1>
          <p className="text-sm text-stone-700">Office: {officeName}</p>
        </div>
        {error && <div className="alert-error">{error}</div>}

        {input("name", "Service name (English)", { maxLength: 150 })}
        {input("name_bn", "Service name (Bangla, optional)", { maxLength: 150 })}
        {textarea("description", "Description (optional)")}

        <div className="bg-forest-soft border border-forest rounded-md p-4 space-y-4">
          <span className="badge-official">Official information</span>
          <div className="grid gap-4 sm:grid-cols-2">
            {input("official_fee", "Official fee (BDT)", { type: "number", min: 0, step: "any" })}
            {input("processing_days", "Processing time (days)", { type: "number", min: 0 })}
          </div>
          {textarea("required_documents", "Required documents", "Write one document per line.")}
          {input("source_note", "Source of this information (optional)", { maxLength: 255 })}
        </div>

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
            {busy ? "Saving..." : "Save service"}
          </button>
          <Link to={`/admin/offices/${officeId}`} className="btn btn-light">Cancel</Link>
        </div>
      </form>
    </div>
  );
}