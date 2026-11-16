@@ intro
Le homework 6 est **facultatif** et court : pas de questions à choix, une réflexion. L'énoncé demande d'essayer les exemples des leçons, de comparer les approches, et d'écrire ce que tu utiliserais dans un système en production.

Ton rendu : un `README.md` dans `mon-travail/module-06/`, d'une page au plus.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton `README.md` poussé sur ton fork. Si tu as Claude, il peut relire ta comparaison.

@@ guide
Ici, pas de réponse à trouver : la qualité de ta réflexion compte. Une structure qui marche :

### 1. Ce que tu as comparé

Les approches que tu as vraiment lancées : par mots-clés, vectorielle, hybride (somme pondérée ou RRF), avec ou sans reclassement. Si tu n'as pas installé Elasticsearch, ton défi du module 2 (hybride dans Postgres) et ta `rrf` de la leçon 2 comptent.

### 2. Les chiffres

Pour chaque approche, le hit rate et le MRR sur la même vérité terrain. Avec ton banc du défi 4, ajoute l'intervalle de la différence avec la meilleure approche : un gain dont l'intervalle contient 0 n'est pas encore un gain.

### 3. Ce que tu prendrais en production

Une approche, et trois lignes pour la défendre : la qualité, le coût par question (un reclassement par cross-encoder coûte un modèle de plus), et la simplicité à faire tourner.

### 4. Ce que tu essaierais ensuite

Une des trois techniques non montrées (small-to-big, métadonnées, réécriture de la question), et le chiffre qui te dirait si elle marche.
