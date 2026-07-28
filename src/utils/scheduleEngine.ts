import type { Block, Schedule, ScheduleParams } from '../types';
import { timeToMins } from './timeUtils';

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function generateSchedule(params: ScheduleParams): Schedule | null {
  const {
    name, startTime, endTime, numPeriods, passingTime,
    lunchLength, numLunches, lunchAfterPeriod,
    hasSplitLunch, splitLunchPeriod, splitLunchSymmetric,
    hasBreak, breakBeforePeriod, breakLength, breakName, color,
    periodAdjustments, specialBlocks,
  } = params;

  const startMins = timeToMins(startTime);
  const endMins = timeToMins(endTime);
  const totalMins = endMins - startMins;

  const effectiveSplitPeriod = hasSplitLunch
    ? Math.min(Math.max(1, splitLunchPeriod), numPeriods)
    : -1;

  // Non-instructional time. A break absorbs the passing gap that would normally
  // precede it into its own displayed span, so passingTotal still just counts one
  // gap per period-to-period transition regardless of what occupies that gap.
  const passingTotal = passingTime * (numPeriods - 1);
  const lunchTotal = hasSplitLunch ? 0 : lunchLength * numLunches;
  const breakTotal = hasBreak ? breakLength : 0;
  const specialTotal = specialBlocks.reduce((sum, sb) => sum + sb.length, 0);
  // Split lunch runs N parallel tracks (a lunch-first track, a class-first track, and
  // for 3+ waves, one or more "sandwiched" middle tracks whose class is split around
  // their own lunch) that all resolve to the same clock time. The period itself still
  // gets a full periodLen like every other period — only the extra time needed to fit
  // everyone's lunch and transitions has to come out of the shared pool up front.
  // A middle track needs 3 passing gaps (arriving, into lunch, out of lunch) — more
  // than either edge track needs — so once a middle track exists it sets the pace.
  const numWaves = hasSplitLunch ? Math.max(2, numLunches) : 0;
  const hasMiddleWaves = numWaves >= 3;
  const splitExtra = hasSplitLunch
    ? (hasMiddleWaves
      ? 2 * passingTime + lunchLength
      : lunchLength + (splitLunchSymmetric ? passingTime : 0))
    : 0;

  const validAdjustments = periodAdjustments.filter(
    adj => !(hasSplitLunch && adj.period === effectiveSplitPeriod)
  );
  const offsetByPeriod = new Map<number, number>();
  for (const adj of validAdjustments) {
    offsetByPeriod.set(adj.period, (offsetByPeriod.get(adj.period) ?? 0) + adj.offsetMinutes);
  }
  const sumOffsets = validAdjustments.reduce((sum, adj) => sum + adj.offsetMinutes, 0);

  const instructionalPool = totalMins - passingTotal - lunchTotal - breakTotal - specialTotal - splitExtra;
  const adjustedPool = instructionalPool - sumOffsets;
  const periodsCount = numPeriods;

  if (periodsCount <= 0 || adjustedPool <= 0 || adjustedPool / periodsCount < 1) return null;

  const periodLen = Math.floor(adjustedPool / periodsCount);
  const remainder = adjustedPool - periodLen * periodsCount;
  // Remainder goes to Period 1, unless Period 1 is the split-lunch period.
  const remainderTarget = hasSplitLunch && effectiveSplitPeriod === 1 ? 2 : 1;

  const blocks: Block[] = [];

  const pushSpecialBlocksAfter = (period: number) => {
    for (const sb of specialBlocks) {
      if (sb.afterPeriod === period) {
        blocks.push({
          id: makeId(),
          type: 'assembly',
          name: sb.name || 'Special Block',
          duration: sb.length,
          locked: true,
          edited: false,
          baseDuration: sb.length,
        });
      }
    }
  };

  // A break directly after a period absorbs that period's passing gap into its own
  // displayed span (starts immediately, shows passingTime + breakLength). A break
  // preceded by anything else (e.g. a special block) shows its plain length instead,
  // and the passing gap reappears before whichever period follows.
  const pushBreak = () => {
    const prev = blocks[blocks.length - 1];
    const embeds = prev?.type === 'period';
    const dur = embeds ? passingTime + breakLength : breakLength;
    blocks.push({
      id: makeId(),
      type: 'break',
      name: breakName || 'Break',
      duration: dur,
      locked: true,
      edited: false,
      baseDuration: dur,
    });
  };

  // Special blocks placed before Period 1 (afterPeriod === 0), e.g. homeroom.
  pushSpecialBlocksAfter(0);
  if (hasBreak && breakBeforePeriod === 1) pushBreak();

  for (let i = 1; i <= numPeriods; i++) {
    if (hasSplitLunch && i === effectiveSplitPeriod) {
      // N parallel tracks sharing this period's slot. Track 1 eats first, then takes
      // one uninterrupted class block. Track N takes one uninterrupted class block,
      // then eats. Any tracks in between (3+ waves only) split their class around
      // their own lunch. A middle track needs 3 passing gaps (arriving, into lunch,
      // back from lunch) — one more than an edge track — so when middle tracks exist,
      // the edge tracks' class block is padded to stay in sync with them.
      const groupKey = `split-${i}`;
      const edgeGap = splitLunchSymmetric ? passingTime : 0;
      const edgePadding = hasMiddleWaves ? (2 * passingTime - edgeGap) : 0;
      const edgeDuration = periodLen + edgePadding;
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      let letterIndex = 2;

      const pushSplitBlock = (type: 'period' | 'lunch', name: string, duration: number) => {
        blocks.push({
          id: makeId(), type, name, duration,
          locked: type === 'lunch', edited: false, baseDuration: duration,
          splitGroup: groupKey, splitSymmetric: splitLunchSymmetric,
        });
      };

      // Track 1: lunch first, then one full class block.
      pushSplitBlock('lunch', 'Lunch 1', lunchLength);
      pushSplitBlock('period', `Period ${i}B`, edgeDuration);

      // Middle tracks (only present when numWaves >= 3): class, lunch, class.
      for (let k = 2; k <= numWaves - 1; k++) {
        const frac1 = (k - 1) / (numWaves - 1);
        const part1 = Math.round(periodLen * frac1);
        const part2 = periodLen - part1;
        const letterBefore = letters[letterIndex++];
        const letterAfter = letters[letterIndex++];
        pushSplitBlock('period', `Period ${i}${letterBefore}`, part1);
        pushSplitBlock('lunch', `Lunch ${k}`, lunchLength);
        pushSplitBlock('period', `Period ${i}${letterAfter}`, part2);
      }

      // Track N: one full class block first, then lunch.
      pushSplitBlock('period', `Period ${i}A`, edgeDuration);
      pushSplitBlock('lunch', `Lunch ${numWaves}`, lunchLength);
    } else {
      const dur = Math.max(
        1,
        periodLen + (i === remainderTarget ? remainder : 0) + (offsetByPeriod.get(i) ?? 0)
      );
      blocks.push({
        id: makeId(),
        type: 'period',
        name: `Period ${i}`,
        duration: dur,
        locked: false,
        edited: false,
        baseDuration: dur,
      });
    }

    // Standalone lunch after this period (split-lunch mode handles lunch inline above instead)
    if (!hasSplitLunch && i === lunchAfterPeriod) {
      for (let l = 0; l < numLunches; l++) {
        const lname = numLunches > 1
          ? `Lunch ${String.fromCharCode(65 + l)}`
          : 'Lunch';
        blocks.push({
          id: makeId(),
          type: 'lunch',
          name: lname,
          duration: lunchLength,
          locked: true,
          edited: false,
          baseDuration: lunchLength,
        });
      }
    }

    // Special blocks and a break positioned before the next period (e.g. homeroom
    // after Period 2, then a break, before Period 3 starts) — in that order.
    pushSpecialBlocksAfter(i);
    if (hasBreak && breakBeforePeriod === i + 1) pushBreak();
  }

  return {
    id: makeId(),
    name,
    startTime,
    endTime,
    blocks,
    createdAt: new Date().toLocaleDateString(),
    color,
  };
}

