## Question 1: Context Engineering

Fais cette expérience :

1. Ouvre ChatGPT dans une fenêtre de navigation privée : https://chatgpt.com
2. Entre ce prompt : « Create an Airflow DAG that loads NYC taxi data from CSV to BigQuery »
3. Puis donne le même prompt à l'assistant de ton Codespace (GitHub Copilot Chat), avec ton fichier `.github/copilot-instructions.md` de la leçon 4

Après avoir comparé les deux réponses, quelle est la raison principale pour laquelle ton assistant écrit de meilleurs DAG Airflow 3 ?

- Ton assistant utilise un modèle plus puissant
- Ton assistant reçoit la documentation et les règles actuelles de ta version d'Airflow, avec ton fichier de contexte
- Ton assistant utilise plus de tokens
- Ton assistant a accès à Internet

## Question 2: RAG vs No RAG

Lance `faq_ask` (leçon 5) avec ses paramètres par défaut, puis lis les logs de la tâche `compare`.

La réponse **sans** RAG est plutôt :

- Exacte et précise, conforme à la FAQ du cours
- Vague, générique ou inventée : le modèle devine à partir de ses données d'entraînement
- Vide : le modèle refuse de répondre sans contexte
- Identique à la réponse avec RAG

## Question 3: Token usage — short summary

Lance `simple_agent` (leçon 6) avec `summary_length = short`, en laissant les autres paramètres par défaut.

Ouvre les logs de la tâche `log_token_usage`. Combien de tokens de **sortie** affiche-t-elle, à peu près, pour `multilingual_agent` ?

- 5-15 tokens
- 60-100 tokens
- 200-400 tokens
- 500+ tokens

## Question 4: Token usage — long summary

Relance `simple_agent` avec `summary_length = long`.

Compare les tokens de sortie de `multilingual_agent` à ton résultat de la question 3. Combien de fois plus de tokens de sortie le résumé long utilise-t-il, à peu près ?

