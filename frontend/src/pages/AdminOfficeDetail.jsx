import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

const money = (n) => `৳ ${Number(n).toLocaleString("en-US")}`;

export default function AdminOfficeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/admin/offices/${id}`)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, reload]);

  async function toggleService(s) {
    const action = s.is_active ? "deactivate" : "restore";
    if (!window.confirm(`Do you want to ${action} "${s.name}"?`)) return;
    try {
      await apiFetch(`/admin/services/${s.id}/active`, {
        method: "PATCH",
        body: { is_active: !s.is_active },
      });
      setReload((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="alert-error">{error || "Office not found"}</div>
        <Link to="/admin" className="btn btn-light">Back to offices</Link>
      </div>
    );
  }

  const { office, services } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin" className="text-sm underline font-semibold">← All offices</Link>
      {error && <div className="alert-error">{error}</div>}

      <div className="card flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="badge-official">{office.type}</span>
          <h1 className="font-display text-3xl font-bold text-forest mt-3">{office.name}</h1>
          {office.name_bn && <p className="text-stone-700">{office.name_bn}</p>}
          <p className="mt-2 text-sm">
            {[office.address, office.upazila, office.district, office.division].filter(Boolean).join(", ")}
          </p>
          {!office.is_active && (
            <p className="mt-2 text-sm font-semibold text-signal">This office is inactive and hidden from the public.</p>
          )}
        </div>
        <Link to={`/admin/offices/${office.id}/edit`} className="btn btn-light btn-sm">Edit office</Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-forest">Services</h2>
        <Link to={`/admin/offices/${office.id}/services/new`} className="btn btn-primary btn-sm">Add service</Link>
      </div>

      {services.length === 0 && <div className="card text-center">No services yet. Add the first one.</div>}

      {services.map((s) => (
        <div key={s.id} className="card space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold">{s.name}</h3>
              {!s.is_active && (
                <span className="inline-block border border-signal text-signal bg-red-50 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/offices/${office.id}/services/${s.id}/edit`} className="btn btn-light btn-sm">Edit</Link>
              <button onClick={() => toggleService(s)} className="btn btn-light btn-sm">
                {s.is_active ? "Deactivate" : "Restore"}
              </button>
            </div>
          </div>
          <p className="text-sm">
            <span className="font-semibold">Official fee:</span>{" "}
            {s.official_fee === null ? "Not set" : money(s.official_fee)}
            {" · "}
            <span className="font-semibold">Processing:</span>{" "}
            {s.processing_days != null   ? `${s.processing_days} days`   : "Not set"}
          </p>
          {s.required_documents && (
            <p className="text-sm whitespace-pre-line">
              <span className="font-semibold">Documents:</span>
              {"\n"}
              {s.required_documents}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
