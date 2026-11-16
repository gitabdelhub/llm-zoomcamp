@@ intro
Le homework officiel du workshop, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Tu reprends l'agent de la FAQ du module 1, réécrit avec **Pydantic AI**, tu l'instrumentes avec **Logfire** pour voir ses traces, puis tu récupères ces traces avec dlt pour les analyser dans DuckDB. Deux comptes gratuits à créer : Logfire, et une clé OpenAI que tu as déjà.

Ton code va dans `mon-travail/workshop-dlt/homework/`, avec un `README.md` qui reprend tes réponses et la façon dont tu les as trouvées.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/workshop-dlt/homework/` poussé sur ton fork, avec ton `README.md`. Pour comparer ton raisonnement, les étudiants de la cohorte en ont parlé sur le Slack de DataTalksClub (canal `#course-llm-zoomcamp`). Si tu as Claude, il peut relire ton raisonnement question par question.

L'énoncé le dit : les nombres varient d'un run à l'autre, parce que le modèle décide combien de fois chercher. Choisis **l'option la plus proche**.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le dossier et le code

~~~bash
mkdir -p /workspaces/llm-zoomcamp/mon-travail/workshop-dlt/homework
cd /workspaces/llm-zoomcamp/mon-travail/workshop-dlt/homework
~~~

Les commandes `wget` de l'énoncé marchent telles quelles. Les fichiers sont aussi dans ton fork : `cp /workspaces/llm-zoomcamp/cohorts/2026/workshops/dlt/homework/{agent,ingest,main}.py .` fait la même chose.

### 2. Le projet uv

Un projet **à part**, avec les commandes `uv init` et `uv add` de l'énoncé : Pydantic AI et Logfire n'ont rien à faire dans ton workspace dltHub.

### 3. Les clés, sans fichier .env

Ta clé OpenAI est déjà un secret Codespaces (`OPENAI_API_KEY`) : elle est dans l'environnement, `load_dotenv()` ne la remplace pas. Fais pareil pour Logfire : ajoute `LOGFIRE_TOKEN` (le jeton d'écriture) et, à la question 2, `LOGFIRE_READ_TOKEN` (le jeton de lecture) dans les secrets Codespaces de ton fork, puis redémarre le Codespace. Si tu préfères un fichier `.env`, vérifie d'abord que `.env` est dans ton `.gitignore`, avant le premier `git add`.

### 4. Lire le code

`agent.py` est commenté ligne par ligne : chaque morceau correspond à ce que tu as écrit à la main au module 1 (les instructions, le schéma de l'outil, la boucle). Lis-le avant de lancer `uv run python main.py`.

### 5. Les réponses

Dans ton `README.md`, une section par question : ta réponse, le nombre exact que tu as mesuré, et la requête ou la capture qui le montre.

@@ q1
- Les deux lignes de l'énoncé vont **avant** la création de l'agent : au début de `main.py`, juste après `load_dotenv()`.
- Dans Logfire, ouvre la vue **Live**, puis clique sur la trace de ta question : chaque ligne de l'arbre est un span. Compte-les tous, l'agent compris.
- Pose la question de l'énoncé deux ou trois fois : le nombre de recherches change d'un run à l'autre. Note chaque compte dans ton README.

@@ q2
- La page de contexte dltHub pour Logfire (`https://dlthub.com/context/source/logfire`) se donne directement à ton agent de code. Sans agent, l'API de requêtes de Logfire accepte du SQL, avec ton jeton de lecture dans l'en-tête `Authorization`.
- La requête de l'énoncé filtre sur `table_schema = 'agent_traces'` : c'est le **nom du dataset** de ta pipeline. Si tu as choisi un autre nom, mets le tien.
- Les tables internes de dlt (`_dlt_loads`, `_dlt_version`, `_dlt_pipeline_state`) sont aussi dans ce schéma : regarde si l'option la plus proche les compte ou non, et écris ton choix.

@@ q3
- Les attributs des spans sont imbriqués : après la normalisation de dlt, cherche la colonne avec `SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%input_tokens%'`.
- Ne garde que les spans des appels au modèle de **la** trace de la question 1 : filtre sur son identifiant de trace (`trace_id`).
- Les points des clés d'attributs (`gen_ai.usage.input_tokens`) deviennent des `_` dans les noms de colonnes de dlt. Si l'attribut est resté dans une colonne JSON, lis-le avec `->>` comme à la leçon 3.
