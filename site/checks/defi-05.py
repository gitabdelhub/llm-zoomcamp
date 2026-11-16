"""Vérification du défi du module 5 : toute la pile de monitoring démarre avec une seule commande.

Usage, depuis le dossier de ta pile (mon-travail/module-05), une fois la pile lancée :
    docker compose down -v && docker compose up -d --build --wait
    python3 ../../site/checks/defi-05.py

Le script lit ta pile en marche avec docker compose (ps, config, exec), interroge Postgres par psql
dans son conteneur, l'application Streamlit et l'API de Grafana sur localhost. Il ne modifie rien,
n'appelle aucun LLM, et compare des empreintes : il ne contient pas les résultats attendus.
Il n'a besoin que de Python et de Docker : aucune bibliothèque à installer.
"""
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from http import client as http_client
from base64 import b64encode

LABELS = [
    "Les trois services tournent, et Postgres est en bonne santé",
    "Streamlit attend que Postgres soit en bonne santé",
    "Les tables sont créées au premier démarrage, sans script à lancer",
    "La table conversations a le schéma de la leçon 5",
    "La table feedback a le schéma de la leçon 8, avec sa clé étrangère",
    "Un index sur la date des conversations",
    "L'application répond, sans fichier .env dans son image",
    "La source de données Grafana est provisionnée et se connecte",
    "Le tableau de bord est provisionné, avec ses quatre panneaux",
    "Les requêtes des quatre panneaux tournent sans erreur",
]

EXPECTED = [
    "b3c9a5c3c7191f97",
    "318442b38486f640",
    "a31bd5779865e3be",
    "735643ac6d9456c2",
    "4e0c4589ba241f83",
    "1bc04b5291c26a46",
    "26a62d6af5a9df70",
    "63c8b30993768621",
    "a8e7a6f858ecc76d",
    "0859ef921574f0da",
]

PANELS = ["Cost", "Relevance", "Response time", "User feedback"]
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # localhost, sans proxy


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def sh(*args):
    r = subprocess.run(args, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip().splitlines()[-1] if (r.stderr or r.stdout).strip() else f"code {r.returncode}")
    return r.stdout.strip()


def compose(*args):
    return sh("docker", "compose", *args)


def http(url, data=None, auth=None, wait=90):
    """Grafana et Streamlit mettent quelques secondes à répondre après le démarrage : on réessaie."""
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None)
    req.add_header("Content-Type", "application/json")
    if auth:
        req.add_header("Authorization", "Basic " + b64encode(auth.encode()).decode())
    deadline = time.time() + wait
    while True:
        try:
            with OPENER.open(req, timeout=30) as r:
                body = r.read().decode()
            break
        except urllib.error.HTTPError:
            raise  # le serveur répond : une erreur HTTP est une vraie réponse
        except (ConnectionError, urllib.error.URLError, http_client.RemoteDisconnected):
            if time.time() > deadline:
                raise
            time.sleep(2)
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return body


