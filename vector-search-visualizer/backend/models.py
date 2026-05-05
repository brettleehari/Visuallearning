from pydantic import BaseModel

class EmbedRequest(BaseModel):
    texts: list[str]
    model: str = "all-MiniLM-L6-v2"

class QueryRequest(BaseModel):
    query: str
    documents: list[str]
    model: str = "all-MiniLM-L6-v2"
