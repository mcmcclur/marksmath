import re, time, requests
from urllib.parse import quote
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from sentence_transformers import SentenceTransformer



UA = {"User-Agent": "WikiSimilarityBot/1.0, contact: you@you.org"}
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# ---- Wikipedia fetchers ----
def fetch_full_text_and_cats(title, retries=3, backoff=0.7):
    """
    Get full plaintext + categories for a Wikipedia title.
    Returns (resolved_title, text, categories_list).
    """
    url = (
        "https://en.wikipedia.org/w/api.php?"
        f"action=query&prop=extracts|categories&explaintext=1&format=json&cllimit=max&titles={quote(title)}"
    )
    for k in range(retries):
        r = requests.get(url, headers=UA, timeout=30)
        if r.status_code == 200:
            j = r.json()
            page = next(iter(j["query"]["pages"].values()))
            resolved = page.get("title", title)
            text = page.get("extract", "")
            cats = [c["title"].replace("Category:", "") for c in page.get("categories", [])]
            return resolved, text, cats
        time.sleep(backoff * (k + 1))
    return title, "", []

# ---- Light cleaning & chunking ----
def clean_text(s):
    s = s.replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def split_into_paragraphs(s, min_len=200):
    paras = [p.strip() for p in s.split("\n") if p.strip()]
    # Merge short paragraphs to avoid tons of tiny chunks
    merged = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) < min_len:
            buf = (buf + " " + p).strip()
        else:
            if buf: merged.append(buf); buf = ""
            merged.append(p)
    if buf:
        merged.append(buf)
    return merged

# ---- Embedding (sentence-transformers) ----
def build_embedding(text, model, batch_size=32, normalize=True):
    """
    Mean-pool paragraph embeddings for robust long-doc representation.
    """
    paras = split_into_paragraphs(clean_text(text))
    if not paras:
        paras = [""]
    emb = model.encode(paras, batch_size=batch_size, normalize_embeddings=normalize)
    doc_vec = emb.mean(axis=0)
    if normalize:
        n = np.linalg.norm(doc_vec)
        if n > 0: doc_vec = doc_vec / n
    return doc_vec

# ---- Category similarity ----
# def jaccard(a, b):
#     A, B = set(a), set(b)
#     if not A and not B: return 1.0
#     if not A or not B: return 0.0
#     return len(A & B) / len(A | B)

# def top_overlap(a, b, k=15):
#     A, B = set(a), set(b)
#     overlap = sorted(A & B)
#     return overlap[:k], len(A & B)

# ---- Main demo ----
def cosineTransformerSimilarity(TITLES):
    items = []
    for t in TITLES:
        rt, txt, cats = fetch_full_text_and_cats(t)
        items.append({"title": rt, "text": txt, "cats": cats})

    model = SentenceTransformer(MODEL_NAME)

    vecs = np.vstack([build_embedding(it["text"], model) for it in items])

    # Cosine similarity (embeddings are normalized → dot = cosine)
    S = vecs @ vecs.T

    return S

