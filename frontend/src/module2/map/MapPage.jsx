// M2-FR3 (Mahi): interactive Leaflet + OpenStreetMap map of offices with aggregated APPROVED report data.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { apiFetch } from "../../api/client";

const BD_CENTER = [23.685, 90.356];

const STATUS = {
  none: { color: "#9ca3af", label: "No approved reports yet" },
  few: { color: "#c9a227", label: "Too few approved reports for statistics" },
  data: { color: "#57534e", label: "Reports available (no official fee to compare)" },
  ok: { color: "#0b3d2e", label: "Reported cost near or below the official fee" },
  above: { color: "#d62839", label: "Reported cost more than 10% above the official fee" },
};

function statusOf(o) {
  if (o.approved_reports === 0) return "none";
  if (!o.has_enough_data) return "few";
  const p = o.stats?.paid_vs_official_percent;
  if (p === null || p === undefined) return "data";
  return p > 10 ? "above" : "ok";
}

function makeIcon(status, count, active) {
  const ring = active ? "0 0 0 4px rgba(201,162,39,.65)," : "";
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${STATUS[status].color};border:3px solid #fff;box-shadow:${ring}0 1px 5px rgba(0,0,0,.45);color:#fff;font:700 13px/28px 'Hind Siliguri',sans-serif;text-align:center;">${count > 0 ? count : ""}</div>`,
  });
}

const money = (n) => `৳ ${Number(n).toLocaleString("en-US")}`;

