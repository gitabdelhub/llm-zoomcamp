@@ intro
Le homework officiel de la cohorte 2026, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Le module construisait le monitoring à la main : une dataclass, Postgres, Streamlit, Grafana. Le homework prend l'autre chemin, celui de l'industrie : **OpenTelemetry**. Tu instrumentes le RAG avec des **traces**, tu ranges les mesures dans les **attributs** des spans, tu écris ton propre exportateur vers SQLite, et tu interroges les traces en SQL. Même base qu'aux homeworks 1, 2 et 4 : les 72 leçons du cours, au commit `8c1834d`. Chaque question coûte un ou quelques appels au LLM : quelques centimes en tout.

Ton code va dans `mon-travail/module-05/homework/`, avec un `README.md` qui reprend tes réponses et la façon dont tu les as trouvées.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-05/homework/` poussé sur ton fork, avec ton `README.md`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-llm-zoomcamp`), ou cherche « llm zoomcamp 2026 homework 5 » sur GitHub. Si tu as Claude, il peut relire ton raisonnement question par question.

L'énoncé le dit : si ta réponse ne tombe pas exactement sur une option, choisis **la plus proche**.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le projet

~~~bash
mkdir -p /workspaces/llm-zoomcamp/mon-travail/module-05/homework
cd /workspaces/llm-zoomcamp/mon-travail/module-05/homework
uv init --python 3.12
uv add gitsource minsearch openai python-dotenv opentelemetry-api opentelemetry-sdk pandas
~~~

Ta clé est déjà dans le secret Codespaces `OPENAI_API_KEY` : le fichier `.env` de l'énoncé est inutile.

### 2. Les fichiers, sans wget

Les deux `wget` de l'énoncé renvoient une **erreur 404** : rien de tout ça n'est dans `cohorts/2026/`. Les deux fichiers sont à la racine du module, dans ton fork :

~~~bash
cp /workspaces/llm-zoomcamp/05-monitoring/{rag_helper,starter}.py .
~~~

Attention : ce `rag_helper.py`-là n'est **pas** celui du module (`05-monitoring/code/`). Le sien cherche dans le champ `content` des leçons, et sa méthode `llm()` renvoie la **réponse brute** de l'API, pas le texte. C'est exprès : tu en as besoin pour lire les tokens.

### 3. Un script, pas un notebook

L'énoncé dit de mettre la configuration d'OpenTelemetry **tout en haut**, avant d'importer `starter`. Fais-le dans un script `hw5.py` que tu relances en entier, plutôt que dans un notebook : OpenTelemetry n'accepte qu'**un seul** fournisseur de traces par processus. Si tu relances la cellule de configuration, il refuse le nouveau en silence, à part un avertissement (vérifié avec opentelemetry-sdk 1.45 : `Overriding of current TracerProvider is not allowed`), et tes spans continuent de partir vers l'ancien exportateur.

### 4. Les réponses

Dans ton `README.md`, une section par question : ta réponse, le nombre exact que tu as mesuré, et la commande ou la requête qui le montre.

@@ q1
- `RAGTraced(RAGBase)` redéfinit trois méthodes. Chacune ouvre un span, puis appelle la version d'origine avec `super()` : `with tracer.start_as_current_span("search"): return super().search(query, ...)`.
- Garde la même signature que la méthode d'origine : `search(self, query, num_results=5)`. Et crée l'objet tracé avec les mêmes arguments que le `rag` de `starter.py` (`index=`, `llm_client=`).
- Ne compte pas à la main dans un mur de texte : chaque span imprimé contient une ligne `"name":`. `uv run python hw5.py | grep -c '"name":'` les compte pour toi. Puis vérifie que le nombre colle avec ce que fait `rag()` dans `rag_helper.py`.

@@ q2
- Dans ta méthode `llm`, `response = super().llm(prompt)`, puis `response.usage.input_tokens` et `response.usage.output_tokens`. Pose les attributs **avant** de sortir du `with` : après, le span est fermé.
- Avant de lancer, estime : le prompt contient 5 leçons **entières**. Regarde `len(prompt)` et divise par 4 (environ 4 caractères par token en anglais). Ton estimation et la mesure doivent avoir le même ordre de grandeur.
- Pour le coût : la `calculate_cost` du module (0,15 $ et 0,60 $ par million) ou la `calc_price` du module 4 (0,75 $ et 4,50 $) ne donnent pas le même chiffre. Choisis-en une, et écris dans ton README laquelle, et pourquoi.

@@ q3
- `start_time` et `end_time` sont des entiers en **nanosecondes** (vérifié : un span de 10 ms donne une différence d'environ 10 000 000). Divise par 1 000 000 pour des millisecondes.
- La console n'affiche pas la durée, seulement les deux dates en texte : calcule-la. Plus simple : dans ta méthode `llm`, mesure aussi avec `time.perf_counter()` et compare.
- Lance la question plusieurs fois : la première peut être plus lente. L'énoncé demande la plage que tu vois le plus souvent.

@@ q4
- Remplace le `ConsoleSpanExporter` par `SQLiteSpanExporter("traces.db")` **dans la configuration du haut**, et relance le script en entier (voir l'étape 3 du guide).
- Si la table `spans` est vide, ton exportateur n'est pas celui qui reçoit les spans : cherche l'avertissement `Overriding of current TracerProvider` dans la sortie.
- `sqlite3 traces.db "SELECT name, COUNT(*) FROM spans GROUP BY name;"` montre tout. Si `sqlite3` n'est pas installé dans ton Codespace, la même requête marche avec `pandas.read_sql`.

@@ q5
- La durée d'un span : `end_time - start_time`, en nanosecondes. En SQL : `SUM(end_time - start_time) / 1e6` pour des millisecondes.
- `WHERE name != 'rag'` et `GROUP BY name` : un total par type de span.
- Compare aussi le total de `rag` à la somme des deux autres : la différence, c'est le temps passé hors de `search` et `llm` (construire le prompt).

@@ q6
- Avant de lancer les quatre requêtes, repars d'une base propre (`rm traces.db`) : sinon tes essais des questions précédentes se mélangent aux quatre runs. Ou bien garde-les, mais ne prends que les 4 derniers spans `llm`, triés par `start_time`.
- `pd.read_sql("SELECT input_tokens FROM spans WHERE name = 'llm'", conn)` te donne une colonne : regarde le minimum, le maximum, et l'écart relatif `(max - min) / min`.
- Dans ton README, explique ce que contiennent les tokens d'entrée (les instructions, la question, le contexte) et ce qui pourrait les faire varier d'un run à l'autre.