// A break's own duration already reflects whether it absorbed the passing gap of a
// directly-preceding period (see pushBreak in generateSchedule) — this just needs to
// answer the same question again to know whether the *next* block still owes a gap.
function breakEmbedsGap(blocks: Block[], idx: number): boolean {
  return blocks[idx]?.type === 'break' && blocks[idx - 1]?.type === 'period';
}

// Does `blocks[idx]` need a passing-time gap inserted immediately before it?
function needsLeadingGap(blocks: Block[], idx: number): boolean {
  const block = blocks[idx];
  const prev = blocks[idx - 1];
  if (!prev) return false;
  if (prev.splitGroup !== undefined) return false; // split-lunch cluster already added its own trailing gap
  if (block.type === 'break' || block.type === 'assembly') return false; // never get a leading gap themselves

  if (block.type === 'period') {
    if (prev.type === 'period' || prev.type === 'lunch') return true;
    if (prev.type === 'break') return !breakEmbedsGap(blocks, idx - 1);
    return false; // assembly (e.g. homeroom) already provides ample transition time
  }
  if (block.type === 'lunch') {
    return prev.type === 'period';
  }
  return false;
}

export function computeBlockTimes(
  blocks: Block[],
  startMins: number,
  passingTime: number
): { start: number; end: number }[] {
  const times: { start: number; end: number }[] = new Array(blocks.length);
  let cursor = startMins;
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.splitGroup !== undefined) {
      // A split-lunch cluster: [Lunch 1, Period B, (middle triples...), Period A, Lunch N]
      // sharing one splitGroup key. Track 1 and Track N are the "edge" tracks (one
      // uninterrupted class block, before or after their lunch); any tracks in between
      // are "middle" tracks whose class is split around their own lunch. All tracks
      // resolve to the same clock time before the next period.
      let j = i;
      while (j < blocks.length && blocks[j].splitGroup === block.splitGroup) j++;
      const cluster = blocks.slice(i, j);
      // Symmetric mode adds a passing gap on both sides of the swap in each edge track
      // (before Lunch 1, and after Lunch N) instead of just one side.
      const edgeGap = block.splitSymmetric ? passingTime : 0;
      const T0 = cursor;

      const lunch1 = cluster[0];
      const periodB = cluster[1];
      const periodA = cluster[cluster.length - 2];
      const lunchN = cluster[cluster.length - 1];

      const lunch1Start = T0 + edgeGap;
      const lunch1End = lunch1Start + lunch1.duration;
      const periodBStart = lunch1End + passingTime;
      const periodBEnd = periodBStart + periodB.duration;
      const periodAStart = T0 + passingTime;
      const periodAEnd = periodAStart + periodA.duration;
      const lunchNStart = periodAEnd + edgeGap;
      const lunchNEnd = lunchNStart + lunchN.duration;

      times[i] = { start: lunch1Start, end: lunch1End };
      times[i + 1] = { start: periodBStart, end: periodBEnd };
      times[j - 2] = { start: periodAStart, end: periodAEnd };
      times[j - 1] = { start: lunchNStart, end: lunchNEnd };

      let clusterEnd = Math.max(periodBEnd, lunchNEnd);

      // Middle tracks: each is a [class, lunch, class] triple occupying cluster[2..length-3].
      for (let m = 2; m < cluster.length - 2; m += 3) {
        const classBefore = cluster[m];
        const midLunch = cluster[m + 1];
        const classAfter = cluster[m + 2];

        const beforeStart = T0 + passingTime;
        const beforeEnd = beforeStart + classBefore.duration;
        const midLunchStart = beforeEnd + passingTime;
        const midLunchEnd = midLunchStart + midLunch.duration;
        const afterStart = midLunchEnd + passingTime;
        const afterEnd = afterStart + classAfter.duration;

        times[i + m] = { start: beforeStart, end: beforeEnd };
        times[i + m + 1] = { start: midLunchStart, end: midLunchEnd };
        times[i + m + 2] = { start: afterStart, end: afterEnd };

        clusterEnd = Math.max(clusterEnd, afterEnd);
      }

      cursor = clusterEnd;
      if (blocks[j]) cursor += passingTime;
      i = j;
      continue;
    }

    if (needsLeadingGap(blocks, i)) cursor += passingTime;

    times[i] = { start: cursor, end: cursor + block.duration };
    cursor += block.duration;
    i++;
  }

  return times;
}

