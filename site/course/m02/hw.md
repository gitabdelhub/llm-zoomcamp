@@ intro
Le homework officiel de la cohorte 2026, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Comme au homework 1, la base de connaissances, ce sont **les leçons du cours**, au commit `8c1834d`. Deux nouveautés : les embeddings avec l'`Embedder` ONNX de la leçon 9, sans sentence-transformers, et la recherche **hybride** avec RRF, que le module n'a fait qu'annoncer.

Ton code va dans `mon-travail/module-02/homework/`, avec un `README.md` qui reprend tes réponses et la façon dont tu les as trouvées.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-02/homework/` poussé sur ton fork, avec ton `README.md`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-llm-zoomcamp`), ou cherche « llm zoomcamp 2026 homework 2 » sur GitHub. Si tu as Claude, il peut relire ton raisonnement question par question.

L'énoncé le dit : si ta réponse ne tombe pas exactement sur une option, choisis **la plus proche**.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le projet

Tu peux réutiliser `mon-travail/module-02-onnx/` de la leçon 9 : il a déjà `onnxruntime`, `tokenizers`, `numpy`, `tqdm` et `minsearch`. Ajoute seulement `gitsource` :

~~~bash
cd /workspaces/llm-zoomcamp/mon-travail/module-02-onnx
uv add gitsource
mkdir -p ../module-02/homework
~~~

Ton notebook va dans `../module-02/homework/`, avec le kernel `llm-zoomcamp-onnx` de la leçon 9.

### 2. download.py et embedder.py

Les commandes `wget` de l'énoncé renvoient une **erreur 404** : les fichiers ne sont pas dans `cohorts/2026/02-vector-search/embed/`. Ils sont dans ton fork, et tu les as déjà copiés à la leçon 9 :

~~~bash
cp /workspaces/llm-zoomcamp/02-vector-search/embed/*.py .
~~~

### 3. Un Embedder tel quel

L'énoncé dit que les deux méthodes donnent des vecteurs « identiques ». À la leçon 9, tu as vérifié ce qu'il en est vraiment, et peut-être réglé la coupe du tokenizer. Pour le homework, utilise l'`Embedder` **tel quel**, sans ton réglage : les options de l'énoncé ont été calculées avec lui. Si une réponse tombe entre deux options, refais le calcul avec ton réglage et note les deux résultats dans ton `README.md`.

### 4. Les données

Le même code qu'au homework 1, au même commit. Vérifie juste après : `len(documents)` doit valoir 72. Je n'ai pas pu lancer ce téléchargement depuis mon environnement (GitHub y bloque les archives) ; dans ton Codespace, il marche normalement.

### 5. Les réponses

Dans ton `README.md`, une section par question : ta réponse, la valeur exacte que tu as mesurée (un score, un nom de fichier), et le code qui t'y a mené.

@@ q1
- C'est la leçon 9 : `Embedder()`, puis `encode` sur la question. Vérifie d'abord `v.shape` : tu dois avoir `(384,)`.
- Arrondis à deux décimales avant de comparer aux options.
- Si ta valeur est loin de toutes les options, vérifie que `download.py` a bien téléchargé `Xenova/all-MiniLM-L6-v2`, et que tu lances `Embedder()` depuis le dossier qui contient `models/`.

@@ q2
- Trouve la page avec `next(d for d in documents if d["filename"] == "...")`, en copiant le chemin de l'énoncé.
- Le vecteur de Q1 et celui de la page sont normalisés : un produit scalaire suffit. C'est la leçon 2.
- Une page entière est longue. Repense à l'erreur provoquée de la leçon 2 : quelle partie de la page le modèle lit-il vraiment ? Garde la réponse en tête, c'est l'argument de la question 3.

@@ q3
- `encode_batch` par lots de 50, avec `tqdm`, comme à la leçon 3. Puis `X = np.array(...)` : vérifie que `X.shape[0]` vaut `len(chunks)`.
- Le meilleur morceau, c'est `np.argmax(scores)`. Sa page, c'est `chunks[i]["filename"]`.
- Regarde aussi les 5 meilleurs avec `np.argsort(-scores)[:5]` : plusieurs morceaux de la même page peuvent apparaître.
- Garde `X` et `chunks` : les trois questions suivantes en ont besoin. Tu peux les enregistrer comme à la leçon 3.

@@ q4
- C'est la leçon 5 : `VectorSearch()`, puis `fit(X, chunks)`. Les morceaux n'ont pas de champ `course` : pas de `keyword_fields`, pas de `filter_dict`.
- `search` veut un **vecteur** : encode la question d'abord.
- La recherche doit donner le même premier résultat que `np.argmax(X.dot(v))` : c'est ta vérification de la leçon 5.

@@ q5
- `Index(text_fields=["content"])`, puis `fit(chunks)` : c'est le module 1.
- Plusieurs morceaux d'une même page peuvent être dans un top 5. Compare des **ensembles** de noms de fichiers : `set(d["filename"] for d in results)`.
- Ce qui est dans l'un et pas dans l'autre : la différence de deux ensembles, `a - b`.
- Une fois la réponse trouvée, ouvre la page en question : pourquoi la recherche texte l'a-t-elle ratée ? Cherche les mots exacts de la requête dedans.

@@ q6
- La fonction `rrf` est donnée : copie-la telle quelle. Elle utilise `doc["start"]` : une `KeyError` veut dire que tu lui passes des pages au lieu de morceaux.
- L'énoncé ne dit pas combien de résultats prendre dans chaque liste. Les deux `search` de minsearch en renvoient 10 par défaut. Fais le calcul avec 10 et avec 5 : si le premier change, note les deux dans ton `README.md`.
- Pour comprendre le résultat, affiche le **rang** du gagnant dans chacune des deux listes : l'énoncé dit qu'il n'est premier dans aucune.
- C'est la fusion que ton défi du module te demande d'écrire en SQL, avec un départage en cas d'égalité : ici, `sorted` garde l'ordre d'arrivée des documents à score égal.
