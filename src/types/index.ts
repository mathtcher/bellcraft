export type BlockType = 'period' | 'lunch' | 'break' | 'assembly' | 'passing';

export interface Block {
  id: string;
  type: BlockType;
  name: string;
  duration: number;
  locked: boolean;
  edited: boolean;
  baseDuration: number;
  /** Shared key linking sub-blocks that are one split-lunch period (e.g. "Period 4A" / "Period 4B"). */
  splitGroup?: string;
  /** Whether this split-lunch group uses a passing gap on both sides of the swap, not just one. */
  splitSymmetric?: boolean;
  /** Overrides the gap before each edge track's non-class block (e.g. time to get seated for an assembly). */
  splitEdgeGap?: number;
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  blocks: Block[];
  createdAt: string;
  color: string;
  /** Settings this schedule was generated from. Missing on schedules saved before this was added. */
  sourceParams?: ScheduleParams;
}

export interface PeriodAdjustment {
  id: string;
  period: number;
  offsetMinutes: number;
}

export interface SpecialBlock {
  id: string;
  name: string;
  afterPeriod: number;
  length: number;
}

export interface ScheduleParams {
  name: string;
  startTime: string;
  endTime: string;
  numPeriods: number;
  passingTime: number;
  lunchLength: number;
  numLunches: number;
  lunchAfterPeriod: number;
  hasSplitLunch: boolean;
  splitLunchPeriod: number;
  splitLunchSymmetric: boolean;
  hasSplitAssembly: boolean;
  splitAssemblyPeriod: number;
  splitAssemblyLength: number;
  splitAssemblyName: string;
  /** Minutes beyond normal passing time that each group gets to reach the assembly and sit down. */
  splitAssemblyExtraLoad: number;
  hasBreak: boolean;
  breakBeforePeriod: number;
  breakLength: number;
  breakName: string;
  color: string;
  periodAdjustments: PeriodAdjustment[];
  specialBlocks: SpecialBlock[];
}

export interface AppState {
  params: ScheduleParams;
  schedule: Schedule | null;
  library: Schedule[];
  activeTab: 'builder' | 'library' | 'settings' | 'help';
}
