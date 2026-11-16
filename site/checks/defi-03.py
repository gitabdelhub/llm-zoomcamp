"""Vérification du défi du module 3 : ton ingestion incrémentale des embeddings, faq_incremental.py.

Usage, depuis le dossier de ton Airflow (mon-travail/module-03/airflow), avec les conteneurs démarrés :
    docker compose exec -T airflow-scheduler python - /opt/airflow/dags/faq_incremental.py < ../../../site/checks/defi-03.py

Le script tourne dans le conteneur, avec ton Airflow et ta connexion pgvector (AIRFLOW_CONN_PGVECTOR).
Il n'utilise ni le modèle d'embeddings ni l'API : un faux embed_batch compte les textes qu'il reçoit.
Il travaille dans ses propres tables, defi_sync et defi_sync_lots, qu'il supprime avant de commencer.
Ta table faq_sync n'est pas touchée. Le script compare des empreintes : il ne contient pas les résultats attendus.
"""
import hashlib
import importlib.util
import os
import sys

LABELS = [
    "doc_hash suit la règle de l'énoncé",
    "La première synchronisation ajoute tout",
    "La table a les bonnes colonnes",
    "Relancée sans changement, rien n'est recalculé",
    "Une réponse modifiée : un seul embedding recalculé",
    "Un changement de cours seul : aucun embedding, la ligne à jour",
    "Une entrée retirée de la FAQ disparaît de la table",
    "Un échec d'embedding ne laisse pas la table à moitié écrite",
    "Les textes partent par lots de 50 au plus",
    "Le DAG est planifié, protégé et déclare son asset",
]

EXPECTED = [
    "1175cb937735e91d",
    "1a30681a95f5e70a",
    "4d75abe4df5d5958",
    "1f1b36bbc2f269e4",
    "52a99b4cecb8622c",
    "fc379fb0b867bbc8",
    "1cc9ccce74d6997b",
    "6bae0b6604aa9d54",
    "14d7ff862643a4d4",
    "3da3e76698e62bdf",
]

TABLE, TABLE_B = "defi_sync", "defi_sync_lots"


def make_docs(n, prefix="d"):
    return [{"id": f"{prefix}{i:03d}", "course": "llm-zoomcamp", "section": "General",
             "question": f"Question number {i}?", "answer": f"Answer number {i}."} for i in range(n)]


class FakeEmbed:
    """Un faux modèle : un vecteur de 384 nombres tiré du texte, et la liste des lots reçus."""
    def __init__(self, fail_on_call=None):
        self.calls, self.fail_on_call = [], fail_on_call

    def __call__(self, texts):
        texts = list(texts)
        self.calls.append(len(texts))
        if self.fail_on_call and len(self.calls) == self.fail_on_call:
            raise RuntimeError("429 Too Many Requests (simulé par la vérification)")
        out = []
        for t in texts:
            seed = hashlib.sha256(t.encode()).digest()
            v = [((seed[i % 32] + i) % 17 - 8) / 8 for i in range(384)]
            out.append(v)
        return out


def stats_str(s):
    return ",".join(f"{k}={s.get(k)}" for k in ("new", "changed", "deleted", "unchanged"))


def count(conn, table):
    return conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]


