// PeriodNamesEditor.jsx — edit custom names for each period

const PRESETS = [
  'Advisory', 'Homeroom', 'Seminar', 'Study Hall',
  'Flex', 'PE', 'Lunch', 'Assembly', 'Passing',
]

export default function PeriodNamesEditor({ numPeriods, periodNames, onChange }) {
  function setName(i, val) {
    const updated = [...periodNames]
    updated[i] = val
    onChange(updated)
  }

  function handlePreset(i, val) {
    if (val === '__custom') return
    setName(i, val)
  }

  return (
    <div className="period-names-editor">
      {Array.from({ length: numPeriods }, (_, i) => {
        const name = periodNames[i] || ''
        const isPreset = PRESETS.includes(name)
        return (
          <div key={i} className="period-name-row">
            <span className="period-name-index">P{i + 1}</span>
            <input
              type="text"
              className="period-name-input"
              value={name}
              onChange={e => setName(i, e.target.value)}
              placeholder={`Period ${i + 1}`}
            />
            <select
              className="period-name-preset"
              value={isPreset ? name : '__custom'}
              onChange={e => handlePreset(i, e.target.value)}
            >
              <option value="__custom">— preset —</option>
              {PRESETS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {name && (
              <button
                className="period-name-clear"
                onClick={() => setName(i, '')}
                title="Reset to default"
              >×</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