function FitToOffices({ offices }) {
  const map = useMap();
  useEffect(() => {
    if (offices.length === 0) {
      map.setView(BD_CENTER, 7);
      return;
    }
    const bounds = L.latLngBounds(offices.map((o) => [o.latitude, o.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [offices, map]);
  return null;
}

function FlyToSelected({ office }) {
  const map = useMap();
  useEffect(() => {
    if (office) map.flyTo([office.latitude, office.longitude], Math.max(map.getZoom(), 13), { duration: 0.8 });
  }, [office, map]);
  return null;
}

function OfficePopup({ o, minReports }) {
  const s = o.stats;
  return (
    <div className="space-y-1.5 text-sm" style={{ minWidth: 230 }}>
      <div className="font-display text-base font-bold text-forest leading-tight">{o.name}</div>
      {o.name_bn && <div>{o.name_bn}</div>}
      <div className="text-stone-600">
        {o.type} · {[o.upazila, o.district, o.division].filter(Boolean).join(", ")}
      </div>
      <div className="pt-1">
        <span className="badge-reported">User reported</span>{" "}
        <span>
          Approved reports: <b>{o.approved_reports}</b>
        </span>
      </div>
      {s ? (
        <ul className="space-y-0.5">
          <li>Average paid: <b>{money(s.avg_amount_paid)}</b></li>
          {s.avg_official_fee !== null && (
            <li>
              Official fee (reported services): <b>{money(s.avg_official_fee)}</b>
              {s.paid_vs_official_percent !== null && (
                <span className={s.paid_vs_official_percent > 10 ? "font-bold text-signal" : "font-bold text-forest"}>
                  {" "}({s.paid_vs_official_percent > 0 ? "+" : ""}{s.paid_vs_official_percent}%)
                </span>
              )}
            </li>
          )}
          <li>Average waiting: <b>{s.avg_waiting_days} days</b></li>
          <li>Average visits: <b>{s.avg_visit_count}</b></li>
        </ul>
      ) : (
        <p className="text-stone-600">
          {o.approved_reports === 0
            ? "No approved reports yet."
            : `Statistics are shown from ${minReports} approved reports (this office has ${o.approved_reports}).`}
        </p>
      )}
      {o.indicator && (
        <p>
          Transparency indicator:{" "}
          <b>{o.indicator.score === null ? "not enough data" : `${o.indicator.score}/100 (${o.indicator.level})`}</b>
        </p>
      )}
      <p className="text-xs text-stone-500">Reports are personal experiences, not verified facts.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link to={`/offices/${o.id}`} className="btn btn-primary btn-sm">Official information</Link>
        <Link to={`/report/new?office=${o.id}`} className="btn btn-light btn-sm">Share experience</Link>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [filters, setFilters] = useState({ divisions: [], types: [] });
  const [division, setDivision] = useState("");
  const [type, setType] = useState("");
  const key = `${division}|${type}`;
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const [selection, setSelection] = useState({ key: null, id: null });
  const markerRefs = useRef({});

  useEffect(() => {
    apiFetch("/offices/filters").then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams();
    if (division) qs.set("division", division);
    if (type) qs.set("type", type);
    apiFetch(`/map/offices?${qs.toString()}`)
      .then((d) => !cancelled && setResult({ key, data: d, error: "" }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [division, type, key]);

  const loading = result.key !== key;
  const data = result.data;
  const error = loading ? "" : result.error;
  const selectedId = selection.key === key ? selection.id : null;

  const offices = useMemo(() => data?.offices ?? [], [data]);
  const selected = offices.find((o) => o.id === selectedId) || null;

  function select(id) {
    setSelection({ key, id });
    setTimeout(() => markerRefs.current[id]?.openPopup(), 50);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold text-forest">Office Map</h1>
        <p className="text-stone-700 mt-1">
          Public offices across Bangladesh with a summary of approved user reports. Click a marker for details.
        </p>
      </div>

      <div className="card grid gap-3 sm:grid-cols-3">
        <select className="input" value={division} onChange={(e) => setDivision(e.target.value)} aria-label="Division">
          <option value="">All divisions</option>
          {filters.divisions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Office type">
          <option value="">All office types</option>
          {filters.types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          className="btn btn-light"
          onClick={() => {
            setDivision("");
            setType("");
          }}
          disabled={!division && !type}
        >
          Clear filters
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {data && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge-official">{data.summary.offices_on_map} office(s) on the map</span>
          <span className="badge-reported">{data.summary.approved_reports} approved report(s)</span>
          {data.summary.offices_without_location > 0 && (
            <span className="inline-block border border-stone-400 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-stone-600">
              {data.summary.offices_without_location} office(s) without a location
            </span>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="relative border-2 border-ink rounded-md overflow-hidden shadow-[4px_4px_0_0_var(--color-forest)]" style={{ height: 560 }}>
            <MapContainer center={BD_CENTER} zoom={7} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <FitToOffices offices={offices} />
              <FlyToSelected office={selected} />
              {offices.map((o) => (
                <Marker
                  key={o.id}
                  position={[o.latitude, o.longitude]}
                  icon={makeIcon(statusOf(o), o.approved_reports, o.id === selectedId)}
                  ref={(m) => {
                    if (m) markerRefs.current[o.id] = m;
                  }}
                  eventHandlers={{ click: () => setSelection({ key, id: o.id }) }}
                >
                  <Popup>
                    <OfficePopup o={o} minReports={data.summary.min_reports_for_stats} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {loading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-paper/70 font-semibold">
                Loading map...
              </div>
            )}
          </div>

          <div className="card !p-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {Object.entries(STATUS).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full border border-white shadow" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
            <span className="text-stone-500">Number in a marker = approved reports.</span>
          </div>
        </div>

        <div className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto pr-1">
          {!loading && !error && offices.length === 0 && (
            <div className="card text-center">
              <p className="font-semibold">No offices to show.</p>
              <p className="text-stone-700 text-sm">Try another division or office type.</p>
            </div>
          )}
          {offices.map((o) => (
            <button
              key={o.id}
              onClick={() => select(o.id)}
              className={`card block w-full text-left cursor-pointer ${o.id === selectedId ? "!border-signal" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold leading-tight">{o.name}</p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {o.type} · {o.district}, {o.division}
                  </p>
                </div>
                <span
                  className="shrink-0 inline-block w-3.5 h-3.5 rounded-full mt-1"
                  style={{ background: STATUS[statusOf(o)].color }}
                  title={STATUS[statusOf(o)].label}
                />
              </div>
              <p className="text-xs mt-2 text-stone-700">
                {o.approved_reports} approved report(s)
                {o.stats && ` · avg paid ${money(o.stats.avg_amount_paid)}`}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
