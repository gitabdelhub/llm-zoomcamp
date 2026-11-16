// Module 5 : le monitoring. Le texte des leçons vient du repo officiel (src), mes exercices sont dans course/m05/*.md.
// hash = 8 premiers caractères du SHA-256 de la leçon au moment où j'ai écrit les exercices :
// s'il change, le site affiche « Leçon modifiée ».
// light : true = leçon courte (lire, résumer), "p" = leçon courte avec un exercice, absent = leçon complète.
(function () {
  const dir = "05-monitoring/";
  COURSE.fill("05", [
    { type: "lesson", light: true, id: "05-01", title: "Surveiller un système en ligne", min: 15, src: dir + "01-intro.md", hash: "07a4050c", overlay: "course/m05/01.md",
      videos: [{ yt: "lbEj3Waxs1U", label: "Le monitoring" }] },
    { type: "lesson", light: "p", id: "05-02", title: "L'assistant à surveiller", min: 40, src: dir + "02-assistant-setup.md", hash: "45e1796b", overlay: "course/m05/02.md",
      videos: [{ yt: "jMO8rqPmR-4", label: "L'assistant" }] },
    { type: "lesson", id: "05-03", title: "Une interface de chat avec Streamlit", min: 60, src: dir + "03-chat-app.md", hash: "04013e5c", overlay: "course/m05/03.md",
      videos: [{ yt: "JCB4JZlMsIQ", label: "L'application de chat" }] },
    { type: "lesson", light: "p", id: "05-04", title: "Mesurer chaque appel : temps, tokens, coût", min: 45, src: dir + "04-metrics.md", hash: "63a8b098", overlay: "course/m05/04.md",
      videos: [{ yt: "JGh6-DqaueA", label: "Les métriques" }] },
    { type: "lesson", id: "05-05", title: "Tout garder dans PostgreSQL", min: 75, src: dir + "05-database.md", hash: "0dc34673", overlay: "course/m05/05.md",
      videos: [{ yt: "iXRu_AbMtuU", label: "PostgreSQL" }] },
    { type: "lesson", light: "p", id: "05-06", title: "Relire les conversations, et l'index", min: 40, src: dir + "06-querying.md", hash: "ff78dfd0", overlay: "course/m05/06.md",
      videos: [{ yt: "18vEtjPJwLc", label: "Interroger les données" }] },
    { type: "lesson", light: "p", id: "05-07", title: "Un tableau de bord dans Streamlit", min: 45, src: dir + "07-streamlit-dashboard.md", hash: "990d7e9b", overlay: "course/m05/07.md",
      videos: [{ yt: "OrWlgDKZclI", label: "Le tableau de bord Streamlit" }] },
    { type: "lesson", id: "05-08", title: "L'avis des utilisateurs : 👍 et 👎", min: 70, src: dir + "08-user-feedback.md", hash: "8a34fe0c", overlay: "course/m05/08.md",
      videos: [{ yt: "GEifsHDadBw", label: "L'avis des utilisateurs" }] },
    { type: "lesson", light: "p", id: "05-09", title: "Un juge sur chaque réponse", min: 50, src: dir + "09-built-in-judge.md", hash: "0e155ebc", overlay: "course/m05/09.md",
      videos: [{ yt: "YLOLQyrMDuY", label: "Le juge intégré" }] },
    { type: "lesson", light: true, id: "05-10", title: "Les avis sur le tableau de bord", min: 20, src: dir + "10-feedback-dashboard.md", hash: "9ff37c91", overlay: "course/m05/10.md" },
    { type: "lesson", light: "p", id: "05-11", title: "Des fausses conversations, mais cohérentes", min: 40, src: dir + "11-synthetic-data.md", hash: "6e0a2b71", overlay: "course/m05/11.md" },
    { type: "lesson", id: "05-12", title: "Les tableaux de bord Grafana", min: 75, src: dir + "12-grafana.md", hash: "8179f3bf", overlay: "course/m05/12.md",
      videos: [{ yt: "Pmh2jT8tEiw", label: "Grafana" }] },
    { type: "lesson", id: "05-13", title: "Toute la pile dans Docker Compose", min: 60, src: dir + "13-docker-compose.md", hash: "6bc07eb9", overlay: "course/m05/13.md" },
    { type: "lesson", light: true, id: "05-14", title: "Bilan : outils et production", min: 15, src: dir + "14-next-steps.md", hash: "71a0c7bf", overlay: "course/m05/14.md",
      videos: [{ yt: "GpQeAniVGfk", label: "La suite" }] },
    { type: "homework", id: "05-hw", title: "Homework 5 : OpenTelemetry", min: 180, src: "cohorts/2026/homework/05-monitoring/homework.md", hash: "8bab370e", overlay: "course/m05/hw.md" },
    { type: "defi", id: "05-defi", title: "Défi : toute la pile en une seule commande", min: 180, overlay: "course/m05/defi.md", script: "site/checks/defi-05.py",
      codeHash: "6f16c93bb63ae5218000f21a4bf37c66a41aa8ae5c34d65ed8496b49f9886f1d", seq: "compose.yaml, vérifié sur ta pile en marche" }
  ]);
})();