export function rebalanceBlocks(
  blocks: Block[],
  changedId: string,
  newDuration: number
): Block[] {
  const updated = blocks.map(b => ({ ...b }));
  const changed = updated.find(b => b.id === changedId);
  if (!changed || changed.type !== 'period') return updated;

  const diff = newDuration - changed.duration;
  if (diff === 0) return updated;

  changed.duration = newDuration;
  changed.edited = true;

  // Flexible = unlocked, unedited periods that aren't the changed one. Split-lunch
  // sub-blocks (e.g. Period 4A/4B) are excluded so an unrelated edit can't silently
  // shrink or grow a lunch wave — their length is meant to stay tied to lunch length.
  const flexible = updated.filter(
    b => b.id !== changedId && b.type === 'period' && !b.locked && !b.edited && b.splitGroup === undefined
  );

  if (flexible.length > 0) {
    const perPeriod = Math.floor(Math.abs(diff) / flexible.length);
    const leftover = Math.abs(diff) - perPeriod * flexible.length;

    flexible.forEach((fl, i) => {
      const adjust = diff > 0
        ? -(perPeriod + (i === 0 ? leftover : 0))
        : (perPeriod + (i === 0 ? leftover : 0));
      fl.duration = Math.max(1, fl.duration + adjust);
    });
  }

  return updated;
}

export function resetBlock(blocks: Block[], id: string): Block[] {
  return blocks.map(b =>
    b.id === id ? { ...b, duration: b.baseDuration, edited: false } : { ...b }
  );
}

export function resetAllBlocks(blocks: Block[]): Block[] {
  return blocks.map(b => ({ ...b, duration: b.baseDuration, edited: false }));
}

export function toggleBlockLock(blocks: Block[], id: string): Block[] {
  return blocks.map(b =>
    b.id === id && b.type === 'period' ? { ...b, locked: !b.locked } : { ...b }
  );
}

export function totalInstructionalMins(blocks: Block[]): number {
  return blocks
    .filter(b => b.type === 'period')
    .reduce((sum, b) => sum + b.duration, 0);
}
