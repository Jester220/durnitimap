// M2-FR4 (Nahid): Transparency Indicator for every office.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client";
import IndicatorBadge from "./IndicatorBadge";
import { TREND } from "./trend";

const COLORS = { high: "#0b3d2e", moderate: "#c9a227", low: "#d62839", not_enough_data: "#9ca3af" };

export default function TransparencyPage() {
  const [filters, setFilters] = useState({ divisions: [], types: [] });
  const [division, setDivision] = useState("");
  const [type, setType] = useState("");
  const key = `${division}|${type}`;
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    apiFetch("/offices/filters").then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams();
    if (division) qs.set("division", division);
    if (type) qs.set("type", type);
    apiFetch(`/transparency/offices?${qs.toString()}`)
      .then((d) => !cancelled && setResult({ key, data: d, error: "" }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [division, type, key]);

  const loading = result.key !== key;
  const { data, error } = result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-forest">Transparency Indicator</h1>
        <p className="text-stone-700 mt-1">
          A 0-100 score showing how closely approved user reports match each office's official fees and times.
        </p>
      </div>

      <div className="card grid gap-3 sm:grid-cols-2">
        <select className="input" value={division} onChange={(e) => setDivision(e.target.value)} aria-label="Division">
          <option value="">All divisions</option>
          {filters.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Office type">
          <option value="">All office types</option>
          {filters.types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading && <p className="text-center py-8">Calculating...</p>}
      {!loading && error && <div className="alert-error">{error}</div>}
      {!loading && data && data.offices.length === 0 && <div className="card text-center">No offices found.</div>}

      {!loading && data && data.offices.length > 0 && (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {data.offices.map((x) => (
              <Link key={x.office.id} to={`/transparency/${x.office.id}`} className="card block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-bold leading-tight">{x.office.name}</h2>
                    <p className="text-xs text-stone-600">{x.office.type} · {x.office.district}, {x.office.division}</p>
                  </div>
                  <IndicatorBadge score={x.score} level={x.level} />
                </div>
                <div className="h-3 bg-stone-200 rounded mt-4">
                  <div className="h-3 rounded" style={{ width: `${x.score ?? 0}%`, background: COLORS[x.level] }} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3 text-stone-700">
                  <span>{x.approved_reports} approved report(s)</span>
                  <span>{x.reports_last_90_days} in last 90 days</span>
                  <span className={TREND[x.trend][1]}>Trend: {TREND[x.trend][0]}</span>
                </div>
              </Link>
            ))}
          </div>

          <details className="card">
            <summary className="font-semibold cursor-pointer">How is the indicator calculated?</summary>
            <div className="text-sm space-y-2 mt-3">
              <p>
                <b>Alignment (80%)</b>: fee score {data.formula.alignment_weights.fee * 100}%, time score{" "}
                {data.formula.alignment_weights.time * 100}% and visits score {data.formula.alignment_weights.visits * 100}%.
                Paying or waiting more than the official figure lowers the score; one visit is best.
              </p>
              <p><b>Verification (20%)</b>: share of reviewed reports that were approved.</p>
              <p>
                <b>Recent trend (±{data.formula.trend_adjustment})</b>: average overpayment in the last {data.formula.trend_window_days} days
                compared with the {data.formula.trend_window_days} days before.
              </p>
              <p><b>Report frequency</b> sets the confidence: High needs 10+ approved reports and 3+ in the last 90 days.</p>
              <p>An office needs at least {data.offices[0].min_reports} approved reports to get a score. High is {data.formula.levels.high}+, Moderate is {data.formula.levels.moderate}+.</p>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
