import './SkillTag.css';

export default function SkillTag({ skill, variant = 'default', onRemove }) {
  return (
    <span className={`skill-tag skill-tag--${variant}`}>
      {skill}
      {onRemove && (
        <button className="skill-tag__remove" onClick={onRemove} aria-label={`Remove ${skill}`}>×</button>
      )}
    </span>
  );
}

export function SkillTagList({ skills = [], variant = 'default', max = 8 }) {
  const visible = skills.slice(0, max);
  const remaining = skills.length - max;
  return (
    <div className="skill-tag-list">
      {visible.map((s, i) => (
        <SkillTag key={i} skill={s} variant={variant} />
      ))}
      {remaining > 0 && (
        <span className="skill-tag skill-tag--more">+{remaining} more</span>
      )}
    </div>
  );
}
