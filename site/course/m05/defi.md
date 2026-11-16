@@ body
# Défi du module 5 : toute la pile en une seule commande

Pas de vidéo, pas de leçon. C'est la troisième piste que propose la leçon 14 : « Move everything to Docker Compose so the whole stack starts with one command ». Le Compose de la leçon 13 laisse encore trois gestes à la main : lancer `db_init.py`, cliquer la source de données dans Grafana, recréer le tableau de bord. Et rien n'empêche l'application de démarrer avant que Postgres soit prêt. Ici, un collègue qui clone ton dossier tape **une** commande, et tout est là. Essaie d'abord seul. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape.

Pourquoi ce défi ? Parce qu'une installation qu'on refait à la main finit toujours par différer : une colonne oubliée, un tableau de bord d'une autre version, une source de données mal nommée. Ce qu'on décrit dans des fichiers se relit, se versionne dans Git, et se reconstruit à l'identique. C'est ce qu'on appelle l'**infrastructure as code**, et c'est un réflexe que toute équipe attend de toi.

## L'objectif

Dans `mon-travail/module-05/`, ton projet du module. Depuis un état vide :

```bash
docker compose down -v
docker compose up -d --build --wait
```

et rien d'autre. Ensuite :

### 1. Postgres

- Image `postgres:17`, avec un **healthcheck** : `docker compose ps` doit le montrer `healthy`.
- Au premier démarrage, les tables existent **sans aucun script lancé à la main** : `conversations` avec exactement le schéma de la leçon 5, `feedback` avec exactement celui de la leçon 8 (clé étrangère vers `conversations(id)` comprise).
- Un index sur `conversations (timestamp)`.

### 2. L'application Streamlit

- Elle démarre **après** que Postgres est en bonne santé (pas seulement démarré).
- Son image ne contient pas de fichier `.env`.
- Elle répond sur le port 8501. Ta clé vient de la variable `OPENAI_API_KEY` de ton Codespace.

### 3. Grafana

- La source de données Postgres est **provisionnée** depuis un fichier, avec l'uid `course-assistant-pg`, et elle se connecte.
- Le tableau de bord est **provisionné** depuis un fichier JSON, avec l'uid `course-assistant` et le titre `Course Assistant`.
- Il contient au moins quatre panneaux nommés exactement `Response time`, `Cost`, `Relevance` et `User feedback`, et leurs requêtes tournent sans erreur.

## La vérification

Une fois la pile lancée, depuis `mon-travail/module-05` :

```bash
python3 ../../site/checks/defi-05.py
```

Le script n'a besoin que de Python et de Docker : aucune bibliothèque à installer. Il lit ta pile avec `docker compose` (`ps`, `config`, `exec`), interroge Postgres dans son conteneur, l'application et l'API de Grafana sur `localhost`. Il ne modifie rien et n'appelle aucun LLM. Il affiche ✅ ou ❌ pour chacune des dix vérifications, avec ce que ta pile a renvoyé, mais jamais ce qui est attendu. Si tu as changé le mot de passe admin de Grafana, donne-le-lui : `GRAFANA_PASSWORD=... python3 ../../site/checks/defi-05.py`. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

Ensuite, le vrai test : lance `uv run python generate_data.py` (ou ton générateur de la leçon 11) et regarde ton tableau de bord se remplir dans Grafana, sans avoir rien cliqué.

@@ guide
### 1. Le point de départ

Ton `compose.yaml`, ton `Dockerfile` et ton `.dockerignore` de la leçon 13. Si tu n'as pas fait son exercice, commence par là : sans `.dockerignore`, la vérification 7 échouera.

### 2. Les tables au premier démarrage

L'image `postgres` exécute tous les fichiers `.sql` du dossier `/docker-entrypoint-initdb.d/`, **une seule fois** : quand son volume de données est vide. Écris un `init.sql` avec tes deux `CREATE TABLE` et ton index (repris de `db_init.py`), et monte-le en lecture seule : `./init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro`.

### 3. Le healthcheck

`pg_isready -U ... -d ...` répond « accepting connections » quand Postgres accepte des connexions. Dans `healthcheck.test`, la forme `["CMD-SHELL", "..."]` passe la commande à un shell. Compte large : `interval: 5s`, `retries: 20`.

### 4. Attendre la bonne santé

Dans le service `streamlit`, la forme longue de `depends_on` : `postgres:` puis `condition: service_healthy`. La forme courte (`- postgres`) n'attend que le **démarrage** du conteneur.

### 5. La source de données en fichier

