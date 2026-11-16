@@ body
# Défi du module 3 : une ingestion incrémentale des embeddings

Pas de vidéo, pas de leçon. Tu as tout vu : l'ingestion planifiée et ses assets (leçon 5), les retries et les limites (leçons 6 et 8), l'upsert dans pgvector (module 2). Mais ton `faq_ingest` a un défaut que tout pipeline de production finit par corriger : **chaque jour, il recalcule les 1 470 embeddings**, alors que la FAQ change de quelques entrées par semaine. Ici, tu écris la version qui ne recalcule **que ce qui a changé**. Essaie d'abord seul. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape.

Pourquoi ce défi ? Parce que c'est le problème réel de tout RAG qui vit longtemps. Avec un modèle local, recalculer tout coûte du temps ; avec une API d'embeddings payante, ça coûte de l'argent à chaque run. Et une ingestion qui plante au milieu ne doit jamais laisser une base à moitié à jour, que ton assistant interrogerait quand même.

## L'objectif

Un seul fichier, `mon-travail/module-03/airflow/dags/faq_incremental.py`, qui contient deux fonctions et un DAG.

### 1. `doc_hash(doc)`

L'empreinte du texte qu'on embedde : le SHA-256, en hexadécimal, de `question + "\n" + answer`, encodé en UTF-8. Deux entrées avec la même question et la même réponse ont la même empreinte ; une virgule changée dans la réponse la change.

### 2. `sync(conn, docs, embed_batch, table="faq_sync")`

