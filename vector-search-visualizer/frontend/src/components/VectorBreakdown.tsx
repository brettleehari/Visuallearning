import { useAppStore } from '../store/useAppStore'
import { getDocColor } from '../lib/colors'
import { useState } from 'react'

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute z-50 left-0 top-full mt-1 p-2 rounded-lg text-xs"
          style={{
            background: '#1a1d25',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text)',
            width: 240,
            lineHeight: 1.5,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}

function Callout({ icon, title, text, color }: { icon: string; title: string; text: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 flex gap-2" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
      <div>
        <div className="font-mono text-xs font-bold mb-0.5" style={{ color, fontSize: '0.65rem', letterSpacing: '0.05em' }}>{title}</div>
        <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  )
}

export function VectorBreakdown() {
  const documents = useAppStore(s => s.documents)
  const dim = useAppStore(s => s.dim)
  const model = useAppStore(s => s.model)

  // Always show the educational callouts
  return (
    <div className="flex flex-col gap-2">
      {/* Tokenization callout */}
      <Callout
        icon="&#9997;"
        title="TOKENIZATION"
        text="Text is split into sub-word tokens (not whole words). 'running' might become ['run', '##ning']. Each token gets a numeric ID from the model's vocabulary. This is how text enters the math world."
        color="var(--blue)"
      />

      {/* Vectorization callout */}
      <Callout
        icon="&#10132;"
        title="VECTORIZATION (EMBEDDING)"
        text={`The model reads ALL tokens together and outputs a single ${dim}-dimensional vector — a point in space. Sentences with similar meaning land near each other. This is the key insight: meaning becomes geometry.`}
        color="var(--green)"
      />

      {/* Show pipeline per document only after embedding */}
      {documents.length > 0 && documents[0].vectorFull && (
        <div className="rounded-lg p-2.5" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-mono tracking-wider mb-1.5 flex items-center gap-2" style={{ color: 'var(--purple)' }}>
            <span>TEXT &#8594; VECTOR PIPELINE</span>
            <Tooltip text={`Using model: ${model} (${dim} dimensions). Each text → tokenize → embed → one ${dim}D vector. The 3D view is a PCA projection for visualization only.`}>
              <span className="px-1 rounded" style={{ background: 'rgba(168,124,232,0.15)', fontSize: '0.55rem', cursor: 'help' }}>?</span>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
            {documents.map((doc, i) => {
              const color = getDocColor(i)
              const tokenCount = doc.tokens?.length || 0
              const preview = doc.vectorFull || []
              const text = doc.text.length > 35 ? doc.text.slice(0, 35) + '...' : doc.text

              return (
                <div key={i} className="rounded p-2" style={{ background: 'var(--bg)', borderLeft: `3px solid ${color}` }}>
                  {/* Text */}
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text)' }}>{text}</div>

                  {/* Token + Vector summary row */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tooltip text={`Tokens: ${doc.tokens?.join(', ')}`}>
                      <span className="font-mono px-1 rounded" style={{ background: 'rgba(77,166,232,0.1)', color: 'var(--blue)', fontSize: '0.55rem', cursor: 'help' }}>
                        {tokenCount} tokens
                      </span>
                    </Tooltip>
                    <span style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>&#8594;</span>
                    <Tooltip text={`Full vector (first 16): [${preview.map(v => v.toFixed(4)).join(', ')}...]`}>
                      <span className="font-mono px-1 rounded" style={{ background: 'rgba(77,216,138,0.1)', color: 'var(--green)', fontSize: '0.55rem', cursor: 'help' }}>
                        {dim}D vector
                      </span>
                    </Tooltip>
                    <span className="font-mono ml-auto" style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>
                      [{preview.slice(0, 3).map(v => v.toFixed(2)).join(', ')}, ...]
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
