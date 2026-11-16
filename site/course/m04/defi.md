@@ body
# Défi du module 4 : un banc d'évaluation honnête

Pas de vidéo, pas de leçon. Tu as tout vu : les listes de pertinence (leçon 4), le hit rate et le MRR à plusieurs k (leçon 5), le découpage par document (leçon 6), et une vérité terrain qui vieillit (leçon 4). Ici, tu en fais **un outil** que tu réutiliseras à chaque module : un banc qui dit si une recherche est meilleure qu'une autre, **et à quel point tu peux y croire**. Essaie d'abord seul. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape.

Pourquoi ce défi ? Parce qu'à la leçon 6, la grille gagnait 0,08 de MRR sur 15 documents mis de côté. Est-ce un vrai progrès, ou la chance d'un petit échantillon ? Le hit rate et le MRR sont des **moyennes**, et une moyenne sur peu de cas bouge beaucoup. Une équipe sérieuse ne dit pas « c'est mieux » sans un **intervalle de confiance**. Et cet intervalle doit respecter une chose que le cours ne dit pas : les 5 questions d'un même document **ne sont pas indépendantes**.

## L'objectif

Un seul fichier, `mon-travail/module-04/evalbench.py`, avec six fonctions. Pas de nouvelle bibliothèque : le module `random` de Python suffit.

### 1. `relevance(ground_truth, search_function, k=10, label="document", key="id")`

Une liste de pertinence par question, dans l'ordre de `ground_truth` : `search_function(question)` est appelée **une seule fois** par question, et on garde au plus ses `k` premiers résultats. Un résultat vaut 1 si son champ `key` est égal au champ `label` de la question, 0 sinon. Si la recherche renvoie moins de `k` résultats, la liste est plus courte.

### 2. `hit_rate(rel, k=5)` et 3. `mrr(rel, k=5)`

Les deux métriques du module, calculées sur les `k` premiers éléments de chaque liste : une seule recherche à 10 résultats sert ainsi pour tous les `k` jusqu'à 10. `mrr` ne compte que le **premier** 1 de chaque liste.

### 4. `split_by_doc(ground_truth, test_frac=0.2, seed=42, label="document")`

Renvoie deux listes `(train, test)` de questions. `int(nombre de documents × test_frac)` documents vont dans `test`, avec **toutes** leurs questions ; les autres vont dans `train`. Aucune question n'est perdue, aucun document n'est des deux côtés. Le même `seed` donne le même découpage, un autre `seed` un autre découpage.

### 5. `paired_bootstrap(rel_a, rel_b, groups, metric="mrr", k=5, n_boot=1000, seed=0)`

Compare deux recherches **sur les mêmes questions** : `rel_a` et `rel_b` sont leurs listes de pertinence, `groups` donne le document de chaque question (`groups[i]` pour la question `i`). Renvoie un dictionnaire :

- `diff` : `metric(rel_a, k) - metric(rel_b, k)` sur toutes les questions ;
- `low` et `high` : l'intervalle de confiance à 95 % de cette différence, par **bootstrap par document**. On tire au hasard, avec remise, autant de documents qu'il y en a ; toutes les questions de chaque document tiré entrent dans l'échantillon, une fois par tirage ; on recalcule la différence. Après `n_boot` tirages, `low` et `high` sont les percentiles 2,5 et 97,5 des différences ;
- le même `seed` donne le même résultat. `metric` vaut `"mrr"` ou `"hit_rate"`.

### 6. `audit(ground_truth, documents, label="document", key="id")`

Ce qui fausse les chiffres avant même de chercher. Un dictionnaire : `missing_ids`, la liste triée des étiquettes de la vérité terrain qui ne correspondent à **aucun** document ; `affected_questions`, le nombre de questions concernées ; `duplicate_ids`, la liste triée des `id` qui apparaissent plusieurs fois dans `documents`.

## La vérification

Depuis `mon-travail/module-04`, dans le projet uv du module :

```bash
uv run python ../../site/checks/defi-04.py evalbench.py
```

