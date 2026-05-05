import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import EmbedRequest, QueryRequest
from embeddings import embed_texts, SUPPORTED_MODELS
from projections import project_to_3d
from similarity import cosine_similarity, euclidean_distance

app = FastAPI(title="Vector Search Visualizer API")

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

# In-memory cache: (model, text) -> vector
_embed_cache: dict[tuple[str, str], np.ndarray] = {}


@app.get("/api/models")
def list_models():
    return {"models": SUPPORTED_MODELS}


@app.post("/api/embed")
def embed(req: EmbedRequest):
    if not req.texts:
        raise HTTPException(400, "No texts provided")
    if len(req.texts) > 20:
        raise HTTPException(400, "Maximum 20 texts per request")
    if req.model not in SUPPORTED_MODELS:
        raise HTTPException(400, f"Unsupported model. Choose from: {list(SUPPORTED_MODELS.keys())}")

    result = embed_texts(req.texts, req.model)
    vectors = result["vectors"]

    # Cache vectors
    for i, text in enumerate(req.texts):
        _embed_cache[(req.model, text)] = vectors[i]

    # Project to 3D
    proj = project_to_3d(vectors)

    return {
        "model": req.model,
        "dim": result["dim"],
        "tokens": result["tokens"],
        "token_ids": [ids[:20] for ids in result["token_ids"]],  # Truncate for payload size
        "vectors_full": [v[:16].tolist() for v in vectors],  # First 16 dims only
        "vectors_3d": proj["vectors_3d"],
        "pca_explained_variance": proj["explained_variance"],
    }


@app.post("/api/query")
def query(req: QueryRequest):
    if not req.query:
        raise HTTPException(400, "No query provided")
    if not req.documents:
        raise HTTPException(400, "No documents provided")
    if req.model not in SUPPORTED_MODELS:
        raise HTTPException(400, f"Unsupported model. Choose from: {list(SUPPORTED_MODELS.keys())}")

    # Embed all texts together (docs + query) for consistent PCA
    all_texts = req.documents + [req.query]
    result = embed_texts(all_texts, req.model)
    vectors = result["vectors"]

    doc_vectors = vectors[:-1]
    query_vector = vectors[-1]

    # Cache
    for i, text in enumerate(all_texts):
        _embed_cache[(req.model, text)] = vectors[i]

    # Project all together for consistent PCA
    proj = project_to_3d(vectors)
    all_3d = proj["vectors_3d"]
    doc_3d = all_3d[:-1]
    query_3d = all_3d[-1]

    # Compute similarities in full-dim space
    docs_result = []
    cosine_scores = []
    euclidean_scores = []

    for i, doc_text in enumerate(req.documents):
        cos_sim = cosine_similarity(query_vector, doc_vectors[i])
        euc_dist = euclidean_distance(query_vector, doc_vectors[i])
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

    return {
        "query": {
            "text": req.query,
            "tokens": result["tokens"][-1],
            "token_ids": result["token_ids"][-1][:20],
            "vector_full": query_vector[:16].tolist(),
            "vector_3d": query_3d,
        },
        "documents": docs_result,
        "pca_explained_variance": proj["explained_variance"],
        "model": req.model,
        "dim": result["dim"],
    }


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
