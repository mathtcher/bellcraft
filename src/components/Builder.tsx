import { useMemo } from 'react';
import type { Dispatch } from 'react';
import type { PeriodAdjustment, ScheduleParams, SpecialBlock } from '../types';
import type { Action } from '../appState';
import { generateSchedule } from '../utils/scheduleEngine';
import Stepper from './Stepper';

const PRESET_COLORS = [
  '#1e3a5f', // navy
  '#2563eb', // blue
  '#0d9488', // teal
  '#16a34a', // green
  '#ca8a04', // amber
  '#ea580c', // orange
  '#dc2626', // red
  '#9333ea', // purple
];

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

interface BuilderProps {
  params: ScheduleParams;
  hasSchedule: boolean;
  dispatch: Dispatch<Action>;
}

export default function Builder({ params, hasSchedule, dispatch }: BuilderProps) {
  const set = <K extends keyof ScheduleParams>(key: K, value: ScheduleParams[K]) =>
    dispatch({ type: 'SET_PARAM', key, value });

  const preview = useMemo(() => generateSchedule(params), [params]);
  const fitError = preview === null;

  const handleGenerate = () => {
    if (!preview) return;
    dispatch({ type: 'SET_SCHEDULE', schedule: preview });
  };

  const handleSave = () => {
    dispatch({ type: 'SAVE_TO_LIBRARY' });
  };

  const updateAdjustments = (next: PeriodAdjustment[]) => set('periodAdjustments', next);
  const addAdjustment = () => {
    const excluded = params.hasSplitLunch ? params.splitLunchPeriod : -1;
    const defaultPeriod = 1 === excluded ? Math.min(2, params.numPeriods) : 1;
    updateAdjustments([...params.periodAdjustments, { id: uid(), period: defaultPeriod, offsetMinutes: 5 }]);
  };
  const updateAdjustment = (id: string, patch: Partial<PeriodAdjustment>) =>
    updateAdjustments(params.periodAdjustments.map(a => (a.id === id ? { ...a, ...patch } : a)));
  const removeAdjustment = (id: string) =>
    updateAdjustments(params.periodAdjustments.filter(a => a.id !== id));

  const updateSpecialBlocks = (next: SpecialBlock[]) => set('specialBlocks', next);
  const addSpecialBlock = () =>
    updateSpecialBlocks([
      ...params.specialBlocks,
      { id: uid(), name: 'Assembly', afterPeriod: Math.max(1, params.numPeriods - 1), length: 30 },
    ]);
  const updateSpecialBlock = (id: string, patch: Partial<SpecialBlock>) =>
    updateSpecialBlocks(params.specialBlocks.map(sb => (sb.id === id ? { ...sb, ...patch } : sb)));
  const removeSpecialBlock = (id: string) =>
    updateSpecialBlocks(params.specialBlocks.filter(sb => sb.id !== id));

  return (
    <div className="builder">
      <div className="builder-section">
        <label className="field-label" htmlFor="schedule-name">Schedule Name</label>
        <input
          id="schedule-name"
          type="text"
          className="text-input"
          placeholder="e.g. Regular Day"
          value={params.name}
          onChange={e => set('name', e.target.value)}
        />
      </div>

      <div className="builder-section builder-row">
        <div>
          <label className="field-label" htmlFor="start-time">Start Time</label>
          <input
            id="start-time"
            type="time"
            className="text-input"
            value={params.startTime}
            onChange={e => set('startTime', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="end-time">End Time</label>
          <input
            id="end-time"
            type="time"
            className="text-input"
            value={params.endTime}
            onChange={e => set('endTime', e.target.value)}
          />
        </div>
      </div>

      <div className="builder-section">
        <Stepper
          label="Number of Periods"
          value={params.numPeriods}
          onChange={v => set('numPeriods', v)}
          min={1}
          max={12}
        />
        <Stepper
          label="Passing Time"
          value={params.passingTime}
          onChange={v => set('passingTime', v)}
          min={0}
          max={20}
          suffix=" min"
        />
      </div>

      <div className="builder-section">
        <h3 className="section-title">Lunch</h3>
        <Stepper
          label="Lunch Length"
          value={params.lunchLength}
          onChange={v => set('lunchLength', v)}
          min={0}
          max={90}
          step={5}
          suffix=" min"
        />
        <label className="checkbox-row checkbox-row-spaced">
          <input
            type="checkbox"
            checked={params.hasSplitLunch}
            onChange={e => {
              const checked = e.target.checked;
              set('hasSplitLunch', checked);
              if (checked && params.numLunches < 2) set('numLunches', 2);
            }}
          />
          <span>Split lunch within a period</span>
        </label>

        {params.hasSplitLunch ? (
          <>
            <Stepper
              label="Split Lunch During Period"
              value={params.splitLunchPeriod}
              onChange={v => set('splitLunchPeriod', v)}
              min={1}
              max={Math.max(1, params.numPeriods)}
            />
            <Stepper
              label="Number of Lunch Waves"
              value={params.numLunches}
              onChange={v => set('numLunches', v)}
              min={2}
              max={4}
            />
            {params.numLunches === 2 ? (
              <p className="field-hint">
                Period {params.splitLunchPeriod} keeps its full length for everyone. One group eats first then takes Period {params.splitLunchPeriod}B; the other takes Period {params.splitLunchPeriod}A first, then eats.
              </p>
            ) : (
              <p className="field-hint">
                Period {params.splitLunchPeriod} keeps its full length for everyone. The first and last groups each eat once, before or after one uninterrupted class block; groups in between split their class time evenly around their own lunch. Because those middle groups need an extra passing period, the first and last groups' class block runs a few minutes longer than a normal period so everyone still starts the next period together.
              </p>
            )}
            <label className="checkbox-row checkbox-row-spaced">
              <input
                type="checkbox"
                checked={params.splitLunchSymmetric}
                onChange={e => set('splitLunchSymmetric', e.target.checked)}
              />
              <span>Add passing time on both sides of the swap</span>
            </label>
            <p className="field-hint">
              Off: lunch starts the moment the prior period ends. On: a passing period also runs before the swap, not just between lunch and class.
              {params.numLunches > 2 && ' With 3+ waves, the middle groups always get passing time on both sides regardless of this setting.'}
            </p>
          </>
        ) : (
          <>
            <Stepper
              label="Number of Lunches"
              value={params.numLunches}
              onChange={v => set('numLunches', v)}
              min={0}
              max={4}
            />
            {params.numLunches === 0 ? (
              <p className="field-hint">
                No lunch will be scheduled — periods run back-to-back. Useful for delay days where lunch is skipped.
              </p>
            ) : (
              <Stepper
                label="Lunch After Period"
                value={params.lunchAfterPeriod}
                onChange={v => set('lunchAfterPeriod', v)}
                min={1}
                max={Math.max(1, params.numPeriods)}
              />
            )}
          </>
        )}
      </div>

      <div className="builder-section">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={params.hasBreak}
            onChange={e => set('hasBreak', e.target.checked)}
          />
          <span>Add a break</span>
        </label>

        {params.hasBreak && (
          <div className="builder-subsection">
            <Stepper
              label="Break Before Period"
              value={params.breakBeforePeriod}
              onChange={v => set('breakBeforePeriod', v)}
              min={1}
              max={Math.max(1, params.numPeriods)}
            />
            <p className="field-hint">
              Placed after any special blocks scheduled at the same spot (e.g. homeroom), so the break can land right before class resumes.
            </p>
            <Stepper
              label="Break Length"
              value={params.breakLength}
              onChange={v => set('breakLength', v)}
              min={1}
              max={60}
              suffix=" min"
            />
            <div>
              <label className="field-label" htmlFor="break-name">Break Name</label>
              <input
                id="break-name"
                type="text"
                className="text-input"
                value={params.breakName}
                onChange={e => set('breakName', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="builder-section">
        <h3 className="section-title">Special Blocks</h3>
        <p className="field-hint">Add one-off blocks like homeroom or an assembly.</p>
        {params.specialBlocks.map(sb => (
          <SpecialBlockRow
            key={sb.id}
            block={sb}
            numPeriods={params.numPeriods}
            onChange={patch => updateSpecialBlock(sb.id, patch)}
            onRemove={() => removeSpecialBlock(sb.id)}
          />
        ))}
        <button type="button" className="btn btn-secondary btn-small" onClick={addSpecialBlock}>
          + Add Special Block
        </button>
      </div>

      <div className="builder-section">
        <h3 className="section-title">Preferences</h3>
        <p className="field-hint">Make a period run longer or shorter than the rest when it fits (e.g. +5 min on Period 1 for announcements).</p>
        {params.periodAdjustments.map(adj => (
          <AdjustmentRow
            key={adj.id}
            adjustment={adj}
            numPeriods={params.numPeriods}
            excludePeriod={params.hasSplitLunch ? params.splitLunchPeriod : undefined}
            onChange={patch => updateAdjustment(adj.id, patch)}
            onRemove={() => removeAdjustment(adj.id)}
          />
        ))}
        <button type="button" className="btn btn-secondary btn-small" onClick={addAdjustment}>
          + Add Preference
        </button>
      </div>

      <div className="builder-section">
        <h3 className="section-title">Color</h3>
        <div className="color-picker">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`color-swatch${params.color === c ? ' color-swatch-active' : ''}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              onClick={() => set('color', c)}
            />
          ))}
          <input
            type="color"
            className="color-swatch-custom"
            value={params.color}
            onChange={e => set('color', e.target.value)}
            aria-label="Custom color"
          />
        </div>
      </div>

      {fitError && (
        <div className="error-message">
          This schedule doesn't fit in the available time. Reduce periods, passing time, or lunch/break/special block length — or extend the day.
        </div>
      )}

      <div className="builder-actions">
        <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={fitError}>
          Generate Schedule
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleSave} disabled={!hasSchedule}>
          Save to Library
        </button>
      </div>
    </div>
  );
}

interface AdjustmentRowProps {
  adjustment: PeriodAdjustment;
  numPeriods: number;
  excludePeriod?: number;
  onChange: (patch: Partial<PeriodAdjustment>) => void;
  onRemove: () => void;
}

function AdjustmentRow({ adjustment, numPeriods, excludePeriod, onChange, onRemove }: AdjustmentRowProps) {
  const periodOptions: number[] = [];
  for (let i = 1; i <= numPeriods; i++) {
    if (i !== excludePeriod) periodOptions.push(i);
  }

  return (
    <div className="list-row">
      <select
        className="select-input"
        value={adjustment.period}
        onChange={e => onChange({ period: Number(e.target.value) })}
        aria-label="Period"
      >
        {periodOptions.map(p => (
          <option key={p} value={p}>Period {p}</option>
        ))}
      </select>
      <input
        type="number"
        className="text-input list-row-number"
        value={adjustment.offsetMinutes}
        onChange={e => onChange({ offsetMinutes: Number(e.target.value) || 0 })}
        aria-label="Offset in minutes"
      />
      <span className="list-row-hint">min</span>
      <button type="button" className="list-row-remove" onClick={onRemove} aria-label="Remove preference">
        ×
      </button>
    </div>
  );
}

interface SpecialBlockRowProps {
  block: SpecialBlock;
  numPeriods: number;
  onChange: (patch: Partial<SpecialBlock>) => void;
  onRemove: () => void;
}

function SpecialBlockRow({ block, numPeriods, onChange, onRemove }: SpecialBlockRowProps) {
  const afterOptions: number[] = [];
  for (let i = 0; i <= numPeriods; i++) afterOptions.push(i);

  return (
    <div className="list-row">
      <input
        type="text"
        className="text-input list-row-text"
        value={block.name}
        placeholder="e.g. Homeroom"
        onChange={e => onChange({ name: e.target.value })}
        aria-label="Block name"
      />
      <select
        className="select-input"
        value={block.afterPeriod}
        onChange={e => onChange({ afterPeriod: Number(e.target.value) })}
        aria-label="Position"
      >
        {afterOptions.map(p => (
          <option key={p} value={p}>{p === 0 ? 'Before Period 1' : `After Period ${p}`}</option>
        ))}
      </select>
      <input
        type="number"
        className="text-input list-row-number"
        value={block.length}
        min={1}
        onChange={e => onChange({ length: Math.max(1, Number(e.target.value) || 1) })}
        aria-label="Length in minutes"
      />
      <span className="list-row-hint">min</span>
      <button type="button" className="list-row-remove" onClick={onRemove} aria-label="Remove special block">
        ×
      </button>
    </div>
  );
}
