import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function Offices() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ divisions: [], districts: [], types: [] });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState(params.get("q") || "");

  const query = params.toString();

  
  useEffect(() => {
    apiFetch("/offices/filters").then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/offices?${query}`)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  function updateParam(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    setParams(next);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParam("q", text.trim());
  }

  function clearAll() {
    setText("");
    setParams({});
  }

  const page = Number(params.get("page")) || 1;
  const select = (name, label, options) => (
    <select
      className="input"
      value={params.get(name) || ""}
      onChange={(e) => updateParam(name, e.target.value)}
      aria-label={label}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-forest">Public Offices</h1>

      <form onSubmit={handleSearch} className="card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search office, service or area"
            maxLength={100}
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {select("division", "All divisions", filters.divisions)}
          {select("district", "All districts", filters.districts)}
          {select("type", "All office types", filters.types)}
        </div>
        {query && (
          <button type="button" onClick={clearAll} className="text-sm underline text-signal font-semibold">
            Clear search and filters
          </button>
        )}
      </form>

      {loading && <p className="text-center py-10">Loading offices...</p>}
      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && data && data.offices.length === 0 && (
        <div className="card text-center">
          <p className="font-semibold">No offices found.</p>
          <p className="text-stone-700">Try a different word or clear the filters.</p>
        </div>
      )}

      {!loading && !error && data && data.offices.length > 0 && (
        <>
          <p className="text-sm text-stone-700">{data.total} office(s) found</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.offices.map((o) => (
              <Link key={o.id} to={`/offices/${o.id}`} className="card block hover:-translate-y-0.5 transition-transform">
                <span className="badge-official">{o.type}</span>
                <h2 className="font-display text-xl font-bold mt-3">{o.name}</h2>
                {o.name_bn && <p className="text-stone-700">{o.name_bn}</p>}
                <p className="text-sm mt-2">
                  {[o.upazila, o.district, o.division].filter(Boolean).join(", ")}
                </p>
                <p className="text-sm font-semibold text-forest mt-2">{o.service_count} service(s)</p>
              </Link>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => updateParam("page", String(page - 1))}>
                Previous
              </button>
              <span className="text-sm">Page {data.page} of {data.totalPages}</span>
              <button className="btn btn-light btn-sm" disabled={page >= data.totalPages} onClick={() => updateParam("page", String(page + 1))}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}