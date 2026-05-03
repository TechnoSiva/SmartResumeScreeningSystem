import './Skeleton.css';

export function Skeleton({ width, height = 20, radius = 'var(--radius-md)', style }) {
  return (
    <div
      className="skeleton"
      style={{ width: width || '100%', height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height={14} width="40%" />
      <Skeleton height={28} width="60%" style={{ marginTop: 8 }} />
      <Skeleton height={12} width="30%" style={{ marginTop: 8 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table">
      <Skeleton height={40} style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={48} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}
