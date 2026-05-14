# Vector Search Visualizer

Interactive 3D visualization of how text is tokenized, embedded into vectors, and retrieved via semantic search.

## Quick Start

### 1. Backend (Python)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
Backend runs on http://localhost:8000

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

### 3. Open the app
Visit http://localhost:5173 or use the "Vector Search" tab in the main Visual Learning page.

## API Endpoints
- `GET /api/models` — List available embedding models
- `POST /api/embed` — Tokenize and embed documents
- `POST /api/query` — Semantic search with similarity scores

## Default model
`all-MiniLM-L6-v2` (384 dimensions, runs on CPU)