def values_of(h, conn, path):
    out = []

    def run(fn):
        try:
            out.append((str(fn()).strip().lower(), ""))
        except Exception as e:
            conn.rollback()
            out.append(("", f"{type(e).__name__}: {str(e).splitlines()[0][:200] if str(e) else ''}"))

    for t in (TABLE, TABLE_B):
        conn.execute(f"DROP TABLE IF EXISTS {t}")
    conn.commit()
    docs = make_docs(6)

    run(lambda: h.doc_hash({"question": "Can I still join?", "answer": "Yes, you can."}))

    def first():
        e = FakeEmbed()
        s = h.sync(conn, docs, e, table=TABLE)
        return f"{stats_str(s)}|{sum(e.calls)}|{count(conn, TABLE)}"
    run(first)

    def columns():
        rows = conn.execute(
            "SELECT a.attname, format_type(a.atttypid, a.atttypmod) FROM pg_attribute a "
            "WHERE a.attrelid = %s::regclass AND a.attnum > 0 AND NOT a.attisdropped", (TABLE,)).fetchall()
        cols = dict(rows)
        return f"{cols.get('id')}|{cols.get('content_hash')}|{cols.get('embedding')}"
    run(columns)

    def unchanged():
        e = FakeEmbed()
        s = h.sync(conn, docs, e, table=TABLE)
        return f"{stats_str(s)}|{sum(e.calls)}"
    run(unchanged)

    def changed():
        docs[1]["answer"] = "A brand new answer."
        e = FakeEmbed()
        s = h.sync(conn, docs, e, table=TABLE)
        stored = conn.execute(f"SELECT content_hash FROM {TABLE} WHERE id = %s", (docs[1]["id"],)).fetchone()[0]
        return f"{stats_str(s)}|{sum(e.calls)}|{stored == h.doc_hash(docs[1])}"
    run(changed)

    def metadata():
        docs[2]["course"] = "data-engineering-zoomcamp"
        e = FakeEmbed()
        s = h.sync(conn, docs, e, table=TABLE)
        course = conn.execute(f"SELECT course FROM {TABLE} WHERE id = %s", (docs[2]["id"],)).fetchone()[0]
        return f"{stats_str(s)}|{sum(e.calls)}|{course}"
    run(metadata)

    def deleted():
        gone = docs.pop(3)
        e = FakeEmbed()
        s = h.sync(conn, docs, e, table=TABLE)
        still = conn.execute(f"SELECT count(*) FROM {TABLE} WHERE id = %s", (gone["id"],)).fetchone()[0]
        return f"{stats_str(s)}|{count(conn, TABLE)}|{still}"
    run(deleted)

    def atomic():
        before = count(conn, TABLE)
        more = docs + make_docs(60, prefix="n")
        more[0] = dict(more[0], answer="Changed again, but the run will fail.")
        e = FakeEmbed(fail_on_call=2)
        try:
            h.sync(conn, more, e, table=TABLE)
            raised = "pas d'erreur"
        except Exception as err:
            conn.rollback()
            raised = "erreur" if "429" in str(err) else type(err).__name__
        after = count(conn, TABLE)
        old = conn.execute(f"SELECT answer FROM {TABLE} WHERE id = %s", (docs[0]["id"],)).fetchone()[0]
        return f"{raised}|{before}|{after}|{old}"
    run(atomic)

    def batches():
        e = FakeEmbed()
        h.sync(conn, make_docs(120, prefix="b"), e, table=TABLE_B)
        return f"{','.join(map(str, e.calls))}|{count(conn, TABLE_B)}"
    run(batches)

    def dag_shape():
        from airflow.dag_processing.dagbag import DagBag
        bag = DagBag(path)
        if bag.import_errors:
            return "erreur d'import : " + list(bag.import_errors.values())[0].strip().splitlines()[-1]
        d = bag.dags.get("faq_incremental")
        if d is None:
            return "pas de DAG faq_incremental"
        retries = all(t.retries >= 2 for t in d.tasks)
        outlet = any("faq_sync" in getattr(o, "uri", "") for t in d.tasks for o in t.outlets)
        return f"{d.schedule}|{d.catchup}|{d.max_active_runs}|{retries}|{outlet}"
    run(dag_shape)
    return out


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def main():
    import psycopg

    path = sys.argv[1] if len(sys.argv) > 1 else "/opt/airflow/dags/faq_incremental.py"
    if not os.path.isfile(path):
        sys.exit(f"❌ Fichier introuvable : {path}")
    sys.path.insert(0, os.path.dirname(os.path.abspath(path)))
    spec = importlib.util.spec_from_file_location("faq_incremental_defi", path)
    h = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(h)

    url = os.environ.get("PG_URL") or os.environ.get("AIRFLOW_CONN_PGVECTOR", "postgresql://user:pswd@localhost:5432/faq")
    try:
        conn = psycopg.connect(url)
    except Exception as e:
        sys.exit(f"❌ Pas de connexion à pgvector ({e}). Démarre tes conteneurs : docker compose up -d")

    print("Défi du module 3 : vérification de ton ingestion incrémentale")
    print()
    ok, values = 0, []
    for label, (value, error), expected in zip(LABELS, values_of(h, conn, path), EXPECTED):
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            print(f"   Réponse : {error or value or '(rien)'}")
        values.append(value)
    for t in (TABLE, TABLE_B):
        conn.execute(f"DROP TABLE IF EXISTS {t}")
    conn.commit()
    print()
    if ok == len(LABELS):
        code = hashlib.sha256("|".join(values).encode()).hexdigest()[:8]
        print(f"🎉 Tout est vert. Ton code de réussite : {code}")
        print("   Entre-le sur la page du défi pour le valider.")
        return True
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige et relance le script.")
    return False


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
