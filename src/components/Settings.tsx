import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SettingsState } from '../appState';
import Stepper from './Stepper';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

interface SettingsProps {
  settings: SettingsState;
  onSave: (settings: SettingsState) => void;
}

export default function Settings({ settings, onSave }: SettingsProps) {
  const [draft, setDraft] = useState<SettingsState>(settings);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const set = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setDraft(d => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be under 2 MB.');
      return;
    }

    setLogoError(null);
    const reader = new FileReader();
    reader.onload = () => set('schoolLogo', reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings">
      <h2 className="page-title">Settings</h2>

      <div className="settings-form">
        <div className="builder-section">
          <label className="field-label" htmlFor="school-name">School Name</label>
          <input
            id="school-name"
            type="text"
            className="text-input"
            value={draft.schoolName}
            onChange={e => set('schoolName', e.target.value)}
          />
        </div>

        <div className="builder-section builder-row">
          <div>
            <label className="field-label" htmlFor="default-start">Default Start Time</label>
            <input
              id="default-start"
              type="time"
              className="text-input"
              value={draft.defaultStartTime}
              onChange={e => set('defaultStartTime', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="default-end">Default End Time</label>
            <input
              id="default-end"
              type="time"
              className="text-input"
              value={draft.defaultEndTime}
              onChange={e => set('defaultEndTime', e.target.value)}
            />
          </div>
        </div>

        <div className="builder-section">
          <Stepper
            label="Default Number of Periods"
            value={draft.defaultNumPeriods}
            onChange={v => set('defaultNumPeriods', v)}
            min={1}
            max={12}
          />
        </div>

        <div className="builder-section">
          <label className="field-label" htmlFor="school-logo">School Logo</label>
          <div className="logo-upload">
            {draft.schoolLogo && (
              <img src={draft.schoolLogo} alt="School logo preview" className="logo-preview" />
            )}
            <div className="logo-upload-controls">
              <input id="school-logo" type="file" accept="image/*" onChange={handleLogoChange} />
              {draft.schoolLogo && (
                <button type="button" className="btn btn-ghost logo-remove" onClick={() => set('schoolLogo', null)}>
                  Remove
                </button>
              )}
            </div>
          </div>
          {logoError && <div className="error-message">{logoError}</div>}
          <p className="field-hint">Appears on PDF exports. PNG or SVG on a transparent background works best.</p>
        </div>

        <div className="builder-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          {saved && <span className="settings-saved">Saved</span>}
        </div>
      </div>
    </div>
  );
}
