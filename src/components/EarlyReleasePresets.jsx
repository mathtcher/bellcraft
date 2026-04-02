// EarlyReleasePresets.jsx
// Quick presets for shortened day schedules

import { timeToMin, minToTime } from '../engine'

const PRESETS = [
  { label: 'Early Release −30 min', offset: -30 },
  { label: 'Early Release −60 min', offset: -60 },
  { label: 'Early Release −90 min', offset: -90 },
  { label: '2-hour delay',           offset: 120, applyToStart: true },
]

export default function EarlyReleasePresets({ params, onChange }) {
  function applyPreset(preset) {
    if (preset.applyToStart) {
      // Late start: push start time forward
      const newStart = timeToMin(params.startTime) + preset.offset
      onChange({ ...params, startTime: minToTime(newStart) })
    } else {
      // Early release: pull end time earlier
      const newEnd = timeToMin(params.endTime) + preset.offset
      onChange({ ...params, endTime: minToTime(newEnd) })
    }
  }

  function resetTimes() {
    onChange({ ...params, startTime: params._originalStart || params.startTime, endTime: params._originalEnd || params.endTime })
  }

  return (
    <div className="early-release-presets">
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
        Quickly adjust start or end time for special days. Regenerate after applying.
      </div>
      <div className="preset-grid">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className="preset-btn"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>
          Or set a custom end time:
        </div>
        <div className="field-row" style={{ gap: 8 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Start</label>
            <input
              type="time"
              value={params.startTime}
              onChange={e => onChange({ ...params, startTime: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>End</label>
            <input
              type="time"
              value={params.endTime}
              onChange={e => onChange({ ...params, endTime: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
