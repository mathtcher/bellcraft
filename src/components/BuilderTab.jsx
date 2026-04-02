import { useState, useEffect } from 'react'
import Stepper from './Stepper'
import ConstraintPill from './ConstraintPill'
import AddConstraintModal from './AddConstraintModal'
import PeriodNamesEditor from './PeriodNamesEditor'
import SpecialBlocksEditor from './SpecialBlocksEditor'
import SplitLunchEditor from './SplitLunchEditor'
import ColorPicker from './ColorPicker'
import EarlyReleasePresets from './EarlyReleasePresets'
import ScheduleOutput from './ScheduleOutput'
import { generateSchedule } from '../engine'

const DEFAULT_PARAMS = {
  name: 'Regular Day',
  startTime: '08:00',
  endTime: '15:00',
  periods: 7,
  passingTime: 5,
  lunchLength: 30,
  numLunches: 1,
  periodNames: [],
  specialBlocks: [],
  splitLunch: { enabled: false },
  color: '#2D5BE3',
  notes: '',
}

function SectionHeader({ title, open, onToggle, badge }) {
  return (
    <button className="section-toggle" onClick={onToggle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg
          viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ width: 10, height: 10, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M3 2l4 3-4 3"/>
        </svg>
        <label style={{ margin: 0, cursor: 'pointer' }}>{title}</label>
      </span>
      {badge && <span className="global-count-badge">{badge}</span>}
    </button>
  )
}

export default function BuilderTab({
  globalConstraints, preferences, schoolInfo,
  onSave, loadedSchedule, onLoadedScheduleConsumed,
}) {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS })
  const [localConstraints, setLocalConstraints] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loadBanner, setLoadBanner] = useState(null)

  // Section open/close
  const [showNames, setShowNames] = useState(false)
  const [showSpecialBlocks, setShowSpecialBlocks] = useState(false)
  const [showLunch, setShowLunch] = useState(true)
  const [showConstraintsSection, setShowConstraintsSection] = useState(true)
  const [showEarlyRelease, setShowEarlyRelease] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // Load a saved schedule into the builder when triggered from Library
  useEffect(() => {
    if (!loadedSchedule) return
    setParams({ ...DEFAULT_PARAMS, ...loadedSchedule.params, notes: loadedSchedule.notes || '' })
    setLocalConstraints(loadedSchedule.localConstraints || [])
    setResult(null)
    setError(null)
    setLoadBanner(loadedSchedule.name)
    onLoadedScheduleConsumed()
  }, [loadedSchedule])

  const set = k => v => setParams(p => ({ ...p, [k]: v }))

  function handlePeriodsChange(val) {
    setParams(p => ({
      ...p,
      periods: val,
      periodNames: Array.from({ length: val }, (_, i) => (p.periodNames || [])[i] || ''),
    }))
  }

  const activeGlobals = globalConstraints.filter(
    g => !localConstraints.find(c => c.periodIndex === g.periodIndex && c.type === g.type)
  )
  const allPills = [...activeGlobals, ...localConstraints].sort((a, b) => a.periodIndex - b.periodIndex)
  const customNameCount = (params.periodNames || []).filter(n => n && n.trim()).length
  const specialBlockCount = (params.specialBlocks || []).length
  const splitEnabled = params.splitLunch?.enabled

  function handleGenerate() {
    setError(null)
    const r = generateSchedule(params, globalConstraints, localConstraints)
    if (r.error) { setError(r.error); return }
    setResult(r)
  }

  function handleSave() {
    onSave(params, localConstraints, result)
  }

  function handleReset() {
    setParams({ ...DEFAULT_PARAMS })
    setLocalConstraints([])
    setResult(null)
    setError(null)
    setLoadBanner(null)
  }

  return (
    <div className="builder-layout">
      <div className="panel no-print">
        <div className="panel-header">
          <span className="panel-title">Schedule Parameters</span>
          <button
            className="btn-secondary"
            style={{ fontSize: 11, padding: '3px 10px' }}
            onClick={handleReset}
            title="Clear all and start fresh"
          >
            Reset
          </button>
        </div>

        {loadBanner && (
          <div className="load-banner">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13, flexShrink: 0 }}>
              <path d="M1 7l4 4L13 2"/>
            </svg>
            <span>Loaded: <strong>{loadBanner}</strong> — edit and regenerate to update</span>
            <button onClick={() => setLoadBanner(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14 }}>×</button>
          </div>
        )}

        <div className="panel-body">

          {/* Name */}
          <div className="field">
            <label>Schedule Name</label>
            <input
              type="text"
              value={params.name}
              onChange={e => setParams(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Regular Day"
            />
          </div>

          {/* Color */}
          <div className="field">
            <label>Schedule Color</label>
            <ColorPicker value={params.color} onChange={color => setParams(p => ({ ...p, color }))} />
          </div>

          <hr className="section-divider" />

          {/* Times */}
          <div className="field-row">
            <div className="field">
              <label>Start Time</label>
              <input type="time" value={params.startTime} onChange={e => set('startTime')(e.target.value)} />
            </div>
            <div className="field">
              <label>End Time</label>
              <input type="time" value={params.endTime} onChange={e => set('endTime')(e.target.value)} />
            </div>
          </div>

          {/* Early release presets */}
          <div style={{ marginBottom: 14 }}>
            <SectionHeader
              title="Early Release / Late Start"
              open={showEarlyRelease}
              onToggle={() => setShowEarlyRelease(v => !v)}
            />
            {showEarlyRelease && (
              <div style={{ marginTop: 10 }}>
                <EarlyReleasePresets params={params} onChange={setParams} />
              </div>
            )}
          </div>

          <Stepper label="Number of Periods" value={params.periods} onChange={handlePeriodsChange} min={1} max={12} />
          <Stepper label="Passing Time (min)" value={params.passingTime} onChange={set('passingTime')} min={0} max={15} />

          <hr className="section-divider" />

          {/* Lunch */}
          <div style={{ marginBottom: 14 }}>
            <SectionHeader
              title="Lunch"
              open={showLunch}
              onToggle={() => setShowLunch(v => !v)}
              badge={splitEnabled ? 'Split A/B' : null}
            />
            {showLunch && (
              <div style={{ marginTop: 10 }}>
                {!splitEnabled && (
                  <>
                    <Stepper label="Lunch Length (min)" value={params.lunchLength} onChange={set('lunchLength')} min={15} max={60} />
                    <Stepper label="Number of Lunches" value={params.numLunches} onChange={set('numLunches')} min={1} max={3} />
                    <hr className="section-divider" style={{ margin: '10px 0' }} />
                  </>
                )}
                <SplitLunchEditor
                  numPeriods={params.periods}
                  splitLunch={params.splitLunch}
                  lunchLength={params.lunchLength}
                  onChange={sl => setParams(p => ({ ...p, splitLunch: sl }))}
                />
              </div>
            )}
          </div>

          <hr className="section-divider" />

          {/* Special blocks */}
          <div style={{ marginBottom: 14 }}>
            <SectionHeader
              title="Special Blocks"
              open={showSpecialBlocks}
              onToggle={() => setShowSpecialBlocks(v => !v)}
              badge={specialBlockCount > 0 ? `${specialBlockCount} block${specialBlockCount > 1 ? 's' : ''}` : null}
            />
            {showSpecialBlocks && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
                  Insert named blocks like Break, Homeroom, or Bear Time anywhere in the schedule.
                </div>
                <SpecialBlocksEditor
                  numPeriods={params.periods}
                  specialBlocks={params.specialBlocks || []}
                  onChange={blocks => setParams(p => ({ ...p, specialBlocks: blocks }))}
                />
              </div>
            )}
          </div>

          <hr className="section-divider" />

          {/* Period names */}
          <div style={{ marginBottom: 14 }}>
            <SectionHeader
              title="Period Names"
              open={showNames}
              onToggle={() => setShowNames(v => !v)}
              badge={customNameCount > 0 ? `${customNameCount} custom` : null}
            />
            {showNames && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
                  Leave blank to use default names (Period 1, Period 2…)
                </div>
                <PeriodNamesEditor
                  numPeriods={params.periods}
                  periodNames={params.periodNames || []}
                  onChange={names => setParams(p => ({ ...p, periodNames: names }))}
                />
              </div>
            )}
          </div>

          <hr className="section-divider" />

          {/* Constraints */}
          <div style={{ marginBottom: 14 }}>
            <SectionHeader
              title="Constraints & Preferences"
              open={showConstraintsSection}
              onToggle={() => setShowConstraintsSection(v => !v)}
              badge={activeGlobals.length > 0 ? `${activeGlobals.length} global active` : null}
            />
            {showConstraintsSection && (
              <div style={{ marginTop: 10 }}>
                {activeGlobals.length > 0 && (
                  <div className="global-banner">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13, flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="5"/>
                      <path d="M7 2c-2.5 2.5-2.5 7 0 10M7 2c2.5 2.5 2.5 7 0 10M2 7h10"/>
                    </svg>
                    <span>{activeGlobals.length} global default{activeGlobals.length > 1 ? 's' : ''} applied</span>
                  </div>
                )}
                {allPills.length > 0 && (
                  <div className="constraint-list">
                    {allPills.map(c => (
                      <ConstraintPill
                        key={c.id}
                        c={c}
                        onRemove={id => setLocalConstraints(cs => cs.filter(x => x.id !== id))}
                      />
                    ))}
                  </div>
                )}
                <button className="add-constraint-btn" onClick={() => setShowModal(true)}>
                  + Add constraint or preference
                </button>
              </div>
            )}
          </div>

          <hr className="section-divider" />

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <SectionHeader
              title="Notes"
              open={showNotes}
              onToggle={() => setShowNotes(v => !v)}
              badge={params.notes?.trim() ? 'Has notes' : null}
            />
            {showNotes && (
              <div style={{ marginTop: 10 }}>
                <textarea
                  className="notes-textarea"
                  value={params.notes || ''}
                  onChange={e => setParams(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Used during state testing week. Modified P5 and P6."
                  rows={3}
                />
              </div>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="generate-btn" onClick={handleGenerate}>
            <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2">
              <rect x="1" y="1" width="12" height="12" rx="2"/>
              <path d="M4.5 7h5M7 4.5v5"/>
            </svg>
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Output */}
      <div>
        {!result ? (
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Generated Schedule</span></div>
            <div className="output-empty">
              <div className="output-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <path d="M8 12h8M8 8h5M8 16h6"/>
                </svg>
              </div>
              <div className="output-empty-title">No schedule yet</div>
              <div className="output-empty-sub">Fill in the parameters and click Generate Schedule</div>
            </div>
          </div>
        ) : (
          <ScheduleOutput
            params={params}
            result={result}
            onSave={handleSave}
            preferences={preferences}
            schoolInfo={schoolInfo}
          />
        )}
      </div>

      {showModal && (
        <AddConstraintModal
          numPeriods={params.periods}
          onAdd={c => setLocalConstraints(cs => [...cs, c])}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
