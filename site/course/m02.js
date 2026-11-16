// Module 2 : la recherche vectorielle. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m02/*.md. hash = 8 premiers caractères du SHA-256 de la leçon
// au moment où j'ai écrit les exercices : s'il change, le site affiche « Leçon modifiée ».
// min = durée indicative en minutes, vidéo comprise. light : true = leçon courte (lire, résumer),
// "p" = leçon courte avec un exercice, absent = leçon complète (prédire, pratiquer, casser, expliquer).
(function () {
  const dir = "02-vector-search/";
  COURSE.fill("02", [
    { type: "lesson", light: true, id: "02-01", title: "La recherche vectorielle", min: 15, src: dir + "01-intro.md", hash: "d2c98466", overlay: "course/m02/01.md",
      videos: [{ yt: "qyZgxTmC2cY", label: "Recherche vectorielle" }] },
    { type: "lesson", id: "02-02", title: "Les embeddings", min: 45, src: dir + "02-embeddings.md", hash: "32f3abf7", overlay: "course/m02/02.md",
      videos: [{ yt: "kJOlW1HeMp4", label: "Embeddings" }] },
    { type: "lesson", light: "p", id: "02-03", title: "Les embeddings de la FAQ", min: 35, src: dir + "03-embeddings-dataset.md", hash: "e68bfb5e", overlay: "course/m02/03.md",
      videos: [{ yt: "NC89mz1iG4E", label: "Les embeddings de la FAQ" }] },
    { type: "lesson", id: "02-04", title: "La recherche vectorielle à la main", min: 45, src: dir + "04-vector-search.md", hash: "6b7a8549", overlay: "course/m02/04.md",
      videos: [{ yt: "h-_tdBc24qc", label: "Recherche vectorielle" }] },
    { type: "lesson", light: "p", id: "02-05", title: "La recherche vectorielle avec minsearch", min: 25, src: dir + "05-minsearch-vector.md", hash: "adcba1ba", overlay: "course/m02/05.md",
      videos: [{ yt: "E7KdO3xmESg", label: "minsearch" }] },
    { type: "lesson", id: "02-06", title: "Le RAG avec la recherche vectorielle", min: 40, src: dir + "06-rag-vector.md", hash: "9afed94c", overlay: "course/m02/06.md",
      videos: [{ yt: "-GBW3g3PVTM", label: "RAG vectoriel" }] },
    { type: "lesson", id: "02-07", title: "La recherche vectorielle persistante avec sqlitesearch", min: 50, src: dir + "07-sqlitesearch-vector.md", hash: "2705f0d7", overlay: "course/m02/07.md",
      videos: [{ yt: "csxKescwJYM", label: "sqlitesearch" }] },
    { type: "lesson", id: "02-08", title: "pgvector : les vecteurs dans Postgres", min: 60, src: dir + "08-pgvector.md", hash: "3d96bdaa", overlay: "course/m02/08.md",
      videos: [{ yt: "0P54MFyz-mc", label: "PGVector" }] },
    { type: "lesson", light: "p", id: "02-09", title: "ONNX Runtime à la place de PyTorch", min: 40, src: dir + "09-onnx-embedder.md", hash: "385bf704", overlay: "course/m02/09.md",
      videos: [{ yt: "BMqa4OsCk58", label: "ONNX" }] },
    { type: "lesson", light: true, id: "02-10", title: "Bilan : quand passer au vectoriel", min: 15, src: dir + "10-next-steps.md", hash: "e936b891", overlay: "course/m02/10.md",
      videos: [{ yt: "vhNfnNUz3A0", label: "La suite" }] },
    { type: "homework", id: "02-hw", title: "Homework 2 : recherche vectorielle", min: 180, src: "cohorts/2026/homework/02-vector-search/homework.md", hash: "02ba6845", overlay: "course/m02/hw.md" },
    { type: "defi", id: "02-defi", title: "Défi : une recherche hybride dans Postgres", min: 180, overlay: "course/m02/defi.md", script: "site/checks/defi-02.py",
      codeHash: "4fd380bff4fc53307da65e62d0d09b0dabe6883df66be1995953037c7477e032", seq: "hybrid.py, vérifié dans ton Postgres" }
  ]);
})();
