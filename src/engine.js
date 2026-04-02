// engine.js — core schedule generation logic
// Supports: special blocks, split lunch (A/B waves), custom period names, constraints

export function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(m) {
  const h = Math.floor(m / 60) % 24
  const mn = m % 60
  return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`
}

export function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`
}

export function generateSchedule(params, globalConstraints, localConstraints) {
  const {
    startTime, endTime, periods, passingTime,
    lunchLength, numLunches,
    periodNames = [],
    specialBlocks = [],
    splitLunch = { enabled: false },
  } = params

  const startMin = timeToMin(startTime)
  const endMin   = timeToMin(endTime)
  const totalMin = endMin - startMin

  if (totalMin <= 0) return { error: 'End time must be after start time.' }
  if (periods < 1)   return { error: 'Number of periods must be at least 1.' }

  // Merge constraints — local overrides global for same period + type
  const merged = {}
  ;[...globalConstraints, ...localConstraints].forEach(c => {
    merged[`${c.periodIndex}-${c.type}`] = c
  })
  const constraints = Object.values(merged)

  // ─────────────────────────────────────────────────────────────
  // TIME BUDGET — wall-clock minutes consumed by fixed items
  //
  // Passing gaps that appear sequentially in the schedule:
  //   Base: (periods - 1) inter-period gaps
  //   Standard lunch: +1 before each lunch, +1 after = +2 per lunch
  //     BUT "before lunch" replaces an existing inter-period gap, net = +1
  //   Split lunch zone: the zone contains 1 internal passing (between wave halves)
  //     plus 1 passing out of zone. Passing INTO zone is already in (periods-1). Net = +2.
  //   Special blocks: each block replaces the inter-period passing on its left,
  //     adds 1 on its right. Net = 0.
  //
  // Split lunch wall-clock: both waves overlap, so only 1 lunch duration consumed.
  //   Zone wall-clock = classDuration + passingTime + lunchDuration
  //   Since classDuration is already counted in `lengths`, zone overhead = passingTime + lunchDuration
  //   The internal passing is already counted in passingGaps, so splitLunchMin = lunchDuration only.
  // ─────────────────────────────────────────────────────────────

  const effectiveLunches = splitLunch.enabled ? 0 : numLunches

  const passingGaps = (periods - 1)
    + effectiveLunches               // +1 net per standard lunch (post-lunch passing)
    + (splitLunch.enabled ? 1 : 0)  // +1 for split zone: only the internal between-wave passing

  const totalPassingMin = passingTime * passingGaps
  const totalLunchMin   = lunchLength * effectiveLunches
  const totalSpecialMin = specialBlocks.reduce((s, b) => s + (b.duration || 0), 0)

  // Split lunch: only 1 lunch worth of wall-clock (both waves overlap)
  const splitLunchMin = splitLunch.enabled
    ? (splitLunch.lunchDuration || lunchLength)
    : 0

  const available = totalMin - totalPassingMin - totalLunchMin - totalSpecialMin - splitLunchMin

  if (available <= 0) {
    return { error: 'Not enough time in the school day. Try reducing passing time, lunch, special blocks, or number of periods.' }
  }

  // ── Constraint resolution ──────────────────────────────────
  const baseLen = Math.floor(available / periods)
  let lengths = Array(periods).fill(baseLen)
  const warnings = []

  for (const c of constraints) {
    const idx = c.periodIndex
    if (idx < 0 || idx >= periods) continue

    const desired = c.type === 'absolute' ? c.value : baseLen + c.offset
    const remaining = available - desired
    const otherLen = (periods - 1) > 0 ? Math.floor(remaining / (periods - 1)) : 0

    if (otherLen < 1) {
      if (c.isHard) {
        return { error: `Hard constraint on Period ${idx + 1} cannot be satisfied — the school day is too short.` }
      }
      warnings.push(`Soft preference for Period ${idx + 1} could not be honored — not enough time.`)
      continue
    }

    const delta = desired - lengths[idx]
    lengths[idx] = desired

    const unc = [...Array(periods).keys()].filter(
      i => i !== idx && !constraints.find(mc => mc.periodIndex === i)
    )
    if (unc.length && delta !== 0) {
      const adj = Math.floor(delta / unc.length)
      let rem = delta % unc.length
      unc.forEach(i => { lengths[i] -= adj })
      let ui = 0
      while (rem > 0) { lengths[unc[ui % unc.length]] -= 1; rem--; ui++ }
      while (rem < 0) { lengths[unc[ui % unc.length]] += 1; rem++; ui++ }
    }
  }

  // Distribute leftover minutes one-by-one so schedule fills exactly
  const used = lengths.reduce((a, b) => a + b, 0)
  let leftover = available - used
  if (leftover !== 0) {
    const targets = [...Array(periods).keys()].filter(
      i => !constraints.find(c => c.periodIndex === i)
    )
    const pool = targets.length > 0 ? targets : [...Array(periods).keys()]
    let ti = 0
    while (leftover > 0) { lengths[pool[ti++ % pool.length]] += 1; leftover-- }
    while (leftover < 0) { lengths[pool[ti++ % pool.length]] -= 1; leftover++ }
  }

  // ── Build rows ─────────────────────────────────────────────
  const rows = []
  let cursor = startMin

  const lunchAfterPeriod = splitLunch.enabled
    ? (splitLunch.lunchAfterPeriod ?? Math.floor(periods / 2))
    : Math.floor(periods / (effectiveLunches + 1))

  function pushPassing(tag) {
    if (passingTime <= 0) return
    const pe = cursor + passingTime
    rows.push({ id: `pass-${tag}-${cursor}`, label: 'Passing', type: 'passing', start: minToTime(cursor), end: minToTime(pe), duration: passingTime })
    cursor = pe
  }

  for (let i = 0; i < periods; i++) {

    // ── Special blocks that appear BEFORE Period 1 (afterPeriod === 0) ──
    if (i === 0) {
      specialBlocks
        .filter(b => b.afterPeriod === 0)
        .forEach(b => {
          const be = cursor + (b.duration || 10)
          rows.push({ id: `special-${b.id}`, label: b.name || 'Special Block', type: 'special', start: minToTime(cursor), end: minToTime(be), duration: b.duration || 10 })
          cursor = be
          pushPassing(`sp-pre-${b.id}`)
        })
    }

    // ── Instructional period ──
    const end = cursor + lengths[i]
    rows.push({
      id: `p${i}`,
      label: periodNames[i] || `Period ${i + 1}`,
      defaultLabel: `Period ${i + 1}`,
      type: 'period',
      start: minToTime(cursor),
      end: minToTime(end),
      duration: lengths[i],
      hasConstraint: constraints.some(c => c.periodIndex === i),
      isGlobal: globalConstraints.some(c => c.periodIndex === i),
    })
    cursor = end

    // ── Split lunch zone ──
    if (splitLunch.enabled && i === lunchAfterPeriod - 1) {
      const ld = splitLunch.lunchDuration || lunchLength
      const cd = lengths[i + 1] || ld

      pushPassing(`into-split`)       // passing from last period into zone

      const zoneStart = cursor

      // Both waves start at zoneStart (overlapping)
      // Wave B: lunch first (Lunch 1), then class (Period XB)
      // Wave A: class first (Period XA), then lunch (Lunch 2)
      const l1start = zoneStart
      const l1end   = l1start + ld

      const p4aStart = zoneStart
      const p4aEnd   = p4aStart + cd

      const l2start  = p4aEnd + passingTime
      const l2end    = l2start + ld

      const p4bStart = l1end + passingTime
      const p4bEnd   = p4bStart + cd

      const baseName = periodNames[i + 1] || `Period ${i + 2}`
      rows.push({ id: `lunch1`,      label: 'Lunch 1',          type: 'lunch',  start: minToTime(l1start),  end: minToTime(l1end),  duration: ld })
      rows.push({ id: `p${i+1}a`,   label: `${baseName}A`,     type: 'period', start: minToTime(p4aStart), end: minToTime(p4aEnd), duration: cd, hasConstraint: false, isGlobal: false })
      rows.push({ id: `lunch2`,      label: 'Lunch 2',          type: 'lunch',  start: minToTime(l2start),  end: minToTime(l2end),  duration: ld })
      rows.push({ id: `p${i+1}b`,   label: `${baseName}B`,     type: 'period', start: minToTime(p4bStart), end: minToTime(p4bEnd), duration: cd, hasConstraint: false, isGlobal: false })

      // Cursor advances to the end of the zone (both waves finish at same time)
      cursor = Math.max(l2end, p4bEnd)
      pushPassing(`out-split`)        // passing out of zone into next period
      i++                             // skip the A/B period index
      continue
    }

    // ── Standard lunch ──
    for (let ln = 1; ln <= effectiveLunches; ln++) {
      if (i === (lunchAfterPeriod * ln) - 1) {
        pushPassing(`pre-lunch${ln}`)
        const le = cursor + lunchLength
        rows.push({ id: `lunch${ln}`, label: effectiveLunches > 1 ? `Lunch ${ln}` : 'Lunch', type: 'lunch', start: minToTime(cursor), end: minToTime(le), duration: lunchLength })
        cursor = le
        pushPassing(`post-lunch${ln}`)
      }
    }

    // ── Special blocks after this period ──
    const blocksAfter = specialBlocks.filter(b => b.afterPeriod === i + 1)
    if (blocksAfter.length > 0) {
      // No passing between period and first special block — block sits right after
      blocksAfter.forEach((b, bi) => {
        const be = cursor + (b.duration || 10)
        rows.push({ id: `special-${b.id}`, label: b.name || 'Special Block', type: 'special', start: minToTime(cursor), end: minToTime(be), duration: b.duration || 10 })
        cursor = be
      })
      // Single passing after all special blocks, before next period
      if (i < periods - 1) pushPassing(`post-sp-${i}`)
    } else {
      // Normal passing between periods
      if (i < periods - 1) pushPassing(`between-${i}`)
    }
  }

  const globalCount = globalConstraints.filter(
    g => !localConstraints.find(c => c.periodIndex === g.periodIndex && c.type === g.type)
  ).length

  return { rows, warnings, globalCount, localCount: localConstraints.length }
}

