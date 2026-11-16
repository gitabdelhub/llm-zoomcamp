// « Ce que tu construis » : le schéma d'architecture en haut de chaque module.
// rows = une ligne par zone (où ça tourne). Un nœud = [logo, couleur, nom, détail, texte de la flèche qui y mène].
// link = la flèche qui descend de la ligne précédente. official = [image du repo, légende].
// map = « Où tu en es » en haut de chaque leçon : chaque pièce porte l'id de la leçon qui la construit.
(function () {
  const INK = "#0a0a0a";
  const ARCH = {
    "01": {
      intro: "Tu construis un assistant qui répond aux questions des étudiants à partir de la FAQ du cours. D'abord un RAG simple (chercher, construire le prompt, appeler le LLM), puis un agent qui décide lui-même quand chercher.",
      rows: [
        { zone: "Ton Codespace · un notebook Jupyter", nodes: [
          ["file", INK, "La FAQ du cours", "documents JSON : question, réponse, cours"],
          ["python", "#3776AB", "Ton index de recherche", "minsearch, puis sqlitesearch", "indexé"],
          ["file", INK, "Ton prompt", "la question + les documents trouvés", "les meilleurs résultats"],
          ["model", INK, "Le LLM", "API d'OpenAI (ou un autre fournisseur)", "envoyé"]
        ] },
        { zone: "Ton agent", link: "puis le LLM pilote la recherche", nodes: [
          ["model", INK, "L'agent", "boucle : penser, appeler un outil, recommencer"],
          ["python", "#3776AB", "Tes outils", "search(), add_entry() : des fonctions Python", "appel de fonction"]
        ] }
      ]
    },
    "02": {
      intro: "Tu remplaces la recherche par mots-clés par une recherche par le sens : chaque texte devient un vecteur (un embedding), et on cherche les vecteurs les plus proches. D'abord en mémoire, puis dans SQLite, puis dans PostgreSQL avec pgvector.",
      rows: [
        { zone: "Ton Codespace", nodes: [
          ["file", INK, "La FAQ du cours", "questions et réponses"],
          ["huggingface", "#FFD21E", "Un modèle d'embedding", "sentence-transformers, en local", "encodé"],
          ["python", "#3776AB", "Tes vecteurs", "384 nombres par document", "un vecteur par texte"]
        ] },
        { zone: "Où tu les ranges", link: "puis tu cherches les plus proches", nodes: [
          ["python", "#3776AB", "minsearch", "en mémoire"],
          ["sqlite", "#003B57", "sqlitesearch", "dans un fichier"],
          ["postgresql", "#4169E1", "pgvector", "dans PostgreSQL, en Docker"]
        ] }
      ]
    },
    "03": {
      intro: "Tu fais tourner tes pipelines IA tout seuls avec Airflow 3, l'orchestrateur que tu connais déjà : indexer la FAQ chaque nuit, répondre à des questions en lot, puis un agent et plusieurs agents qui travaillent ensemble, avec des reprises en cas d'erreur.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["apacheairflow", "#017CEE", "Ton DAG Airflow", "planifié, avec reprises"],
          ["python", "#3776AB", "Indexation", "télécharger, découper, indexer", "chaque nuit"],
          ["model", INK, "Le LLM", "réponses, résumés, agents", "appelé par tes tâches"],
          ["postgresql", "#4169E1", "PostgreSQL", "les réponses et les coûts", "rangé"]
        ] }
      ]
    },
    "W1": {
      intro: "Les applications LLM laissent des traces : chaque question, chaque réponse, chaque coût. Tu les charges avec dlt dans DuckDB pour les analyser, d'abord depuis des fichiers, puis depuis l'API d'un service de monitoring, et tu en fais un tableau de bord marimo.",
      rows: [
        { zone: "Ton Codespace", nodes: [
          ["file", INK, "Les traces LLM", "fichiers de logs, puis une API"],
          ["dlt", "", "Ton pipeline dlt", "schéma déduit tout seul", "extraction"],
          ["duckdb", "#000000", "DuckDB", "des tables propres", "chargement"],
          ["dashboard", INK, "marimo", "ton tableau de bord", "analysé"]
        ] }
      ]
    },
    "04": {
      intro: "Tu mesures si ton système marche, avec des chiffres plutôt qu'à l'œil : des questions de test générées par un LLM, le hit rate et le MRR pour la recherche, puis un LLM juge pour les réponses et pour l'agent.",
      rows: [
        { zone: "Ton Codespace · un notebook", nodes: [
          ["model", INK, "Questions de test", "générées par un LLM, pour chaque document"],
          ["python", "#3776AB", "Évaluer la recherche", "hit rate, MRR, réglage des paramètres", "comparées"],
          ["model", INK, "Évaluer les réponses", "un LLM juge, des sorties structurées", "puis"]
        ] }
      ]
    },
    "05": {
      intro: "Ton assistant devient une vraie application : une interface de chat, chaque échange enregistré dans PostgreSQL avec son coût et l'avis de l'utilisateur, puis des tableaux de bord Streamlit et Grafana, le tout lancé par Docker Compose.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["streamlit", "#FF4B4B", "L'application de chat", "Streamlit, avec 👍 et 👎"],
          ["model", INK, "L'assistant", "RAG + juge intégré", "chaque question"],
          ["postgresql", "#4169E1", "PostgreSQL", "conversations, coûts, avis", "enregistré"],
          ["grafana", "#F46800", "Grafana", "tes tableaux de bord", "lu par"]
        ] }
      ]
    },
    "06": {
      intro: "Les techniques qui font la différence en production : combiner la recherche par mots-clés et par le sens (recherche hybride), puis reclasser les résultats avec un modèle plus précis (reranking).",
      rows: [
        { zone: "Ton Codespace", nodes: [
          ["elasticsearch", "#005571", "Recherche par mots-clés", "BM25"],
          ["huggingface", "#FFD21E", "Recherche par le sens", "embeddings", "en même temps"],
          ["python", "#3776AB", "Fusion des résultats", "RRF", "fusionnés"],
          ["huggingface", "#FFD21E", "Reranking", "un cross-encoder", "reclassés"]
        ] }
      ]
    },
    "07": {
      intro: "Un projet complet, de bout en bout, à lire et refaire avant le tien : un assistant fitness avec son évaluation, une API Flask, l'ingestion, le monitoring Grafana et Docker Compose.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["file", INK, "Un dataset d'exercices", "CSV"],
          ["flask", "#000000", "L'API Flask", "RAG évalué", "indexé"],
          ["postgresql", "#4169E1", "PostgreSQL", "conversations et avis", "enregistré"],
          ["grafana", "#F46800", "Grafana", "le monitoring", "lu par"]
        ] }
      ]
    },
    "P": {
      intro: "Ton propre assistant, sur des données que tu choisis : une base de connaissances, un RAG évalué, une interface, et le monitoring. Les critères suivent la grille officielle.",
      rows: [
        { zone: "Ton dépôt GitHub", nodes: [
          ["file", INK, "Ton dataset", "choisi par toi"],
          ["python", "#3776AB", "Ingestion et index", "recherche évaluée", "indexé"],
          ["model", INK, "Ton RAG", "réponses évaluées", "cherché"],
          ["streamlit", "#FF4B4B", "Interface", "Streamlit ou API", "servi"],
          ["grafana", "#F46800", "Monitoring", "avis et métriques", "suivi"]
        ] }
      ]
    }
  };
  COURSE.modules.forEach(m => { if (ARCH[m.id]) m.arch = ARCH[m.id]; });
})();
