import { useState } from 'react'
import ScheduleOutput from './ScheduleOutput'
import { fmtTime } from '../engine'

export default function LibraryTab({ library, setLibrary, preferences, schoolInfo, onLoadIntoBuilder }) {
  const [viewing, setViewing] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  // Detail view
  if (viewing) {
    const s = library.find(x => x.id === viewing)
    if (!s) { setViewing(null); return null }
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setViewing(null)}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <path d="M8 2L4 6l4 4"/>
            </svg>
            Back to Library
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => { onLoadIntoBuilder(s) }}
              title="Open this schedule in the Builder to edit and regenerate"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 13, height: 13 }}>
                <rect x="1" y="1" width="12" height="12" rx="2"/>
                <path d="M4.5 7h5M7 4.5v5"/>
              </svg>
              Edit in Builder
            </button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Saved {s.savedAt}</span>
        </div>

        {/* Notes in detail view */}
        {s.notes?.trim() && (
          <div className="notes-display" style={{ marginBottom: 16 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13, flexShrink: 0 }}>
              <rect x="2" y="1" width="10" height="12" rx="1.5"/>
              <path d="M4 5h6M4 7h6M4 9h4"/>
            </svg>
            <span>{s.notes}</span>
          </div>
        )}

        <ScheduleOutput params={s.params} result={s.result} preferences={preferences} schoolInfo={schoolInfo} />
      </div>
    )
  }

  // Grid view
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Schedule Library</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {library.length} saved schedule{library.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {library.length === 0 ? (
        <div className="panel">
          <div className="library-empty">
            <div className="output-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 9h6M9 12h4M9 15h5"/>
              </svg>
            </div>
            <div className="output-empty-title">No saved schedules</div>
            <div className="output-empty-sub">Generate a schedule in the Builder tab and click Save to Library</div>
          </div>
        </div>
      ) : (
        <div className="library-grid">
          {library.map(s => (
            <div
              key={s.id}
              className="schedule-card"
              onClick={() => setViewing(s.id)}
            >
              {/* Color accent bar */}
              <div style={{ height: 4, background: s.params?.color || 'var(--accent)', borderRadius: '12px 12px 0 0' }} />

              <div className="card-top">
                {editingId === s.id ? (
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: 13 }}
                      autoFocus
                    />
                    <button
                      className="btn-primary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => { setLibrary(lib => lib.map(x => x.id === s.id ? { ...x, name: editName } : x)); setEditingId(null) }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="card-name">{s.name}</div>
                )}
                <div className="card-meta">Saved {s.savedAt}</div>
                {s.notes?.trim() && (
                  <div className="card-notes">{s.notes}</div>
                )}
              </div>

              <div className="card-body">
                <span className="card-tag">{s.result.rows.filter(r => r.type === 'period').length} periods</span>
                <span className="card-tag">{fmtTime(s.params.startTime)} – {fmtTime(s.params.endTime)}</span>
                {s.result.globalCount > 0 && <span className="card-tag accent">{s.result.globalCount} global</span>}
                {s.localConstraints?.length > 0 && (
                  <span className="card-tag">{s.localConstraints.length} constraint{s.localConstraints.length > 1 ? 's' : ''}</span>
                )}
              </div>

              <div className="card-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="icon-btn"
                  title="Edit in Builder"
                  onClick={() => onLoadIntoBuilder(s)}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="1" y="1" width="12" height="12" rx="2"/>
                    <path d="M4.5 7h5M7 4.5v5"/>
                  </svg>
                </button>
                <button
                  className="icon-btn"
                  title="Rename"
                  onClick={() => { setEditingId(s.id); setEditName(s.name) }}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 2l2 2-7 7H3v-2L10 2z"/>
                  </svg>
                </button>
                <button
                  className="icon-btn"
                  title="Duplicate"
                  onClick={() => setLibrary(lib => [...lib, { ...s, id: Date.now().toString(), name: `${s.name} (copy)`, savedAt: new Date().toLocaleString() }])}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="1" y="4" width="9" height="9" rx="1.5"/>
                    <path d="M4 4V2.5A1.5 1.5 0 015.5 1H11.5A1.5 1.5 0 0113 2.5v6A1.5 1.5 0 0111.5 10H10"/>
                  </svg>
                </button>
                <button
                  className="icon-btn danger"
                  title="Delete"
                  onClick={() => setLibrary(lib => lib.filter(x => x.id !== s.id))}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
