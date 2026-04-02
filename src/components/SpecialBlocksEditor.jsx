// SpecialBlocksEditor.jsx — add named special blocks at any position in the schedule

const BLOCK_PRESETS = ['Break', 'Homeroom', 'Advisory', 'Bear Time', 'Flex', 'Assembly', 'Passing', 'Pep Rally', 'Other']

function BlockRow({ block, numPeriods, onChange, onRemove }) {
  return (
    <div className="special-block-row">
      <div className="special-block-fields">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="text"
            className="period-name-input"
            value={block.name}
            onChange={e => onChange({ ...block, name: e.target.value })}
            placeholder="Block name"
            style={{ flex: 1 }}
          />
          <select
            className="period-name-preset"
            value={BLOCK_PRESETS.includes(block.name) ? block.name : '__custom'}
            onChange={e => {
              if (e.target.value !== '__custom') onChange({ ...block, name: e.target.value })
            }}
          >
            <option value="__custom">— preset —</option>
            {BLOCK_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={{ marginBottom: 3 }}>Duration (min)</label>
            <div className="stepper" style={{ height: 32 }}>
              <button className="stepper-btn" style={{ height: 32 }} onClick={() => onChange({ ...block, duration: Math.max(5, (block.duration || 10) - 5) })}>−</button>
              <div className="stepper-val" style={{ fontSize: 13, padding: '5px 4px' }}>{block.duration || 10}</div>
              <button className="stepper-btn" style={{ height: 32 }} onClick={() => onChange({ ...block, duration: Math.min(120, (block.duration || 10) + 5) })}>+</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ marginBottom: 3 }}>Insert after</label>
            <select
              value={block.afterPeriod}
              onChange={e => onChange({ ...block, afterPeriod: Number(e.target.value) })}
            >
              <option value={0}>Start of day</option>
              {Array.from({ length: numPeriods }, (_, i) => (
                <option key={i + 1} value={i + 1}>Period {i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <button className="period-name-clear" onClick={onRemove} title="Remove block" style={{ alignSelf: 'flex-start', marginTop: 4 }}>×</button>
    </div>
  )
}

export default function SpecialBlocksEditor({ numPeriods, specialBlocks, onChange }) {
  function addBlock() {
    onChange([...specialBlocks, {
      id: Date.now().toString(),
      name: 'Break',
      duration: 10,
      afterPeriod: 2,
    }])
  }

  function updateBlock(id, updated) {
    onChange(specialBlocks.map(b => b.id === id ? updated : b))
  }

  function removeBlock(id) {
    onChange(specialBlocks.filter(b => b.id !== id))
  }

  return (
    <div>
      {specialBlocks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {specialBlocks.map(block => (
            <BlockRow
              key={block.id}
              block={block}
              numPeriods={numPeriods}
              onChange={updated => updateBlock(block.id, updated)}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
        </div>
      )}
      <button className="add-constraint-btn" onClick={addBlock}>
        + Add special block
      </button>
    </div>
  )
}
