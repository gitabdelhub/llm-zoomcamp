@@ body
# Défi du workshop : des logs d'agent sans doublons

Pas de vidéo, pas de leçon. Tu as tout vu : la source `filesystem` (leçon 2), le choix de ce que dlt déplie et les fonctions JSON de DuckDB (leçon 3), le `merge` et l'incrémental (leçons 4 et 7). Ici, tu écris la pipeline que la leçon 7 ne fait qu'annoncer : des logs d'agent rechargés **chaque jour**, qui ne relisent que les fichiers modifiés, et ne créent **jamais** de doublon. Essaie d'abord seul. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape.

Pourquoi ce défi ? Parce qu'un agent de code **ajoute des lignes** au fichier d'une session tant qu'elle dure. Un incrémental sur la date de modification relit alors tout le fichier : sans la bonne clé, chaque ligne déjà chargée revient en double, et ton tableau de bord compte deux fois tes tokens sans que rien ne plante. C'est le genre d'erreur qui survit des mois en production.

## L'objectif

Un seul fichier, `mon-travail/workshop-dlt/agent_logs.py`, qui contient deux fonctions.

### 1. `load(bucket_url, pipeline_name="defi_logs", pipelines_dir=None, duckdb_path="defi_logs.duckdb")`

`bucket_url` est un dossier d'agent, comme `file:///home/codespace/.zlaude`. La fonction :

- lit les fichiers `projects/**/*.jsonl` de ce dossier avec la source `filesystem`, en **incrémental sur la date de modification** : un fichier qui n'a pas changé depuis le dernier run n'est pas relu ;
- écrit **une seule table** de données, `log_records`, dans le dataset `agent_logs` d'une base DuckDB `duckdb_path`, sans aucune table enfant ;
- une ligne JSON du fichier = une ligne de la table, avec les colonnes `session_id` (le nom du fichier, sans `.jsonl`), `line_no` (le numéro de la ligne dans le fichier, à partir de 0), `type`, `timestamp`, `model`, `input_tokens`, `output_tokens`, `cache_read_tokens` (lus dans `message` et `message.usage`), et `data`, la ligne entière, en type **`json`** ;
- `timestamp` est de type horodatage, et les trois colonnes de tokens sont des entiers (`bigint`), même si une ligne n'en a pas ;
- relancée sur une session qui a grandi ou dont une ligne a été réécrite, elle **met à jour** la table, sans doublon ;
- ignore une ligne qui n'est pas du JSON valide, sans faire échouer le run ;
- passe `pipeline_name` et `pipelines_dir` à `dlt.pipeline`, et renvoie la pipeline.

### 2. `tokens_by_model(pipeline)`

La liste des tuples `(model, calls, output_tokens)` pour les lignes `assistant` qui ont un modèle : le nombre de lignes et la somme des tokens de sortie, par modèle, triés par tokens de sortie décroissants, puis par nom de modèle. Les nombres sont des `int` Python.

## La vérification

Depuis `mon-travail/workshop-dlt`, dans le projet uv de ton workspace :

```bash
uv run python ../../site/checks/defi-w1.py agent_logs.py
```

Le script fabrique ses propres logs (12 sessions fictives) dans un dossier temporaire, lance ta fonction `load` sept fois en modifiant les fichiers entre deux runs (une session qui grandit, une ligne réécrite, une nouvelle session, une ligne illisible), et lit le résultat. Il fixe lui-même les dates de modification : le résultat ne dépend pas de la vitesse de ta machine. Tes vrais logs et ta base ne sont pas touchés, et il n'y a aucun appel réseau. Il affiche ✅ ou ❌ pour chacune des dix vérifications, avec ce que ton code a renvoyé, mais jamais ce qui est attendu. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

Ensuite, le vrai test : branche le tableau de bord de la leçon 3 sur ta table, et compare ses chiffres de tokens à ceux de la pipeline officielle, après avoir laissé grandir une de tes sessions.

@@ guide
### 1. Le fichier

`agent_logs.py`, dans ton workspace `mon-travail/workshop-dlt`. Il a déjà dlt et DuckDB. Pas de nouvelle bibliothèque.

### 2. Le transformer

Repars de `raw_reader` dans la pipeline officielle (leçon 2) : un `@dlt.transformer` qui reçoit les fichiers, ouvre chacun avec `file_obj.open()`, et parcourt ses lignes avec `enumerate`. Le nom du fichier est dans `file_obj["file_name"]`.

### 3. Une seule table

La ligne entière va dans `data`, en tant que **dict** Python, pas en texte. Sans rien dire à dlt, il la déplierait en tables enfants. Avec un hint de colonne `{"data": {"data_type": "json"}}`, il la garde telle quelle.

### 4. Les types

Les mêmes `columns` du transformer fixent les types : `timestamp` en `timestamp`, les tokens en `bigint`, `model` en `text`. Sans hint, une colonne qui n'a que des `None` au premier run n'existe pas.

### 5. La clé

