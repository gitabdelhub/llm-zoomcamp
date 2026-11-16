@@ body
# Défi du module 2 : une recherche hybride dans Postgres

Pas de vidéo, pas de leçon. Tu as tout vu : la recherche vectorielle (leçons 4 à 6), une ingestion qu'on peut relancer (leçons 7 et 8), pgvector (leçon 8), et la fusion RRF du homework. Ici, tu mets **tout** dans Postgres : les vecteurs, la recherche plein texte, et la fusion des deux. Essaie d'abord seul. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape.

Pourquoi ce défi ? Parce que c'est l'architecture d'un vrai RAG en production : une seule base, que l'équipe connaît déjà, qui fait à la fois le sens et les mots exacts. Le module 6 du cours y reviendra avec d'autres outils ; toi, tu sauras déjà comment ça marche dedans.

## L'objectif

Un seul fichier, `mon-travail/module-02/defi/hybrid.py`, qui reçoit une connexion psycopg 3 ouverte (`conn`) et contient cinq fonctions.

### 1. `ingest(conn, docs)`

`docs` est une liste de dictionnaires avec les clés `id`, `course`, `section`, `question`, `answer` et `embedding` (une liste de 384 nombres, déjà calculée). La fonction :

- active l'extension `vector` ;
- crée, si elle n'existe pas, la table **`defi_docs`** : `id` (texte, clé primaire), `course` (texte, obligatoire), `section`, `question`, `answer`, `embedding` en `vector(384)`, et une colonne **`fts`** de type `tsvector`, **générée** par Postgres à partir de `question || ' ' || answer`, avec la configuration `'english'` ;
- crée, s'ils n'existent pas, un index **HNSW** en distance cosinus sur `embedding`, et un index **GIN** sur `fts` ;
- insère tous les documents en une fois. Relancée, elle ne crée **aucun doublon** et **met à jour** les documents qui ont changé ;
- valide la transaction.

### 2. `search_vector(conn, query_vector, course, k=5)`

Les `k` documents du cours `course` les plus proches de `query_vector`, du plus proche au moins proche. À distance égale, l'`id` le plus petit d'abord.

### 3. `search_text(conn, query, course, k=5)`

Les `k` documents du cours dont `fts` correspond à `websearch_to_tsquery('english', query)`, triés par `ts_rank(fts, la même requête)` décroissant. À rang égal, l'`id` le plus petit d'abord.

### 4. `search_hybrid(conn, query, query_vector, course, k=5, rrf_k=60)`

La fusion RRF des **10** premiers résultats de chaque recherche : chaque document gagne `1 / (rrf_k + rang)` dans chaque liste où il apparaît, avec un rang qui commence à **0**. On renvoie les `k` meilleurs scores ; à score égal, l'`id` le plus petit d'abord.

### Les règles communes

- Les trois recherches renvoient une liste de dictionnaires avec les clés `id`, `course`, `section`, `question` et `answer`.
- Un cours absent de la table lève une **`ValueError`**, dans `search_vector` comme dans `search_text`.
- Aucune valeur venue de l'utilisateur n'est collée dans le texte SQL : tout passe en paramètre `%s`.

## La vérification

Démarre ton Postgres pgvector de la leçon 8 (`docker compose up -d --wait`), puis lance depuis la racine de ton fork :

```bash
uv run --project mon-travail/module-02 python site/checks/defi-02.py mon-travail/module-02/defi/hybrid.py
```

Le script utilise 40 entrées de la FAQ, avec leurs embeddings déjà calculés : pas de modèle à charger, pas d'appel payant. Il supprime la table `defi_docs`, et **seulement elle**, puis lance ton ingestion et dix vérifications. Il affiche ✅ ou ❌ pour chacune, avec ce que ton code a renvoyé, mais jamais ce qui est attendu. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

Ensuite, le vrai test : branche `search_hybrid` sur ta table de la leçon 8 et sur le modèle, et compare ses résultats à ceux de `search_vector` seule sur tes questions de la leçon 4.

@@ guide
### 1. Le dossier

~~~bash
mkdir -p /workspaces/llm-zoomcamp/mon-travail/module-02/defi
~~~

Ton projet `module-02` a besoin de `psycopg[binary]` (leçon 8). Pas d'autre bibliothèque.

### 2. La colonne générée

Postgres sait calculer une colonne à partir des autres, à chaque insertion et à chaque mise à jour :

~~~sql
fts tsvector GENERATED ALWAYS AS (to_tsvector('english', ...)) STORED
~~~

Tu n'insères jamais `fts` toi-même : Postgres s'en charge. C'est ce qui garantit qu'elle reste à jour quand une réponse change.

### 3. Les index

`CREATE INDEX IF NOT EXISTS <nom> ON defi_docs USING hnsw (embedding vector_cosine_ops)`, et la même chose avec `USING gin (fts)`. Le nom est obligatoire avec `IF NOT EXISTS`.

### 4. L'upsert

Repars de `ON CONFLICT (id) DO NOTHING` de la leçon 8. Pour mettre à jour, c'est `DO UPDATE SET colonne = EXCLUDED.colonne, ...` : `EXCLUDED` désigne la ligne que tu essayais d'insérer.

### 5. Les deux recherches

La recherche vectorielle, c'est `RAGPgVector.search` de la leçon 8, avec l'`id` en second critère de tri. La recherche plein texte, c'est le même squelette avec `fts @@ websearch_to_tsquery('english', %s)` dans le `WHERE`.

