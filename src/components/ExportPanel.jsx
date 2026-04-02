import { useState, useRef } from 'react'
import { printSchedule, buildShareUrl } from '../engine'
import { fmtTime } from '../engine'

export default function ExportPanel({ params, result, schoolInfo = {} }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const linkRef = useRef()

  function handlePDF() {
    printSchedule(params, result.rows, schoolInfo)
  }

  function handleShareLink() {
    const url = buildShareUrl(params, result.rows)
    setShareUrl(url)
    setCopied(false)
  }

  function handleCopyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
      .catch(() => {
        if (linkRef.current) { linkRef.current.select(); document.execCommand('copy') }
        setCopied(true); setTimeout(() => setCopied(false), 2500)
      })
  }

  function handleCopyText() {
    const lines = [
      params.name,
      `${fmtTime(params.startTime)} – ${fmtTime(params.endTime)}`,
      '',
      ...result.rows.map(r => `${r.label.padEnd(12)} ${fmtTime(r.start)} – ${fmtTime(r.end)}  (${r.duration} min)`),
    ].join('\n')
    navigator.clipboard.writeText(lines)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="export-panel no-print">
      <div className="export-panel-title">Export &amp; Share</div>
      <div className="export-actions">
        <button className="export-btn pdf" onClick={handlePDF}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="1" width="10" height="12" rx="1.5"/>
            <path d="M4 4h6M4 7h6M4 10h4"/>
          </svg>
          Save as PDF
        </button>
        <button className="export-btn link" onClick={handleShareLink}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5.5 8.5l3-3M8 3.5l1.5-1.5a2.12 2.12 0 013 3L11 6.5"/>
            <path d="M6 7.5l-1.5 1.5a2.12 2.12 0 01-3-3L3 4.5"/>
          </svg>
          {shareUrl ? 'Refresh Link' : 'Get Shareable Link'}
        </button>
        <button className="export-btn copy" onClick={handleCopyText}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="1" y="4" width="9" height="9" rx="1.5"/>
            <path d="M4 4V2.5A1.5 1.5 0 015.5 1H11.5A1.5 1.5 0 0113 2.5v6A1.5 1.5 0 0111.5 10H10"/>
          </svg>
          Copy as Text
        </button>
      </div>

      {shareUrl && (
        <div className="share-link-box">
          <input
            ref={linkRef}
            className="share-link-input"
            type="text"
            value={shareUrl}
            readOnly
            onClick={e => e.target.select()}
          />
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleCopyLink}>
            Copy
          </button>
          {copied && <span className="copy-toast">Copied!</span>}
        </div>
      )}
      <div className="export-note">
        PDF and shared links show only the clean schedule — no constraint labels.
      </div>
    </div>
  )
}
