export default function ScoreGauge({ score = 0 }) {
  const r = 54;
  const cx = 70;
  const cy = 70;
  const clamped = Math.min(100, Math.max(0, score));
  const circumference = Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg width="140" height="80" viewBox="0 0 140 80">
      <defs>
        <linearGradient id="bb-score-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f2622b" />
          <stop offset="35%" stopColor="#f6c51d" />
          <stop offset="65%" stopColor="#7ac142" />
          <stop offset="100%" stopColor="#1ca7c4" />
        </linearGradient>
      </defs>
      <path d={arcPath} fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
      <path
        d={arcPath}
        fill="none"
        stroke="url(#bb-score-grad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}
