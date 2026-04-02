// ColorPicker.jsx — per-schedule color selection with presets + custom hex

export const COLOR_PRESETS = [
  { name: 'Navy',    value: '#1a3a6b' },
  { name: 'Royal',   value: '#2D5BE3' },
  { name: 'Crimson', value: '#B83232' },
  { name: 'Forest',  value: '#2A7D4F' },
  { name: 'Purple',  value: '#6B3FA0' },
  { name: 'Maroon',  value: '#7B1F3A' },
  { name: 'Orange',  value: '#C95C00' },
  { name: 'Teal',    value: '#0F6E6E' },
  { name: 'Gold',    value: '#B8860B' },
  { name: 'Slate',   value: '#3D5A73' },
]

export default function ColorPicker({ value, onChange }) {
  const isPreset = COLOR_PRESETS.some(c => c.value === value)

  return (
    <div className="color-picker">
      <div className="color-presets">
        {COLOR_PRESETS.map(c => (
          <button
            key={c.value}
            className={`color-swatch${value === c.value ? ' selected' : ''}`}
            style={{ background: c.value }}
            title={c.name}
            onClick={() => onChange(c.value)}
          />
        ))}
      </div>
      <div className="color-custom-row">
        <label style={{ margin: 0, textTransform: 'none', fontSize: 12, color: 'var(--text2)' }}>
          Custom color
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={value || '#2D5BE3'}
            onChange={e => onChange(e.target.value)}
            className="color-input-native"
            title="Pick a custom color"
          />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
            {value || '#2D5BE3'}
          </span>
        </div>
      </div>
    </div>
  )
}
