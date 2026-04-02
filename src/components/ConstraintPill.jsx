export default function ConstraintPill({ c, onRemove }) {
  const lbl =
    c.type === 'relative'
      ? c.offset === 0
        ? `P${c.periodIndex + 1}: standard`
        : c.offset > 0
        ? `P${c.periodIndex + 1}: +${c.offset} min`
        : `P${c.periodIndex + 1}: ${c.offset} min`
      : `P${c.periodIndex + 1}: ${c.value} min exact`

  return (
    <div className={`constraint-pill${c.isGlobal ? ' global-pill' : ''}`}>
      <span className="pill-label">{lbl}</span>
      {c.isGlobal && <span className="pill-badge glob">Global</span>}
      <span className={`pill-badge ${c.isHard ? 'hard' : 'soft'}`}>
        {c.isHard ? 'Hard' : 'Soft'}
      </span>
      {!c.isGlobal && onRemove && (
        <button className="pill-remove" onClick={() => onRemove(c.id)}>×</button>
      )}
    </div>
  )
}
