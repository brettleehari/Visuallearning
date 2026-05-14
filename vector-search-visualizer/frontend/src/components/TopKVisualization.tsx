import { useAppStore } from '../store/useAppStore'
import { getDocColor, similarityToColor, QUERY_COLOR } from '../lib/colors'
import { useState } from 'react'

export function TopKVisualization() {
  const documents = useAppStore(s => s.documents)
  const query = useAppStore(s => s.query)
  const metric = useAppStore(s => s.metric)
  const dim = useAppStore(s => s.dim)
  const [topK, setTopK] = useState(3)

  if (!query || !documents.some(d => d.cosineSimilarity !== undefined)) return null

  // Sort by selected metric
  const withIndex = documents.map((d, i) => ({ ...d, origIdx: i }))
  const sorted = [...withIndex].sort((a, b) => {
    if (metric === 'cosine') return (b.cosineSimilarity || 0) - (a.cosineSimilarity || 0)
    return (a.euclideanDistance || 0) - (b.euclideanDistance || 0)
  })

  const topResults = sorted.slice(0, topK)
  const restResults = sorted.slice(topK)

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono tracking-wider" style={{ color: 'var(--accent)' }}>
          HOW TOP-K RETRIEVAL WORKS
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>K =</span>
          <input
            type="range" min="1" max={Math.max(1, documents.length)} value={topK}
            onChange={e => setTopK(parseInt(e.target.value))}
            style={{ width: 60, accentColor: 'var(--accent)' }}
          />
          <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{topK}</span>
        </div>
      </div>

      {/* Step-by-step explanation */}
      <div className="flex flex-col gap-2 mb-3">
        {/* Step 1 */}
        <div className="flex items-start gap-2">
          <span className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(168,124,232,0.1)', color: 'var(--purple)' }}>1</span>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Embed the query</strong> into the same {dim}D vector space using the same model.
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-2">
          <span className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(77,166,232,0.1)', color: 'var(--blue)' }}>2</span>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Compute distance</strong> from query vector to <em>every</em> stored document vector ({metric === 'cosine' ? 'cosine similarity' : 'Euclidean distance'}).
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-2">
          <span className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(77,216,138,0.1)', color: 'var(--green)' }}>3</span>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Sort and return top K={topK}</strong> — the {topK} {metric === 'cosine' ? 'most similar' : 'nearest'} documents.
          </div>
        </div>
      </div>

      {/* Distance computation table */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontFamily: 'var(--mono, monospace)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>DOCUMENT</th>
              <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontFamily: 'var(--mono, monospace)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>
                {metric === 'cosine' ? 'COSINE SIM' : 'EUCLIDEAN DIST'}
              </th>
              <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontFamily: 'var(--mono, monospace)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>TOP-K?</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((doc, i) => {
              const isTopK = i < topK
              const score = metric === 'cosine' ? doc.cosineSimilarity! : doc.euclideanDistance!
              const simForColor = metric === 'cosine' ? doc.cosineSimilarity! : Math.max(0, 1 - doc.euclideanDistance! / 2)
              const color = getDocColor(doc.origIdx)
              const text = doc.text.length > 35 ? doc.text.slice(0, 35) + '...' : doc.text

              return (
                <tr
                  key={i}
                  style={{
                    background: isTopK ? 'rgba(77,216,138,0.04)' : 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    opacity: isTopK ? 1 : 0.45,
                  }}
                >
                  <td style={{ padding: '0.4rem 0.6rem' }}>
                    <div className="flex items-center gap-1.5">
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}></div>
                      <span style={{ color: 'var(--text)' }}>{text}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontFamily: 'monospace' }}>
                    <span style={{ color: similarityToColor(simForColor) }}>{score.toFixed(4)}</span>
                  </td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                    {isTopK ? (
                      <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(77,216,138,0.15)', color: 'var(--green)', fontSize: '0.55rem' }}>
                        #{i + 1}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Real-world note */}
      <div className="mt-2 text-xs font-mono p-2 rounded" style={{ background: 'var(--surface2)', color: 'var(--muted)', fontSize: '0.55rem' }}>
        <strong style={{ color: 'var(--accent)' }}>In production:</strong> Vector DBs (Pinecone, Weaviate, Qdrant) use approximate nearest neighbor (ANN) algorithms like HNSW or IVF to avoid brute-force comparison against millions of vectors. Same math, smarter indexing.
      </div>
    </div>
  )
}
