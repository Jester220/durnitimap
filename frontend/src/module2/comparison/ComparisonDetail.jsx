// M2-FR1 (Nahid): detailed comparison for one service.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { money, signed } from "../format";

const VERDICT_TEXT = {
  higher: ["Reported is higher than official", "text-signal"],
  lower: ["Reported is lower than official", "text-forest"],
  similar: ["Reported is close to official", "text-stone-700"],
};

function BarPair({ title, official, reported, format, verdict, difference }) {
  const max = Math.max(official, reported, 1);
  const bar = (value, color, label) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <b>{format(value)}</b>
      </div>
      <div className="h-5 bg-stone-200 rounded">
        <div className="h-5 rounded" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
  return (
    <div className="card space-y-3">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {bar(official, "#0b3d2e", "Official")}
      {bar(reported, "#c9a227", "Reported (average)")}
      {verdict && (
        <p className={`font-semibold ${VERDICT_TEXT[verdict][1]}`}>
          {VERDICT_TEXT[verdict][0]} ({difference})
        </p>
      )}
    </div>
  );
}

export default function ComparisonDetail() {
  const { serviceId } = useParams();
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/comparison/services/${serviceId}`)
      .then((d) => !cancelled && setResult({ key: serviceId, data: d, error: "" }))
      .catch((err) => !cancelled && setResult({ key: serviceId, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  if (result.key !== serviceId) return <p className="text-center py-10">Loading...</p>;
  if (result.error) {
    return (
      <div className="space-y-4">
        <div className="alert-error">{result.error}</div>
        <Link to="/compare" className="btn btn-light">Back to comparison</Link>
      </div>
    );
  }
  const d = result.data;
  const c = d.comparison;

  return (
    <div className="space-y-6">
      <Link to="/compare" className="text-sm underline font-semibold">← All services</Link>
      <div className="card">
        <span className="badge-official">Official information</span>
        <h1 className="font-display text-3xl font-bold text-forest mt-3">{d.service.name}</h1>
        <p className="text-stone-700">
          <Link to={`/offices/${d.office.id}`} className="underline">{d.office.name}</Link> · {d.office.district}, {d.office.division}
        </p>
        <p className="mt-3">
          Official fee: <b>{money(d.official.fee)}</b>
          {d.official.processing_days !== null && <> · Official processing time: <b>{d.official.processing_days} days</b></>}
        </p>
        {d.official.source_note && <p className="text-xs text-stone-600 mt-1">Source: {d.official.source_note}</p>}
      </div>

      {!d.has_enough_data ? (
        <div className="card text-center">
          <p className="font-semibold">Not enough approved reports yet.</p>
          <p className="text-sm text-stone-700">
            This service has {d.approved_reports} approved report(s). The comparison appears from {d.min_reports} reports.
          </p>
          <Link to={`/report/new?office=${d.office.id}&service=${d.service.id}`} className="btn btn-primary mt-4">Share your experience</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <BarPair
              title="Fee"
              official={d.official.fee}
              reported={d.reported.avg_amount_paid}
              format={money}
              verdict={c.fee_verdict}
              difference={`${signed(c.fee_difference)} BDT${c.fee_difference_percent !== null ? `, ${signed(c.fee_difference_percent, "%")}` : ""}`}
            />
            {d.official.processing_days !== null && (
              <BarPair
                title="Processing / waiting time"
                official={d.official.processing_days}
                reported={d.reported.avg_waiting_days}
                format={(v) => `${v} days`}
                verdict={c.time_verdict}
                difference={`${signed(c.time_difference_days)} days${c.time_difference_percent !== null ? `, ${signed(c.time_difference_percent, "%")}` : ""}`}
              />
            )}
          </div>
          <div className="card grid gap-3 sm:grid-cols-2 text-sm">
            <p>Based on <b>{d.approved_reports}</b> approved reports.</p>
            <p>Amount paid range: <b>{money(d.details.min_amount_paid)} - {money(d.details.max_amount_paid)}</b></p>
            <p>Waiting range: <b>{d.details.min_waiting_days} - {d.details.max_waiting_days} days</b></p>
            <p>Reports at or under the official fee: <b>{d.details.percent_at_or_under_official_fee}%</b></p>
            {d.details.percent_within_official_time !== null && (
              <p>Reports within the official time: <b>{d.details.percent_within_official_time}%</b></p>
            )}
          </div>
          <p className="text-xs text-stone-600">Reported values are personal experiences from approved reports, not verified facts.</p>
        </>
      )}
    </div>
  );
}
