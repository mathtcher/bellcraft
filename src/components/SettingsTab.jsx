import { useState, useRef } from 'react'
import AddConstraintModal from './AddConstraintModal'

export default function SettingsTab({
  globalConstraints, setGlobalConstraints,
  schoolInfo, setSchoolInfo,
  preferences, setPreferences,
}) {
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef()

  function setPref(key) {
    return e => setPreferences(p => ({ ...p, [key]: e.target.checked }))
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setSchoolInfo(i => ({ ...i, logoDataUrl: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    setSchoolInfo(i => ({ ...i, logoDataUrl: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Configure global defaults and preferences that apply to all schedules
      </div>

      {/* School Branding */}
      <div className="settings-section">
        <div className="settings-section-title">School Branding</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
          Your school name, district, and logo will appear on all generated schedules and PDF exports.
        </div>

        <div className="field">
          <label>School Name</label>
          <input
            type="text"
            value={schoolInfo.schoolName}
            onChange={e => setSchoolInfo(i => ({ ...i, schoolName: e.target.value }))}
            placeholder="e.g. Lincoln High School"
          />
        </div>

        <div className="field">
          <label>District</label>
          <input
            type="text"
            value={schoolInfo.district}
            onChange={e => setSchoolInfo(i => ({ ...i, district: e.target.value }))}
            placeholder="e.g. Olympia School District"
          />
        </div>

        <div className="field">
          <label>School Logo</label>
          {schoolInfo.logoDataUrl ? (
            <div className="logo-preview-row">
              <img src={schoolInfo.logoDataUrl} alt="School logo" className="logo-preview" />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                  Logo uploaded successfully
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => fileInputRef.current?.click()}>
                    Replace
                  </button>
                  <button className="btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={removeLogo}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="logo-upload-area" onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28, color: 'var(--text3)' }}>
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>Click to upload logo</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>PNG, JPG, or SVG recommended</div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      {/* Global Constraints */}
      <div className="settings-section">
        <div className="settings-section-title">Global Default Constraints</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
          These constraints automatically apply to every new schedule. Each schedule can override them individually in the Builder.
        </div>

        {globalConstraints.length === 0 && (
          <div className="settings-empty">No global defaults set</div>
        )}

        {globalConstraints.map(c => {
          const lbl = c.type === 'relative'
            ? c.offset === 0 ? 'Standard length' : c.offset > 0 ? `+${c.offset} min from standard` : `${c.offset} min from standard`
            : `Exactly ${c.value} min`
          return (
            <div key={c.id} className="global-constraint-item">
              <div className="gci-info">
                <div className="gci-label">Period {c.periodIndex + 1}</div>
                <div className="gci-desc">
                  {lbl} ·{' '}
                  <span style={{ color: c.isHard ? 'var(--red)' : 'var(--amber)' }}>
                    {c.isHard ? 'Hard constraint' : 'Soft preference'}
                  </span>
                </div>
              </div>
              <span className={`pill-badge ${c.isHard ? 'hard' : 'soft'}`}>
                {c.isHard ? 'Hard' : 'Soft'}
              </span>
              <button
                className="icon-btn danger"
                onClick={() => setGlobalConstraints(gs => gs.filter(x => x.id !== c.id))}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4"/>
                </svg>
              </button>
            </div>
          )
        })}

        <button
          className="add-constraint-btn"
          style={{ marginTop: globalConstraints.length > 0 ? 8 : 0 }}
          onClick={() => setShowModal(true)}
        >
          + Add global default
        </button>
      </div>

      {/* Preferences */}
      <div className="settings-section">
        <div className="settings-section-title">Preferences</div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Show constraint indicators on schedules</div>
            <div className="settings-desc">Display icons on periods that have constraints applied</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={preferences.showConstraintIndicators} onChange={setPref('showConstraintIndicators')} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Hide constraints on exports</div>
            <div className="settings-desc">PDF and shared links show only the clean schedule</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={preferences.hideConstraintsOnExport} onChange={setPref('hideConstraintsOnExport')} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Use 12-hour time format</div>
            <div className="settings-desc">Display times as 8:00 AM instead of 08:00</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={preferences.use12HourFormat} onChange={setPref('use12HourFormat')} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {showModal && (
        <AddConstraintModal
          numPeriods={12}
          onAdd={c => setGlobalConstraints(gs => [...gs, { ...c, isGlobal: true }])}
          onClose={() => setShowModal(false)}
          isGlobal={true}
        />
      )}
    </div>
  )
}
