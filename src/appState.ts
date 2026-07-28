import type { AppState, Schedule, ScheduleParams } from './types';
import {
  resetAllBlocks,
  resetBlock,
  toggleBlockLock,
} from './utils/scheduleEngine';

export interface SettingsState {
  schoolName: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultNumPeriods: number;
  /** Data URI of an uploaded logo image, shown in PDF exports. */
  schoolLogo: string | null;
}

const LIBRARY_KEY = 'bellcraft-library';
const SETTINGS_KEY = 'bellcraft-settings';

export const DEFAULT_SETTINGS: SettingsState = {
  schoolName: 'Olympia High School',
  defaultStartTime: '08:55',
  defaultEndTime: '15:25',
  defaultNumPeriods: 6,
  schoolLogo: null,
};

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SettingsState): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLibrary(): Schedule[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLibrary(library: Schedule[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function initialParams(settings: SettingsState): ScheduleParams {
  return {
    name: '',
    startTime: settings.defaultStartTime,
    endTime: settings.defaultEndTime,
    numPeriods: settings.defaultNumPeriods,
    passingTime: 5,
    lunchLength: 30,
    numLunches: 2,
    lunchAfterPeriod: 3,
    hasSplitLunch: false,
    splitLunchPeriod: Math.min(4, settings.defaultNumPeriods),
    splitLunchSymmetric: false,
    hasBreak: false,
    breakBeforePeriod: 3,
    breakLength: 5,
    breakName: 'Break',
    color: '#1e3a5f',
    periodAdjustments: [],
    specialBlocks: [],
  };
}

export function initialAppState(settings: SettingsState): AppState {
  return {
    params: initialParams(settings),
    schedule: null,
    library: loadLibrary(),
    activeTab: 'builder',
  };
}

export type Action =
  | { type: 'SET_PARAM'; key: keyof ScheduleParams; value: ScheduleParams[keyof ScheduleParams] }
  | { type: 'SET_SCHEDULE'; schedule: Schedule }
  | { type: 'SET_BLOCKS'; blocks: Schedule['blocks'] }
  | { type: 'RESET_ALL_BLOCKS' }
  | { type: 'RESET_BLOCK'; id: string }
  | { type: 'TOGGLE_LOCK'; id: string }
  | { type: 'SAVE_TO_LIBRARY' }
  | { type: 'LOAD_SCHEDULE'; schedule: Schedule }
  | { type: 'DELETE_FROM_LIBRARY'; id: string }
  | { type: 'SET_TAB'; tab: AppState['activeTab'] };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PARAM':
      return { ...state, params: { ...state.params, [action.key]: action.value } };

    case 'SET_SCHEDULE':
      return { ...state, schedule: action.schedule };

    case 'SET_BLOCKS':
      return state.schedule
        ? { ...state, schedule: { ...state.schedule, blocks: action.blocks } }
        : state;

    case 'RESET_ALL_BLOCKS':
      return state.schedule
        ? { ...state, schedule: { ...state.schedule, blocks: resetAllBlocks(state.schedule.blocks) } }
        : state;

    case 'RESET_BLOCK':
      return state.schedule
        ? { ...state, schedule: { ...state.schedule, blocks: resetBlock(state.schedule.blocks, action.id) } }
        : state;

    case 'TOGGLE_LOCK':
      return state.schedule
        ? { ...state, schedule: { ...state.schedule, blocks: toggleBlockLock(state.schedule.blocks, action.id) } }
        : state;

    case 'SAVE_TO_LIBRARY': {
      if (!state.schedule) return state;
      const existingIdx = state.library.findIndex(s => s.id === state.schedule!.id);
      const library = existingIdx >= 0
        ? state.library.map((s, i) => (i === existingIdx ? state.schedule! : s))
        : [...state.library, state.schedule];
      return { ...state, library };
    }

    case 'LOAD_SCHEDULE':
      return { ...state, schedule: action.schedule, activeTab: 'builder' };

    case 'DELETE_FROM_LIBRARY':
      return { ...state, library: state.library.filter(s => s.id !== action.id) };

    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    default:
      return state;
  }
}
