// M2-FR2 (Saif): expenses, waiting times and repeated visits for a selected service.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { money } from "../format";
import { BarChart, LineChart } from "./Charts";

function Stat({ title, value, note }) {
  return (
    <div className="card !p-4">
      <p className="text-xs uppercase tracking-wide text-stone-600 font-semibold">{title}</p>
      <p className="font-display text-2xl font-bold text-forest mt-1">{value}</p>
      {note && <p className="text-xs text-stone-600 mt-1">{note}</p>}
    </div>
  );
}

const shortMonth = (m) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-GB", { month: "short" }) + " " + y.slice(2);
};

export default function AnalysisPage() {
  const [params, setParams] = useSearchParams();
  const service = params.get("service") || "";
  const months = params.get("months") || "12";
  const [services, setServices] = useState({ list: null, error: "" });
  const key = `${service}|${months}`;
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    apiFetch("/analysis/services")
      .then((d) => setServices({ list: d.services, error: "" }))
      .catch((err) => setServices({ list: [], error: err.message }));
  }, []);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    apiFetch(`/analysis/services/${service}?months=${months}`)
      .then((d) => !cancelled && setResult({ key, data: d, error: "" }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [service, months, key]);

  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next);
  }

  const loading = service && result.key !== key;
  const d = service && result.key === key ? result.data : null;
  const error = service && result.key === key ? result.error : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-forest">Service Analysis</h1>
        <p className="text-stone-700 mt-1">
          Reported expenses, waiting times and repeated visits for one service, from approved reports.
        </p>
      </div>

      <div className="card grid gap-3 sm:grid-cols-3">
        <select className="input sm:col-span-2" value={service} onChange={(e) => update("service", e.target.value)} aria-label="Service">
          <option value="">Select a service to analyze</option>
          {(services.list ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} - {s.office_name} ({s.approved_reports} reports)
            </option>
          ))}
        </select>
        <select className="input" value={months} onChange={(e) => update("months", e.target.value)} aria-label="Period">
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
          <option value="24">Last 24 months</option>
        </select>
      </div>

      {services.error && <div className="alert-error">{services.error}</div>}
      {!service && <div className="card text-center">Choose a service above to see its statistics and charts.</div>}
      {loading && <p className="text-center py-8">Analyzing...</p>}
      {error && <div className="alert-error">{error}</div>}

      {d && (
        <>
          <div className="card">
            <h2 className="font-display text-2xl font-bold">{d.service.name}</h2>
            <p className="text-stone-700">
              <Link to={`/offices/${d.office.id}`} className="underline">{d.office.name}</Link> · {d.office.district}, {d.office.division}
            </p>
            {d.official.fee !== null && (
              <p className="text-sm mt-2">
                <span className="badge-official">Official</span> fee <b>{money(d.official.fee)}</b>
                {d.official.processing_days !== null && <> · processing <b>{d.official.processing_days} days</b></>}
              </p>
            )}
          </div>

          {!d.has_enough_data ? (
            <div className="card text-center">
              <p className="font-semibold">Not enough approved reports yet.</p>
              <p className="text-sm text-stone-700">
                This service has {d.approved_reports} approved report(s). Statistics appear from {d.min_reports} reports.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Stat title="Approved reports" value={d.approved_reports} />
                <Stat title="Average paid" value={money(d.expenses.average)} note={`Median ${money(d.expenses.median)}`} />
                <Stat title="Average waiting" value={`${d.waiting.average} days`} note={`Median ${d.waiting.median} days`} />
                <Stat title="Repeat visits" value={`${d.visits.repeat_visit_percent}%`} note={`Average ${d.visits.average} visits`} />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="card space-y-2">
                  <h3 className="font-display text-lg font-bold">Amount paid (BDT)</h3>
                  <BarChart data={d.expenses.histogram.map((h) => ({ label: h.label, value: h.count }))} color="#c9a227" label="Amount paid distribution" />
                  <p className="text-xs text-stone-600">
                    Range {money(d.expenses.min)} - {money(d.expenses.max)} · middle half {money(d.expenses.p25)} - {money(d.expenses.p75)}
                  </p>
                </div>
                <div className="card space-y-2">
                  <h3 className="font-display text-lg font-bold">Waiting time (days)</h3>
                  <BarChart data={d.waiting.histogram.map((h) => ({ label: h.label, value: h.count }))} color="#0b3d2e" label="Waiting time distribution" />
                  <p className="text-xs text-stone-600">
                    Range {d.waiting.min} - {d.waiting.max} days · middle half {d.waiting.p25} - {d.waiting.p75} days
                  </p>
                </div>
                <div className="card space-y-2">
                  <h3 className="font-display text-lg font-bold">Number of visits</h3>
                  <BarChart data={d.visits.distribution.map((v) => ({ label: `${v.label} visit${v.label === "1" ? "" : "s"}`, value: v.count }))} color="#d62839" label="Visits distribution" />
                  <p className="text-xs text-stone-600">{d.visits.repeat_visit_percent}% of reports needed more than one visit.</p>
                </div>
                <div className="card space-y-2">
                  <h3 className="font-display text-lg font-bold">Reports per month</h3>
                  <BarChart data={d.monthly.map((m) => ({ label: shortMonth(m.month), value: m.count }))} color="#57534e" label="Reports per month" />
                </div>
              </div>

              <div className="card space-y-2">
                <h3 className="font-display text-lg font-bold">Trend: average amount paid by month (BDT)</h3>
                <LineChart points={d.monthly.map((m) => ({ label: shortMonth(m.month), value: m.avg_amount_paid }))} color="#c9a227" format={(v) => Math.round(v)} label="Average amount paid per month" />
              </div>
              <div className="card space-y-2">
                <h3 className="font-display text-lg font-bold">Trend: average waiting time by month (days)</h3>
                <LineChart points={d.monthly.map((m) => ({ label: shortMonth(m.month), value: m.avg_waiting_days }))} color="#0b3d2e" format={(v) => Math.round(v)} label="Average waiting per month" />
              </div>
              <p className="text-xs text-stone-600">Statistics use approved reports only. Reports are personal experiences, not verified facts.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
