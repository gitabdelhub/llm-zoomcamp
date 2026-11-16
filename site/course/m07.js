// Module 7 : un projet complet, en exemple (facultatif). Le texte des leçons vient du repo officiel (src), mes exercices sont dans course/m07/*.md.
// hash = 8 premiers caractères du SHA-256 de la leçon au moment où j'ai écrit les exercices :
// s'il change, le site affiche « Leçon modifiée ».
// light : true = leçon courte (lire, résumer), "p" = leçon courte avec un exercice, absent = leçon complète.
(function () {
  const dir = "07-project-example/";
  COURSE.fill("07", [
    { type: "lesson", light: true, id: "07-01", title: "Un assistant de fitness, de zéro", min: 30, src: dir + "01-intro.md", hash: "1139f96a", overlay: "course/m07/01.md",
      videos: [{ yt: "E9O0Tg68PPg", label: "Le projet exemple" }] },
    { type: "lesson", light: "p", id: "07-02", title: "Évaluer la recherche et régler les boosts", min: 60, src: dir + "02-evaluating-retrieval.md", hash: "c0064c47", overlay: "course/m07/02.md",
      videos: [{ yt: "6ulnHtJPCWY", label: "Évaluer la recherche" }] },
    { type: "lesson", light: true, id: "07-03", title: "Évaluer les réponses avec un juge", min: 25, src: dir + "03-evaluating-rag.md", hash: "5573c409", overlay: "course/m07/03.md",
      videos: [{ yt: "lxpW2mR7dGk", label: "Évaluer le RAG" }] },
    { type: "lesson", light: "p", id: "07-04", title: "Une API Flask et l'ingestion", min: 60, src: dir + "04-interface.md", hash: "fd0cd25a", overlay: "course/m07/04.md",
      videos: [{ yt: "vMHve2EyA5M", label: "L'interface" }] },
    { type: "lesson", light: "p", id: "07-05", title: "Monitoring et conteneurs", min: 50, src: dir + "05-monitoring.md", hash: "d5047a25", overlay: "course/m07/05.md",
      videos: [{ yt: "nQda9etJWW8", label: "Monitoring et Docker" }] },
    { type: "lesson", light: true, id: "07-06", title: "Bilan : le projet fini et son coût", min: 15, src: dir + "06-summary.md", hash: "bd626c2f", overlay: "course/m07/06.md",
      videos: [{ yt: "TW9M5VE8vpo", label: "Le bilan" }] },
    { type: "lesson", light: true, id: "07-07", title: "Découper des textes longs", min: 20, src: dir + "07-chunking.md", hash: "2096d0c3", overlay: "course/m07/07.md",
      videos: [{ yt: "tyBRP_WewXA", label: "Le découpage" }] },
    { type: "homework", id: "07-hw", title: "Homework 7 : Ce que tu améliorerais (facultatif)", min: 60, src: "cohorts/2026/homework/07-project-example/homework.md", hash: "e5108f82", overlay: "course/m07/hw.md" }
  ]);
})();
