// Projet final : AB construit sa propre application LLM, dans son propre dépôt. Le texte vient du repo officiel (src),
// mes jalons sont dans course/mp/*.md : guides et exemples sur un autre sujet (les règles de jeux de société),
// jamais le projet d'AB à sa place.
// hash = 8 premiers caractères du SHA-256 du texte officiel quand j'ai écrit les jalons.
// min = durée indicative en minutes : un projet prend des semaines, c'est le temps de la première séance.
(function () {
  const src = "project.md";
  COURSE.fill("P", [
    { type: "lesson", id: "P-01", title: "Ton problème, tes données, ton dépôt", min: 90, src, hash: "fde0647a", overlay: "course/mp/01.md",
      videos: [{ yt: "pA9S1mTqAwU", label: "Les office hours du projet" }] },
    { type: "lesson", id: "P-02", title: "L'ingestion et le flux RAG", min: 150, src, hash: "fde0647a", overlay: "course/mp/02.md" },
    { type: "lesson", id: "P-03", title: "Évaluer la recherche et les réponses", min: 180, src, hash: "fde0647a", overlay: "course/mp/03.md" },
    { type: "lesson", id: "P-04", title: "L'interface et le monitoring", min: 150, src, hash: "fde0647a", overlay: "course/mp/04.md" },
    { type: "lesson", id: "P-05", title: "Reproductible, relu, rendu", min: 120, src, hash: "fde0647a", overlay: "course/mp/05.md" }
  ]);
})();
