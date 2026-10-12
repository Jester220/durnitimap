import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

const money = (n) => `৳ ${Number(n).toLocaleString("en-US")}`;

export default function OfficeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/offices/${id}`)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-center py-10">Loading office...</p>;
  if (error) {
    return (
      <div className="space-y-4">
        <div className="alert-error">{error}</div>
        <Link to="/offices" className="btn btn-light">Back to offices</Link>
      </div>
    );
  }

  const { office, services } = data;

  return (
    <div className="space-y-6">
      <Link to="/offices" className="text-sm underline font-semibold">← All offices</Link>

      <div className="card">
        <span className="badge-official">{office.type}</span>
        <h1 className="font-display text-3xl font-bold text-forest mt-3">{office.name}</h1>
        {office.name_bn && <p className="text-lg text-stone-700">{office.name_bn}</p>}
        <p className="mt-3">
          {[office.address, office.upazila, office.district, office.division].filter(Boolean).join(", ")}
        </p>
        {office.contact_info && <p className="text-sm mt-1">Contact: {office.contact_info}</p>}
      </div>

      <h2 className="font-display text-2xl font-bold text-forest">Services</h2>

      {services.length === 0 && (
        <div className="card text-center">No services have been added for this office yet.</div>
      )}

      {services.map((s) => (
        <div key={s.id} className="card space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold">{s.name}</h3>
              {s.name_bn && <p className="text-stone-700">{s.name_bn}</p>}
            </div>
            <Link to={`/report/new?office=${office.id}&service=${s.id}`} className="btn btn-primary btn-sm">
              Share your experience
            </Link>
          </div>

          {s.description && <p>{s.description}</p>}

          {s.official ? (
            <div className="bg-forest-soft border border-forest rounded-md p-4 space-y-2">
              <span className="badge-official">Official information</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <p><span className="font-semibold">Official fee:</span> {money(s.official.fee)}</p>
                <p>
                  <span className="font-semibold">Processing time:</span>{" "}
                  {s.official.processing_days ? `${s.official.processing_days} days` : "Not provided"}
                </p>
              </div>
              {s.official.required_documents.length > 0 && (
                <div>
                  <p className="font-semibold">Required documents:</p>
                  <ul className="list-disc ml-6">
                    {s.official.required_documents.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {s.official.source_note && (
                <p className="text-xs text-stone-600">Source: {s.official.source_note}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-600">Official fee and document information has not been added yet.</p>
          )}
        </div>
      ))}
    </div>
  );
}