def values_of():
    config = json.loads(compose("config", "--format", "json"))
    services = config.get("services", {})
    pg_env = services.get("postgres", {}).get("environment", {}) or {}
    user, db = pg_env.get("POSTGRES_USER", "postgres"), pg_env.get("POSTGRES_DB", pg_env.get("POSTGRES_USER", "postgres"))
    grafana_auth = "admin:" + os.getenv("GRAFANA_PASSWORD", "admin")

    def port(service, inner):
        out = compose("port", service, str(inner)).splitlines()[0]
        return out.rsplit(":", 1)[1]

    def psql(sql):
        return compose("exec", "-T", "postgres", "psql", "-U", user, "-d", db, "-Atc", sql)

    def c1():
        rows = [json.loads(line) for line in compose("ps", "--format", "json").splitlines() if line.strip()]
        if rows and isinstance(rows[0], list):
            rows = rows[0]
        state = {r["Service"]: (r.get("Health") or r["State"]) if r["Service"] == "postgres" else r["State"] for r in rows}
        return "|".join(f"{s}={state.get(s, 'absent')}" for s in ("postgres", "grafana", "streamlit"))

    def c2():
        dep = services.get("streamlit", {}).get("depends_on", {}) or {}
        return str(dep.get("postgres", {}).get("condition", "aucune")) if isinstance(dep, dict) else "aucune"

    def c3():
        return psql("SELECT string_agg(table_name, ',' ORDER BY table_name) FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name IN ('conversations', 'feedback')")

    def columns(table):
        return psql("SELECT string_agg(column_name || ':' || data_type || ':' || is_nullable, ',' ORDER BY column_name) "
                    f"FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '{table}'")

    def c4():
        return columns("conversations")

    def c5():
        fk = psql("SELECT string_agg(kcu.column_name || '->' || ccu.table_name || '.' || ccu.column_name, ',') "
                  "FROM information_schema.table_constraints tc "
                  "JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name "
                  "JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name "
                  "WHERE tc.table_name = 'feedback' AND tc.constraint_type = 'FOREIGN KEY'")
        return columns("feedback") + "|" + fk

    def c6():
        n = psql("SELECT COUNT(*) FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid "
                 "JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = i.indkey[0] "
                 "WHERE c.relname = 'conversations' AND a.attname = 'timestamp'")
        return "index" if n != "0" else "aucun index sur timestamp"

    def c7():
        health = http(f"http://localhost:{port('streamlit', 8501)}/_stcore/health")
        env = compose("exec", "-T", "streamlit", "sh", "-c", "test -e .env && echo présent || echo absent")
        return f"santé={health}|.env={env}"

    def c8():
        ds = http("http://localhost:" + port("grafana", 3000) + "/api/datasources/uid/course-assistant-pg", auth=grafana_auth)
        kind = "postgres" if ds.get("type") in ("postgres", "grafana-postgresql-datasource") else ds.get("type")
        health = http("http://localhost:" + port("grafana", 3000) + "/api/datasources/uid/course-assistant-pg/health", auth=grafana_auth)
        return f"{kind}|{health.get('status')}"

    def dashboard():
        try:
            return http("http://localhost:" + port("grafana", 3000) + "/api/dashboards/uid/course-assistant", auth=grafana_auth)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise LookupError("Grafana n'a aucun tableau de bord d'uid course-assistant") from None
            raise

    def c9():
        d = dashboard()
        titles = sorted({p.get("title") for p in d["dashboard"].get("panels", [])} & set(PANELS))
        return f"{d['dashboard'].get('title')}|{'provisionné' if d['meta'].get('provisioned') else 'créé à la main'}|{','.join(titles)}"

    def c10():
        panels = [p for p in dashboard()["dashboard"].get("panels", []) if p.get("title") in PANELS]
        ok, errors = 0, []
        for p in panels:
            targets = [dict(t, datasource=t.get("datasource") or p.get("datasource"), intervalMs=60000, maxDataPoints=500)
                       for t in p.get("targets", [])]
            try:
                res = http("http://localhost:" + port("grafana", 3000) + "/api/ds/query",
                           {"from": "now-6h", "to": "now", "queries": targets}, auth=grafana_auth)
            except urllib.error.HTTPError as e:  # une requête SQL fausse donne 400, avec l'erreur dans le corps
                res = json.loads(e.read().decode() or "{}")
            bad = [r.get("error") for r in res.get("results", {}).values() if r.get("error")]
            if targets and not bad:
                ok += 1
            else:
                errors.append(f"{p['title']} : {(bad or ['aucune requête'])[0][:120]}")
        return f"{ok}/{len(PANELS)}" + ("" if not errors else " | " + " ; ".join(errors))

    for f in (c1, c2, c3, c4, c5, c6, c7, c8, c9, c10):
        try:
            yield f(), None
        except Exception as e:  # noqa: BLE001
            yield None, f"{type(e).__name__}: {e}"


def main():
    print("Défi du module 5 : vérification de ta pile de monitoring")
    print()
    try:
        sh("docker", "compose", "version")
    except Exception as e:  # noqa: BLE001
        print(f"❌ docker compose ne répond pas : {e}")
        return False
    try:
        compose("config", "--quiet")
    except Exception as e:  # noqa: BLE001
        print(f"❌ Pas de pile Compose lisible dans ce dossier : {e}")
        print("   Lance le script depuis le dossier qui contient ton compose.yaml.")
        return False
    ok, values = 0, []
    for label, (value, error), expected in zip(LABELS, values_of(), EXPECTED):
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
