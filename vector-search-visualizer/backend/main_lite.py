"""
Lightweight vector search API using pre-computed embeddings.
No torch/sentence-transformers needed — just numpy + fastapi.
Fits easily in Render free tier (< 100MB RAM).
"""
import json
import os

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Visual Learning — Vector Search API (Lite)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://brettleehari.github.io",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pre-computed embeddings
_data_path = os.path.join(os.path.dirname(__file__), "precomputed_embeddings.json")
with open(_data_path) as f:
    PRECOMPUTED = json.load(f)

# Build lookup indexes
_doc_vectors = np.array([d["vector"] for d in PRECOMPUTED["documents"]])
_doc_texts = [d["text"] for d in PRECOMPUTED["documents"]]
_query_lookup = {q["text"].lower().strip(): q for q in PRECOMPUTED["queries"]}
# Also index all texts (docs + queries) for flexible matching
_all_texts_lookup = {}
for d in PRECOMPUTED["documents"]:
    _all_texts_lookup[d["text"].lower().strip()] = np.array(d["vector"])
for q in PRECOMPUTED["queries"]:
    _all_texts_lookup[q["text"].lower().strip()] = np.array(q["vector"])


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a - b))


def find_nearest_query(text: str) -> np.ndarray | None:
    """Find the most similar pre-computed query/doc vector using word overlap.
    Uses Jaccard + keyword weighting for better semantic matching."""
    text_lower = text.lower().strip()

    # Exact match first
    if text_lower in _all_texts_lookup:
        return _all_texts_lookup[text_lower]

    # Remove common stop words for better matching
    stop_words = {'what','is','the','a','an','how','do','does','tell','me','about',
                  'and','or','in','on','at','to','for','of','with','by','are','was',
                  'were','be','been','it','this','that','i','you','we','they','can',
                  'could','would','should'}
    text_words = set(text_lower.split()) - stop_words
    if not text_words:
        text_words = set(text_lower.split())

    best_score = 0
    best_vec = None
    for known_text, vec in _all_texts_lookup.items():
        known_words = set(known_text.split()) - stop_words
        if not known_words:
            known_words = set(known_text.split())
        overlap = len(text_words & known_words)
        if overlap == 0:
            continue
        # Weighted: prioritize overlap relative to query length (recall-oriented)
        score = overlap / max(len(text_words), 1) * 0.7 + overlap / max(len(known_words), 1) * 0.3
        if score > best_score:
            best_score = score
            best_vec = vec
    if best_score > 0.1:
        return best_vec
    return None


class QueryRequest(BaseModel):
    query: str
    documents: list[str]
    model: str = "all-MiniLM-L6-v2"


class EmbedRequest(BaseModel):
    texts: list[str]
    model: str = "all-MiniLM-L6-v2"


@app.get("/api/models")
def list_models():
    return {"models": {"all-MiniLM-L6-v2": {"dim": 384, "name": "all-MiniLM-L6-v2 (precomputed)"}}}


@app.post("/api/query")
def query(req: QueryRequest):
    if not req.query:
        raise HTTPException(400, "No query provided")
    if not req.documents:
        raise HTTPException(400, "No documents provided")

    # Find query vector
    query_vec = find_nearest_query(req.query)
    if query_vec is None:
        raise HTTPException(
            422,
            "Query not found in pre-computed set. Try a query about: AI, machine learning, neural networks, programming, weather, food, sports, climate, databases, or animals.",
        )

    # Find document vectors
    doc_vectors = []
    doc_tokens = []
    for doc_text in req.documents:
        vec = find_nearest_query(doc_text)
        if vec is None:
            # Fall back to the first pre-computed doc vector (imperfect but graceful)
            # Find the closest pre-computed doc by text overlap
            doc_lower = doc_text.lower().strip()
            best_idx = 0
            best_overlap = 0
            for i, known_doc in enumerate(_doc_texts):
                known_words = set(known_doc.lower().split())
                doc_words = set(doc_lower.split())
                overlap = len(known_words & doc_words)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_idx = i
            vec = _doc_vectors[best_idx]
            doc_tokens.append(PRECOMPUTED["documents"][best_idx]["tokens"])
        else:
            # Find the matching entry for tokens
            found_tokens = None
            for entry in PRECOMPUTED["documents"] + PRECOMPUTED["queries"]:
                if np.allclose(np.array(entry["vector"][:10]), vec[:10]):
                    found_tokens = entry["tokens"]
                    break
            doc_tokens.append(found_tokens or ["[UNK]"])
        doc_vectors.append(vec)

    doc_vectors_np = np.array(doc_vectors)

    # PCA projection to 3D
    all_vecs = np.vstack([doc_vectors_np, query_vec.reshape(1, -1)])
    if all_vecs.shape[0] >= 3:
        from sklearn.decomposition import PCA
        pca = PCA(n_components=3)
        projected = pca.fit_transform(all_vecs)
        explained = pca.explained_variance_ratio_.tolist()
    else:
        projected = all_vecs[:, :3]
        explained = [0.0, 0.0, 0.0]

    doc_3d = projected[:-1].tolist()
    query_3d = projected[-1].tolist()

    # Compute similarities
    cosine_scores = []
    euclidean_scores = []
    docs_result = []
    for i, doc_text in enumerate(req.documents):
        cos_sim = cosine_similarity(query_vec, doc_vectors[i])
        euc_dist = euclidean_distance(query_vec, doc_vectors[i])
        cosine_scores.append(cos_sim)
        euclidean_scores.append(euc_dist)
        docs_result.append({
            "text": doc_text,
            "vector_full": doc_vectors[i][:16].tolist(),
            "vector_3d": doc_3d[i],
            "cosine_similarity": round(cos_sim, 4),
            "euclidean_distance": round(euc_dist, 4),
        })

    # Rank
    cosine_ranks = sorted(range(len(cosine_scores)), key=lambda i: -cosine_scores[i])
    euclidean_ranks = sorted(range(len(euclidean_scores)), key=lambda i: euclidean_scores[i])
    for rank, idx in enumerate(cosine_ranks):
        docs_result[idx]["rank_cosine"] = rank + 1
    for rank, idx in enumerate(euclidean_ranks):
        docs_result[idx]["rank_euclidean"] = rank + 1

    # Query tokens
    query_entry = _query_lookup.get(req.query.lower().strip())
    query_tokens = query_entry["tokens"] if query_entry else ["[approx]"]
    query_token_ids = query_entry["token_ids"] if query_entry else []

    return {
        "query": {
            "text": req.query,
            "tokens": query_tokens,
            "token_ids": query_token_ids[:20],
            "vector_full": query_vec[:16].tolist(),
            "vector_3d": query_3d,
        },
        "documents": docs_result,
        "pca_explained_variance": explained,
        "model": "all-MiniLM-L6-v2 (precomputed)",
        "dim": PRECOMPUTED["dim"],
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "precomputed_docs": len(PRECOMPUTED["documents"]),
        "precomputed_queries": len(PRECOMPUTED["queries"]),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
