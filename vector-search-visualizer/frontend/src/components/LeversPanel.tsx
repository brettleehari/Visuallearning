import { useAppStore } from '../store/useAppStore'
import { embedTexts } from '../lib/api'

export function LeversPanel() {
  const { model, metric, showFormula, showTokens, documents, setModel, setMetric, setShowFormula, setShowTokens, setDocuments, setIsEmbedding, setDim, setPcaVariance, setQuery, setError } = useAppStore()

  async function handleModelChange(newModel: string) {
    setModel(newModel)
    if (documents.length === 0) return

    // Re-embed everything with new model
    setIsEmbedding(true)
    setQuery(null)
    setError(null)
    try {
      const data = await embedTexts(documents.map(d => d.text), newModel)
      const docs = documents.map((doc, i) => ({
        ...doc,
        tokens: data.tokens[i],
        tokenIds: data.token_ids[i],
        vectorFull: data.vectors_full[i],
        vector3d: data.vectors_3d[i] as [number, number, number],
        cosineSimilarity: undefined,
        euclideanDistance: undefined,
        rankCosine: undefined,
        rankEuclidean: undefined,
      }))
      setDocuments(docs)
      setDim(data.dim)
      setPcaVariance(data.pca_explained_variance)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsEmbedding(false)
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
      {/* Model selector */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--muted)' }}>MODEL:</span>
        <select
          value={model}
          onChange={e => handleModelChange(e.target.value)}
          className="rounded px-2 py-1 text-xs font-mono outline-none cursor-pointer"
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384d)</option>
          <option value="all-mpnet-base-v2">all-mpnet-base-v2 (768d)</option>
        </select>
      </div>

      {/* Metric toggle */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--muted)' }}>METRIC:</span>
        <button
          onClick={() => setMetric('cosine')}
          className="px-2 py-1 rounded transition-all"
          style={{
            background: metric === 'cosine' ? 'rgba(232,160,52,0.12)' : 'var(--surface2)',
            color: metric === 'cosine' ? 'var(--accent)' : 'var(--muted)',
            border: `1px solid ${metric === 'cosine' ? 'rgba(232,160,52,0.3)' : 'var(--border)'}`,
          }}
        >
          Cosine
        </button>
        <button
          onClick={() => setMetric('euclidean')}
          className="px-2 py-1 rounded transition-all"
          style={{
            background: metric === 'euclidean' ? 'rgba(232,160,52,0.12)' : 'var(--surface2)',
            color: metric === 'euclidean' ? 'var(--accent)' : 'var(--muted)',
            border: `1px solid ${metric === 'euclidean' ? 'rgba(232,160,52,0.3)' : 'var(--border)'}`,
          }}
        >
          Euclidean
        </button>
      </div>

      {/* Toggles */}
      <label className="flex items-center gap-1 cursor-pointer" style={{ color: 'var(--muted)' }}>
        <input type="checkbox" checked={showFormula} onChange={e => setShowFormula(e.target.checked)} className="accent-amber-500" />
        Formulas
      </label>
      <label className="flex items-center gap-1 cursor-pointer" style={{ color: 'var(--muted)' }}>
        <input type="checkbox" checked={showTokens} onChange={e => setShowTokens(e.target.checked)} className="accent-amber-500" />
        Tokens
      </label>

      {/* Reset */}
      <button
        onClick={() => useAppStore.getState().reset()}
        className="ml-auto px-3 py-1 rounded transition-all"
        style={{ background: 'rgba(232,84,84,0.08)', color: 'var(--red)', border: '1px solid rgba(232,84,84,0.2)' }}
      >
        Reset
      </button>
    </div>
  )
}
