"""Vérification du défi du module 2 : ta recherche hybride dans Postgres, hybrid.py.

Usage, depuis la racine du fork, avec ton Postgres pgvector de la leçon 8 démarré :
    uv run --project mon-travail/module-02 python site/checks/defi-02.py mon-travail/module-02/defi/hybrid.py

Sans chemin, le script cherche hybrid.py dans mon-travail/.
La base par défaut est celle de la leçon 8 : postgresql://user:pswd@localhost:5432/faq
(une autre avec la variable PG_URL). Le script repart de zéro : il supprime la table defi_docs,
et seulement elle, avant de lancer ton ingestion.
Les données sont figées dans site/checks/data/ : 40 entrées de la FAQ, avec leurs embeddings
calculés par all-MiniLM-L6-v2. Pas de modèle à charger, pas d'appel payant.
Le script compare des empreintes : il ne contient pas les résultats attendus.
"""
import glob
import hashlib
import importlib.util
import json
import os
import sys
from pathlib import Path

LABELS = [
    "La colonne embedding est un vector(384)",
    "Un index HNSW en distance cosinus",
    "Un index GIN sur une colonne tsvector",
    "L'ingestion relancée ne crée pas de doublon et met à jour",
    "La recherche vectorielle retrouve Ollama malgré la faute",
    "La recherche plein texte trouve le mot exact",
    "Le filtre par cours ne laisse rien passer d'autre",
    "Un cours inconnu lève une ValueError",
    "La fusion RRF classe les documents comme prévu",
    "Une requête piégée ne casse rien",
]

EXPECTED = [
    "3d21d8a7d491ab4c",
    "e2ada1a8c6c62377",
    "8c788fd0badab03b",
    "3d47b8a5de8c8344",
    "6aecf76cdb981915",
    "f2df41a45f50ec56",
    "1656891a9d8894c9",
    "d4d3baecaa90a0ce",
    "e7ad592c9eac7749",
    "ce1f16f4345895a1",
]

DATA = Path(__file__).resolve().parent / "data"
TABLE = "defi_docs"
LLM, DE = "llm-zoomcamp", "data-engineering-zoomcamp"


def ids(results):
    return ",".join(d["id"] for d in results)


def t_column(h, conn, corpus, Q):
    row = conn.execute(
        "SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a "
        "WHERE a.attrelid = %s::regclass AND a.attname = 'embedding' AND NOT a.attisdropped", (TABLE,)).fetchone()
    return row[0] if row else ""


def t_hnsw(h, conn, corpus, Q):
    defs = [r[0].lower() for r in conn.execute("SELECT indexdef FROM pg_indexes WHERE tablename = %s", (TABLE,))]
    return "hnsw|vector_cosine_ops" if any("using hnsw" in d and "vector_cosine_ops" in d for d in defs) else "|".join(defs)


def t_gin(h, conn, corpus, Q):
    cols = [r[0] for r in conn.execute(
        "SELECT a.attname FROM pg_attribute a WHERE a.attrelid = %s::regclass AND a.atttypid = 'tsvector'::regtype "
        "AND NOT a.attisdropped", (TABLE,))]
    defs = [r[0].lower() for r in conn.execute("SELECT indexdef FROM pg_indexes WHERE tablename = %s", (TABLE,))]
    ok = any(f"using gin ({c})" in d for c in cols for d in defs)
    return f"tsvector|gin|{ok}" if cols else "pas de colonne tsvector"


def t_idempotent(h, conn, corpus, Q):
    h.ingest(conn, corpus)
    first = conn.execute(f"SELECT count(*) FROM {TABLE}").fetchone()[0]
    changed = [dict(d) for d in corpus]
    changed[0]["answer"] = "Updated answer for the check."
    h.ingest(conn, changed)
    second = conn.execute(f"SELECT count(*) FROM {TABLE}").fetchone()[0]
    answer = conn.execute(f"SELECT answer FROM {TABLE} WHERE id = %s", (corpus[0]["id"],)).fetchone()[0]
    h.ingest(conn, corpus)
    return f"{first}|{second}|{answer}"