`conn` est une connexion psycopg 3 ouverte. `docs` est une liste de dictionnaires avec les clés `id`, `course`, `section`, `question` et `answer`. `embed_batch` reçoit une liste de textes et renvoie une liste de vecteurs de 384 nombres (dans le DAG, c'est `encode_batch` de ton `Embedder`). La fonction :

- active l'extension `vector`, et crée la table `table` si elle n'existe pas : `id` (texte, clé primaire), `course` (texte, obligatoire), `section`, `question`, `answer`, `content_hash` (texte, obligatoire), `embedding` en `vector(384)` (obligatoire), et `updated_at` (`TIMESTAMPTZ`, par défaut `now()`) ;
- n'envoie à `embed_batch` **que** les entrées nouvelles, ou dont l'empreinte a changé. Le texte embeddé est `question + " " + answer`. Les textes partent dans l'ordre de `docs`, par **lots de 50 au plus** ;
- met à jour sans aucun embedding une entrée dont seuls `course` ou `section` ont changé ;
- supprime de la table les `id` qui ne sont plus dans `docs` ;
- est **tout ou rien** : si `embed_batch` lève une exception, l'exception remonte, et la table n'a **pas changé du tout** ;
- renvoie un dictionnaire `{"new": ..., "changed": ..., "deleted": ..., "unchanged": ...}`. Une entrée dont seuls `course` ou `section` ont changé compte dans `unchanged` : son embedding n'a pas changé.

### 3. Le DAG `faq_incremental`

- planifié `@daily`, sans rattrapage, avec **un seul run à la fois** ;
- chaque tâche a au moins 2 retries, avec un délai croissant ;
- une tâche `extract` écrit la FAQ dans un fichier de `data/` et ne renvoie que son chemin ;
- une tâche `sync_embeddings` appelle `sync` avec ta connexion `pgvector` et l'`Embedder` du module 2, et déclare l'asset `postgres://pgvector:5432/faq/public/faq_sync`.

### Les règles communes

- Aucune valeur venue des données n'est collée dans le texte SQL : tout passe en paramètre `%s`. Seul le nom de la table, qui vient de ton code, peut être dans une f-string.
- `sync` ne touche qu'à la table `table`.

## La vérification

Avec tes conteneurs démarrés, lance depuis `mon-travail/module-03/airflow` :

```bash
docker compose exec -T airflow-scheduler python - /opt/airflow/dags/faq_incremental.py < ../../../site/checks/defi-03.py
```

Le script tourne **dans** ton conteneur Airflow, avec ta connexion `pgvector`. Il n'utilise ni le modèle ni l'API : un faux `embed_batch` compte les textes qu'il reçoit, et sait simuler une erreur 429 au milieu d'une ingestion. Il travaille dans ses propres tables, `defi_sync` et `defi_sync_lots`, qu'il supprime avant de commencer : ta table `faq_sync` n'est pas touchée. Il lance dix vérifications et affiche ✅ ou ❌ pour chacune, avec ce que ton code a renvoyé, mais jamais ce qui est attendu. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

Ensuite, le vrai test : lance `faq_incremental` deux fois de suite dans l'interface. Le premier run embedde les 1 470 entrées ; le second doit afficher `new=0` et `changed=0`, et sa tâche `sync_embeddings` finir en quelques secondes.

@@ guide
### 1. Le fichier

`dags/faq_incremental.py`, à côté de ton `faq_ingest`. Tu réutilises `ingest.py` et `embedder.py`, déjà dans `dags/`. Pas de nouvelle bibliothèque.

### 2. L'état de la table

Commence `sync` par lire ce qui est déjà là : `dict(conn.execute(f"SELECT id, content_hash FROM {table}").fetchall())`. Avec ce dictionnaire et `docs`, tu peux classer chaque entrée : nouvelle, modifiée, identique, ou disparue. Écris ces quatre listes **avant** tout calcul.

### 3. Les embeddings d'abord

Calcule **tous** les vecteurs dont tu as besoin, lot par lot, **avant** d'écrire quoi que ce soit. Si le deuxième lot échoue, rien n'a encore été écrit.

### 4. Puis tout en une transaction

`with conn.transaction():` ouvre une transaction qui est validée à la sortie du bloc, ou annulée si une exception le traverse. Dedans : l'upsert des entrées nouvelles et modifiées, la mise à jour des métadonnées, et la suppression.

### 5. L'upsert

C'est celui du module 2 : `ON CONFLICT (id) DO UPDATE SET colonne = EXCLUDED.colonne, ...`, avec `content_hash` et `updated_at = now()` en plus.

### 6. La suppression

`DELETE FROM {table} WHERE id = ANY(%s)`, avec la liste Python des `id` disparus en paramètre : psycopg la transforme en tableau Postgres.

### 7. Le DAG

Repars de `faq_ingest` (leçon 5). L'asset va dans `@task(outlets=[...])` de `sync_embeddings`. `max_active_runs=1` dans `@dag` : deux synchronisations en même temps sur la même table se marcheraient dessus.

### 8. Tester pas à pas

Lance le script **tôt**, dès que `doc_hash` et la création de la table existent : chaque ❌ te montre ce que ton code a renvoyé.

@@ hints
- La première vérification ne teste que `doc_hash`. Si elle échoue, vérifie le séparateur : un **retour à la ligne** pour l'empreinte, une **espace** pour le texte embeddé.
- Si la vérification 8 échoue avec une table qui a changé, c'est que tu écris avant d'avoir fini les embeddings, ou que tu valides (`conn.commit()`) entre deux étapes. Un seul `with conn.transaction():`, après tous les calculs.
- Créer la table puis faire `conn.commit()` **avant** la transaction d'écriture est permis : une table vide n'est pas une base à moitié à jour.
- `vector(384)` refuse une liste Python : transforme chaque vecteur en texte `"[0.1,0.2,...]"` et ajoute `::vector`, comme au module 2.
- `cur.executemany(sql, liste_de_tuples)` lance la même requête pour chaque tuple, dans la même transaction.
- Pour la mise à jour des métadonnées, `IS DISTINCT FROM` compare aussi correctement les `NULL` : `section IS DISTINCT FROM %s` est vrai si l'une vaut `NULL` et pas l'autre.
- Pour la vérification 10, le script charge ton fichier avec `DagBag` : une erreur d'import dans ton DAG la fait échouer, même si `sync` est parfaite.

@@ solution
Ma solution, testée avec le script de vérification dans Airflow 3.3.2, Postgres 17 et pgvector 0.8 : les dix vérifications passent.

~~~python
"""Mon ingestion incrémentale de la FAQ : on ne recalcule l'embedding que des entrées nouvelles ou modifiées."""
import hashlib
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

from airflow.sdk import Asset, Connection, dag, task

TABLE = "faq_sync"
BATCH_SIZE = 50
FAQ_SYNC = Asset(f"postgres://pgvector:5432/faq/public/{TABLE}")
MODEL_DIR = os.environ.get("EMBED_MODEL_DIR", "/opt/airflow/models/Xenova/all-MiniLM-L6-v2")
DATA_DIR = Path(os.environ.get("FAQ_DATA_DIR", "/opt/airflow/data"))


def doc_hash(doc):
    """L'empreinte du texte embeddé : la question et la réponse, séparées par un retour à la ligne."""
    return hashlib.sha256((doc["question"] + "\n" + doc["answer"]).encode("utf-8")).hexdigest()


def vec_to_str(vector):
    return "[" + ",".join(str(float(x)) for x in vector) + "]"


def sync(conn, docs, embed_batch, table=TABLE):
    """Met la table à jour avec docs. Seuls les textes nouveaux ou modifiés passent par embed_batch.
    Tout ou rien : si un lot d'embeddings échoue, la table ne change pas."""
    conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {table} (
            id TEXT PRIMARY KEY,
            course TEXT NOT NULL,
            section TEXT,
            question TEXT,
            answer TEXT,
            content_hash TEXT NOT NULL,
            embedding vector(384) NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    conn.commit()

    stored = dict(conn.execute(f"SELECT id, content_hash FROM {table}").fetchall())
    incoming = {d["id"]: d for d in docs}
    to_embed = [d for d in docs if stored.get(d["id"]) != doc_hash(d)]
    metadata_only = [d for d in docs if d["id"] in stored and stored[d["id"]] == doc_hash(d)]
    deleted = [i for i in stored if i not in incoming]

    # Les embeddings d'abord, hors transaction d'écriture : un échec ici ne touche pas la table.
    vectors = []
    texts = [d["question"] + " " + d["answer"] for d in to_embed]
    for i in range(0, len(texts), BATCH_SIZE):
        vectors.extend(embed_batch(texts[i:i + BATCH_SIZE]))

    with conn.transaction():
        with conn.cursor() as cur:
            cur.executemany(f"""
                INSERT INTO {table} (id, course, section, question, answer, content_hash, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                ON CONFLICT (id) DO UPDATE SET
                    course = EXCLUDED.course, section = EXCLUDED.section, question = EXCLUDED.question,
                    answer = EXCLUDED.answer, content_hash = EXCLUDED.content_hash,
                    embedding = EXCLUDED.embedding, updated_at = now()
            """, [(d["id"], d["course"], d["section"], d["question"], d["answer"], doc_hash(d), vec_to_str(v))
                  for d, v in zip(to_embed, vectors)])
            cur.executemany(f"""
                UPDATE {table} SET course = %s, section = %s, updated_at = now()
                WHERE id = %s AND (course IS DISTINCT FROM %s OR section IS DISTINCT FROM %s)
            """, [(d["course"], d["section"], d["id"], d["course"], d["section"]) for d in metadata_only])
            if deleted:
                cur.execute(f"DELETE FROM {table} WHERE id = ANY(%s)", (deleted,))
    return {
        "new": sum(1 for d in to_embed if d["id"] not in stored),
        "changed": sum(1 for d in to_embed if d["id"] in stored),
        "deleted": len(deleted),
        "unchanged": len(metadata_only),
    }


@dag(schedule="@daily", start_date=datetime(2026, 11, 1), catchup=False, max_active_runs=1,
     default_args={"retries": 3, "retry_delay": timedelta(seconds=30), "retry_exponential_backoff": True},
     tags=["llm-zoomcamp", "defi"])
def faq_incremental():

    @task
    def extract(ds=None):
        from ingest import load_faq_data
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        path = DATA_DIR / f"faq_{ds}.json"
        path.write_text(json.dumps(load_faq_data()))
        return str(path)

    @task(outlets=[FAQ_SYNC])
    def sync_embeddings(path):
        import psycopg
        from embedder import Embedder
        docs = json.loads(Path(path).read_text())
        embed = Embedder(MODEL_DIR)
        embed.tokenizer.enable_truncation(256)
        with psycopg.connect(Connection.get("pgvector").get_uri()) as conn:
            stats = sync(conn, docs, embed.encode_batch)
        print(f"{len(docs)} entrées dans la FAQ : {stats}")
        return stats

    sync_embeddings(extract())


faq_incremental()
~~~

Deux choix à remarquer. Les embeddings sont calculés **avant** la transaction : une transaction ouverte pendant de longs calculs garde ses verrous tout ce temps, et un échec du modèle n'a rien à annuler. Et l'empreinte ne porte que sur ce qui est **embeddé** : changer la section d'une entrée ne coûte aucun calcul.
