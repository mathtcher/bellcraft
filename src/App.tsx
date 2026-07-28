import { useEffect, useReducer, useState } from 'react';
import Builder from './components/Builder';
import ScheduleView from './components/ScheduleView';
import Library from './components/Library';
import Settings from './components/Settings';
import Help from './components/Help';
import {
  appReducer,
  initialAppState,
  loadSettings,
  saveSettings,
  saveLibrary,
} from './appState';
import type { SettingsState } from './appState';
import type { AppState } from './types';

const TABS: { key: AppState['activeTab']; label: string }[] = [
  { key: 'builder', label: 'Builder' },
  { key: 'library', label: 'Library' },
  { key: 'settings', label: 'Settings' },
  { key: 'help', label: 'Help' },
];

const SUPPORT_LINK = 'https://paypal.me/PAULRAE523/10';

export default function App() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [state, dispatch] = useReducer(appReducer, settings, initialAppState);

  useEffect(() => {
    saveLibrary(state.library);
  }, [state.library]);

  const handleSaveSettings = (next: SettingsState) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-name">BellCraft</span>
          <span className="app-school">{settings.schoolName}</span>
        </div>
        <nav className="app-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`app-tab${state.activeTab === tab.key ? ' app-tab-active' : ''}`}
              onClick={() => dispatch({ type: 'SET_TAB', tab: tab.key })}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <p className="app-support">
          If you found this useful, would you consider{' '}
          <a
            className="app-support-link"
            href={SUPPORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            🍺 buying me a beer?
          </a>
        </p>
      </header>

      <main className="app-main">
        {state.activeTab === 'builder' && (
          <div className="app-columns">
            <div className="app-column-left">
              <Builder params={state.params} hasSchedule={state.schedule !== null} dispatch={dispatch} />
            </div>
            <div className="app-column-right">
              <ScheduleView
                schedule={state.schedule}
                passingTime={state.params.passingTime}
                schoolName={settings.schoolName}
                schoolLogo={settings.schoolLogo}
                dispatch={dispatch}
              />
            </div>
          </div>
        )}

        {state.activeTab === 'library' && <Library library={state.library} dispatch={dispatch} />}

        {state.activeTab === 'settings' && <Settings settings={settings} onSave={handleSaveSettings} />}

        {state.activeTab === 'help' && <Help />}
      </main>
    </div>
  );
}
