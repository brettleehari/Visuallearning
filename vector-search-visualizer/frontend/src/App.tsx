import { DocumentInput } from './components/DocumentInput'
import { QueryBar } from './components/QueryBar'
import { Scene3D } from './components/Scene3D'
import { ResultsPanel } from './components/ResultsPanel'
import { LeversPanel } from './components/LeversPanel'
import { FormulaOverlay } from './components/FormulaOverlay'
import { VectorBreakdown } from './components/VectorBreakdown'
import { TopKVisualization } from './components/TopKVisualization'
import { useAppStore } from './store/useAppStore'

function App() {
  const error = useAppStore(s => s.error)
  const isEmbedding = useAppStore(s => s.isEmbedding)
  const isQuerying = useAppStore(s => s.isQuerying)

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top: Query bar */}
      <div className="shrink-0 px-4 py-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <QueryBar />
      </div>

      {/* Middle: 3 columns */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Document input + Tokenization/Vectorization explainer */}
        <div className="w-80 shrink-0 p-3 overflow-y-auto flex flex-col gap-3" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
          <DocumentInput />
          <VectorBreakdown />
        </div>

        {/* Center: 3D scene */}
        <div className="flex-1 p-3 flex flex-col gap-2 min-w-0">
          {error && (
            <div className="text-xs font-mono px-3 py-2 rounded" style={{ background: 'rgba(232,84,84,0.1)', color: 'var(--red)', border: '1px solid rgba(232,84,84,0.2)' }}>
              {error}
            </div>
          )}
          {(isEmbedding || isQuerying) && (
            <div className="text-xs font-mono px-3 py-2 rounded" style={{ background: 'rgba(77,166,232,0.08)', color: 'var(--blue)', border: '1px solid rgba(77,166,232,0.15)' }}>
              {isEmbedding ? 'Embedding documents...' : 'Computing similarity search...'}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <Scene3D />
          </div>
          <FormulaOverlay />
        </div>

        {/* Right: Split 50/50 — Results top, Top-K bottom */}
        <div className="w-96 shrink-0 flex flex-col" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
          {/* Top half: Search Results */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <ResultsPanel />
          </div>
          {/* Bottom half: Top-K */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0">
            <TopKVisualization />
          </div>
        </div>
      </div>

      {/* Bottom: Levers */}
      <div className="shrink-0 px-4 py-2" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <LeversPanel />
      </div>
    </div>
  )
}

export default App
