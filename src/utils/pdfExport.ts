import type { Schedule } from '../types';
import { minsToTime } from './timeUtils';
import { computeBlockTimes } from './scheduleEngine';
import { timeToMins } from './timeUtils';

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

export function exportToPDF(
  schedule: Schedule,
  passingTime: number,
  schoolName: string,
  logoDataUrl?: string | null
): void {
  const startMins = timeToMins(schedule.startTime);
  const times = computeBlockTimes(schedule.blocks, startMins, passingTime);

  const rows = schedule.blocks.map((b, i) => {
    const { start, end } = times[i];
    const bg =
      b.type === 'lunch' ? '#e8f0fe' :
      b.type === 'break' ? '#f5f5f5' :
      b.type === 'assembly' ? '#fff3e0' :
      'white';
    return `
      <tr style="background:${bg}">
        <td style="padding:9px 14px;border-bottom:1px solid #eee;font-weight:${b.type === 'period' ? '500' : '400'}">${escapeHtml(b.name)}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #eee;font-family:monospace">${minsToTime(start)}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #eee;font-family:monospace">${minsToTime(end)}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #eee;color:#666">${b.duration} min</td>
      </tr>`;
  }).join('');

  const safeScheduleName = escapeHtml(schedule.name);
  const safeSchoolName = escapeHtml(schoolName);
  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="${safeSchoolName} logo" style="height:40px;width:auto;margin-bottom:10px;display:block;" />`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${safeScheduleName} — BellCraft</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 720px; margin: 40px auto; color: #111; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 9px 14px;
      background: #1e3a5f; color: white;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: right; }
    @media print {
      body { margin: 20px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  ${logoHtml}
  <h1>${safeScheduleName}</h1>
  <div class="meta">${safeSchoolName} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString()}</div>
  <table>
    <thead>
      <tr>
        <th>Block</th>
        <th>Start</th>
        <th>End</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Created with BellCraft · bell-schedule.com</div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export function exportToCSV(schedule: Schedule, passingTime: number): void {
  const startMins = timeToMins(schedule.startTime);
  const times = computeBlockTimes(schedule.blocks, startMins, passingTime);

  const rows = [['Block', 'Start', 'End', 'Duration (min)']];
  schedule.blocks.forEach((b, i) => {
    const { start, end } = times[i];
    rows.push([b.name, minsToTime(start), minsToTime(end), String(b.duration)]);
  });

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `${schedule.name.replace(/\s+/g, '_')}.csv`;
  a.click();
}
