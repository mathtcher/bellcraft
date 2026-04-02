// storage.js — localStorage persistence for schedules and settings

const KEYS = {
  LIBRARY: 'bellcraft_library',
  GLOBAL_CONSTRAINTS: 'bellcraft_global_constraints',
  SCHOOL_INFO: 'bellcraft_school_info',
  PREFERENCES: 'bellcraft_preferences',
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('BellCraft: could not save to localStorage', e)
  }
}

export const DEFAULT_GLOBAL_CONSTRAINTS = [
  { id: 'g1', periodIndex: 0, type: 'relative', value: 55, offset: 5, isHard: false, isGlobal: true },
]

export const DEFAULT_PREFERENCES = {
  showConstraintIndicators: true,
  hideConstraintsOnExport: true,
  use12HourFormat: true,
}

export const DEFAULT_SCHOOL_INFO = {
  schoolName: '',
  district: '',
}

export function loadLibrary() {
  return load(KEYS.LIBRARY, [])
}

export function saveLibrary(library) {
  save(KEYS.LIBRARY, library)
}

export function loadGlobalConstraints() {
  return load(KEYS.GLOBAL_CONSTRAINTS, DEFAULT_GLOBAL_CONSTRAINTS)
}

export function saveGlobalConstraints(constraints) {
  save(KEYS.GLOBAL_CONSTRAINTS, constraints)
}

export function loadSchoolInfo() {
  return load(KEYS.SCHOOL_INFO, DEFAULT_SCHOOL_INFO)
}

export function saveSchoolInfo(info) {
  save(KEYS.SCHOOL_INFO, info)
}

export function loadPreferences() {
  return load(KEYS.PREFERENCES, DEFAULT_PREFERENCES)
}

export function savePreferences(prefs) {
  save(KEYS.PREFERENCES, prefs)
}
