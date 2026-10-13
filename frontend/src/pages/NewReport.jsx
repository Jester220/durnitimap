import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function NewReport() {
  const [params] = useSearchParams();
  const [offices, setOffices] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    office_id: "",
    service_id: "",
    amount_paid: "",
    waiting_days: "",
    visit_count: "1",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function loadServices(officeId) {
    if (!officeId) {
      setServices([]);
      return;
    }
    try {
      const d = await apiFetch(`/offices/${officeId}`);
      setServices(d.services);
    } catch {
      setServices([]);
    }
  }

 
  useEffect(() => {
    async function start() {
      try {
        const d = await apiFetch("/offices?limit=30");
        setOffices(d.offices);
        const officeId = params.get("office");
        if (officeId) {
          setForm((f) => ({ ...f, office_id: officeId, service_id: params.get("service") || "" }));
          await loadServices(officeId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    start();
  
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function chooseOffice(e) {
    const officeId = e.target.value;
    setForm({ ...form, office_id: officeId, service_id: "" });
    loadServices(officeId);
  }

  function validate() {
    const e = {};
    if (!form.office_id) e.office_id = "Select an office";
    if (!form.service_id) e.service_id = "Select a service";
    const paid = Number(form.amount_paid);
    if (form.amount_paid === "" || !Number.isFinite(paid) || paid < 0)
      e.amount_paid = "Enter the amount you paid in BDT (0 or more)";
    const wait = Number(form.waiting_days);
    if (form.waiting_days === "" || !Number.isInteger(wait) || wait < 0 || wait > 3650)
      e.waiting_days = "Enter waiting time in whole days (0 to 3650)";
    const visits = Number(form.visit_count);
    if (!Number.isInteger(visits) || visits < 1 || visits > 100)
      e.visit_count = "Enter how many visits it took (1 to 100)";
    const len = form.description.trim().length;
    if (len < 20 || len > 2000) e.description = "Description must be 20 to 2000 characters";
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
      await apiFetch("/reports", { method: "POST", body: form });
      setDone(true);
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-center py-10">Loading...</p>;

  if (done) {
    return (
      <div className="max-w-xl mx-auto card text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-forest">Report submitted</h1>
        <p>Thank you. Your report is pending review and will be shown publicly only after it is approved. Your identity is never shown.</p>
        <div className="flex justify-center gap-3">
          <Link to="/my-reports" className="btn btn-primary">View my reports</Link>
          <Link to="/offices" className="btn btn-light">Browse offices</Link>
        </div>
      </div>
    );
  }

  const input = (name, label, type = "number", extra = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" value={form[name]} onChange={change} {...extra} />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4">
        <h1 className="font-display text-2xl font-bold text-forest">Share your experience</h1>
        <p className="text-sm bg-amber-50 border border-ochre rounded-md p-3">
          Describe only what happened to you. Do not write the names of individual people, phone numbers or
          accusations you cannot prove. Reports are reviewed before they appear.
        </p>
        {error && <div className="alert-error">{error}</div>}

        <div>
          <label className="label" htmlFor="office_id">Office</label>
          <select id="office_id" name="office_id" className="input" value={form.office_id} onChange={chooseOffice}>
            <option value="">Select an office</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          {errors.office_id && <p className="field-error">{errors.office_id}</p>}
        </div>

        <div>
          <label className="label" htmlFor="service_id">Service</label>
          <select
            id="service_id"
            name="service_id"
            className="input"
            value={form.service_id}
            onChange={change}
            disabled={!form.office_id}
          >
            <option value="">{form.office_id ? "Select a service" : "Select an office first"}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.service_id && <p className="field-error">{errors.service_id}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {input("amount_paid", "Amount you paid (BDT)", "number", { min: 0, step: "any" })}
          {input("waiting_days", "Waiting time (days)", "number", { min: 0 })}
          {input("visit_count", "Number of visits", "number", { min: 1 })}
        </div>

        <div>
          <label className="label" htmlFor="description">What happened?</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={2000}
            className="input"
            value={form.description}
            onChange={change}
          />
          <p className="text-xs text-stone-600">{form.description.length}/2000</p>
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Submitting..." : "Submit anonymously"}
        </button>
      </form>
    </div>
  );
}