import { useState, useCallback } from 'react'
import { fmtTime } from '../engine'
import ExportPanel from './ExportPanel'
import BrandedHeader from './BrandedHeader'
import BlockLayout from './BlockLayout'

// ── Undo/redo hook ────────────────────────────────────────────
function useUndoRedo(initial) {
  const [history, setHistory] = useState([initial])
  const [index, setIndex] = useState(0)

  const current = history[index]

  const push = useCallback(newState => {
    setHistory(h => [...h.slice(0, index + 1), newState])
    setIndex(i => i + 1)
  }, [index])

  const undo = useCallback(() => {
    setIndex(i => Math.max(0, i - 1))
  }, [])

  const redo = useCallback(() => {
    setIndex(i => Math.min(history.length - 1, i + 1))
  }, [history.length])

  const canUndo = index > 0
  const canRedo = index < history.length - 1

  return { current, push, undo, redo, canUndo, canRedo }
}

// ── Edit row modal ────────────────────────────────────────────
function EditRowModal({ row, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState(row.label)
  const [duration, setDuration] = useState(row.duration)

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Edit Block</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Name</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Duration (minutes)</label>
            <div className="stepper">
              <button className="stepper-btn" onClick={() => setDuration(d => Math.max(1, d - 1))}>−</button>
              <div className="stepper-val">{duration}</div>
              <button className="stepper-btn" onClick={() => setDuration(d => d + 1)}>+</button>
            </div>
            <div className="field-hint">
              Duration edits here are display-only — regenerate to rebalance all periods.
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-danger" onClick={() => { onDelete(row.id); onClose() }}>
            Delete block
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { onSave(row.id, label, duration); onClose() }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function ScheduleOutput({ params, result: initialResult, onSave, preferences, schoolInfo }) {
  const { current: result, push, undo, redo, canUndo, canRedo } = useUndoRedo(initialResult)
  const [editingRow, setEditingRow] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'blocks'

  const showIndicators = preferences?.showConstraintIndicators ?? true
  const color = params.color || '#2D5BE3'

  function updateRows(newRows) {
    push({ ...result, rows: newRows })
  }

  function handleSaveRow(id, label, duration) {
    updateRows(result.rows.map(row => row.id === id ? { ...row, label, duration } : row))
  }

  function handleDeleteRow(id) {
    updateRows(result.rows.filter(row => row.id !== id))
  }

  return (
    <div className="panel">
      <div className="schedule-color-bar" style={{ background: color }} />

      <div className="panel-header">
        <span className="panel-title">Generated Schedule</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="1" width="12" height="12" rx="1.5"/>
                <path d="M1 5h12M5 5v7"/>
              </svg>
            </button>
            <button
              className={`view-toggle-btn${viewMode === 'blocks' ? ' active' : ''}`}
              onClick={() => setViewMode('blocks')}
              title="Block layout view"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="4" width="12" height="6" rx="1.5"/>
                <path d="M5 4v6M9 4v6"/>
              </svg>
            </button>
          </div>

          {/* Undo/redo */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="icon-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              style={{ opacity: canUndo ? 1 : 0.35 }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 6l3-3-3-3M2 6h6a4 4 0 010 8H5"/>
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              style={{ opacity: canRedo ? 1 : 0.35 }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 6l-3-3 3-3M12 6H6a4 4 0 000 8h3"/>
              </svg>
            </button>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {result.rows.filter(r => r.type === 'period').length} periods
          </span>

          {onSave && (
            <button className="btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={onSave}>
              Save to Library
            </button>
          )}
        </div>
      </div>

      <div className="panel-body">
        <BrandedHeader params={params} schoolInfo={schoolInfo} color={color} />

        {/* Notes display */}
        {params.notes?.trim() && (
          <div className="notes-display">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }}>
              <rect x="2" y="1" width="10" height="12" rx="1.5"/>
              <path d="M4 5h6M4 7h6M4 9h4"/>
            </svg>
            <span>{params.notes}</span>
          </div>
        )}

        {/* Warnings */}
        {result.warnings?.map((w, i) => (
          <div key={i} className="warning-banner">
            <svg viewBox="0 0 14 14" fill="none" stroke="#B85C00" strokeWidth="1.5">
              <path d="M7 1L13 12H1L7 1z"/>
              <path d="M7 6v3M7 10.5v.5"/>
            </svg>
            <span className="warning-text"><strong>Soft preference not honored: </strong>{w}</span>
          </div>
        ))}

        {/* Constraint summary */}
        {showIndicators && (result.globalCount > 0 || result.localCount > 0) && (
          <div className="constraint-summary">
            <svg viewBox="0 0 14 14" fill="none" stroke="#185FA5" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5"/>
              <path d="M5 7h4M7 5v4"/>
            </svg>
            <span>
              {result.globalCount > 0 && `${result.globalCount} global default${result.globalCount > 1 ? 's' : ''}`}
              {result.globalCount > 0 && result.localCount > 0 && ' · '}
              {result.localCount > 0 && `${result.localCount} schedule-specific constraint${result.localCount > 1 ? 's' : ''}`}
              {' '}applied
            </span>
          </div>
        )}

        {/* Block layout view */}
        {viewMode === 'blocks' && (
          <BlockLayout rows={result.rows} params={params} schoolInfo={schoolInfo} />
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
              Click any row to edit or delete it
            </div>
            <table className="period-table">
              <thead>
                <tr>
                  <th style={{ borderBottom: `2px solid ${color}` }}>Period</th>
                  <th style={{ borderBottom: `2px solid ${color}` }}>Time</th>
                  <th style={{ textAlign: 'right', borderBottom: `2px solid ${color}` }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map(row => {
                  const dot = { period: color, passing: 'var(--border2)', lunch: 'var(--green)', special: 'var(--amber)' }[row.type] || 'var(--border2)'
                  return (
                    <tr
                      key={row.id}
                      className={`period-row ${row.type} editable-row`}
                      onClick={() => setEditingRow(row)}
                      title="Click to edit"
                    >
                      <td>
                        <div className="period-name-cell">
                          <span className="period-dot" style={{ background: dot }} />
                          <span style={{ fontWeight: row.type === 'period' ? 500 : 400 }}>{row.label}</span>
                          {showIndicators && row.hasConstraint && (
                            <span className="c-icon">
                              <svg viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.5">
                                <circle cx="6" cy="6" r="4"/>
                                <path d="M6 4v2l1 1"/>
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="time-cell">{fmtTime(row.start)} – {fmtTime(row.end)}</td>
                      <td className="dur-cell">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <span className="dur-badge">{row.duration} min</span>
                          <svg viewBox="0 0 12 12" fill="none" stroke="var(--text3)" strokeWidth="1.5" style={{ width: 11, height: 11, opacity: 0.5 }}>
                            <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z"/>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      <ExportPanel params={params} result={result} schoolInfo={schoolInfo} />

      {editingRow && (
        <EditRowModal
          row={editingRow}
          onSave={handleSaveRow}
          onDelete={handleDeleteRow}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  )
}
