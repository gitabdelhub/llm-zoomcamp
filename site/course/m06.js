// Module 6 : les bonnes pratiques. Le texte des leçons vient du repo officiel (src), mes exercices sont dans course/m06/*.md.
// hash = 8 premiers caractères du SHA-256 de la leçon au moment où j'ai écrit les exercices :
// s'il change, le site affiche « Leçon modifiée ».
// light : true = leçon courte (lire, résumer), "p" = leçon courte avec un exercice, absent = leçon complète.
(function () {
  const dir = "06-best-practices/";
  COURSE.fill("06", [
    { type: "lesson", light: true, id: "06-01", title: "Cinq techniques pour une meilleure recherche", min: 15, src: dir + "01-intro.md", hash: "6f56cd94", overlay: "course/m06/01.md" },
    { type: "lesson", light: "p", id: "06-02", title: "Recherche hybride et fusion RRF", min: 45, src: dir + "02-hybrid-search.md", hash: "432787f7", overlay: "course/m06/02.md" },
    { type: "lesson", light: true, id: "06-03", title: "Reclasser les résultats dans Elasticsearch", min: 25, src: dir + "03-reranking.md", hash: "275a8b94", overlay: "course/m06/03.md" },
    { type: "lesson", light: true, id: "06-04", title: "La même recherche avec LangChain", min: 20, src: dir + "04-langchain.md", hash: "2947802c", overlay: "course/m06/04.md" },
    { type: "lesson", light: true, id: "06-05", title: "Bilan et techniques à essayer", min: 15, src: dir + "05-next-steps.md", hash: "bcc82e10", overlay: "course/m06/05.md" },
    { type: "homework", id: "06-hw", title: "Homework 6 : Comparer les approches (facultatif)", min: 60, src: "cohorts/2026/homework/06-best-practices/homework.md", hash: "5b763012", overlay: "course/m06/hw.md" }
  ]);
})();
