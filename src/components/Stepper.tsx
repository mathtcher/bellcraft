interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

export default function Stepper({ label, value, onChange, min, max, step = 1, suffix }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="stepper">
      <label className="stepper-label">{label}</label>
      <div className="stepper-control">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="stepper-value">
          {value}
          {suffix ? <span className="stepper-suffix">{suffix}</span> : null}
        </span>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
