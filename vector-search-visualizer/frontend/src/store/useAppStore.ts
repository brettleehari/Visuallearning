import { create } from 'zustand'

export interface DocEntry {
  text: string
  tokens?: string[]
  tokenIds?: number[]
  vectorFull?: number[]
  vector3d?: [number, number, number]
  cosineSimilarity?: number
  euclideanDistance?: number
  rankCosine?: number
  rankEuclidean?: number
}

export interface QueryResult {
  text: string
  tokens?: string[]
  vectorFull?: number[]
  vector3d?: [number, number, number]
}

interface AppState {
  documents: DocEntry[]
  query: QueryResult | null
  model: string
  metric: 'cosine' | 'euclidean'
  dim: number
  pcaVariance: number[]
  isEmbedding: boolean
  isQuerying: boolean
  showFormula: boolean
  showTokens: boolean
  error: string | null

  setDocuments: (docs: DocEntry[]) => void
  setQuery: (q: QueryResult | null) => void
  setModel: (m: string) => void
  setMetric: (m: 'cosine' | 'euclidean') => void
  setDim: (d: number) => void
  setPcaVariance: (v: number[]) => void
  setIsEmbedding: (b: boolean) => void
  setIsQuerying: (b: boolean) => void
  setShowFormula: (b: boolean) => void
  setShowTokens: (b: boolean) => void
  setError: (e: string | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  documents: [],
  query: null,
  model: 'all-MiniLM-L6-v2',
  metric: 'cosine',
  dim: 384,
  pcaVariance: [0, 0, 0],
  isEmbedding: false,
  isQuerying: false,
  showFormula: false,
  showTokens: true,
  error: null,

  setDocuments: (docs) => set({ documents: docs }),
  setQuery: (q) => set({ query: q }),
  setModel: (m) => set({ model: m }),
  setMetric: (m) => set({ metric: m }),
  setDim: (d) => set({ dim: d }),
  setPcaVariance: (v) => set({ pcaVariance: v }),
  setIsEmbedding: (b) => set({ isEmbedding: b }),
  setIsQuerying: (b) => set({ isQuerying: b }),
  setShowFormula: (b) => set({ showFormula: b }),
  setShowTokens: (b) => set({ showTokens: b }),
  setError: (e) => set({ error: e }),
  reset: () => set({ documents: [], query: null, pcaVariance: [0,0,0], error: null }),
}))