`primary_key` et `write_disposition="merge"` dans le décorateur du transformer. Choisis une clé qui reste la même quand le fichier grandit, et qui change d'une ligne à l'autre.

### 6. L'incrémental

`filesystem(..., incremental=dlt.sources.incremental("modification_date"))`, puis `files | log_lines`.

### 7. Tester pas à pas

Lance le script **tôt** : les trois premières vérifications ne testent que le premier run. Chaque ❌ te montre ce que ton code a renvoyé.

@@ hints
- Si la vérification 5 montre plus de lignes qu'attendu, la clé n'est pas la bonne. Quelle information garde la même valeur pour une ligne quand le fichier grandit, et en prend une autre pour la ligne suivante ?
- `pipeline.last_trace.last_normalize_info.row_counts` donne le nombre de lignes lues au dernier run, par table : c'est ce que regarde la vérification 4.
- `str.removesuffix(".jsonl")` donne le `session_id` sans risque de couper un nom qui contiendrait `.jsonl` au milieu.
- Une ligne illisible : `json.JSONDecodeError`, puis `continue`. Une ligne vide aussi, avec `if not raw.strip()`.
- `pipeline.dataset()(sql).fetchall()` renvoie des tuples. `SUM` renvoie un grand entier DuckDB : passe-le dans `int()`.
- Si tu charges plusieurs dossiers d'agents (`.claude`, `.zlaude`), donne un nom différent à chaque ressource `filesystem` avec `.with_name(...)` : l'état de l'incrémental est rangé sous le nom de la ressource.

@@ solution
Ma solution, testée avec le script de vérification et dlt 1.32 : les dix vérifications passent.

~~~python
"""Mes logs d'agent dans DuckDB, sans doublons : une ligne de log = une ligne de table, chargée une seule fois."""
import json
from pathlib import Path

import dlt
from dlt.sources.filesystem import filesystem

TABLE = "log_records"
COLUMNS = {
    "data": {"data_type": "json"},
    "timestamp": {"data_type": "timestamp"},
    "type": {"data_type": "text"},
    "model": {"data_type": "text"},
    "input_tokens": {"data_type": "bigint"},
    "output_tokens": {"data_type": "bigint"},
    "cache_read_tokens": {"data_type": "bigint"},
}


@dlt.transformer(name=TABLE, primary_key=["session_id", "line_no"], write_disposition="merge", columns=COLUMNS)
def log_lines(items):
    """Chaque ligne JSON d'un fichier de session devient une ligne de la table. Les lignes illisibles sont ignorées."""
    for file_obj in items:
        session_id = file_obj["file_name"].removesuffix(".jsonl")
        rows = []
        with file_obj.open() as f:
            for line_no, raw in enumerate(f):
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8", errors="replace")
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    rec = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if not isinstance(rec, dict):
                    continue
                msg = rec.get("message") if isinstance(rec.get("message"), dict) else {}
                usage = msg.get("usage") if isinstance(msg.get("usage"), dict) else {}
                rows.append({
                    "session_id": session_id,
                    "line_no": line_no,
                    "type": rec.get("type"),
                    "timestamp": rec.get("timestamp"),
                    "model": msg.get("model"),
                    "input_tokens": usage.get("input_tokens"),
                    "output_tokens": usage.get("output_tokens"),
                    "cache_read_tokens": usage.get("cache_read_input_tokens"),
                    "data": rec,
                })
        if rows:
            yield rows


def load(bucket_url, pipeline_name="defi_logs", pipelines_dir=None, duckdb_path="defi_logs.duckdb"):
    files = filesystem(bucket_url=bucket_url, file_glob="projects/**/*.jsonl",
                       incremental=dlt.sources.incremental("modification_date"))
    pipeline = dlt.pipeline(pipeline_name=pipeline_name, destination=dlt.destinations.duckdb(duckdb_path),
                            dataset_name="agent_logs", pipelines_dir=pipelines_dir)
    pipeline.run(files | log_lines)
    return pipeline


def tokens_by_model(pipeline):
    rows = pipeline.dataset()(f"""
        SELECT model, COUNT(*) AS calls, SUM(output_tokens) AS output_tokens
        FROM {TABLE}
        WHERE type = 'assistant' AND model IS NOT NULL
        GROUP BY model
        ORDER BY output_tokens DESC, model
    """).fetchall()
    return [(model, int(calls), int(out)) for model, calls, out in rows]


if __name__ == "__main__":
    p = load(f"file://{Path.home()}/.zlaude")
    print(p.last_trace.last_normalize_info)
    for model, calls, out in tokens_by_model(p):
        print(f"{model:20} {calls:5} appels {out:9} tokens de sortie")
~~~

Deux choix à remarquer. La clé `(session_id, line_no)` est **naturelle** : elle vient de l'endroit où la ligne est écrite, pas de son contenu, donc elle ne change pas quand la ligne est réécrite, et le `merge` la met à jour. Et l'incrémental sur la date ne fait qu'éviter de relire les fichiers **intacts** : c'est la clé, pas l'incrémental, qui empêche les doublons.
