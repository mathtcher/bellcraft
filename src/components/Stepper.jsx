export default function Stepper({ value, onChange, min = 1, max = 20, label }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="stepper">
        <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <div className="stepper-val">{value}</div>
        <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  )
}
