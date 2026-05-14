import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { embedTexts } from '../lib/api'
import { TokenChips } from './TokenChips'

const SAMPLE_DOCS = [
  'The cat sat on the warm mat by the fireplace.',
  'Dogs love to run and play fetch in the park.',
  'Stock markets experienced a sharp decline today.',
  'Machine learning models require large datasets to train.',
  'The quick brown fox jumps over the lazy dog.',
]

export function DocumentInput() {
  const [inputText, setInputText] = useState(SAMPLE_DOCS.join('\n'))
  const { model, isEmbedding, setDocuments, setIsEmbedding, setDim, setPcaVariance, setError, setQuery } = useAppStore()
  const documents = useAppStore(s => s.documents)
  const showTokens = useAppStore(s => s.showTokens)

  async function handleEmbed() {
    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    if (lines.length > 20) { setError('Maximum 20 documents'); return }

    setIsEmbedding(true)
    setError(null)
    setQuery(null)

    try {
      const data = await embedTexts(lines, model)
      const docs = lines.map((text, i) => ({
        text,
        tokens: data.tokens[i],
        tokenIds: data.token_ids[i],
        vectorFull: data.vectors_full[i],
        vector3d: data.vectors_3d[i] as [number, number, number],
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
    <div className="flex flex-col gap-3 h-full">
      <div className="text-xs font-mono tracking-wider" style={{ color: 'var(--accent)' }}>
        DOCUMENTS
      </div>
      <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        placeholder="Paste 3-7 sentences, one per line..."
        rows={8}
        className="flex-1 rounded-lg p-3 text-sm resize-none outline-none"
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: "'Source Sans 3', sans-serif",
        }}
      />

      <button
        onClick={handleEmbed}
        disabled={isEmbedding}
        className="px-4 py-2 rounded-lg font-mono text-xs tracking-wider transition-all cursor-pointer disabled:opacity-50"
        style={{
          background: 'rgba(77,166,232,0.15)',
          color: 'var(--blue)',
          border: '1px solid rgba(77,166,232,0.3)',
        }}
      >
        {isEmbedding ? 'Embedding...' : 'Embed Documents'}
      </button>

      {showTokens && documents.length > 0 && (
        <div className="overflow-y-auto max-h-40" style={{ background: 'var(--surface2)', borderRadius: 6, padding: '0.5rem' }}>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--muted)' }}>TOKENIZATION</div>
          {documents.slice(0, 3).map((doc, i) => (
            <TokenChips key={i} tokens={doc.tokens || []} index={i} />
          ))}
          {documents.length > 3 && (
            <div className="text-xs" style={{ color: 'var(--muted)' }}>+{documents.length - 3} more...</div>
          )}
        </div>
      )}
    </div>
  )
}
