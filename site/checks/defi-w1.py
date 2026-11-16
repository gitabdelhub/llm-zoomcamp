"""Vérification du défi du workshop dlt : tes logs d'agent sans doublons, agent_logs.py.

Usage, depuis ton dossier du workshop (mon-travail/workshop-dlt) :
    uv run python ../../site/checks/defi-w1.py agent_logs.py

Le script fabrique ses propres logs (12 sessions fictives, avec fake_agent_logs.py) dans un dossier temporaire,
lance ta fonction load plusieurs fois en modifiant les fichiers entre deux runs, et lit le résultat dans une
base DuckDB temporaire. Tes vrais logs et ta base ne sont pas touchés. Aucun appel réseau.
Le script compare des empreintes : il ne contient pas les résultats attendus.
"""
import hashlib
import importlib.util
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

LABELS = [
    "Le premier run charge chaque ligne une fois",
    "Une seule table de données, sans tables enfants",
    "Les colonnes ont les bons types",
    "Relancé sans changement, aucun fichier n'est relu",
    "Une session qui grandit : seules ses nouvelles lignes s'ajoutent",
    "Une ligne réécrite est mise à jour, pas dupliquée",
    "Une nouvelle session est chargée au run suivant",
    "Une ligne illisible est ignorée sans faire planter le run",
    "session_id vient du nom du fichier, line_no commence à 0",
    "tokens_by_model compte les appels et les tokens de sortie",
]

EXPECTED = [
    "25bca5749479e584",
    "adda6b0f56d558fe",
    "f7e365c0157d6914",
    "49138bb74c5d6017",
    "9e725db463e42f30",
    "72c6de7acf3a1e52",
    "0aa424122ca69089",
    "2f58450f2d100425",
    "8b3f372894127c27",
    "36fd764a8c4a9bd7",
]

TABLE = "log_records"
BASE = datetime(2026, 11, 1, tzinfo=timezone.utc).timestamp()


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def touch(path, hours):
    """Fixe la date de modification : le résultat ne dépend pas de la vitesse de ta machine."""
    t = BASE + hours * 3600
    os.utime(path, (t, t))


def values_of(h, logs_dir, work):
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from fake_agent_logs import generate

    out = []
    state = {"run": 0, "p": None}
    bucket = "file://" + str(logs_dir)
    db = str(work / "defi_logs.duckdb")
    pdir = str(work / "pipelines")

    def run(fn):
        try:
            out.append((str(fn()).strip().lower(), ""))
        except Exception as e:
            msg = str(e).strip().splitlines()
            out.append(("", f"{type(e).__name__}: {msg[0][:200] if msg else ''}"))

    def go():
        state["run"] += 1
        state["p"] = h.load(bucket, pipeline_name="defi_logs", pipelines_dir=pdir, duckdb_path=db)
        info = state["p"].last_trace.last_normalize_info
        return info.row_counts.get(TABLE, 0) if info else 0

    def count():
        return state["p"].dataset()(f"SELECT COUNT(*) FROM {TABLE}").fetchall()[0][0]

    paths, total = generate(logs_dir, sessions=12, seed=7)
    paths = sorted(paths)
    for p in paths:
        touch(p, 0)

    run(lambda: f"{go()}|{count()}|{total}")

    def tables():
        return ",".join(sorted(state["p"].default_schema.data_table_names()))
    run(tables)

    def types():
        cols = state["p"].default_schema.get_table_columns(TABLE)
        return "|".join(str(cols.get(c, {}).get("data_type")) for c in
                        ("session_id", "line_no", "timestamp", "model", "output_tokens", "data"))
    run(types)

    run(lambda: f"{go()}|{count()}")

    def grows():
        p = paths[0]
        lines = p.read_text(encoding="utf-8").splitlines()
        extra = [dict(json.loads(lines[1]), uuid="defi-a"), dict(json.loads(lines[1]), uuid="defi-b")]
        with open(p, "a", encoding="utf-8") as f:
            for e in extra:
                f.write(json.dumps(e) + "\n")
        touch(p, 1)
        go()
        n = state["p"].dataset()(f"SELECT COUNT(*) FROM {TABLE} WHERE data->>'$.uuid' IN ('defi-a', 'defi-b')").fetchall()[0][0]
        return f"{count()}|{n}"
    run(grows)

    def rewritten():
        p = paths[1]
        lines = p.read_text(encoding="utf-8").splitlines()
        i = next(k for k, l in enumerate(lines) if json.loads(l).get("type") == "assistant")
        rec = json.loads(lines[i])
        rec["message"]["usage"]["output_tokens"] = 4242
        lines[i] = json.dumps(rec)
        p.write_text("\n".join(lines) + "\n", encoding="utf-8")
        touch(p, 2)
        go()
        sid = p.name[:-6]
        tok = state["p"].dataset()(f"SELECT output_tokens FROM {TABLE} WHERE session_id = '{sid}' AND line_no = {i}").fetchall()
        return f"{count()}|{','.join(str(t[0]) for t in tok)}"
    run(rewritten)

    def new_session():
        more, n = generate(work / "more", sessions=1, seed=99)
        dest = logs_dir / "projects" / more[0].parent.name / more[0].name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(more[0], dest)
        touch(dest, 3)
        loaded = go()
        return f"{loaded}|{count()}|{n}"
    run(new_session)

    def bad_line():
        p = paths[2]
        good = dict(json.loads(p.read_text(encoding="utf-8").splitlines()[1]), uuid="defi-c")
        with open(p, "a", encoding="utf-8") as f:
            f.write('{"type": "assistant", "message": {"oops\n')
            f.write(json.dumps(good) + "\n")
        touch(p, 4)
        go()
        n = state["p"].dataset()(f"SELECT COUNT(*) FROM {TABLE} WHERE data->>'$.uuid' = 'defi-c'").fetchall()[0][0]
        return f"{count()}|{n}"
    run(bad_line)

    def ids():
        sids = sorted(p.name[:-6] for p in paths)
        rows = state["p"].dataset()(f"SELECT DISTINCT session_id FROM {TABLE} ORDER BY 1").fetchall()
        mine = [r[0] for r in rows if r[0] in sids]
        mn = state["p"].dataset()(f"SELECT MIN(line_no), MAX(line_no) FROM {TABLE} WHERE session_id = '{sids[0]}'").fetchall()[0]
        return f"{len(mine)}|{mn[0]}|{mn[1]}"
    run(ids)

    run(lambda: ";".join(f"{m},{c},{o}" for m, c, o in h.tokens_by_model(state["p"])))
    return out


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "agent_logs.py"
    if not os.path.isfile(path):
        sys.exit(f"❌ Fichier introuvable : {path}")
    sys.path.insert(0, os.path.dirname(os.path.abspath(path)))
    spec = importlib.util.spec_from_file_location("agent_logs_defi", path)
    h = importlib.util.module_from_spec(spec)
    sys.modules["agent_logs_defi"] = h  # dlt a besoin de retrouver le module de tes ressources
    spec.loader.exec_module(h)

    print("Défi du workshop dlt : vérification de tes logs d'agent sans doublons")
    print()
    work = Path(tempfile.mkdtemp(prefix="defi-w1-"))
    try:
        ok, values = 0, []
        for label, (value, error), expected in zip(LABELS, values_of(h, work / "logs", work), EXPECTED):
            if value and fingerprint(value) == expected:
                print(f"✅ {label}")
                ok += 1
            else:
                print(f"❌ {label}")
                print(f"   Réponse : {error or value or '(rien)'}")
            values.append(value)
    finally:
        shutil.rmtree(work, ignore_errors=True)
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