### 6. La fusion

C'est la fonction `rrf` du homework, avec l'`id` comme clé, et un tri sur deux critères : `sorted(scores, key=lambda i: (-scores[i], i))`.

### 7. Tester pas à pas

Lance le script **tôt**, dès que `ingest` existe : les quatre premières vérifications ne testent qu'elle. Chaque ❌ te montre ce que ton code a renvoyé.

@@ hints
- Le nom de la table, `defi_docs`, est fixé par le script de vérification : une constante `TABLE = "defi_docs"` en haut du fichier évite les fautes.
- `psycopg` sait passer une liste Python à un paramètre, mais pas en `vector` : transforme l'embedding en texte `"[0.1,0.2,...]"` et ajoute `::vector`, comme à la leçon 8.
- Les cours valides, c'est `SELECT DISTINCT course FROM defi_docs`. Vérifie le cours **avant** la recherche.
- `websearch_to_tsquery` exige **tous** les mots de la requête (un ET logique). Une longue question en langage naturel ne trouve souvent rien en plein texte : la fusion se rabat alors sur la recherche vectorielle. C'est normal, et c'est une limite à connaître.
- La requête piégée, c'est un texte comme `'; DROP TABLE defi_docs; --`. Passée en `%s`, c'est un texte ordinaire. Collée avec une f-string dans le SQL, elle s'exécute.
- Après une erreur SQL, `conn.rollback()` : sinon toutes les requêtes suivantes échouent avec `current transaction is aborted`.

@@ solution
Ma solution, testée avec le script de vérification dans Postgres 17 et pgvector 0.8 : les dix vérifications passent.

~~~python
"""Ma recherche hybride dans Postgres : pgvector pour le sens, la recherche plein texte pour les mots exacts, RRF pour fusionner."""

TABLE = "defi_docs"
LIST_SIZE = 10  # chaque recherche fournit ses 10 meilleurs documents à la fusion


def vec_to_str(vector):
    return "[" + ",".join(str(float(x)) for x in vector) + "]"


def ingest(conn, docs):
    """Crée la table et ses index, puis insère ou met à jour chaque document. Relançable sans doublon."""
    conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE} (
            id TEXT PRIMARY KEY,
            course TEXT NOT NULL,
            section TEXT,
            question TEXT,
            answer TEXT,
            embedding vector(384),
            fts tsvector GENERATED ALWAYS AS (to_tsvector('english', question || ' ' || answer)) STORED
        )
    """)
    conn.execute(f"CREATE INDEX IF NOT EXISTS {TABLE}_embedding_idx ON {TABLE} USING hnsw (embedding vector_cosine_ops)")
    conn.execute(f"CREATE INDEX IF NOT EXISTS {TABLE}_fts_idx ON {TABLE} USING gin (fts)")
    with conn.cursor() as cur:
        cur.executemany(
            f"""
            INSERT INTO {TABLE} (id, course, section, question, answer, embedding)
            VALUES (%s, %s, %s, %s, %s, %s::vector)
            ON CONFLICT (id) DO UPDATE SET
                course = EXCLUDED.course, section = EXCLUDED.section, question = EXCLUDED.question,
                answer = EXCLUDED.answer, embedding = EXCLUDED.embedding
            """,
            [(d["id"], d["course"], d["section"], d["question"], d["answer"], vec_to_str(d["embedding"])) for d in docs],
        )
    conn.commit()


def check_course(conn, course):
    known = {row[0] for row in conn.execute(f"SELECT DISTINCT course FROM {TABLE}")}
    if course not in known:
        raise ValueError(f"Cours inconnu : {course!r}. Cours valides : {sorted(known)}")


def rows_to_docs(rows):
    return [{"id": r[0], "course": r[1], "section": r[2], "question": r[3], "answer": r[4]} for r in rows]


def search_vector(conn, query_vector, course, k=5):
    check_course(conn, course)
    q = vec_to_str(query_vector)
    rows = conn.execute(
        f"""
        SELECT id, course, section, question, answer FROM {TABLE}
        WHERE course = %s
        ORDER BY embedding <=> %s::vector, id
        LIMIT %s
        """,
        (course, q, k),
    ).fetchall()
    return rows_to_docs(rows)


def search_text(conn, query, course, k=5):
    check_course(conn, course)
    rows = conn.execute(
        f"""
        SELECT id, course, section, question, answer FROM {TABLE}
        WHERE course = %s AND fts @@ websearch_to_tsquery('english', %s)
        ORDER BY ts_rank(fts, websearch_to_tsquery('english', %s)) DESC, id
        LIMIT %s
        """,
        (course, query, query, k),
    ).fetchall()
    return rows_to_docs(rows)


def search_hybrid(conn, query, query_vector, course, k=5, rrf_k=60):
    lists = [search_vector(conn, query_vector, course, LIST_SIZE), search_text(conn, query, course, LIST_SIZE)]
    scores, docs = {}, {}
    for results in lists:
        for rank, doc in enumerate(results):
            scores[doc["id"]] = scores.get(doc["id"], 0) + 1 / (rrf_k + rank)
            docs[doc["id"]] = doc
    ranked = sorted(scores, key=lambda i: (-scores[i], i))
    return [docs[i] for i in ranked[:k]]
~~~

Le nom de la table vient d'une constante du code, jamais de l'utilisateur : c'est pour ça que la f-string est sans danger ici, alors que la requête, le cours et `k` passent tous en `%s`.
