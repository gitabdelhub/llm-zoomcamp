// Le plan du cours LLM Zoomcamp (cohorte 2026), dans l'ordre conseillé. Tout est ouvert.
// Pas de module 0 : Git, Codespaces, Docker et Postgres s'apprennent dans ton Zoomcamp Data Engineering.
// Les rappels vers ces leçons sont dans les encadrés « Ah, c'est donc ça ! » (lien DE).
// dir / docs : le cours officiel d'un module, lisible en aperçu tant que ses exercices ne sont pas écrits.
// cover : la couverture du module (assets/art.js) : un dessin de ce qu'on apprend (scene) et les vrais logos des outils (logos). art.bg : sa couleur de fond.
window.COURSE = {
  title: "Mon LLM Zoomcamp",
  repo: { owner: "gitabdelhub", name: "llm-zoomcamp", branch: "main" },
  upstream: { owner: "DataTalksClub", name: "llm-zoomcamp", branch: "main" },
  playlist: "https://www.youtube.com/playlist?list=PL3MmuxUbc_hLZFNgSad56pDBKK8KO0XIv",
  faq: "https://datatalks.club/faq/llm-zoomcamp.html",
  slack: "https://app.slack.com/client/T01ATQK62F8/C06TEGTGM3J",
  // Ton autre site : les leçons du Zoomcamp Data Engineering, pour les rappels.
  de: "https://gitabdelhub.github.io/data-engineering-zoomcamp/site/",
  modules: [
    {
      id: "01", dir: "01-agentic-rag", title: "RAG agentique", chips: ["RAG", "minsearch", "Appel de fonctions", "Agents"],
      cover: { scene: "rag", logos: [["openai"], ["python", "#3776AB"], ["jupyter", "#F37626"]] },
      art: { bg: "#c8bcff", seed: 1 }, logo: ["openai"],
      sats: [["python", "#3776AB"], ["sqlite", "#003B57"], ["elasticsearch", "#005571"]], help: 3,
      gate: "Homework 1 et défi de l'agent", planned: 16, items: []
    },
    {
      id: "02", dir: "02-vector-search", title: "Recherche vectorielle", chips: ["Embeddings", "sqlitesearch", "pgvector"],
      cover: { scene: "vectors", logos: [["huggingface", "#FFD21E"], ["postgresql", "#4169E1"], ["sqlite", "#003B57"]] },
      art: { bg: "#e4ff97", seed: 2 }, logo: ["huggingface", "#FFD21E"],
      sats: [["postgresql", "#4169E1"], ["sqlite", "#003B57"], ["qdrant", "#DC244C"]], help: 3,
      gate: "Homework 2 et défi vectoriel", planned: 10, items: []
    },
    {
      id: "03", title: "Orchestration IA avec Airflow", chips: ["Airflow 3", "RAG planifié", "Agents"],
      cover: { scene: "dag", logos: [["apacheairflow", "#017CEE"], ["docker", "#2496ED"], ["python", "#3776AB"]] },
      art: { bg: "#9fd8ff", seed: 3 }, logo: ["apacheairflow", "#017CEE"],
      sats: [["docker", "#2496ED"], ["postgresql", "#4169E1"], ["python", "#3776AB"]], help: 2,
      gate: "Homework 3 et défi de l'ingestion incrémentale", planned: 9, items: []
    },
    {
      id: "W1", docs: [["Vue d'ensemble et installation", "cohorts/2026/workshops/dlt/lessons/01-overview.md"], ["Des logs locaux à un pipeline", "cohorts/2026/workshops/dlt/lessons/02-filesystem-pipeline.md"], ["Déboguer et faire un tableau de bord", "cohorts/2026/workshops/dlt/lessons/03-debug-and-dashboard.md"], ["Charger depuis une API hébergée", "cohorts/2026/workshops/dlt/lessons/04-rest-api-pipeline.md"], ["Déployer dans le cloud", "cohorts/2026/workshops/dlt/lessons/05-deploy.md"], ["Tableau de bord et planification", "cohorts/2026/workshops/dlt/lessons/06-dashboard-deploy.md"], ["La suite et le récapitulatif", "cohorts/2026/workshops/dlt/lessons/07-where-to-go.md"]], title: "Les traces LLM avec dlt", chips: ["dlt", "DuckDB", "marimo"],
      cover: { scene: "pipeline", logos: [["dlt", "", "wide"], ["duckdb", "#0a0a0a"], ["python", "#3776AB"]] },
      art: { bg: "#ffd2f3", seed: 4 }, logo: ["dlt"], wide: true,
      sats: [["duckdb", "#000000"], ["python", "#3776AB"]], help: 2,
      gate: "Homework du workshop", planned: 7, items: []
    },
    {
      id: "04", dir: "04-evaluation", title: "Évaluation", chips: ["Hit rate", "MRR", "LLM juge"],
      cover: { scene: "eval", logos: [["openai"], ["pandas", "#150458"], ["jupyter", "#F37626"]] },
      art: { bg: "#b9f5d0", seed: 5 }, logo: ["pandas", "#150458"],
      sats: [["python", "#3776AB"], ["pandas", "#150458"], ["model", "#000000"]], help: 2,
      gate: "Homework 4 et défi d'évaluation", planned: 11, items: []
    },
    {
      id: "05", dir: "05-monitoring", title: "Monitoring", chips: ["Streamlit", "PostgreSQL", "Grafana"],
      cover: { scene: "monitor", logos: [["grafana", "#F46800"], ["streamlit", "#FF4B4B"], ["postgresql", "#4169E1"]] },
      art: { bg: "#ffcfb8", seed: 6 }, logo: ["grafana", "#F46800"],
      sats: [["streamlit", "#FF4B4B"], ["postgresql", "#4169E1"], ["docker", "#2496ED"]], help: 2,
      gate: "Homework 5 et défi du tableau de bord", planned: 14, items: []
    },
    {
      id: "06", dir: "06-best-practices", title: "Bonnes pratiques", chips: ["Recherche hybride", "Reranking", "LangChain"],
      cover: { scene: "hybrid", logos: [["langchain", "#1C3C3C"], ["elasticsearch", "#005571"], ["python", "#3776AB"]] },
      art: { bg: "#fff3a6", seed: 7 }, logo: ["langchain", "#1C3C3C"],
      sats: [["elasticsearch", "#005571"], ["huggingface", "#FFD21E"]], help: 1,
      gate: "Homework 6", planned: 5, items: []
    },
    {
      id: "07", dir: "07-project-example", title: "Un projet complet, en exemple", chips: ["Flask", "Grafana", "Docker Compose"],
      cover: { scene: "app", logos: [["flask", "#000000"], ["grafana", "#F46800"], ["docker", "#2496ED"]] },
      art: { bg: "#d9d4ff", seed: 8 }, logo: ["flask", "#000000"],
      sats: [["grafana", "#F46800"], ["postgresql", "#4169E1"], ["docker", "#2496ED"]], help: 1,
      gate: "Homework 7", planned: 7, items: []
    },
    {
      id: "P", docs: [["L'énoncé officiel du projet final", "project.md"]], title: "Projet final", chips: ["Ton dataset", "RAG évalué", "Monitoring"],
      cover: { scene: "launch", logos: [["github", "#181717"], ["docker", "#2496ED"], ["python", "#3776AB"]] },
      art: { bg: "#c8bcff", seed: 9 }, logo: ["github", "#181717"],
      sats: [["docker", "#2496ED"], ["streamlit", "#FF4B4B"], ["grafana", "#F46800"]], help: 1,
      gate: "Ton projet rendu et relu", planned: 1, items: []
    }
  ]
};

// Ajoute le contenu d'un module (appelé par course/mXX.js).
window.COURSE.fill = function (id, items) {
  const mod = window.COURSE.modules.find(m => m.id === id);
  mod.items = items.map(it => Object.assign({ module: id }, it));
};
