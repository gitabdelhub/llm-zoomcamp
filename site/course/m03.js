// Module 3 : l'orchestration de l'IA avec Airflow 3. Le cours officiel 2026 utilise Kestra :
// ici, comme au Zoomcamp DE, le texte et les exercices sont à moi (course/m03/*.md), testés sur Airflow 3.3.2.
// Les vidéos officielles restent proposées : les exemples sont avec Kestra, les idées sont les mêmes.
// light : true = leçon courte (lire, résumer), "p" = leçon courte avec un exercice, absent = leçon complète.
(function () {
  const K = "les exemples sont avec Kestra, les idées sont les mêmes";
  COURSE.fill("03", [
    { type: "lesson", light: true, id: "03-01", title: "Pourquoi orchestrer une application LLM", overlay: "course/m03/01.md", min: 25,
      videos: [{ yt: "xUAkcgNIcRI", label: "L'orchestration de l'IA, la vidéo officielle (" + K + ")", optional: true }] },
    { type: "lesson", id: "03-02", title: "Le contexte : pourquoi un chatbot écrit du vieil Airflow", overlay: "course/m03/02.md", min: 45 },
    { type: "lesson", light: "p", id: "03-03", title: "Installer Airflow 3 et pgvector", overlay: "course/m03/03.md", min: 60,
      videos: [{ yt: "PbSIVDou17Q", label: "Une compose Airflow 3 minimale, de Data Slinger (en anglais)", optional: true }] },
    { type: "lesson", light: "p", id: "03-04", title: "Un assistant IA qui connaît ton projet", overlay: "course/m03/04.md", min: 40,
      videos: [{ yt: "OTiOdt17hZg", label: "L'AI Copilot, la vidéo officielle (" + K + ")", optional: true }] },
    { type: "lesson", id: "03-05", title: "Le RAG planifié dans Airflow", overlay: "course/m03/05.md", min: 90,
      videos: [{ yt: "FhGZV173xrk", label: "Le RAG, la vidéo officielle (" + K + ")", optional: true }] },
    { type: "lesson", id: "03-06", title: "Un agent dans une tâche Airflow", overlay: "course/m03/06.md", min: 60,
      videos: [{ yt: "7tvpR8EE0gs", label: "Les agents, la vidéo officielle (" + K + ")", optional: true }] },
    { type: "lesson", id: "03-07", title: "Plusieurs agents qui collaborent", overlay: "course/m03/07.md", min: 50 },
    { type: "lesson", light: "p", id: "03-08", title: "Coûts, secrets et limites", overlay: "course/m03/08.md", min: 45 },
    { type: "lesson", light: true, id: "03-09", title: "Bilan : quand un agent, quand un DAG", overlay: "course/m03/09.md", min: 15 },
    { type: "homework", id: "03-hw", title: "Homework 3 : orchestration", min: 150, overlay: "course/m03/hw.md",
      eyebrow: "Homework de la cohorte 2026, fait avec Airflow" },
    { type: "defi", id: "03-defi", title: "Défi : une ingestion incrémentale des embeddings", min: 180, overlay: "course/m03/defi.md",
      script: "site/checks/defi-03.py", codeHash: "599d4c6612362c3e071d2df97f7897502c8f3906f82677ceea9796059ca6107c",
      seq: "faq_incremental.py, vérifié dans ton Airflow" }
  ]);
})();
