from sentence_transformers import SentenceTransformer
from functools import lru_cache

_model_cache: dict[str, SentenceTransformer] = {}

SUPPORTED_MODELS = {
    "all-MiniLM-L6-v2": {"dim": 384, "name": "all-MiniLM-L6-v2"},
    "all-mpnet-base-v2": {"dim": 768, "name": "all-mpnet-base-v2"},
}

def get_model(model_name: str) -> SentenceTransformer:
    if model_name not in _model_cache:
        _model_cache[model_name] = SentenceTransformer(model_name)
    return _model_cache[model_name]

def embed_texts(texts: list[str], model_name: str) -> dict:
    model = get_model(model_name)
    vectors = model.encode(texts, convert_to_numpy=True)
    tokenizer = model.tokenizer

    all_tokens = []
    all_token_ids = []
    for text in texts:
        encoded = tokenizer(text, return_tensors=None)
        ids = encoded["input_ids"]
        tokens = tokenizer.convert_ids_to_tokens(ids)
        all_tokens.append(tokens)
        all_token_ids.append(ids)

    return {
        "vectors": vectors,
        "tokens": all_tokens,
        "token_ids": all_token_ids,
        "dim": vectors.shape[1],
    }