// Encode schedule into a URL-safe base64 string for shareable links
export function encodeSchedule(params, rows) {
  const payload = {
    n: params.name,
    s: params.startTime,
    e: params.endTime,
    p: params.periods,
    pt: params.passingTime,
    ll: params.lunchLength,
    nl: params.numLunches,
    rows: rows.map(r => ({ l: r.label, t: r.type, s: r.start, e: r.end, d: r.duration })),
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function buildShareUrl(params, rows) {
  const encoded = encodeSchedule(params, rows)
  return `${window.location.origin}${window.location.pathname}?schedule=${encoded}`
}

// Inject clean print-only schedule into the DOM and trigger window.print()
export function printSchedule(params, rows, schoolInfo = {}) {
  const el = document.getElementById('print-area')
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const color = params.color || '#2D5BE3'
  const { schoolName, district, logoDataUrl } = schoolInfo

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="School logo" style="height:48px;width:auto;object-fit:contain;margin-right:12px;" />`
    : ''

  const schoolHtml = schoolName
    ? `<div style="font-size:13px;font-weight:700;color:${color};">${schoolName}</div>${district ? `<div style="font-size:11px;color:#666;">${district}</div>` : ''}`
    : ''

  el.innerHTML = `
    <div style="border-top:4px solid ${color};padding-top:16px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;">
          ${logoHtml}
          <div>${schoolHtml}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:700;color:${color};">${params.name}</div>
          <div style="font-size:12px;color:#666;">${fmtTime(params.startTime)} – ${fmtTime(params.endTime)}</div>
        </div>
      </div>
    </div>
    <div class="print-meta">${rows.filter(r => r.type === 'period').length} periods &nbsp;·&nbsp; Generated ${date}</div>
    <table class="print-table">
      <thead>
        <tr>
          <th style="border-bottom:2px solid ${color}">Period</th>
          <th style="border-bottom:2px solid ${color}">Start</th>
          <th style="border-bottom:2px solid ${color}">End</th>
          <th style="text-align:right;border-bottom:2px solid ${color}">Duration</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr class="p-${r.type}">
            <td>${r.label}</td>
            <td class="print-time">${fmtTime(r.start)}</td>
            <td class="print-time">${fmtTime(r.end)}</td>
            <td class="print-dur">${r.duration} min</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="print-footer">BellCraft &nbsp;·&nbsp; Generated ${date}</div>
  `
  window.print()
}
