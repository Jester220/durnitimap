import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const text = q.trim();
    navigate(text ? `/offices?q=${encodeURIComponent(text)}` : "/offices");
  }

  return (
    <div className="space-y-10">
      <section className="bg-white border-2 border-ink rounded-md p-8 md:p-12 shadow-[6px_6px_0_0_var(--color-signal)]">
        <p className="text-signal font-semibold tracking-wide">জানুন, জানান</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mt-2 leading-tight">
          Know the real cost of public services in Bangladesh.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-700">
          See official fees and required documents, then compare them with what citizens
          experienced. Share your own experience without revealing who you are.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search an office or service, e.g. passport, land, Savar"
            maxLength={100}
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <span className="badge-official">Official</span>
          <h2 className="font-display text-xl font-bold mt-3">Official information</h2>
          <p className="mt-2 text-stone-700">
            Fees, required documents and processing times as published by the office.
          </p>
        </div>
        <div className="card">
          <span className="badge-reported">User reported</span>
          <h2 className="font-display text-xl font-bold mt-3">Community experiences</h2>
          <p className="mt-2 text-stone-700">
            Personal experiences from citizens. They are shown as reports, never as proven facts.
          </p>
        </div>
        <div className="card">
          <span className="badge-official">Private</span>
          <h2 className="font-display text-xl font-bold mt-3">Your identity stays hidden</h2>
          <p className="mt-2 text-stone-700">
            The public never sees who submitted a report. No names, emails or IP addresses are shown.
          </p>
        </div>
      </section>

      <div className="text-center">
        <Link to="/register" className="btn btn-primary">Create a free account</Link>
      </div>
    </div>
  );
}