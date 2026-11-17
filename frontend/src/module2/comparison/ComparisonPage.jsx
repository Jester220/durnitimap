// M2-FR1 (Nahid): list of services with official vs reported fee and processing time.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { money, signed } from "../format";

const VERDICT = {
  higher: "text-signal",
  lower: "text-forest",
  similar: "text-stone-700",
};

export default function ComparisonPage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ divisions: [], types: [] });
  const [text, setText] = useState(params.get("q") || "");
  const query = params.toString();
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    apiFetch("/offices/filters").then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/comparison/services?${query}`)
      .then((d) => !cancelled && setResult({ key: query, data: d, error: "" }))
      .catch((err) => !cancelled && setResult({ key: query, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const loading = result.key !== query;
  const { data, error } = result;
  const page = Number(params.get("page")) || 1;

  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    setParams(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-forest">Compare Official vs Reported</h1>
        <p className="text-stone-700 mt-1">
          Official fees and processing times next to the averages from approved user reports.
        </p>
      </div>

      <form
        className="card grid gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", text.trim());
        }}
      >
        <input className="input sm:col-span-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search service or office" maxLength={100} />
        <select className="input" value={params.get("division") || ""} onChange={(e) => update("division", e.target.value)} aria-label="Division">
          <option value="">All divisions</option>
          {filters.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input" value={params.get("type") || ""} onChange={(e) => update("type", e.target.value)} aria-label="Office type">
          <option value="">All office types</option>
          {filters.types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </form>

      {loading && <p className="text-center py-8">Loading comparison...</p>}
      {!loading && error && <div className="alert-error">{error}</div>}

      {!loading && data && data.items.length === 0 && (
        <div className="card text-center">No services found. Try a different search.</div>
      )}

      {!loading && data && data.items.length > 0 && (
        <>
          <div className="card !p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-soft text-left">
                <tr>
                  <th className="p-3">Service / Office</th>
                  <th className="p-3">Official fee</th>
                  <th className="p-3">Reported avg</th>
                  <th className="p-3">Official time</th>
                  <th className="p-3">Reported wait</th>
                  <th className="p-3">Reports</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={it.service.id} className="border-t border-stone-300 align-top">
                    <td className="p-3">
                      <p className="font-semibold">{it.service.name}</p>
                      <p className="text-xs text-stone-600">{it.office.name}</p>
                    </td>
                    <td className="p-3">{money(it.official.fee)}</td>
                    <td className="p-3">
                      {it.comparison ? (
                        <>
                          {money(it.reported.avg_amount_paid)}
                          {it.comparison.fee_difference_percent !== null && (
                            <span className={`block text-xs font-bold ${VERDICT[it.comparison.fee_verdict]}`}>
                              {signed(it.comparison.fee_difference_percent, "%")}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-stone-500">Not enough data</span>
                      )}
                    </td>
                    <td className="p-3">{it.official.processing_days !== null ? `${it.official.processing_days} days` : "-"}</td>
                    <td className="p-3">
                      {it.comparison ? (
                        <>
                          {it.reported.avg_waiting_days} days
                          {it.comparison.time_difference_percent !== null && (
                            <span className={`block text-xs font-bold ${VERDICT[it.comparison.time_verdict]}`}>
                              {signed(it.comparison.time_difference_percent, "%")}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-stone-500">Not enough data</span>
                      )}
                    </td>
                    <td className="p-3">{it.approved_reports}</td>
                    <td className="p-3">
                      <Link to={`/compare/${it.service.id}`} className="btn btn-light btn-sm">Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-600">
            Averages use approved reports only and appear from {data.items[0].min_reports} reports. Reports are personal
            experiences, not verified facts.
          </p>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => update("page", String(page - 1))}>Previous</button>
              <span className="text-sm">Page {data.page} of {data.totalPages}</span>
              <button className="btn btn-light btn-sm" disabled={page >= data.totalPages} onClick={() => update("page", String(page + 1))}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