- À peu près autant (moins de 20 % d'écart)
- 2 à 5 fois plus
- 10 à 20 fois plus
- 50 fois plus

## Question 5: Modifying a flow

Dans `dags/faq_agents.py`, trouve la tâche `english_brevity` et change son prompt : au lieu d'**exactement 1 phrase**, demande **exactement 3 phrases**.

Enregistre, attends que le dag-processor relise le fichier, puis lance `simple_agent` avec `summary_length = long`.

Compare les tokens de sortie de `english_brevity` à ceux de la version à une phrase (lancée elle aussi avec `summary_length = long`). Que constates-tu ?

- À peu près autant (moins de 20 % d'écart)
- 2 à 4 fois plus
- 5 à 10 fois plus
- Plus de 10 fois plus

## Question 6: Best Practices

D'après ce module, pour des pipelines de production qui demandent des résultats déterministes et reproductibles, avec des exigences strictes de conformité (rapports financiers, secteurs très réglementés), quelle approche est la plus adaptée ?

- Toujours utiliser des agents d'IA, pour un maximum de flexibilité et d'adaptation
- Utiliser des workflows classiques, faits de tâches, pour leur prévisibilité et leur auditabilité
- Utiliser seulement du RAG, sans agents, pour de meilleures performances
- Utiliser uniquement des outils de recherche web, pour avoir des données à jour

@@ intro
Le homework de la cohorte 2026 a été écrit pour Kestra et Gemini. Ici, ce sont **les mêmes six questions, avec les mêmes options**, refaites avec tes DAG Airflow 3 et l'API d'OpenAI. Jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Attention : les options des questions 3 à 5 ont été calibrées avec Gemini, sur un autre texte. Tes nombres ne tomberont pas forcément dans une option. L'énoncé officiel le prévoit : choisis **la plus proche**, et note tes vrais nombres dans ton `README.md`.

Ton code va dans `mon-travail/module-03/`, avec un `homework/README.md` qui reprend tes réponses et la façon dont tu les as trouvées.

@@ submit
La cohorte 2026 est terminée, et ce homework est une adaptation à Airflow : le formulaire officiel, prévu pour Kestra, ne sert pas ici. Ton rendu, c'est ton dossier `mon-travail/module-03/` poussé sur ton fork, avec ton `homework/README.md`. Pour comparer ton raisonnement, les étudiants de la cohorte en ont parlé sur le Slack de DataTalksClub (canal `#course-llm-zoomcamp`) ; leurs nombres viennent de Gemini, pas des tiens. Si tu as Claude, il peut relire ton raisonnement question par question.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Ton Airflow tourne

Les six services de la leçon 3 sont démarrés, et ta clé est là :

~~~bash
cd /workspaces/llm-zoomcamp/mon-travail/module-03/airflow
docker compose ps
docker compose exec airflow-scheduler python -c "import os; print('clé présente :', bool(os.environ.get('OPENAI_API_KEY')))"
~~~

Si la clé est absente, ajoute le secret `OPENAI_API_KEY` dans les réglages Codespaces de GitHub, puis redémarre ton Codespace et `docker compose up -d`.

### 2. Les DAG du module

`faq_ask` (leçon 5) et `simple_agent` (leçon 6) sont dans `dags/`, sans erreur d'import :

~~~bash
docker compose exec airflow-scheduler airflow dags list-import-errors
~~~

`faq_ask` a besoin d'une table `documents` remplie : lance `faq_ingest` une fois si ce n'est pas fait.

### 3. Où lire les tokens

Lance les DAG depuis l'interface (http://localhost:8080, bouton **Trigger**), pour choisir les paramètres dans le formulaire. Les nombres sont dans l'onglet **Logs** de la tâche `log_token_usage` (questions 3 à 5) ou `compare` (question 2).

### 4. Tes réponses

Dans `homework/README.md`, une section par question : ta réponse, les nombres exacts que tu as mesurés, et ce que tu as lancé pour les obtenir.

@@ q1
- Compare les **imports** des deux DAG : `airflow.sdk` ou `airflow.decorators` ? `schedule` ou `schedule_interval` ? Ton tableau de la leçon 2 liste ce qui a changé entre Airflow 2 et 3.
- Les deux assistants peuvent utiliser des modèles de la même famille. Qu'est-ce qui était **différent** dans ce qu'ils ont reçu avant de répondre ?
- Pour éliminer des options : ton assistant a-t-il cherché sur Internet pendant qu'il répondait ? A-t-il écrit beaucoup plus de texte que ChatGPT ?

@@ q2
- Lis les deux réponses côte à côte : laquelle cite un détail qu'on ne peut connaître qu'en lisant la FAQ (une date, un nom, une règle précise) ?
- Compare les tokens d'**entrée** des deux branches, affichés par `compare` : que reçoit le modèle dans chaque cas ?
- Pose aussi la question sans RAG pour un autre cours (`course = data-engineering-zoomcamp`) : la réponse change-t-elle vraiment ?

@@ q3
- C'est la ligne `multilingual_agent : ... en sortie` dans le log de `log_token_usage`. Les tokens d'**entrée** ne comptent pas ici.
- Un modèle ne répond pas deux fois pareil : lance le DAG deux ou trois fois, et note chaque valeur.
- Les modèles GPT-5 peuvent raisonner avant de répondre, et ces tokens de raisonnement comptent dans la sortie. Ajoute `response.usage.output_tokens_details.reasoning_tokens` à ton log : s'il n'est pas à 0, note les deux nombres, avec et sans raisonnement, dans ton README.

@@ q4
- Le rapport, c'est les tokens de sortie du résumé `long` **divisés** par ceux du résumé `short`.
- Compare des choses comparables : soit les deux avec le raisonnement, soit les deux sans.
- Les consignes du DAG disent combien de phrases ou de paragraphes donne chaque longueur. Avant de diviser, devine l'ordre de grandeur : ton résultat est-il cohérent avec ces consignes ?

@@ q5
- Après avoir modifié le fichier, vérifie dans l'onglet **Code** du DAG que l'interface montre bien ta nouvelle version, avant de le lancer.
- Lance la version à 1 phrase et celle à 3 phrases avec le **même** `summary_length = long`, et compare seulement les tokens de **sortie** de `english_brevity`.
- Avant de mesurer, écris ta prédiction dans ton README. Si la mesure la contredit, cherche pourquoi : le raisonnement, la longueur des phrases, ou une consigne que le modèle n'a pas suivie.

@@ q6
- Relis le tableau « Quel outil pour quel travail » de la leçon 8.
- Les mots-clés de la question sont « déterministes », « reproductibles » et « auditabilité ». Où apparaissent-ils dans le module ?
- La leçon 9 propose une question à se poser avant chaque tâche. Applique-la à un rapport financier.
