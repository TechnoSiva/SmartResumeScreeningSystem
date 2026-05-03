import './Badge.css';

const VARIANTS = {
  'Strong Fit': 'success',
  'Good Fit': 'info',
  'Moderate Fit': 'warning',
  'Weak Fit': 'danger',
};

export default function Badge({ label, variant, size = 'md' }) {
  const v = variant || VARIANTS[label] || 'default';
  return (
    <span className={`badge badge--${v} badge--${size}`}>
      {label}
    </span>
  );
}
