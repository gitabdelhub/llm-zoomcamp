@@ intro
Le homework officiel de la cohorte 2026, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Le homework 2 s'arrêtait sur une question ouverte : recherche lexicale, vectorielle ou hybride, laquelle est la meilleure ? Ici, tu réponds avec des chiffres. Même base qu'aux homeworks 1 et 2 : **les leçons du cours**, au commit `8c1834d` (72 pages, 295 morceaux). Une seule question appelle le LLM, et pour 3 pages seulement : moins d'un centime.

Ton code va dans `mon-travail/module-04/homework/`, avec un `README.md` qui reprend tes réponses et la façon dont tu les as trouvées.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-04/homework/` poussé sur ton fork, avec ton `README.md`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-llm-zoomcamp`), ou cherche « llm zoomcamp 2026 homework 4 » sur GitHub. Si tu as Claude, il peut relire ton raisonnement question par question.

L'énoncé le dit : si ta réponse ne tombe pas exactement sur une option, choisis **la plus proche**.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le projet du homework 2

L'énoncé continue le homework 2 : même découpage, mêmes recherches, même modèle ONNX. Le projet `mon-travail/module-02-onnx/` a déjà tout ; ajoute ce qu'il faut pour le LLM :

~~~bash
cd /workspaces/llm-zoomcamp/mon-travail/module-02-onnx
uv add openai pydantic python-dotenv pandas
mkdir -p ../module-04/homework
~~~

Ton notebook va dans `../module-04/homework/`, avec le kernel `llm-zoomcamp-onnx` du module 2. Vérifie que `models/Xenova/all-MiniLM-L6-v2/model.onnx` existe toujours, sinon refais `download.py`.

### 2. Les fichiers, sans wget

Les trois commandes `wget` de l'énoncé renvoient une **erreur 404** : rien de tout ça n'est dans `cohorts/2026/`. Tout est dans ton fork :

~~~bash
cd /workspaces/llm-zoomcamp/mon-travail/module-04/homework
cp /workspaces/llm-zoomcamp/04-evaluation/code/{rag_helper,evaluation_utils}.py .
cp /workspaces/llm-zoomcamp/02-vector-search/embed/embedder.py .
cp /workspaces/llm-zoomcamp/04-evaluation/ground-truth.csv .
~~~

### 3. Le modèle, depuis un autre dossier

`Embedder()` cherche `models/` **dans le dossier courant**. Depuis `module-04/homework/`, donne-lui le chemin complet : `Embedder("/workspaces/llm-zoomcamp/mon-travail/module-02-onnx/models/Xenova/all-MiniLM-L6-v2")`. Et utilise-le **tel quel**, comme au homework 2 : les options ont été calculées avec lui.

### 4. Une fonction evaluate pour tout

Reprends `hit_rate`, `mrr` et `evaluate` du module, avec la recherche en paramètre (leçons 4 et 5). Une seule chose change, et l'énoncé insiste : le **libellé**. Ici, une question est étiquetée par son `filename`, et les résultats sont des **morceaux** de pages.

### 5. Les réponses

Dans ton `README.md`, une section par question : ta réponse, le nombre exact que tu as mesuré, et la commande ou la cellule qui le montre.

@@ q1
- `llm_structured` renvoie deux choses : la sortie structurée **et** l'usage. Le nombre que tu cherches est dans `usage.input_tokens`.
- Le prompt utilisateur, c'est un JSON qui contient le `filename` **et tout le `content`** de la page : `json.dumps({"filename": doc["filename"], "content": doc["content"]})`.
- Avant d'appeler le modèle, estime : en anglais, un token fait environ 4 caractères. Compare ton estimation à la mesure. Si elles diffèrent d'un ordre de grandeur, vérifie que tu envoies bien la page entière.

@@ q2
- `pd.read_csv("ground-truth.csv").to_dict(orient="records")` : chaque enregistrement a une `question` et un `filename`.
- Le découpage de l'énoncé doit te donner **295** morceaux. Si ce n'est pas le cas, vérifie `size=2000, step=1000`.
- `keyword_fields=["filename"]` sert à **filtrer**, pas à classer : il ne change pas les scores. Ce qui compte pour le classement, ce sont les `text_fields`, ceux du homework 2.

@@ q3
- `vector_search` encode la question avec l'`Embedder`, puis cherche ce **vecteur** dans le `VectorSearch` construit sur la matrice `X` des 295 morceaux.
- Vérifie la forme de `X` : une ligne par morceau, 384 colonnes, dans **le même ordre** que `chunks`.
- L'énoncé te dit d'où vient la question. Si les deux méthodes donnent la même page en tête, l'une des deux n'est pas celle de l'énoncé : relis tes paramètres.

@@ q4
- La pertinence d'un résultat : `int(d["filename"] == q["filename"])`, et plus `d["id"] == q["document"]`.
- Plusieurs morceaux de la même page peuvent arriver dans le top 5 : une liste de pertinence peut contenir **plusieurs** 1. Repense à l'erreur provoquée de la leçon 5 : ta fonction `mrr` s'arrête-t-elle au premier ?
- Ajoute ton `assert mrr <= hit_rate` : s'il échoue, le bug est dans `mrr`, pas dans la recherche.

@@ q5
- La même fonction `evaluate`, avec `vector_search` à la place de `text_search` : rien d'autre ne change.
- 360 questions à encoder une par une prend un peu de temps sur un processeur. Si c'est trop long, encode-les d'abord toutes avec `encode_batch`, puis cherche chaque vecteur.
- Compare aussi le hit rate des deux méthodes : tu as maintenant les chiffres pour répondre à la question du homework 2.

@@ q6
- `hybrid_search(query, k=60)` prend `k` en paramètre. Pour l'évaluer avec une autre valeur : `lambda query, k=k: hybrid_search(query, k=k)`, comme la boucle des boosts de la leçon 6.
- Affiche le MRR avec 4 décimales pour chaque `k` : l'énoncé prévient que plusieurs valeurs peuvent être à égalité, et dit laquelle choisir dans ce cas.
- Pour comprendre le résultat, calcule à la main `1 / (k + rank)` pour les rangs 0 et 4, avec `k = 1` puis `k = 200` : avec quel `k` la première place compte-t-elle beaucoup plus que la cinquième ?
