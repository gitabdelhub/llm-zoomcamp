// Module 4 : l'évaluation. Le texte des leçons vient du repo officiel (src), mes exercices sont dans course/m04/*.md.
// Les numéros suivent les fichiers du cours (01 à 06, puis 11 à 15). hash = 8 premiers caractères du SHA-256 de la leçon
// au moment où j'ai écrit les exercices : s'il change, le site affiche « Leçon modifiée ».
// light : true = leçon courte (lire, résumer), "p" = leçon courte avec un exercice, absent = leçon complète.
(function () {
  const dir = "04-evaluation/";
  COURSE.fill("04", [
    { type: "lesson", light: true, id: "04-01", title: "Pourquoi évaluer", min: 20, src: dir + "01-intro.md", hash: "cf21e43b", overlay: "course/m04/01.md",
      videos: [{ yt: "eC_IcxfxoiQ", label: "L'évaluation" }] },
    { type: "lesson", light: "p", id: "04-02", title: "Des questions de test écrites par un LLM", min: 50, src: dir + "02-ground-truth.md", hash: "4e2b1d28", overlay: "course/m04/02.md",
      videos: [{ yt: "YScoH28cVf8", label: "La vérité terrain" }] },
    { type: "lesson", light: true, id: "04-03", title: "Toute la FAQ, en parallèle", min: 30, src: dir + "03-ground-truth-batch.md", hash: "0a3afe07", overlay: "course/m04/03.md",
      videos: [{ yt: "eM6xmdZDT6k", label: "La vérité terrain pour tous les documents" }] },
    { type: "lesson", light: "p", id: "04-04", title: "Évaluer la recherche : la pertinence", min: 50, src: dir + "04-search-evaluation.md", hash: "db3118f9", overlay: "course/m04/04.md",
      videos: [{ yt: "KoyYkv8P_jU", label: "L'évaluation de la recherche" }] },
    { type: "lesson", id: "04-05", title: "Hit rate et MRR", min: 60, src: dir + "05-search-metrics.md", hash: "2decb86a", overlay: "course/m04/05.md",
      videos: [{ yt: "TuirMy3Pdbk", label: "Les métriques de la recherche" }] },
    { type: "lesson", light: "p", id: "04-06", title: "Régler la recherche avec des chiffres", min: 60, src: dir + "06-search-tuning.md", hash: "80ff8be7", overlay: "course/m04/06.md",
      videos: [{ yt: "rSBSS_kCYN0", label: "Le réglage de la recherche" }] },
    { type: "lesson", light: true, id: "04-11", title: "Évaluer les réponses et l'agent", min: 15, src: dir + "11-evaluation-intro.md", hash: "de27088a", overlay: "course/m04/11.md",
      videos: [{ yt: "VKHBP0QSCFo", label: "L'évaluation du RAG et de l'agent" }] },
    { type: "lesson", light: "p", id: "04-12", title: "Les réponses du RAG, sans rien perdre", min: 50, src: dir + "12-rag-answers.md", hash: "9b01b1e3", overlay: "course/m04/12.md",
      videos: [{ yt: "utkcclfpj0g", label: "Les réponses du RAG" }] },
    { type: "lesson", id: "04-13", title: "Un LLM comme juge", min: 75, src: dir + "13-llm-as-judge.md", hash: "b7642921", overlay: "course/m04/13.md",
      videos: [{ yt: "BEXVULgalDM", label: "Le LLM juge" }] },
    { type: "lesson", light: "p", id: "04-14", title: "Évaluer un agent et sa trajectoire", min: 50, src: dir + "14-agent-evaluation.md", hash: "702d9b65", overlay: "course/m04/14.md",
      videos: [{ yt: "2SW86BehVdI", label: "L'évaluation de l'agent" }] },
    { type: "lesson", light: true, id: "04-15", title: "Bilan : de l'évaluation au monitoring", min: 15, src: dir + "15-next-steps.md", hash: "ce402770", overlay: "course/m04/15.md",
      videos: [{ yt: "TlKPBjItUw8", label: "La suite" }] },
    { type: "homework", id: "04-hw", title: "Homework 4 : évaluation", min: 180, src: "cohorts/2026/homework/04-evaluation/homework.md", hash: "15470d8b", overlay: "course/m04/hw.md" },
    { type: "defi", id: "04-defi", title: "Défi : un banc d'évaluation honnête", min: 180, overlay: "course/m04/defi.md", script: "site/checks/defi-04.py",
      codeHash: "f7f56b3409b77b10c5161e7670cf510008c8162e1ca9b20704b52a503b205927", seq: "evalbench.py, vérifié hors ligne" }
  ]);
})();
