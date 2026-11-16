"""Vérification du défi du module 4 : ton banc d'évaluation de la recherche, evalbench.py.

Usage, depuis ton dossier du module (mon-travail/module-04) :
    uv run python ../../site/checks/defi-04.py evalbench.py

Le script fabrique ses propres données : 61 documents fictifs, 302 questions, et deux fausses recherches
dont il connaît d'avance les classements. Il appelle tes six fonctions et compare des empreintes : il ne
contient pas les résultats attendus. Aucun appel réseau, aucun appel à un LLM, rien n'est écrit sur le disque.
"""
import hashlib
import importlib.util
import random
import sys

LABELS = [
    "relevance : une liste de 0 et de 1 par question, au plus k résultats",
    "relevance respecte k",
    "hit_rate à k = 1, 3, 5 et 10, à partir d'une seule recherche",
    "mrr à k = 1, 3, 5 et 10, à partir d'une seule recherche",
    "hit_rate et mrr prennent k = 5 par défaut",
    "split_by_doc : aucun document des deux côtés, rien de perdu, reproductible",
    "paired_bootstrap : la différence et un intervalle qui l'encadre",
    "paired_bootstrap tire des documents, pas des questions",
    "paired_bootstrap marche aussi pour le hit rate",
    "audit trouve les étiquettes sans document et les id en double",
]

EXPECTED = [
    "05e1010d3b149e2a",
    "976349810a5db775",
    "dbcb951bfdb3b27b",
    "a209371e54dc6fcc",
    "f7b6b3f131d2adc0",
    "07cb76885423d410",
    "ab009a84ca18899b",
    "2689367b205c16ce",
    "016311ccef3488eb",
    "d22be882ff38e5c8",
]

REF_WIDTH = 0.155  # largeur de l'intervalle de ma solution, 4000 tirages


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def make_data():
    """61 étiquettes : d00 à d59 ont 5 questions chacune, d99 a 2 questions mais aucun document."""
    rng = random.Random(404)
    docs = [f"d{i:02d}" for i in range(60)]
    documents = [{"id": d, "text": f"texte {d}"} for d in docs + ["d60", "d61", "d62"]]
    documents.append({"id": "d07", "text": "une copie de d07"})
    ground_truth, rank_a, rank_b = [], {}, {}
    for d in docs + ["d99"]:
        base_a = rng.choice([1, 1, 1, 1, 2, 2, 3, 4, 7, None])
        worse = rng.choice([0, 0, 1, 1, 2, 4, None])
        for j in range(2 if d == "d99" else 5):
            q = f"question {j} sur {d}"
            ra = base_a if rng.random() < 0.85 else rng.choice([1, 2, 5, 9, None])
            rb = None if ra is None or worse is None else ra + worse
            rank_a[q], rank_b[q] = ra, (rb if rb is None or rb <= 10 else None)
            ground_truth.append({"question": q, "document": d})
    return rng, docs, documents, ground_truth, rank_a, rank_b


def fake_search(ranks, docs, rng, short):
    cache = {}

    def search(query):
        if query not in cache:
            target = query.rsplit(" ", 1)[1]
            n = 4 if query in short else 10
            others = [d for d in docs if d != target]
            r = random.Random(query).sample(others, n)
            pos = ranks[query]
            if pos is not None and pos <= n:
                r[pos - 1] = target
            cache[query] = [{"id": d, "score": 1.0 / (i + 1)} for i, d in enumerate(r)]
        return [dict(x) for x in cache[query]]
    return search


def values_of(h):
    rng, docs, documents, gt, rank_a, rank_b = make_data()
    short = set(random.Random(7).sample([q["question"] for q in gt], 20))
    search_a = fake_search(rank_a, docs, rng, short)
    search_b = fake_search(rank_b, docs, rng, short)
    groups = [q["document"] for q in gt]
    rel_a = rel_b = None

    def run(f):
        try:
            return f(), None
        except Exception as e:  # noqa: BLE001
            return None, f"{type(e).__name__}: {e}"

    def c1():
        nonlocal rel_a
        rel_a = h.relevance(gt, search_a)
        return f"{len(rel_a)}|{max(len(x) for x in rel_a)}|{sum(sum(x) for x in rel_a)}|{sorted({v for x in rel_a for v in x})}"

    def c2():
        r = h.relevance(gt, search_a, k=3)
        return f"{max(len(x) for x in r)}|{sum(sum(x) for x in r)}"

    def c3():
        return "|".join(f"{h.hit_rate(rel_a, k):.4f}" for k in (1, 3, 5, 10))

    def c4():
        return "|".join(f"{h.mrr(rel_a, k):.4f}" for k in (1, 3, 5, 10))

    def c5():
        nonlocal rel_b
        rel_b = h.relevance(gt, search_b)
        return f"{h.hit_rate(rel_b):.4f}|{h.mrr(rel_b):.4f}"

    def c6():
        train, test = h.split_by_doc(gt)
        same = h.split_by_doc(gt) == (train, test)
        other = h.split_by_doc(gt, seed=7) != (train, test)
        tr, te = {q["document"] for q in train}, {q["document"] for q in test}
        kept = sorted(q["question"] for q in train + test) == sorted(q["question"] for q in gt)
        half = len({q["document"] for q in h.split_by_doc(gt, test_frac=0.5)[1]})
        return f"commun={len(tr & te)}|gardées={kept}|test={len(te)}|moitié={half}|même_graine={same}|autre_graine={other}"

    def c7():
        b = h.paired_bootstrap(rel_a, rel_b, groups)
        inside = b["low"] <= b["diff"] <= b["high"] and b["low"] < b["high"]
        return f"{b['diff']:.4f}|encadre={inside}"

    def c8():
        b = h.paired_bootstrap(rel_a, rel_b, groups)
        again = h.paired_bootstrap(rel_a, rel_b, groups)
        naive = h.paired_bootstrap(rel_a, rel_b, list(range(len(gt))))
        w, wn = b["high"] - b["low"], naive["high"] - naive["low"]
        ok_ratio = wn > 0 and w / wn >= 1.5
        ok_ref = REF_WIDTH * 0.7 <= w <= REF_WIDTH * 1.3
        if ok_ratio and ok_ref and again == b:
            return "ok"
        return f"largeur par documents={w:.4f}|par questions={wn:.4f}|reproductible={again == b}"

    def c9():
        b = h.paired_bootstrap(rel_a, rel_b, groups, metric="hit_rate")
        return f"{b['diff']:.4f}|encadre={b['low'] <= b['diff'] <= b['high']}"

    def c10():
        a = h.audit(gt, documents)
        return f"{list(a['missing_ids'])}|{a['affected_questions']}|{list(a['duplicate_ids'])}"

    for f in (c1, c2, c3, c4, c5, c6, c7, c8, c9, c10):
        if f in (c3, c4, c7, c8, c9) and rel_a is None or f in (c7, c8, c9) and rel_b is None:
            yield None, "relevance ne marche pas encore : corrige d'abord les vérifications 1 et 5"
            continue
        yield run(f)


def main():
    if len(sys.argv) != 2:
        print("Usage : uv run python ../../site/checks/defi-04.py evalbench.py")
        return False
    spec = importlib.util.spec_from_file_location("evalbench_defi", sys.argv[1])
    h = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(h)

    print("Défi du module 4 : vérification de ton banc d'évaluation")
    print()
    ok, values = 0, []
    for label, (value, error), expected in zip(LABELS, values_of(h), EXPECTED):
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            print(f"   Réponse : {error or value or '(rien)'}")
        values.append(value or "")
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
