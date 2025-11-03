import requests

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import time
import math
import re
from collections import Counter
from typing import Dict, List, Tuple



WIKI_API = (
    "https://en.wikipedia.org/w/api.php"
    "?action=query&prop=extracts%7Ccategories&explaintext=1&format=json&cllimit=max&titles={title}"
)

# A compact English stopword list (expand if you like)
STOPWORDS = {
    "a","an","and","are","as","at","be","but","by","for","from","has","have","had","he","her","his","i",
    "in","is","it","its","of","on","or","our","she","that","the","their","them","they","this","to",
    "was","were","will","with","you","your","yours","we","us","not","which","who","whom","what","when",
    "where","why","how","than","then","so","also","into","between","within","over","under","may","can",
    "could","would","should","such","there","these","those","been","being","because","through","after",
    "before","about","up","out","no","yes","one","two","three"
}

def fetch_wiki_text(title: str, session: requests.Session = None, pause: float = 0.2) -> Tuple[str, List[str]]:
    """Fetch plain-text extract and categories for a Wikipedia title."""
    s = session or requests.Session()
    headers = {
        "User-Agent": "WikiSimilarityBot/1.0, contact: you@you.org"
    }
    url = WIKI_API.format(title=requests.utils.quote(title))
    r = s.get(url, headers=headers, timeout=20)
    if r.status_code == 403:
        raise RuntimeError(f"Forbidden (403) when fetching {title}. Check user-agent or throttling.")
    r.raise_for_status()
    data = r.json()
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return "", []
    page = next(iter(pages.values()))
    extract = page.get("extract", "") or ""
    cats = [c.get("title", "") for c in page.get("categories", [])] if page.get("categories") else []
    time.sleep(pause)
    return extract, cats


TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z\-']{1,}")  # words with letters, allow - and '

def tokenize(text: str) -> List[str]:
    text = text.lower()
    # Strip simple apostrophes like "science's" -> "science"
    text = re.sub(r"(\w)'s\b", r"\1", text)
    toks = TOKEN_RE.findall(text)
    # Keep tokens with at least 3 alphabetic characters total (ignore hyphen/apostrophe)
    clean = []
    for t in toks:
        raw = t.replace("-", "").replace("'", "")
        if len(raw) >= 3 and raw not in STOPWORDS:
            clean.append(raw)
    return clean

def build_counts_per_doc(docs: Dict[str, str]) -> Dict[str, Counter]:
    """Return per-document token counts."""
    per_doc_counts = {}
    for title, text in docs.items():
        toks = tokenize(text)
        per_doc_counts[title] = Counter(toks)
    return per_doc_counts

def document_frequency(per_doc_counts: Dict[str, Counter]) -> Counter:
    """How many documents each term appears in (DF)."""
    df = Counter()
    for counts in per_doc_counts.values():
        for w in counts.keys():
            df[w] += 1
    return df

def select_shared_vocab(
    per_doc_counts: Dict[str, Counter],
    min_docs: int = 2,
    max_global_frac: float = 0.5,
    min_df: int = None,
    max_terms: int = 300,
) -> List[str]:
    """
    Choose a vocabulary that:
      - appears in at least `min_docs` different articles,
      - is not 'too common' globally (DF / N_docs <= max_global_frac),
      - then rank by a simple TF-IDF-like score across the corpus and keep top `max_terms`.
    """
    N = len(per_doc_counts)
    df = document_frequency(per_doc_counts)

    # Filter by DF: ensure overlap and avoid super-common terms
    min_df = min_df if min_df is not None else min_docs
    candidates = {w for w, d in df.items() if d >= min_df and d / N <= max_global_frac}

    # Compute a corpus-level TF-IDF-ish score to prefer informative words
    # score(w) = (sum over docs of tf_doc(w)) * idf(w), where idf = log(1 + N/(1+df))
    def idf(d): return math.log(1.0 + N / (1.0 + d))
    scores = {}
    for w in candidates:
        tf_sum = sum(per_doc_counts[doc][w] for doc in per_doc_counts)
        scores[w] = tf_sum * idf(df[w])

    # Keep the top max_terms
    vocab = sorted(scores.keys(), key=lambda w: scores[w], reverse=True)[:max_terms]
    return vocab

def counts_matrix(per_doc_counts: Dict[str, Counter], vocab: List[str]) -> pd.DataFrame:
    rows = []
    for title, counts in per_doc_counts.items():
        row = {w: counts.get(w, 0) for w in vocab}
        row["_total_tokens"] = sum(counts.values())
        row["_unique_tokens"] = len(counts)
        rows.append((title, row))
    df = pd.DataFrame.from_dict(dict(rows), orient="index")
    df.index.name = "Article"
    # Put meta columns first
    meta = ["_total_tokens", "_unique_tokens"]
    cols = meta + [w for w in vocab]
    return df.loc[:, cols]


# Exposed Code

def build_counts_df(titles):
    # titles = ["Mathematics","Physics","Chemistry","Food science","Nutritional science","Baking"]

    session = requests.Session()
    docs_text: Dict[str, str] = {}
    cats_by_title: Dict[str, List[str]] = {}
    for t in titles:
        text, cats = fetch_wiki_text(t, session=session, pause=0.25)
        docs_text[t] = text
        cats_by_title[t] = cats

    # 2) Build raw token counts per doc
    per_doc_counts = build_counts_per_doc(docs_text)

    # 3) Pick a shared vocabulary:
    #    - must appear in >=2 docs
    #    - must not appear in >50% of docs
    #    - keep up to 300 features
    vocab = select_shared_vocab(
        per_doc_counts,
        min_docs=2,
        max_global_frac=0.5,
        max_terms=300
    )

    # 4) Make the counts table
    df_counts = counts_matrix(per_doc_counts, vocab)

    return df_counts

def cosine_similarity_matrix(df_counts: pd.DataFrame) -> pd.DataFrame:
    # Drop metadata columns (assuming first two are non-feature)
    X = df_counts.iloc[:, 2:].to_numpy(dtype=float)
    # Normalize each row to unit length
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    X_normed = X / np.where(norms == 0, 1, norms)
    # Compute pairwise cosine similarity: X_normed @ X_normed.T
    sim = X_normed @ X_normed.T
    return pd.DataFrame(sim, index=df_counts.index, columns=df_counts.index)
