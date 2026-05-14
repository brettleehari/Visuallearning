import { useAppStore } from '../store/useAppStore'
import { getDocColor, similarityToColor } from '../lib/colors'
import { TokenChips } from './TokenChips'

export function ResultsPanel() {
  const documents = useAppStore(s => s.documents)
  const query = useAppStore(s => s.query)
  const metric = useAppStore(s => s.metric)
  const showTokens = useAppStore(s => s.showTokens)

  if (!query) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--muted)' }}>
        Embed documents, then search to see results
      </div>
    )
  }

  const sorted = [...documents]
    .filter(d => d.cosineSimilarity !== undefined)
    .sort((a, b) => {
      if (metric === 'cosine') return (b.cosineSimilarity || 0) - (a.cosineSimilarity || 0)
      return (a.euclideanDistance || 0) - (b.euclideanDistance || 0)
    })

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      <div className="text-xs font-mono tracking-wider" style={{ color: 'var(--green)' }}>
        SEARCH RESULTS
      </div>

      {showTokens && query.tokens && (
        <div className="rounded p-2" style={{ background: 'var(--surface2)' }}>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--muted)' }}>QUERY TOKENS</div>
          <TokenChips tokens={query.tokens} index={0} isQuery />
        </div>
      )}

      {sorted.map((doc, i) => {
        const origIdx = documents.indexOf(doc)
        const rank = metric === 'cosine' ? doc.rankCosine : doc.rankEuclidean
        const cosSim = doc.cosineSimilarity || 0
        const eucDist = doc.euclideanDistance || 0
        const isTopResult = i === 0

        // Bar width for visual score
        const cosBarWidth = Math.round(cosSim * 100)
        const eucBarWidth = Math.round(Math.max(0, (1 - eucDist / 2)) * 100)

        return (
          <div
            key={i}
            className="rounded-lg overflow-hidden transition-all"
            style={{
              background: 'var(--surface2)',
              border: isTopResult ? `2px solid ${getDocColor(origIdx)}` : `1px solid ${getDocColor(origIdx)}30`,
            }}
          >
            {/* Header with rank + text */}
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-start gap-2">
                <span
                  className="font-mono text-sm font-bold px-2 py-0.5 rounded shrink-0"
                  style={{
                    background: `${getDocColor(origIdx)}20`,
                    color: getDocColor(origIdx),
                    fontSize: '0.85rem',
                  }}
                >
                  #{rank}
                </span>
                <span className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.4 }}>{doc.text}</span>
              </div>
            </div>

            {/* Score bars */}
            <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
              {/* Cosine Similarity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono" style={{
                    fontSize: '0.65rem',
                    color: metric === 'cosine' ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: metric === 'cosine' ? 600 : 400,
                  }}>
                    {metric === 'cosine' ? '★ ' : ''}COSINE SIMILARITY
                  </span>
                  <span className="font-mono font-bold" style={{
                    fontSize: metric === 'cosine' ? '1rem' : '0.75rem',
                    color: similarityToColor(cosSim),
                  }}>
                    {cosSim.toFixed(4)}
                  </span>
                </div>
                <div style={{
                  height: metric === 'cosine' ? 8 : 4,
                  background: 'var(--surface)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${cosBarWidth}%`,
                    height: '100%',
                    background: similarityToColor(cosSim),
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* Euclidean Distance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono" style={{
                    fontSize: '0.65rem',
                    color: metric === 'euclidean' ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: metric === 'euclidean' ? 600 : 400,
                  }}>
                    {metric === 'euclidean' ? '★ ' : ''}EUCLIDEAN DISTANCE
                  </span>
                  <span className="font-mono font-bold" style={{
                    fontSize: metric === 'euclidean' ? '1rem' : '0.75rem',
                    color: similarityToColor(Math.max(0, 1 - eucDist / 2)),
                  }}>
                    {eucDist.toFixed(4)}
                  </span>
                </div>
                <div style={{
                  height: metric === 'euclidean' ? 8 : 4,
                  background: 'var(--surface)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${eucBarWidth}%`,
                    height: '100%',
                    background: similarityToColor(Math.max(0, 1 - eucDist / 2)),
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