Grafana lit au démarrage les fichiers YAML de `/etc/grafana/provisioning/datasources/`. Un fichier avec `apiVersion: 1` et une liste `datasources:` : `name`, `uid`, `type` (`grafana-postgresql-datasource`), `url` (`postgres:5432`), `user`, `jsonData.database`, `jsonData.sslmode: disable`, `secureJsonData.password`. Grafana remplace les `${VARIABLE}` de ces fichiers par ses variables d'environnement : passe-lui les `POSTGRES_*`.

### 6. Le tableau de bord en fichier

Deux fichiers. Un YAML dans `/etc/grafana/provisioning/dashboards/` qui déclare un **fournisseur** de type `file`, avec le dossier où chercher. Et ton JSON exporté à la leçon 12, dans ce dossier. Mets-y `"uid": "course-assistant"` et `"title": "Course Assistant"`, et vérifie que ses panneaux portent les quatre noms demandés.

### 7. Tester depuis zéro

`docker compose down -v` supprime les conteneurs **et les volumes**. C'est indispensable ici : sinon Postgres retrouve son ancien volume et n'exécute pas ton `init.sql`, et tu crois que ça marche alors qu'un nouveau clone échouerait.

@@ hints
- Si la vérification 3 ne voit aucune table alors que `init.sql` est correct, ton volume n'était pas vide : `docker compose down -v`, puis relance.
- Dans un `compose.yaml`, `$POSTGRES_USER` est remplacé par Compose **avant** de lancer le conteneur. Pour que ce soit le shell du conteneur qui le lise, double le dollar : `$${POSTGRES_USER}`.
- `docker compose up --wait` rend la main quand les services sont démarrés, et en bonne santé pour ceux qui ont un healthcheck. Grafana met encore quelques secondes à répondre : le script de vérification attend jusqu'à 90 secondes.
- Si la source de données ne se connecte pas, regarde son `url` : depuis le conteneur Grafana, Postgres s'appelle `postgres` (le nom du service), pas `localhost` ni `course-assistant-pg`.
- `docker compose logs grafana | grep -i provision` montre ce que Grafana a lu (ou refusé) au démarrage.
- Les panneaux d'un tableau de bord provisionné ne se modifient pas pour de bon dans l'interface : change le JSON, puis `docker compose restart grafana`.
- Fixe la version de Grafana (`grafana/grafana:13.3.1`) au lieu de `latest` : ton tableau de bord a été écrit pour une version précise.

@@ solution
Ma pile de référence, testée avec Docker Compose v5.6, Postgres 17 et Grafana 13.3.1 : depuis `docker compose down -v`, `docker compose up -d --build --wait` démarre les trois services, et les dix vérifications passent. J'ai aussi vérifié que le script **refuse** une pile où `depends_on` est en forme courte (il lit `service_started`), où `.env` entre dans l'image (`.env=présent`), où une requête de panneau est fausse (il cite l'erreur de Postgres), et où le tableau de bord n'est pas provisionné (`aucun tableau de bord d'uid course-assistant`).

L'arborescence :

~~~text
mon-travail/module-05/
├── compose.yaml
├── init.sql
├── Dockerfile            # celui de la leçon 13
├── .dockerignore         # .venv, .env, __pycache__, *.db
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/postgres.yaml
│   │   └── dashboards/course-assistant.yaml
│   └── dashboards/course-assistant.json
└── app.py, assistant.py, ... (ton code du module)
~~~

`compose.yaml` :

~~~yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-course_assistant}
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 20

  grafana:
    image: grafana/grafana:13.3.1
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      POSTGRES_DB: ${POSTGRES_DB:-course_assistant}
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/etc/grafana/dashboards:ro
    depends_on:
      postgres:
        condition: service_healthy

  streamlit:
    build: .
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: ${POSTGRES_DB:-course_assistant}
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "8501:8501"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  grafana_data:
~~~

`${POSTGRES_DB:-course_assistant}` prend la valeur du `.env` si elle existe, sinon la valeur par défaut : la pile démarre même sans `.env`.

`init.sql` :

~~~sql
-- Lancé par Postgres à son premier démarrage, quand le volume est vide (docker-entrypoint-initdb.d).
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    course TEXT NOT NULL,
    model TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prompt TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    response_time FLOAT NOT NULL,
    cost FLOAT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Les tableaux de bord filtrent et trient par date : sans index, Postgres relit toute la table.
CREATE INDEX IF NOT EXISTS conversations_timestamp_idx ON conversations (timestamp);

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    source TEXT NOT NULL,
    relevance TEXT,
    explanation TEXT,
    score INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);
