// Module 1 : le RAG agentique. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m01/*.md. hash = 8 premiers caractères du SHA-256 de la leçon
// au moment où j'ai écrit les exercices : s'il change, le site affiche « Leçon modifiée ».
// min = durée indicative en minutes, vidéo comprise. light : true = leçon courte (lire, résumer),
// "p" = leçon courte avec un exercice, absent = leçon complète (prédire, pratiquer, casser, expliquer).
(function () {
  const dir = "01-agentic-rag/";
  COURSE.fill("01", [
    { type: "lesson", light: true, id: "01-01", title: "Introduction : les LLM et le RAG", min: 15, src: dir + "01-intro.md", hash: "4a6cf1c4", overlay: "course/m01/01.md",
      videos: [{ yt: "rQYyFxf1FWw", label: "Introduction" }] },
    { type: "lesson", light: "p", id: "01-02", title: "L'environnement et ta clé d'API", min: 30, src: dir + "02-environment.md", hash: "386efca1", overlay: "course/m01/02.md",
      videos: [{ yt: "3U4gBrmkZyM", label: "Environnement" }] },
    { type: "lesson", id: "01-03", title: "Le RAG, à la main", min: 40, src: dir + "03-rag.md", hash: "491780a7", overlay: "course/m01/03.md",
      videos: [{ yt: "JktYwBIDErk", label: "RAG" }] },
    { type: "lesson", light: "p", id: "01-04", title: "Le dataset de la FAQ", min: 30, src: dir + "04-dataset.md", hash: "47a155d6", overlay: "course/m01/04.md",
      videos: [{ yt: "Mx6EqvzVDz0", label: "Le dataset de la FAQ" }] },
    { type: "lesson", id: "01-05", title: "La recherche avec minsearch", min: 50, src: dir + "05-search.md", hash: "5b66edda", overlay: "course/m01/05.md",
      videos: [{ yt: "GYgpNKiuCJU", label: "Recherche" }] },
    { type: "lesson", id: "01-06", title: "Construire le prompt", min: 40, src: dir + "06-building-prompt.md", hash: "8c97018b", overlay: "course/m01/06.md",
      videos: [{ yt: "DV4e2n-dIv0", label: "Construire le prompt" }] },
    { type: "lesson", light: "p", id: "01-07", title: "Le LLM, les tokens et le prix", min: 35, src: dir + "07-llm.md", hash: "976a23f0", overlay: "course/m01/07.md",
      videos: [{ yt: "KHePGkeFn54", label: "Le LLM" }] },
    { type: "lesson", id: "01-08", title: "Le RAG en classe : RAGBase", min: 50, src: dir + "08-rag-helper.md", hash: "9a2f75e8", overlay: "course/m01/08.md",
      videos: [{ yt: "JxaC6Hrym6c", label: "RAG Helper" }] },
    { type: "lesson", id: "01-09", title: "L'ingestion persistante avec sqlitesearch", min: 50, src: dir + "09-data-ingestion.md", hash: "c7767f50", overlay: "course/m01/09.md",
      videos: [{ yt: "e0owGI2JV-s", label: "Ingestion des données" }] },
    { type: "lesson", light: true, id: "01-10", title: "Bilan de la partie 1", min: 15, src: dir + "10-rag-next-steps.md", hash: "e6bdf0de", overlay: "course/m01/10.md",
      videos: [{ yt: "RPXMz5p5fb8", label: "Bilan de la partie 1" }] },
    { type: "lesson", light: true, id: "01-11", title: "Les agents", min: 10, src: dir + "11-agents-intro.md", hash: "9f05ff2d", overlay: "course/m01/11.md",
      videos: [{ yt: "6uG4_Ivv60E", label: "Agents" }] },
    { type: "lesson", light: true, id: "01-12", title: "Révision rapide du RAG (facultative)", min: 15, src: dir + "12-rag-revision.md", hash: "03d08ea2", overlay: "course/m01/12.md",
      videos: [{ yt: "gH8fB-6Emmo", label: "Révision rapide du RAG" }] },
    { type: "lesson", id: "01-13", title: "L'appel de fonctions", min: 50, src: dir + "13-function-calling.md", hash: "7172a862", overlay: "course/m01/13.md",
      videos: [{ yt: "CeEki_0mdGo", label: "Function calling" }] },
    { type: "lesson", id: "01-14", title: "La boucle agentique", min: 55, src: dir + "14-agentic-loop.md", hash: "e149d327", overlay: "course/m01/14.md",
      videos: [{ yt: "ePlQUcTPPjw", label: "La boucle agentique" }] },
    { type: "lesson", light: "p", id: "01-15", title: "ToyAIKit", min: 35, src: dir + "15-frameworks.md", hash: "d5b017b2", overlay: "course/m01/15.md",
      videos: [{ yt: "PQpQOR3Un3w", label: "ToyAIKit" }] },
    { type: "lesson", light: true, id: "01-16", title: "Les autres frameworks", min: 20, src: dir + "16-other-frameworks.md", hash: "424e64f3", overlay: "course/m01/16.md",
      videos: [{ yt: "4yiCbKX9RhI", label: "Autres frameworks" }] },
    { type: "homework", id: "01-hw", title: "Homework 1 : RAG agentique", min: 180, src: "cohorts/2026/homework/01-agentic-rag/homework.md", hash: "d0c4465b", overlay: "course/m01/hw.md" },
    { type: "defi", id: "01-defi", title: "Défi : ta propre boîte à outils d'agent", min: 150, overlay: "course/m01/defi.md", script: "site/checks/defi-01.py",
      codeHash: "e522ae7d16abc72a754332164b1611ae443a4bae0acbcdc883e8477f0196b750", seq: "agentkit.py, vérifié par un faux client" }
  ]);
})();
