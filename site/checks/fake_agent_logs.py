"""Fabrique des logs d'agent de code au format de Claude Code, pour le workshop dlt.

Tu n'as pas de logs dans ~/.claude/projects/ (par exemple parce que tu codes avec Copilot) ?
Ce script écrit des sessions fictives, mais construites comme les vraies, dans ~/.zlaude/projects/ :
le dossier « variante de Claude » que la pipeline officielle du workshop lit déjà.

    python site/checks/fake_agent_logs.py                 # 40 sessions dans ~/.zlaude
    python site/checks/fake_agent_logs.py --out /tmp/logs --sessions 5

Même graine, mêmes fichiers : tu peux comparer tes chiffres avec ceux de la leçon.
Aucune bibliothèque à installer, aucune donnée réelle.
"""
import argparse
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

MODELS = ["claude-sonnet-4-5", "claude-sonnet-4-5", "claude-sonnet-4-5", "claude-opus-4-5", "claude-haiku-4-5"]
PROJECTS = ["-workspaces-llm-zoomcamp", "-workspaces-data-engineering-zoomcamp", "-workspaces-mon-portfolio"]
BRANCHES = ["main", "main", "feature/rag", "fix/airflow-dag"]
TOOLS = {
    "Read": lambda r: {"file_path": f"/workspaces/projet/src/{r.choice(['app', 'rag', 'ingest', 'dag'])}.py"},
    "Bash": lambda r: {"command": r.choice(["uv run pytest", "docker compose ps", "git status", "ls -la"]),
                       "description": "Lancer une commande"},
    "Edit": lambda r: {"file_path": "/workspaces/projet/src/rag.py", "old_string": "k=5", "new_string": "k=10"},
    "Grep": lambda r: {"pattern": r.choice(["def search", "import dlt", "TODO"]), "path": "/workspaces/projet"},
    "TodoWrite": lambda r: {"todos": [{"content": t, "status": r.choice(["pending", "in_progress", "completed"]),
                                       "activeForm": t} for t in r.sample(["Lire le code", "Écrire le test", "Lancer"], 2)]},
}


def tool_result(r, name, args):
    """Ce que Claude Code range dans toolUseResult : une forme différente pour chaque outil."""
    if name == "Read":
        return {"type": "text", "file": {"filePath": args["file_path"], "content": "import dlt\n", "numLines": 1,
                                         "startLine": 1, "totalLines": r.randint(1, 400)}}
    if name == "Edit":
        return {"filePath": args["file_path"], "oldString": args["old_string"], "newString": args["new_string"],
                "structuredPatch": [{"oldStart": 12, "oldLines": 1, "newStart": 12, "newLines": 1,
                                     "lines": ["-    k=5", "+    k=10"]}], "userModified": False}
    if name == "Grep":
        files = r.sample(["src/rag.py", "src/app.py", "dags/faq.py", "tests/test_rag.py"], r.randint(1, 3))
        return {"mode": "files_with_matches", "filenames": files, "numFiles": len(files)}
    if name == "TodoWrite":
        return {"oldTodos": [], "newTodos": args["todos"]}
    return {"stdout": "ok", "stderr": "", "interrupted": False, "isImage": False}
PROMPTS = ["Explique-moi cette erreur de DAG", "Ajoute un test pour la recherche", "Pourquoi mon RAG répond à côté ?",
           "Refactorise ingest.py", "Écris le README du projet", "Corrige le Dockerfile"]


def rid(r):
    return str(uuid.UUID(int=r.getrandbits(128), version=4))


