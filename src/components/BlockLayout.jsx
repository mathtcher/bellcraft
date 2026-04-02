// BlockLayout.jsx — visual block representation of the schedule

import { fmtTime, timeToMin } from '../engine'

const TYPE_COLORS = {
  period:  { bg: null, text: 'white' },   // uses schedule color
  passing: { bg: '#E2E0D8', text: '#6B6860' },
  lunch:   { bg: '#E8F5EE', text: '#2A7D4F' },
  special: { bg: '#FDF3E7', text: '#B85C00' },
}

export default function BlockLayout({ rows, params, schoolInfo, forPrint = false }) {
  const color = params.color || '#2D5BE3'
  const totalMin = timeToMin(params.endTime) - timeToMin(params.startTime)

  // Filter out pure passing rows for the visual — they show as thin dividers
  const displayRows = rows

  return (
    <div className={`block-layout${forPrint ? ' for-print' : ''}`}>
      {schoolInfo?.schoolName && (
        <div className="block-layout-header">
          {schoolInfo.logoDataUrl && (
            <img src={schoolInfo.logoDataUrl} alt="Logo" className="block-logo" />
          )}
          <div>
            <div className="block-school-name" style={{ color }}>{schoolInfo.schoolName}</div>
            {schoolInfo.district && <div className="block-district">{schoolInfo.district}</div>}
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="block-schedule-name" style={{ color }}>{params.name}</div>
            <div className="block-schedule-time">{fmtTime(params.startTime)} – {fmtTime(params.endTime)}</div>
          </div>
        </div>
      )}

      <div className="block-track">
        {displayRows.map(row => {
          const pct = (row.duration / totalMin) * 100
          const isPassing = row.type === 'passing'
          const colors = TYPE_COLORS[row.type] || TYPE_COLORS.special
          const bg = row.type === 'period' ? color : colors.bg
          const textColor = row.type === 'period' ? 'white' : colors.text

          return (
            <div
              key={row.id}
              className={`block-segment${isPassing ? ' block-passing' : ''}`}
              style={{
                width: `${pct}%`,
                background: bg,
                color: textColor,
                minWidth: isPassing ? 4 : 24,
              }}
              title={`${row.label}: ${fmtTime(row.start)} – ${fmtTime(row.end)} (${row.duration} min)`}
            >
              {!isPassing && (
                <div className="block-segment-inner">
                  <div className="block-label">{row.label}</div>
                  {row.duration >= 20 && (
                    <div className="block-time">{fmtTime(row.start)}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Time markers */}
      <div className="block-times">
        <span>{fmtTime(params.startTime)}</span>
        <span>{fmtTime(params.endTime)}</span>
      </div>

      {/* Legend */}
      <div className="block-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: color }} />
          <span>Instruction</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#2A7D4F' }} />
          <span>Lunch</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#B85C00' }} />
          <span>Special block</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#CCC' }} />
          <span>Passing</span>
        </div>
      </div>
    </div>
  )
}