Le script fabrique ses propres données (61 documents fictifs, 302 questions) et deux fausses recherches dont il connaît d'avance les classements. Il n'appelle aucun LLM, n'utilise pas le réseau et n'écrit rien sur le disque. Il affiche ✅ ou ❌ pour chacune des dix vérifications, avec ce que ton code a renvoyé, mais jamais ce qui est attendu. Pour le bootstrap, il ne vérifie pas un nombre exact (ton tirage au hasard n'est pas le mien) : il vérifie que ton intervalle a la bonne largeur, et qu'il est **plus large** qu'un bootstrap par question. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

Ensuite, le vrai test, sur les données du cours : la grille de la leçon 6 contre les boosts de départ, **sur les 15 documents mis de côté**. Le gain de 0,08 est-il sûr ? Compare ton intervalle par document à celui que tu obtiens en passant `list(range(len(test)))` comme `groups`, et écris ta conclusion dans le `README.md` du module.

@@ guide
### 1. Le fichier

`evalbench.py`, dans `mon-travail/module-04/`. Il n'importe rien d'autre que `random` et `collections` : il ne sait rien de minsearch ni de la FAQ, il reçoit une fonction de recherche. C'est ce qui le rend réutilisable.

### 2. relevance, hit_rate, mrr

Ce sont tes fonctions de la leçon 5, avec `label` et `key` en paramètres. `search_function(q["question"])[:k]` coupe les résultats.

### 3. split_by_doc

Ta coupe de la leçon 6, rangée dans une fonction. Trie les étiquettes avant de les mélanger : un `set` n'a pas d'ordre garanti, et sans tri, la même graine pourrait donner deux découpages.

### 4. Les groupes

Un dictionnaire `document → liste des numéros de ses questions`, construit une fois avec `collections.defaultdict(list)`. Le tirage porte sur les **clés** de ce dictionnaire.

### 5. Un tirage

`rng = random.Random(seed)`, puis `rng.choices(noms, k=len(noms))` tire les documents avec remise. Les numéros des questions de l'échantillon, ce sont ceux de chaque document tiré, mis bout à bout. Un document tiré deux fois compte deux fois.

### 6. Les percentiles

Trie les `n_boot` différences : la valeur à la position `int(0.025 * n_boot)` et celle à la position `int(0.975 * n_boot) - 1` encadrent 95 % des tirages.

### 7. audit

Un `Counter` des `id` des documents donne les doublons. Les étiquettes manquantes, c'est une différence d'ensembles.

### 8. Tester pas à pas

Lance le script **tôt** : les cinq premières vérifications ne testent que `relevance`, `hit_rate` et `mrr`. Chaque ❌ te montre ce que ton code a renvoyé.

@@ hints
- Si la vérification 8 dit que ta largeur « par documents » est égale à celle « par questions », tu tires des questions, pas des documents.
- Si la vérification 6 montre `commun` plus grand que 0, tu coupes des questions et pas des documents.
- `diff` ne dépend pas du hasard : c'est la différence des métriques sur toutes les questions. Seuls `low` et `high` viennent des tirages.
- Pour l'intervalle « par questions », pas besoin d'une autre fonction : si chaque question est son propre groupe, ton bootstrap par document devient un bootstrap par question.
- Un `random.Random(seed)` à toi, plutôt que `random.seed(seed)` : tu ne changes pas le hasard du reste du programme.
- Sur les 15 documents de côté, compte environ 75 questions : un intervalle large n'est pas un bug, c'est le message.

@@ solution
Ma solution, testée avec le script de vérification : les dix vérifications passent. Lancée sur les données du cours (`uv run python evalbench.py`), elle affiche aussi la comparaison sur toutes les questions.

~~~python
"""Mon banc d'évaluation de la recherche : une seule recherche par question, des métriques à plusieurs k, et une comparaison honnête."""
import random
from collections import Counter, defaultdict


def relevance(ground_truth, search_function, k=10, label="document", key="id"):
    """Une liste de 0 et de 1 par question : 1 là où le document attendu apparaît dans les k premiers résultats."""
    total = []
    for q in ground_truth:
        results = search_function(q["question"])[:k]
        total.append([int(d[key] == q[label]) for d in results])
    return total


def hit_rate(rel, k=5):
    return sum(1 for line in rel if 1 in line[:k]) / len(rel)


def mrr(rel, k=5):
    score = 0.0
    for line in rel:
        line = line[:k]
        if 1 in line:
            score += 1 / (line.index(1) + 1)
    return score / len(rel)


def split_by_doc(ground_truth, test_frac=0.2, seed=42, label="document"):
    """Coupe par document : les questions d'un même document vont toutes du même côté."""
    ids = sorted({q[label] for q in ground_truth})
    random.Random(seed).shuffle(ids)
    test_ids = set(ids[: int(len(ids) * test_frac)])
    train = [q for q in ground_truth if q[label] not in test_ids]
    test = [q for q in ground_truth if q[label] in test_ids]
    return train, test


METRICS = {"mrr": mrr, "hit_rate": hit_rate}


def paired_bootstrap(rel_a, rel_b, groups, metric="mrr", k=5, n_boot=1000, seed=0):
    """Intervalle à 95 % de metric(a) - metric(b), en tirant des documents (pas des questions) avec remise."""
    f = METRICS[metric]
    by_group = defaultdict(list)
    for i, g in enumerate(groups):
        by_group[g].append(i)
    names = sorted(by_group)
    rng = random.Random(seed)
    diffs = []
    for _ in range(n_boot):
        rows = [i for g in rng.choices(names, k=len(names)) for i in by_group[g]]
        diffs.append(f([rel_a[i] for i in rows], k) - f([rel_b[i] for i in rows], k))
    diffs.sort()
    return {"diff": f(rel_a, k) - f(rel_b, k),
            "low": diffs[int(0.025 * n_boot)], "high": diffs[int(0.975 * n_boot) - 1]}


def audit(ground_truth, documents, label="document", key="id"):
    """Ce qui fausse les chiffres avant même de chercher : des étiquettes sans document, des id en double."""
    counts = Counter(d[key] for d in documents)
    missing = sorted({q[label] for q in ground_truth} - set(counts))
    return {"missing_ids": missing,
            "affected_questions": sum(1 for q in ground_truth if q[label] in set(missing)),
            "duplicate_ids": sorted(i for i, c in counts.items() if c > 1)}


if __name__ == "__main__":
    import json
    import pandas as pd
    from minsearch import Index

    ground_truth = pd.read_csv("data/ground_truth-new.csv").to_dict(orient="records")
    documents = json.load(open("/workspaces/llm-zoomcamp/site/data/faq-llm-2026-05-12.json"))
    print(audit(ground_truth, documents))
    index = Index(text_fields=["question", "section", "answer"], keyword_fields=["course"])
    index.fit(documents)

    def search_with(boosts):
        return lambda query: index.search(query, num_results=10, boost_dict=boosts)

    base = relevance(ground_truth, search_with({"question": 3.0, "section": 0.5}))
    tuned = relevance(ground_truth, search_with({"question": 1.0, "answer": 2.0, "section": 0.1}))
    for k in (1, 3, 5, 10):
        print(f"k={k:2}  base {hit_rate(base, k):.3f} / {mrr(base, k):.3f}   réglée {hit_rate(tuned, k):.3f} / {mrr(tuned, k):.3f}")
    groups = [q["document"] for q in ground_truth]
    print(paired_bootstrap(tuned, base, groups))
~~~

Ce que j'obtiens sur les données du cours. Sur les 395 questions, la grille gagne **0,114** de MRR, avec un intervalle par document de **[0,075 ; 0,155]** : le gain est sûr. Sur les **15 documents mis de côté** seulement :

~~~text
par documents  {'diff': 0.0753, 'low': -0.0249, 'high': 0.1616}
par questions  {'diff': 0.0753, 'low': 0.0062, 'high': 0.1480}
~~~

Par questions, l'intervalle ne contient pas 0 : on conclurait que la grille est meilleure. Par documents, il **contient 0** : avec 15 documents, ce gain peut encore être de la chance. Les deux calculs ont la même différence ; seul le second respecte le fait que 5 questions d'un même document se ressemblent. Ma conclusion : la grille est probablement meilleure (elle l'est aussi sur la partie de réglage, et sur toutes les questions), mais 15 documents ne suffisent pas à le **prouver**. Pour trancher, il faut plus de documents de côté, ou une validation croisée par groupes.
