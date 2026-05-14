import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { querySearch } from '../lib/api'

export function QueryBar() {
  const [queryText, setQueryText] = useState('Where did the cat sit?')
  const { documents, model, isQuerying, setQuery, setDocuments, setIsQuerying, setPcaVariance, setError, setDim } = useAppStore()

  async function handleSearch() {
    if (!queryText.trim() || documents.length === 0) return
    setIsQuerying(true)
    setError(null)

    try {
      const data = await querySearch(queryText, documents.map(d => d.text), model)

      setQuery({
        text: data.query.text,
        tokens: data.query.tokens,
        vectorFull: data.query.vector_full,
        vector3d: data.query.vector_3d,
      })

      const updatedDocs = documents.map((doc, i) => ({
        ...doc,
        vector3d: data.documents[i].vector_3d,
        vectorFull: data.documents[i].vector_full,
        cosineSimilarity: data.documents[i].cosine_similarity,
        euclideanDistance: data.documents[i].euclidean_distance,
        rankCosine: data.documents[i].rank_cosine,
        rankEuclidean: data.documents[i].rank_euclidean,
      }))
      setDocuments(updatedDocs)
      setPcaVariance(data.pca_explained_variance)
      setDim(data.dim)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="text-xs font-mono tracking-wider mr-2" style={{ color: '#ffd700' }}>
        QUERY
      </div>
      <input
        value={queryText}
        onChange={e => setQueryText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="Type a natural language question..."
        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        style={{
          background: 'var(--surface2)',
          border: '1px solid rgba(255,215,0,0.2)',
          color: 'var(--text)',
        }}
      />
      <button
        onClick={handleSearch}
        disabled={isQuerying || documents.length === 0}
        className="px-4 py-2 rounded-lg font-mono text-xs tracking-wider transition-all cursor-pointer disabled:opacity-50"
        style={{
          background: 'rgba(255,215,0,0.12)',
          color: '#ffd700',
          border: '1px solid rgba(255,215,0,0.3)',
        }}
      >
        {isQuerying ? 'Searching...' : 'Search'}
      </button>
    </div>
  )
}
