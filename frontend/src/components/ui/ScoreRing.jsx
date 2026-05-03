import './ScoreRing.css';

export default function ScoreRing({ score, size = 72, strokeWidth = 6, label, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const autoColor = score >= 80 ? 'var(--success)' :
                    score >= 60 ? 'var(--info)' :
                    score >= 40 ? 'var(--warning)' : 'var(--danger)';

  const ringColor = color || autoColor;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="score-ring__svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring__progress"
          style={{ '--offset': offset, '--circumference': circumference }}
        />
      </svg>
      <div className="score-ring__label">
        <span className="score-ring__value" style={{ color: ringColor }}>{Math.round(score)}</span>
        {label && <span className="score-ring__text">{label}</span>}
      </div>
    </div>
  );
}