def t_vector(h, conn, corpus, Q):
    return ids(h.search_vector(conn, Q["How do I run Olama locally?"], LLM, k=3))


def t_text(h, conn, corpus, Q):
    return ids(h.search_text(conn, "Groq", LLM, k=3))


def t_filter(h, conn, corpus, Q):
    res = h.search_vector(conn, Q["Can I still sign up after the course has started?"], DE, k=5)
    return f"{sorted({d['course'] for d in res})}|{ids(res)}"


def t_unknown(h, conn, corpus, Q):
    out = []
    for call in (lambda: h.search_vector(conn, Q["Is the certificate free?"], "llm-zoomcap"),
                 lambda: h.search_text(conn, "certificate", "llm-zoomcap")):
        try:
            call()
            out.append("pas d'erreur")
        except ValueError:
            out.append("valueerror")
        except Exception as e:
            conn.rollback()
            out.append(type(e).__name__)
    return "|".join(out)


def t_hybrid(h, conn, corpus, Q):
    q = "How do I use a model other than OpenAI?"
    return ids(h.search_hybrid(conn, q, Q[q], LLM, k=5))


def t_injection(h, conn, corpus, Q):
    try:
        res = h.search_text(conn, "'; DROP TABLE defi_docs; --", LLM, k=3)
        n = len(res)
    except Exception as e:
        conn.rollback()
        n = type(e).__name__
    count = conn.execute(f"SELECT count(*) FROM {TABLE}").fetchone()[0]
    return f"{n}|{count}"


TESTS = [t_column, t_hnsw, t_gin, t_idempotent, t_vector, t_text, t_filter, t_unknown, t_hybrid, t_injection]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def normalize(value):
    return str(value).strip().lower()


def load(path):
    spec = importlib.util.spec_from_file_location("hybrid", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def values_of(h, conn):
    corpus = json.loads((DATA / "defi-02-corpus.json").read_text())
    Q = json.loads((DATA / "defi-02-queries.json").read_text())
    conn.execute(f"DROP TABLE IF EXISTS {TABLE}")
    conn.commit()
    out = []
    try:
        h.ingest(conn, corpus)
    except Exception as e:
        conn.rollback()
        msg = f"ingest a planté : {type(e).__name__}: {str(e).splitlines()[0][:200] if str(e) else ''}"
        return [("", msg)] * len(TESTS)
    for test in TESTS:
        try:
            out.append((normalize(test(h, conn, corpus, Q)), ""))
        except Exception as e:  # une fonction absente ou qui plante : on l'affiche
            conn.rollback()
            out.append(("", f"{type(e).__name__}: {str(e).splitlines()[0][:200] if str(e) else ''}"))
    return out


def find_file():
    if len(sys.argv) > 1:
        return sys.argv[1]
    found = [p for p in glob.glob("mon-travail/**/hybrid.py", recursive=True) if ".venv" not in p]
    if len(found) != 1:
        sys.exit("❌ Donne le chemin de ton fichier : python site/checks/defi-02.py <chemin>/hybrid.py")
    return found[0]


def check(h, conn):
    print("Défi du module 2 : vérification de ta recherche hybride dans Postgres")
    print()
    ok, values = 0, []
    for label, (value, error), expected in zip(LABELS, values_of(h, conn), EXPECTED):
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            print(f"   Réponse : {error or value or '(rien)'}")
        values.append(value)
    print()
    if ok == len(LABELS):
        code = hashlib.sha256("|".join(values).encode()).hexdigest()[:8]
        print(f"🎉 Tout est vert. Ton code de réussite : {code}")
        print("   Entre-le sur la page du défi pour le valider.")
        return True
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige et relance le script.")
    return False


if __name__ == "__main__":
    import psycopg

    path = find_file()
    if not os.path.isfile(path):
        sys.exit(f"❌ Fichier introuvable : {path}")
    module = load(path)
    url = os.environ.get("PG_URL", "postgresql://user:pswd@localhost:5432/faq")
    try:
        conn = psycopg.connect(url)
    except Exception as e:
        sys.exit(f"❌ Pas de connexion à Postgres ({e}). Démarre le conteneur pgvector de la leçon 8.")
    sys.exit(0 if check(module, conn) else 1)
