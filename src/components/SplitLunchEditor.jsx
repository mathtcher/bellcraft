// SplitLunchEditor.jsx — configure split lunch (A/B wave) settings

export default function SplitLunchEditor({ numPeriods, splitLunch, lunchLength, onChange }) {
  const enabled = splitLunch?.enabled || false
  const lunchAfterPeriod = splitLunch?.lunchAfterPeriod ?? Math.floor(numPeriods / 2)
  const lunchDuration = splitLunch?.lunchDuration ?? lunchLength

  function update(patch) {
    onChange({ ...splitLunch, ...patch })
  }

  return (
    <div>
      <div className="toggle-row" style={{ marginBottom: enabled ? 12 : 0 }}>
        <div>
          <div className="toggle-label">Split lunch (A/B waves)</div>
          <div className="toggle-desc">
            Two groups take lunch at different times — one has class while the other eats
          </div>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => update({ enabled: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {enabled && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="split-lunch-info">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13, flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5"/><path d="M7 5v3M7 9.5v.5"/>
            </svg>
            <span>
              Generates overlapping Period {lunchAfterPeriod + 1}A / {lunchAfterPeriod + 1}B blocks —
              one group eats while the other has class, then they swap.
            </span>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Lunch after Period</label>
              <select
                value={lunchAfterPeriod}
                onChange={e => update({ lunchAfterPeriod: Number(e.target.value) })}
              >
                {Array.from({ length: numPeriods - 1 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Period {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Lunch duration (min)</label>
              <div className="stepper">
                <button className="stepper-btn" onClick={() => update({ lunchDuration: Math.max(15, lunchDuration - 5) })}>−</button>
                <div className="stepper-val">{lunchDuration}</div>
                <button className="stepper-btn" onClick={() => update({ lunchDuration: Math.min(60, lunchDuration + 5) })}>+</button>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
            <strong>How it works:</strong> Period {lunchAfterPeriod + 1}B eats lunch first while Period {lunchAfterPeriod + 1}A has class. Then they swap — Period {lunchAfterPeriod + 1}A eats while Period {lunchAfterPeriod + 1}B finishes class.
          </div>
        </div>
      )}
    </div>
  )
}
