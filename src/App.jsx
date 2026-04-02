import { useState, useEffect } from 'react'
import BuilderTab from './components/BuilderTab'
import LibraryTab from './components/LibraryTab'
import SettingsTab from './components/SettingsTab'
import {
  loadLibrary, saveLibrary,
  loadGlobalConstraints, saveGlobalConstraints,
  loadSchoolInfo, saveSchoolInfo,
  loadPreferences, savePreferences,
} from './storage'

const NAV_TABS = [
  {
    id: 'builder', label: 'Builder',
    icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="12" height="12" rx="2"/><path d="M4.5 7h5M7 4.5v5"/></svg>,
  },
  {
    id: 'library', label: 'Library',
    icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M4 3V2M7 3V1M10 3V2"/></svg>,
  },
  {
    id: 'settings', label: 'Settings',
    icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="7" cy="7" r="2"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.4 1.4M9.6 9.6L11 11M11 3l-1.4 1.4M4.4 9.6L3 11"/></svg>,
  },
]

export default function App() {
  const [tab, setTab] = useState('builder')
  const [library, setLibrary] = useState(() => loadLibrary())
  const [globalConstraints, setGlobalConstraints] = useState(() => loadGlobalConstraints())
  const [schoolInfo, setSchoolInfo] = useState(() => loadSchoolInfo())
  const [preferences, setPreferences] = useState(() => loadPreferences())

  // When a saved schedule is loaded into the builder, this holds it
  const [loadedSchedule, setLoadedSchedule] = useState(null)

  useEffect(() => { saveLibrary(library) }, [library])
  useEffect(() => { saveGlobalConstraints(globalConstraints) }, [globalConstraints])
  useEffect(() => { saveSchoolInfo(schoolInfo) }, [schoolInfo])
  useEffect(() => { savePreferences(preferences) }, [preferences])

  function handleSave(params, localConstraints, result) {
    const entry = {
      id: Date.now().toString(),
      name: params.name,
      params: { ...params },
      localConstraints: [...localConstraints],
      result,
      notes: params.notes || '',
      savedAt: new Date().toLocaleString(),
    }
    setLibrary(lib => {
      const existing = lib.findIndex(x => x.name === params.name)
      if (existing >= 0) {
        const updated = [...lib]
        updated[existing] = entry
        return updated
      }
      return [...lib, entry]
    })
    setTab('library')
  }

  // Load a saved schedule into the Builder for editing
  function handleLoadIntoBuilder(savedEntry) {
    setLoadedSchedule(savedEntry)
    setTab('builder')
  }

  return (
    <div className="app">
      <div id="print-area" className="print-only" />

      <header className="header no-print">
        <div className="logo">
          <svg viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" rx="3" fill="white" fillOpacity="0.2"/>
            <path d="M5 9h8M5 6h5M5 12h6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="app-title">BellCraft</div>
          <div className="app-sub">
            {schoolInfo.schoolName ? schoolInfo.schoolName : 'Bell schedule builder for schools'}
          </div>
        </div>
      </header>

      <nav className="nav no-print">
        {NAV_TABS.map(t => (
          <button
            key={t.id}
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
            {t.id === 'library' && library.length > 0 && (
              <span className="nav-badge">{library.length}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'builder' && (
        <BuilderTab
          globalConstraints={globalConstraints}
          preferences={preferences}
          schoolInfo={schoolInfo}
          onSave={handleSave}
          loadedSchedule={loadedSchedule}
          onLoadedScheduleConsumed={() => setLoadedSchedule(null)}
        />
      )}
      {tab === 'library' && (
        <LibraryTab
          library={library}
          setLibrary={setLibrary}
          preferences={preferences}
          schoolInfo={schoolInfo}
          onLoadIntoBuilder={handleLoadIntoBuilder}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab
          globalConstraints={globalConstraints}
          setGlobalConstraints={setGlobalConstraints}
          schoolInfo={schoolInfo}
          setSchoolInfo={setSchoolInfo}
          preferences={preferences}
          setPreferences={setPreferences}
        />
      )}
    </div>
  )
}
