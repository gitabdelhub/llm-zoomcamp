@@ intro
Le homework officiel de la cohorte 2026, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

La base de connaissances change : ce ne sont plus les questions de la FAQ, mais **les leçons du cours elles-mêmes**. Tu refais donc tout le module sur de nouvelles données, avec deux nouveautés : le découpage en morceaux (*chunking*) et la mesure des tokens.

Ton code va dans `mon-travail/module-01/homework/`, avec un `README.md` qui reprend tes réponses et la façon dont tu les as trouvées.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-01/homework/` poussé sur ton fork, avec ton `README.md`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-llm-zoomcamp`), ou cherche « llm zoomcamp 2026 homework 1 » sur GitHub. Si tu as Claude, il peut relire ton raisonnement question par question.

Les questions 3, 5 et 6 dépendent du modèle : choisis l'option **la plus proche**, comme le dit l'énoncé.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le dossier du homework

~~~bash
mkdir -p /workspaces/llm-zoomcamp/mon-travail/module-01/homework
cd /workspaces/llm-zoomcamp/mon-travail/module-01
uv add gitsource toyaikit
~~~

Tu réutilises le projet uv du module, qui a déjà `minsearch` et `openai`. Ton notebook va dans `homework/`, et tu choisis le kernel du `.venv` de `module-01`.

### 2. Les données

Le code de la partie « Preparation » de l'énoncé télécharge le dépôt du cours **tel qu'il était au commit `8c1834d`**, puis garde les fichiers Markdown dont le chemin contient `/lessons/`. À ce commit, les leçons étaient rangées dans `cohorts/2026/<module>/lessons/`. Aujourd'hui, elles ont bougé (dans ton fork, elles sont dans `01-agentic-rag/` directement). C'est pour ça que l'énoncé fixe le commit : tout le monde travaille sur les mêmes données.

Copie le code de l'énoncé tel quel. Vérifie juste après : `len(documents)` et `documents[0].keys()`. Chaque document a deux champs : `filename` et `content`.

Je n'ai pas pu lancer ce téléchargement depuis mon environnement (GitHub y bloque les archives). Dans ton Codespace, il marche normalement.

### 3. rag_helper.py

La commande `wget` de la question 3 renvoie une **erreur 404** : le fichier n'est pas dans `cohorts/2026/01-agentic-rag/code/`. Il est dans ton fork :

~~~bash
cp /workspaces/llm-zoomcamp/01-agentic-rag/code/rag_helper.py homework/
~~~

Si tu l'as déjà copié à la leçon 8, utilise cette copie.

### 4. Les réponses

Dans ton `README.md`, une section par question : ta réponse, puis le code ou le raisonnement qui t'y a mené. Pour les questions de tokens, note aussi le **nombre exact** que tu as mesuré : c'est lui que tu compareras avec les autres étudiants.

@@ q1
- Le code de l'énoncé remplit `documents` : la réponse est une seule fonction Python que tu connais.
- Avant de répondre, vérifie que le filtre a bien gardé **seulement** les leçons : `documents[0]["filename"]` doit contenir `/lessons/`.
- Compte aussi par module avec `collections.Counter(d["filename"].split("/")[2] for d in documents)` : tu dois retrouver les 7 dossiers de modules de l'énoncé. Si un module manque, le téléchargement s'est mal passé.

@@ q2
- C'est la leçon 5 avec d'autres champs : `Index(text_fields=[...], keyword_fields=[...])`, puis `fit(documents)`.
- Ici, pas de `filter_dict` ni de `boost_dict` : l'énoncé ne les demande pas, et il n'y a plus de champ `course`.
- Le premier résultat, c'est `results[0]["filename"]`. Lis aussi les 4 suivants : est-ce que le classement te paraît logique ?

@@ q3
- Deux méthodes de `RAGBase` parlent du schéma de la FAQ : `search` (le filtre `course` et le boost sur `question`) et `build_context` (`section`, `question`, `answer`). Une sous-classe qui remplace ces deux-là suffit : c'est la leçon 8.
- Pour lire les tokens, `llm` doit renvoyer l'objet `response` entier, ou au moins `response.usage`. Puis `rag` renvoie la réponse **et** l'usage, sous forme de tuple ou d'une petite `dataclass`.
- Le nombre est dans `usage.input_tokens`. Pour vérifier l'ordre de grandeur : un token vaut environ 4 caractères en anglais. Additionne la longueur des 5 `content` trouvés, divise par 4, et compare.

@@ q4
- L'énoncé donne la ligne de code. La réponse, c'est la longueur de la liste renvoyée.
- Vérifie un morceau : `chunks[0].keys()` doit montrer `filename`, `start` et `content`, et `len(chunks[0]["content"])` doit valoir au plus 2000.
- Pour comprendre le nombre : une page de N caractères donne environ N divisé par `step` morceaux, puisque la fenêtre avance de 1000 caractères à chaque fois.

@@ q5
- Un **nouvel** index, construit sur `chunks` au lieu de `documents`, avec les mêmes champs.
- Ta sous-classe de la question 3 accepte n'importe quel index dans son constructeur : crée-en une deuxième avec l'index des morceaux. Aucune ligne de RAG à réécrire.
- La réponse est le **rapport** entre les tokens de la question 3 et ceux-ci. Avant de calculer, prédis-le : 5 morceaux de 2000 caractères au plus, contre 5 pages entières.

@@ q6
- La fonction `search` de l'agent cherche dans l'index des **morceaux**, avec une annotation de type et une docstring : c'est la leçon 15.
- Copie les instructions de l'énoncé mot pour mot : ce sont elles qui poussent l'agent à chercher plusieurs fois.
- Pour compter les appels : le `callback` les affiche un par un, ou bien compte dans `result.all_messages` les éléments dont le type est `function_call`. Lance la question 2 ou 3 fois : le nombre varie un peu, garde l'option la plus proche.