def session(r, start):
    sid, project, branch, model = rid(r), r.choice(PROJECTS), r.choice(BRANCHES), r.choice(MODELS)
    cwd = "/" + project.strip("-").replace("-", "/", 1)
    t, parent, lines = start, None, []

    def base(kind):
        nonlocal t, parent
        t += timedelta(seconds=r.randint(2, 90))
        u = rid(r)
        rec = {"parentUuid": parent, "isSidechain": False, "userType": "external", "cwd": cwd,
               "sessionId": sid, "version": "2.0.31", "gitBranch": branch, "type": kind, "uuid": u,
               "timestamp": t.isoformat(timespec="milliseconds").replace("+00:00", "Z")}
        parent = u
        return rec

    snap = base("file-history-snapshot")
    snap.update({"messageId": rid(r), "isSnapshotUpdate": False,
                 "snapshot": {"messageId": rid(r), "timestamp": snap["timestamp"],
                              "trackedFileBackups": {f"src/{n}.py": {"backupFileName": f"{rid(r)}@v1", "version": 1,
                                                                     "backupTime": snap["timestamp"]}
                                                     for n in r.sample(["app", "rag", "ingest"], 2)}}})
    del snap["parentUuid"], snap["cwd"], snap["gitBranch"], snap["uuid"]
    lines.append(snap)

    for _ in range(r.randint(1, 4)):
        u = base("user")
        u["message"] = {"role": "user", "content": r.choice(PROMPTS)}
        lines.append(u)
        for _ in range(r.randint(1, 5)):
            a = base("assistant")
            name = r.choice(list(TOOLS))
            call_id = "toolu_" + rid(r).replace("-", "")[:24]
            usage = {"input_tokens": r.randint(3, 40), "cache_creation_input_tokens": r.randint(0, 6000),
                     "cache_read_input_tokens": r.randint(5000, 60000), "output_tokens": r.randint(20, 1800),
                     "cache_creation": {"ephemeral_5m_input_tokens": 0, "ephemeral_1h_input_tokens": r.randint(0, 6000)},
                     "service_tier": "standard"}
            args = TOOLS[name](r)
            content = [{"type": "thinking", "thinking": "Je regarde le fichier avant de répondre.", "signature": rid(r)},
                       {"type": "tool_use", "id": call_id, "name": name, "input": args}]
            a["message"] = {"id": "msg_" + rid(r).replace("-", "")[:24], "type": "message", "role": "assistant",
                            "model": model, "content": content, "stop_reason": "tool_use", "stop_sequence": None,
                            "usage": usage}
            a["requestId"] = "req_" + rid(r).replace("-", "")[:24]
            lines.append(a)
            res = base("user")
            out = [{"type": "text", "text": "ok"}] if name == "Read" else "ok"
            res["message"] = {"role": "user", "content": [{"tool_use_id": call_id, "type": "tool_result",
                                                           "content": out, "is_error": r.random() < 0.08}]}
            res["toolUseResult"] = tool_result(r, name, args)
            lines.append(res)
        if r.random() < 0.3:
            att = base("attachment")
            att["attachment"] = r.choice([
                {"type": "todo_reminder", "content": [{"content": "Tester", "status": "pending"}], "itemCount": 1},
                {"type": "hook_success", "hookName": "SessionStart", "hookEvent": "SessionStart",
                 "content": [{"type": "text", "text": "ok"}], "stdout": "", "exitCode": 0},
                {"type": "edited_text_file", "filename": "src/rag.py", "snippet": "k=10",
                 "changes": [{"added": ["k=10"], "removed": ["k=5"]}]},
            ])
            lines.append(att)
        a = base("assistant")
        a["message"] = {"id": "msg_" + rid(r).replace("-", "")[:24], "type": "message", "role": "assistant",
                        "model": model, "content": [{"type": "text", "text": "C'est fait."}],
                        "stop_reason": "end_turn", "stop_sequence": None,
                        "usage": {"input_tokens": r.randint(3, 40), "cache_creation_input_tokens": 0,
                                  "cache_read_input_tokens": r.randint(5000, 60000),
                                  "output_tokens": r.randint(20, 600), "service_tier": "standard"}}
        lines.append(a)
    return project, sid, lines


def generate(out, sessions=40, seed=2026):
    """Écrit les sessions dans out/projects/<projet>/<session>.jsonl. Renvoie la liste des fichiers et le nombre de lignes."""
    r = random.Random(seed)
    day0 = datetime(2026, 10, 1, 8, 0, tzinfo=timezone.utc)
    paths, total = [], 0
    for _ in range(sessions):
        day = r.choice([d for d in range(28) if not 12 <= d <= 18])  # une semaine sans sessions : les vacances
        start = day0 + timedelta(days=day, minutes=r.randint(0, 12 * 60))
        project, sid, lines = session(r, start)
        path = Path(out) / "projects" / project / f"{sid}.jsonl"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("".join(json.dumps(l, ensure_ascii=False) + "\n" for l in lines), encoding="utf-8")
        paths.append(path)
        total += len(lines)
    return paths, total


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default=str(Path.home() / ".zlaude"))
    ap.add_argument("--sessions", type=int, default=40)
    ap.add_argument("--seed", type=int, default=2026)
    args = ap.parse_args()
    paths, total = generate(args.out, args.sessions, args.seed)
    print(f"{len(paths)} sessions, {total} lignes, dans {Path(args.out) / 'projects'}")


if __name__ == "__main__":
    main()
