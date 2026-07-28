import type { Dispatch, MouseEvent } from 'react';
import type { Schedule } from '../types';
import type { Action } from '../appState';

interface LibraryProps {
  library: Schedule[];
  dispatch: Dispatch<Action>;
}

export default function Library({ library, dispatch }: LibraryProps) {
  if (library.length === 0) {
    return (
      <div className="library library-empty">
        <div className="empty-state">
          <h2>No saved schedules</h2>
          <p>Generate a schedule in the Builder tab and click "Save to Library" to see it here.</p>
        </div>
      </div>
    );
  }

  const handleLoad = (schedule: Schedule) => {
    dispatch({ type: 'LOAD_SCHEDULE', schedule });
  };

  const handleDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_FROM_LIBRARY', id });
  };

  return (
    <div className="library">
      <h2 className="page-title">Library</h2>
      <div className="library-grid">
        {library.map(schedule => {
          const periodCount = schedule.blocks.filter(b => b.type === 'period').length;
          return (
            <div key={schedule.id} className="library-card" onClick={() => handleLoad(schedule)}>
              <div className="library-card-swatch" style={{ background: schedule.color }} />
              <div className="library-card-body">
                <h3 className="library-card-name">{schedule.name || 'Untitled Schedule'}</h3>
                <p className="library-card-meta">
                  {periodCount} period{periodCount !== 1 ? 's' : ''} · Saved {schedule.createdAt}
                </p>
              </div>
              <button
                type="button"
                className="library-card-delete"
                onClick={e => handleDelete(e, schedule.id)}
                aria-label={`Delete ${schedule.name}`}
                title="Delete"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
