import { useState } from 'react'
import Stepper from './Stepper'

export default function AddConstraintModal({ numPeriods = 12, onAdd, onClose, isGlobal = false }) {
  const [idx, setIdx] = useState(0)
  const [type, setType] = useState('relative')
  const [abs, setAbs] = useState(55)
  const [off, setOff] = useState(5)
  const [isHard, setIsHard] = useState(false)

  const desc =
    type === 'relative'
      ? off === 0 ? 'Standard length' : off > 0 ? `${off} min longer than standard` : `${Math.abs(off)} min shorter than standard`
      : `Exactly ${abs} min`

  function handleAdd() {
    onAdd({ id: Date.now().toString(), periodIndex: idx, type, value: abs, offset: off, isHard, isGlobal })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isGlobal ? 'Add Global Default' : 'Add Constraint'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Apply to Period</label>
            <select value={idx} onChange={e => setIdx(Number(e.target.value))}>
              {Array.from({ length: isGlobal ? 12 : numPeriods }, (_, i) => (
                <option key={i} value={i}>Period {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Type</label>
            <div className="segment">
              <button className={`segment-btn${type === 'relative' ? ' active' : ''}`} onClick={() => setType('relative')}>Relative length</button>
              <button className={`segment-btn${type === 'absolute' ? ' active' : ''}`} onClick={() => setType('absolute')}>Exact length</button>
            </div>
          </div>

          {type === 'relative' ? (
            <div className="field">
              <label>Offset vs. standard (minutes)</label>
              <div className="stepper">
                <button className="stepper-btn" onClick={() => setOff(o => Math.max(-30, o - 1))}>−</button>
                <div className="stepper-val">{off > 0 ? `+${off}` : off}</div>
                <button className="stepper-btn" onClick={() => setOff(o => Math.min(30, o + 1))}>+</button>
              </div>
              <div className="field-hint">{desc}</div>
            </div>
          ) : (
            <div className="field">
              <label>Period length (minutes)</label>
              <div className="stepper">
                <button className="stepper-btn" onClick={() => setAbs(v => Math.max(5, v - 5))}>−</button>
                <div className="stepper-val">{abs}</div>
                <button className="stepper-btn" onClick={() => setAbs(v => Math.min(120, v + 5))}>+</button>
              </div>
            </div>
          )}

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Hard constraint</div>
              <div className="toggle-desc">
                {isHard ? 'Generation fails if this cannot be met' : 'Warns you if this cannot be met'}
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={isHard} onChange={e => setIsHard(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd}>
            {isGlobal ? 'Add global default' : 'Add constraint'}
          </button>
        </div>
      </div>
    </div>
  )
}
