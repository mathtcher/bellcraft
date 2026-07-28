import { useMemo, useState } from 'react';
import type { Dispatch } from 'react';
import type { Block, Schedule } from '../types';
import type { Action } from '../appState';
import { computeBlockTimes, rebalanceBlocks } from '../utils/scheduleEngine';
import { minsToTime, timeToMins } from '../utils/timeUtils';
import { exportToPDF, exportToCSV } from '../utils/pdfExport';

interface ScheduleViewProps {
  schedule: Schedule | null;
  passingTime: number;
  schoolName: string;
  schoolLogo: string | null;
  dispatch: Dispatch<Action>;
}

export default function ScheduleView({ schedule, passingTime, schoolName, schoolLogo, dispatch }: ScheduleViewProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [notifiedScheduleId, setNotifiedScheduleId] = useState(schedule?.id);

  if (schedule?.id !== notifiedScheduleId) {
    setNotifiedScheduleId(schedule?.id);
    setNotification(null);
  }

  const times = useMemo(() => {
    if (!schedule) return [];
    return computeBlockTimes(schedule.blocks, timeToMins(schedule.startTime), passingTime);
  }, [schedule, passingTime]);

  if (!schedule) {
    return (
      <div className="schedule-view schedule-view-empty">
        <div className="empty-state">
          <h2>No schedule yet</h2>
          <p>Fill out the builder panel on the left and click "Generate Schedule" to see it here.</p>
        </div>
      </div>
    );
  }

  const periods = schedule.blocks.filter(b => b.type === 'period');

  // A split-lunch period produces two period-type blocks (e.g. 4A/4B) sharing a
  // splitGroup — count and total them as one logical period, not two.
  const seenSplitGroups = new Set<string>();
  let periodCount = 0;
  let totalInstructional = 0;
  for (const p of periods) {
    if (p.splitGroup) {
      if (seenSplitGroups.has(p.splitGroup)) continue;
      seenSplitGroups.add(p.splitGroup);
    }
    periodCount++;
    totalInstructional += p.duration;
  }

  // Exclude split-lunch sub-blocks — with 3+ waves the "sandwiched" middle track's
  // class is split into fractional chunks that aren't a meaningful "period length".
  const regularPeriods = periods.filter(p => !p.splitGroup);
  const basePeriodLen = regularPeriods.length > 0
    ? Math.min(...regularPeriods.map(p => p.baseDuration))
    : (periods.length > 0 ? Math.min(...periods.map(p => p.baseDuration)) : 0);
  const actualEndTime = times.length > 0 ? minsToTime(times[times.length - 1].end) : schedule.endTime;
  const hasEdits = schedule.blocks.some(b => b.duration !== b.baseDuration);

  const handleDurationCommit = (block: Block, newDuration: number) => {
    if (newDuration === block.duration) return;
    const oldBlocks = schedule.blocks;
    const newBlocks = rebalanceBlocks(oldBlocks, block.id, newDuration);

    const others = newBlocks.filter(nb => {
      if (nb.id === block.id) return false;
      const ob = oldBlocks.find(o => o.id === nb.id);
      return ob && ob.duration !== nb.duration;
    });

    if (others.length > 0) {
      const moved = others.reduce((sum, nb) => {
        const ob = oldBlocks.find(o => o.id === nb.id)!;
        return sum + Math.abs(nb.duration - ob.duration);
      }, 0);
      setNotification(
        `${block.name} set to ${newDuration} min — redistributed ${moved} min across ${others.length} other period${others.length > 1 ? 's' : ''}.`
      );
    } else {
      setNotification(
        `${block.name} set to ${newDuration} min — no unlocked periods available to rebalance, so the schedule end time shifted.`
      );
    }

    dispatch({ type: 'SET_BLOCKS', blocks: newBlocks });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_ALL_BLOCKS' });
    setNotification(null);
  };

  const handleResetBlock = (id: string) => {
    dispatch({ type: 'RESET_BLOCK', id });
  };

  const handleToggleLock = (id: string) => {
    dispatch({ type: 'TOGGLE_LOCK', id });
  };

  return (
    <div className="schedule-view">
      <div className="schedule-view-header">
        <h2 className="schedule-title">{schedule.name || 'Untitled Schedule'}</h2>
        <div className="schedule-actions">
          <button type="button" className="btn btn-ghost" onClick={handleReset} disabled={!hasEdits}>
            Reset
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => exportToPDF(schedule, passingTime, schoolName, schoolLogo)}>
            PDF
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => exportToCSV(schedule, passingTime)}>
            CSV
          </button>
        </div>
      </div>

      {notification && (
        <div className="notification-bar">
          <span>{notification}</span>
          <button type="button" className="notification-dismiss" onClick={() => setNotification(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="schedule-table-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Block</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Lock</th>
              <th>Reset</th>
            </tr>
          </thead>
          <tbody>
            {schedule.blocks.map((block, i) => (
              <BlockRow
                key={block.id}
                block={block}
                start={times[i].start}
                end={times[i].end}
                onDurationCommit={d => handleDurationCommit(block, d)}
                onToggleLock={() => handleToggleLock(block.id)}
                onReset={() => handleResetBlock(block.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-value">{periodCount}</span>
          <span className="summary-label">Periods</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{totalInstructional}</span>
          <span className="summary-label">Instructional Min</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{basePeriodLen}</span>
          <span className="summary-label">Base Period Length</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{actualEndTime}</span>
          <span className="summary-label">Actual End Time</span>
        </div>
      </div>
    </div>
  );
}

interface BlockRowProps {
  block: Block;
  start: number;
  end: number;
  onDurationCommit: (duration: number) => void;
  onToggleLock: () => void;
  onReset: () => void;
}

function BlockRow({ block, start, end, onDurationCommit, onToggleLock, onReset }: BlockRowProps) {
  const [draft, setDraft] = useState(String(block.duration));
  const [lastDuration, setLastDuration] = useState(block.duration);

  if (block.duration !== lastDuration) {
    setLastDuration(block.duration);
    setDraft(String(block.duration));
  }

  const isPeriod = block.type === 'period';

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setDraft(String(block.duration));
      return;
    }
    onDurationCommit(parsed);
  };

  return (
    <tr className={`block-row block-row-${block.type}${block.duration !== block.baseDuration ? ' block-row-edited' : ''}`}>
      <td className="block-name">{block.name}</td>
      <td className="block-time">{minsToTime(start)}</td>
      <td className="block-time">{minsToTime(end)}</td>
      <td className="block-duration">
        {isPeriod ? (
          <input
            type="number"
            className="duration-input"
            value={draft}
            min={1}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
        ) : (
          <span className="duration-static">{block.duration} min</span>
        )}
      </td>
      <td className="block-lock">
        {isPeriod ? (
          <button
            type="button"
            className={`lock-btn${block.locked ? ' lock-btn-active' : ''}`}
            onClick={onToggleLock}
            aria-label={block.locked ? 'Unlock period' : 'Lock period'}
            title={block.locked ? 'Unlock period' : 'Lock period'}
          >
            {block.locked ? '🔒' : '🔓'}
          </button>
        ) : (
          <span className="lock-static" title="Locked by default">🔒</span>
        )}
      </td>
      <td className="block-reset">
        {isPeriod && (
          <button
            type="button"
            className="reset-btn"
            onClick={onReset}
            disabled={block.duration === block.baseDuration}
            aria-label="Reset this period"
            title="Reset to original duration"
          >
            ↺
          </button>
        )}
      </td>
    </tr>
  );
}
