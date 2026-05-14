import { useAppStore } from '../store/useAppStore'
import { useEffect, useRef } from 'react'
import katex from 'katex'

function Formula({ latex, label }: { latex: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) {
      katex.render(latex, ref.current, { throwOnError: false, displayMode: true })
    }
  }, [latex])

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="text-xs font-mono mb-2" style={{ color: 'var(--accent)' }}>{label}</div>
      <div ref={ref} style={{ color: 'var(--text)' }} />
    </div>
  )
}

export function FormulaOverlay() {
  const showFormula = useAppStore(s => s.showFormula)
  if (!showFormula) return null

  return (
    <div className="flex gap-3">
      <Formula
        label="COSINE SIMILARITY"
        latex="\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\cdot \\|\\mathbf{B}\\|}"
      />
      <Formula
        label="EUCLIDEAN DISTANCE"
        latex="d(\\mathbf{A}, \\mathbf{B}) = \\sqrt{\\sum_{i=1}^{n}(A_i - B_i)^2}"
      />
    </div>
  )
}
