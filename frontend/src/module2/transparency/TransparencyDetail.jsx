// M2-FR4 (Nahid): breakdown of one office's indicator.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import IndicatorBadge from "./IndicatorBadge";
import { TREND } from "./trend";

function Part({ label, value, note }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <b>{value === null || value === undefined ? "n/a" : `${value}/100`}</b>
      </div>
      <div className="h-3 bg-stone-200 rounded">
        <div className="h-3 rounded bg-forest" style={{ width: `${value ?? 0}%` }} />
      </div>
      <p className="text-xs text-stone-600">{note}</p>
    </div>
  );
}

export default function TransparencyDetail() {
  const { officeId } = useParams();
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/transparency/offices/${officeId}`)
      .then((d) => !cancelled && setResult({ key: officeId, data: d, error: "" }))
      .catch((err) => !cancelled && setResult({ key: officeId, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [officeId]);

  if (result.key !== officeId) return <p className="text-center py-10">Loading...</p>;
  if (result.error) {
    return (
      <div className="space-y-4">
        <div className="alert-error">{result.error}</div>
        <Link to="/transparency" className="btn btn-light">Back</Link>
      </div>
    );
  }
  const x = result.data.indicator;

  return (
    <div className="space-y-6">
      <Link to="/transparency" className="text-sm underline font-semibold">← All offices</Link>
      <div className="card space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-forest">{x.office.name}</h1>
            <p className="text-stone-700">{x.office.type} · {x.office.district}, {x.office.division}</p>
          </div>
          <IndicatorBadge score={x.score} level={x.level} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span>Approved reports: <b>{x.approved_reports}</b></span>
          <span>Last 90 days: <b>{x.reports_last_90_days}</b></span>
          <span>Confidence: <b>{x.confidence}</b></span>
          <span className={TREND[x.trend][1]}>Trend: <b>{TREND[x.trend][0]}</b></span>
          {x.verification_rate !== null && <span>Approved among reviewed: <b>{x.verification_rate}%</b></span>}
        </div>
        <Link to={`/offices/${x.office.id}`} className="underline text-sm font-semibold">View official information</Link>
      </div>

      {x.score === null ? (
        <div className="card text-center">
          <p className="font-semibold">Not enough approved reports yet.</p>
          <p className="text-sm text-stone-700">A score appears from {x.min_reports} approved reports.</p>
        </div>
      ) : (
        <div className="card space-y-5">
          <h2 className="font-display text-xl font-bold">Score breakdown</h2>
          <Part label="Fee alignment" value={x.components.fee} note="100 means people paid no more than the official fee." />
          <Part label="Time alignment" value={x.components.time} note="100 means waiting was not longer than the official processing time." />
          <Part label="Visits" value={x.components.visits} note="100 means one visit; 5 or more visits gives 0." />
          <Part label="Verification (approved among reviewed)" value={x.verification_rate === null ? null : Math.round(x.verification_rate)} note="Share of reviewed reports that were approved." />
        </div>
      )}
      <p className="text-xs text-stone-600">The indicator is calculated from approved user reports. It is not a legal finding.</p>
    </div>
  );
}