~~~

`grafana/provisioning/datasources/postgres.yaml` :

~~~yaml
apiVersion: 1
datasources:
  - name: Course assistant
    uid: course-assistant-pg
    type: grafana-postgresql-datasource
    url: postgres:5432
    user: ${POSTGRES_USER}
    jsonData:
      database: ${POSTGRES_DB}
      sslmode: disable
    secureJsonData:
      password: ${POSTGRES_PASSWORD}
~~~

`grafana/provisioning/dashboards/course-assistant.yaml` :

~~~yaml
apiVersion: 1
providers:
  - name: course-assistant
    type: file
    allowUiUpdates: false
    options:
      path: /etc/grafana/dashboards
~~~

`grafana/dashboards/course-assistant.json`, cinq panneaux (le cinquième, un tableau des dernières conversations, n'est pas demandé) :

~~~json
{
  "uid": "course-assistant",
  "title": "Course Assistant",
  "schemaVersion": 41,
  "refresh": "30s",
  "time": { "from": "now-6h", "to": "now" },
  "panels": [
    {
      "id": 1, "type": "timeseries", "title": "Response time",
      "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
      "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
      "fieldConfig": { "defaults": { "unit": "s" }, "overrides": [] },
      "targets": [{
        "refId": "A", "format": "time_series", "rawQuery": true, "editorMode": "code",
        "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
        "rawSql": "SELECT timestamp AS time, response_time FROM conversations WHERE $__timeFilter(timestamp) ORDER BY timestamp"
      }]
    },
    {
      "id": 2, "type": "timeseries", "title": "Cost",
      "gridPos": { "x": 12, "y": 0, "w": 12, "h": 8 },
      "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
      "fieldConfig": { "defaults": { "unit": "currencyUSD" }, "overrides": [] },
      "targets": [{
        "refId": "A", "format": "time_series", "rawQuery": true, "editorMode": "code",
        "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
        "rawSql": "SELECT $__timeGroup(timestamp, $__interval) AS time, SUM(cost) AS total_cost FROM conversations WHERE $__timeFilter(timestamp) GROUP BY 1 ORDER BY 1"
      }]
    },
    {
      "id": 3, "type": "piechart", "title": "Relevance",
      "gridPos": { "x": 0, "y": 8, "w": 8, "h": 8 },
      "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
      "options": { "reduceOptions": { "values": true, "calcs": ["lastNotNull"], "fields": "" } },
      "targets": [{
        "refId": "A", "format": "table", "rawQuery": true, "editorMode": "code",
        "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
        "rawSql": "SELECT relevance, COUNT(*) AS count FROM feedback WHERE source = 'judge' AND $__timeFilter(timestamp) GROUP BY relevance"
      }]
    },
    {
      "id": 4, "type": "stat", "title": "User feedback",
      "gridPos": { "x": 8, "y": 8, "w": 8, "h": 8 },
      "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
      "targets": [{
        "refId": "A", "format": "table", "rawQuery": true, "editorMode": "code",
        "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
        "rawSql": "SELECT COUNT(*) FILTER (WHERE score > 0) AS thumbs_up, COUNT(*) FILTER (WHERE score < 0) AS thumbs_down FROM feedback WHERE source = 'user' AND $__timeFilter(timestamp)"
      }]
    },
    {
      "id": 5, "type": "table", "title": "Recent conversations",
      "gridPos": { "x": 16, "y": 8, "w": 8, "h": 8 },
      "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
      "targets": [{
        "refId": "A", "format": "table", "rawQuery": true, "editorMode": "code",
        "datasource": { "type": "grafana-postgresql-datasource", "uid": "course-assistant-pg" },
        "rawSql": "SELECT timestamp AS time, question, response_time, cost FROM conversations WHERE $__timeFilter(timestamp) ORDER BY timestamp DESC LIMIT 5"
      }]
    }
  ]
}
~~~

Le panneau Cost n'a plus le `AND cost > 0` de la leçon : un coût à 0 doit se voir comme une courbe à 0, pas comme « No data » (relis l'erreur provoquée de la leçon 12). Ton panneau Response time de la leçon 12, avec la moyenne et le p95, convient aussi : seul le titre compte pour la vérification.

Les commandes :

~~~bash
cd /workspaces/llm-zoomcamp/mon-travail/module-05
docker compose down -v
docker compose up -d --build --wait
python3 ../../site/checks/defi-05.py
uv run python generate_data.py      # Ctrl + C pour arrêter ; regarde Grafana se remplir
~~~
