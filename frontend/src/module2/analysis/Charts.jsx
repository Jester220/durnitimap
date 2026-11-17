// Small dependency-free SVG charts for the analysis page (owner: Saif).
export function BarChart({ data, color = "#0b3d2e", height = 200, format = (v) => v, label = "Bar chart" }) {
  const W = Math.max(340, data.length * 70);
  const padT = 24;
  const padB = 34;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = W / data.length;
  const bw = Math.min(46, slot * 0.6);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={label}>
      {data.map((d, i) => {
        const x = slot * (i + 0.5);
        const h = (height - padB - padT) * (d.value / max);
        const y = height - padB - h;
        return (
          <g key={d.label}>
            <rect x={x - bw / 2} y={y} width={bw} height={h} fill={color} rx="2" />
            <text x={x} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1917">{format(d.value)}</text>
            <text x={x} y={height - 12} textAnchor="middle" fontSize="11" fill="#57534e">{d.label}</text>
          </g>
        );
      })}
      <line x1="0" x2={W} y1={height - padB} y2={height - padB} stroke="#1c1917" />
    </svg>
  );
}

export function LineChart({ points, color = "#d62839", height = 210, format = (v) => v, label = "Line chart" }) {
  const W = Math.max(420, points.length * 60);
  const padL = 12;
  const padR = 12;
  const padT = 26;
  const padB = 34;
  const values = points.map((p) => p.value).filter((v) => v !== null);
  const max = Math.max(1, ...values) * 1.15;
  const step = points.length > 1 ? (W - padL - padR) / (points.length - 1) : 0;
  const xy = (p, i) => [padL + i * step, height - padB - ((height - padT - padB) * (p.value ?? 0)) / max];

  // split into runs so months without data leave a gap instead of a false line
  const runs = [];
  let cur = [];
  points.forEach((p, i) => {
    if (p.value === null) {
      if (cur.length) runs.push(cur);
      cur = [];
    } else cur.push(xy(p, i));
  });
  if (cur.length) runs.push(cur);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={label}>
      <line x1={padL} x2={W - padR} y1={height - padB} y2={height - padB} stroke="#1c1917" />
      {runs.map((r, i) => (
        <polyline key={i} points={r.map((q) => q.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2.5" />
      ))}
      {points.map((p, i) => {
        const [x, y] = xy(p, i);
        return (
          <g key={p.label}>
            {p.value !== null && (
              <>
                <circle cx={x} cy={y} r="4" fill={color} />
                <text x={x} y={y - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1c1917">{format(p.value)}</text>
              </>
            )}
            <text x={x} y={height - 12} textAnchor="middle" fontSize="11" fill="#57534e">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
