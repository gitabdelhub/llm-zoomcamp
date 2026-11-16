// Workshop dlt : les traces LLM. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/w1/*.md. hash = 8 premiers caractères du SHA-256 de la leçon
// au moment où j'ai écrit les exercices : s'il change, le site affiche « Leçon modifiée ».
// Le workshop n'a qu'une vidéo, la session complète : elle est sur la première leçon.
(function () {
  const dir = "cohorts/2026/workshops/dlt/lessons/";
  COURSE.fill("W1", [
    { type: "lesson", light: true, id: "W1-01", title: "Vue d'ensemble et installation", min: 30, src: dir + "01-overview.md", hash: "ea14319f", overlay: "course/w1/01.md",
      videos: [{ yt: "A0LmmZf-ggM", label: "Le workshop complet, avec Alena Astrakhantseva de dltHub (en anglais)" }] },
    { type: "lesson", id: "W1-02", title: "Des logs locaux à un pipeline", min: 60, src: dir + "02-filesystem-pipeline.md", hash: "47e10233", overlay: "course/w1/02.md" },
    { type: "lesson", id: "W1-03", title: "Déboguer et faire un tableau de bord", min: 75, src: dir + "03-debug-and-dashboard.md", hash: "e9036ab8", overlay: "course/w1/03.md" },
    { type: "lesson", light: "p", id: "W1-04", title: "Charger depuis une API hébergée", min: 60, src: dir + "04-rest-api-pipeline.md", hash: "df77e307", overlay: "course/w1/04.md" },
    { type: "lesson", light: true, id: "W1-05", title: "Déployer dans le cloud", min: 25, src: dir + "05-deploy.md", hash: "ee665bfe", overlay: "course/w1/05.md" },
    { type: "lesson", light: true, id: "W1-06", title: "Tableau de bord et planification", min: 20, src: dir + "06-dashboard-deploy.md", hash: "ddc2dfa8", overlay: "course/w1/06.md" },
    { type: "lesson", light: true, id: "W1-07", title: "La suite et le récapitulatif", min: 15, src: dir + "07-where-to-go.md", hash: "42d9f6f8", overlay: "course/w1/07.md" },
    { type: "homework", id: "W1-hw", title: "Homework du workshop : les traces de ton agent", min: 150, src: "cohorts/2026/workshops/dlt/homework.md", hash: "bc28659e", overlay: "course/w1/hw.md" },
    { type: "defi", id: "W1-defi", title: "Défi : des logs d'agent sans doublons", min: 150, overlay: "course/w1/defi.md", script: "site/checks/defi-w1.py",
      codeHash: "7bf9ad3208a87b0b8c92a009017267b9797c8333e3fa492d8d21ed34673cce60", seq: "agent_logs.py, vérifié sur 12 sessions fictives" }
  ]);
})();
