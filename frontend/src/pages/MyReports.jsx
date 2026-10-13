import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";

const TABS = ["All", "Pending", "Approved", "Rejected", "Flagged"];

const STATUS_STYLE = {
  Pending: "bg-amber-50 text-amber-900 border-ochre",
  Approved: "bg-forest-soft text-forest border-forest",
  Rejected: "bg-red-50 text-signal border-signal",
  Flagged: "bg-orange-50 text-orange-800 border-orange-600",
};

const STATUS_HELP = {
  Pending: "Waiting for review. Not public yet.",
  Approved: "Reviewed and shown publicly without your identity.",
  Rejected: "Not published after review.",
  Flagged: "Marked for extra checking.",
};

const money = (n) => `৳ ${Number(n).toLocaleString("en-US")}`;
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function MyReports() {
  const [tab, setTab] = useState("All");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const path = tab === "All" ? "/reports/mine" : `/reports/mine?status=${tab}`;
    apiFetch(path)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  const countFor = (t) => (!data ? "" : t === "All" ? total : data.counts[t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-forest">My Reports</h1>
        <Link to="/report/new" className="btn btn-primary btn-sm">New report</Link>
      </div>

      <p className="text-sm text-stone-700">
        Only you can see this page. Public visitors never see who submitted a report.
      </p>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-light"}`}
          >
            {t} {data ? `(${countFor(t)})` : ""}
          </button>
        ))}
      </div>

      {loading && <p className="text-center py-10">Loading your reports...</p>}
      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && data && data.reports.length === 0 && (
        <div className="card text-center space-y-3">
          <p className="font-semibold">
            {tab === "All" ? "You have not submitted any reports yet." : `No ${tab} reports.`}
          </p>
          {tab === "All" && <Link to="/report/new" className="btn btn-primary">Share your experience</Link>}
        </div>
      )}

      {!loading && !error && data && data.reports.length > 0 && (
        <div className="space-y-4">
          {data.reports.map((r) => (
            <div key={r.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{r.service_name}</h2>
                  <Link to={`/offices/${r.office_id}`} className="text-sm underline">
                    {r.office_name}
                  </Link>
                </div>
                <span
                  className={`inline-block border rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLE[r.status]}`}
                >
                  {r.status}
                </span>
              </div>

              <p className="text-xs text-stone-600">{STATUS_HELP[r.status]}</p>

              <div className="grid gap-2 sm:grid-cols-3 text-sm">
                <p><span className="font-semibold">Paid:</span> {money(r.amount_paid)}</p>
                <p><span className="font-semibold">Waited:</span> {r.waiting_days} day(s)</p>
                <p><span className="font-semibold">Visits:</span> {r.visit_count}</p>
              </div>

              <p className="whitespace-pre-line">{r.description}</p>
              <p className="text-xs text-stone-600">Submitted on {formatDate(r.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}