const LEVELS = {
  high: { text: "High", cls: "bg-forest-soft text-forest border-forest" },
  moderate: { text: "Moderate", cls: "bg-amber-50 text-amber-900 border-ochre" },
  low: { text: "Low", cls: "bg-red-50 text-signal border-signal" },
  not_enough_data: { text: "Not enough data", cls: "bg-stone-100 text-stone-600 border-stone-400" },
};

export default function IndicatorBadge({ score, level }) {
  const l = LEVELS[level] || LEVELS.not_enough_data;
  return (
    <span className={`inline-block border rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${l.cls}`}>
      {score === null || score === undefined ? l.text : `${l.text} · ${score}/100`}
    </span>
  );
}
