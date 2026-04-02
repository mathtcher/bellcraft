// BrandedHeader.jsx — school branding header for schedule output and PDF

import { fmtTime } from '../engine'

export default function BrandedHeader({ params, schoolInfo, forPrint = false }) {
  const { name, startTime, endTime, color = '#2D5BE3' } = params
  const { schoolName, district, logoDataUrl } = schoolInfo || {}

  if (forPrint) {
    // Clean print version — rendered into the print-area div via innerHTML in engine.js
    // This component is used for the in-app branded header only
    return null
  }

  return (
    <div className="branded-header" style={{ borderColor: color }}>
      <div className="branded-header-left">
        {logoDataUrl && (
          <img
            src={logoDataUrl}
            alt="School logo"
            className="branded-logo"
          />
        )}
        <div className="branded-school-info">
          {schoolName && (
            <div className="branded-school-name" style={{ color }}>
              {schoolName}
            </div>
          )}
          {district && (
            <div className="branded-district">{district}</div>
          )}
        </div>
      </div>
      <div className="branded-schedule-info">
        <div className="branded-schedule-name" style={{ color }}>{name}</div>
        <div className="branded-schedule-time">
          {fmtTime(startTime)} – {fmtTime(endTime)}
        </div>
      </div>
    </div>
  )
}
