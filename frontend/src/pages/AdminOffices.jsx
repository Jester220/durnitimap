import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function AdminOffices() {
  const [offices, setOffices] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/admin/offices?q=${encodeURIComponent(search)}`)
      .then((d) => !cancelled && setOffices(d.offices))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, reload]);

  async function toggle(o) {
    const action = o.is_active ? "deactivate" : "restore";
    if (!window.confirm(`Do you want to ${action} "${o.name}"?`)) return;
    try {
      await apiFetch(`/admin/offices/${o.id}/active`, {
        method: "PATCH",
        body: { is_active: !o.is_active },
      });
      setReload((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-forest">Admin: Offices</h1>
        <Link to="/admin/offices/new" className="btn btn-primary btn-sm">Add office</Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(text.trim());
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by office name or district"
          maxLength={100}
        />
        <button className="btn btn-light" type="submit">Search</button>
      </form>

      {loading && <p className="text-center py-10">Loading offices...</p>}
      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && offices.length === 0 && (
        <div className="card text-center">No offices found.</div>
      )}

      {!loading && !error && offices.length > 0 && (
        <div className="space-y-4">
          {offices.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold">{o.name}</h2>
                  {o.is_active ? (
                    <span className="badge-official">Active</span>
                  ) : (
                    <span className="inline-block border border-signal text-signal bg-red-50 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-700">
                  {o.type} · {o.district}, {o.division} · {o.service_count} active service(s)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/offices/${o.id}`} className="btn btn-primary btn-sm">Manage services</Link>
                <Link to={`/admin/offices/${o.id}/edit`} className="btn btn-light btn-sm">Edit</Link>
                <button onClick={() => toggle(o)} className="btn btn-light btn-sm">
                  {o.is_active ? "Deactivate" : "Restore"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}