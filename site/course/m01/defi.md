@@ body
# Défi du module 1 : ta propre boîte à outils d'agent

Pas de vidéo, pas de leçon. Tu as tout vu dans le module : le schéma d'un outil (leçon 13), la boucle (leçon 14), le schéma généré par ToyAIKit et ses limites (leçon 15). Ici, tu écris **ta** version, en mieux. Essaie d'abord seul : c'est le meilleur test de ce que tu as appris. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape.

Pourquoi ce défi ? Parce que c'est exactement ce qu'on te demandera en entretien d'AI engineer : « écris une boucle d'agent sans framework ». Et parce qu'après, aucun framework ne sera une boîte noire pour toi.

## L'objectif

Un seul fichier, `mon-travail/module-01/defi/agentkit.py`, qui contient deux choses.

### 1. `tool_schema(func)`

Elle prend une fonction Python **annotée** et renvoie son schéma d'outil pour l'API Responses :

```python
def search(query: str, course: str = "llm-zoomcamp") -> list:
    """Search the FAQ of a DataTalksClub course.

    Args:
        query: Search keywords in English.
        course: The course slug.
    """
```

doit donner :

```python
{
    "type": "function",
    "name": "search",
    "description": "Search the FAQ of a DataTalksClub course.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search keywords in English."},
            "course": {"type": "string", "description": "The course slug."},
        },
        "required": ["query"],
        "additionalProperties": False,
    },
}
```

Les règles :

- les types : `str` → `"string"`, `int` → `"integer"`, `float` → `"number"`, `bool` → `"boolean"` ;
- `list[X]` → `{"type": "array", "items": <le type de X>}` ;
- `Literal["a", "b"]` → `{"type": "string", "enum": ["a", "b"]}` ;
- `required` liste, dans l'ordre, les paramètres **sans** valeur par défaut ;
- la `description` de l'outil est le texte de la docstring **avant** `Args:`, avec tous les espaces et retours à la ligne réduits à un seul espace ;
- la description d'un paramètre vient de sa ligne `nom: texte` sous `Args:`. Un paramètre sans ligne n'a pas de clé `description`.

C'est ce que ToyAIKit ne fait pas : à la leçon 15, tu as vu qu'il transformait `int` en `"number"`, oubliait l'`enum` et écrivait `"query parameter"` partout.

### 2. `Agent`

```python
agent = Agent(client, instructions, tools=[search, list_sections], model="gpt-5.4-mini", max_iterations=5)
result = agent.run("How do I run Olama locally?")
```

- `client` est un client OpenAI, ou n'importe quel objet qui a `client.responses.create(...)` ;
- `tools` est une liste de **fonctions** : `Agent` génère leurs schémas avec `tool_schema` ;
- `run` envoie d'abord un message `developer` (les instructions) puis un message `user` (la question), et tourne en boucle jusqu'à ce que le modèle réponde sans appeler d'outil ;
- `run` renvoie un dictionnaire : `answer` (le texte de la réponse), `iterations` (le nombre d'appels au modèle), `tool_calls` (la liste des `(nom, arguments)`, avec les arguments en dictionnaire), `input_tokens` et `output_tokens` (additionnés sur **tous** les appels).

Les règles de robustesse :

- si le modèle demande **plusieurs** outils dans la même réponse, chacun reçoit son propre `function_call_output`, avec son `call_id` ;
- le résultat d'un outil est toujours envoyé en JSON (`json.dumps`) ;
- un outil inconnu, des arguments JSON invalides ou un outil qui lève une exception ne font **jamais** planter la boucle : le résultat envoyé au modèle est `{"error": "<un message clair>"}` ;
- au dernier tour (`max_iterations`), le modèle est appelé avec `tool_choice="none"` : il doit répondre.

## La vérification

Quand tu penses avoir fini, lance depuis la racine de ton fork :

```bash
uv run --project mon-travail/module-01 python site/checks/defi-01.py mon-travail/module-01/defi/agentkit.py
```

Le script ne fait **aucun appel payant** : un faux client joue le rôle du modèle, avec des réponses écrites à l'avance. Il lance dix vérifications et affiche ✅ ou ❌ pour chacune, avec ce que ton code a renvoyé. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

Ensuite, le vrai test : branche ton `Agent` sur `OpenAI()` et sur tes outils `search` et `list_sections` de la leçon 15, et pose-lui « How do I run Olama locally? ».

@@ guide
### 1. Le dossier

~~~bash
mkdir -p /workspaces/llm-zoomcamp/mon-travail/module-01/defi
~~~

Tout se passe dans `agentkit.py`. Pas de bibliothèque à ajouter : `inspect`, `typing` et `json` sont livrés avec Python.

### 2. Lire une fonction

Trois outils de la bibliothèque standard font tout le travail :

- `inspect.signature(func).parameters` : les paramètres, dans l'ordre, avec leur valeur par défaut (`param.default is inspect.Parameter.empty` quand il n'y en a pas) ;
- `typing.get_type_hints(func)` : les annotations, en vrais objets Python (`str`, `list[str]`…) ;
- `inspect.getdoc(func)` : la docstring, déjà débarrassée de son indentation.

Essaie-les sur une fonction dans le notebook avant d'écrire `tool_schema`.

### 3. Traduire un type

Écris une petite fonction `json_type(annotation)`. Pour les types simples, un dictionnaire `{str: "string", ...}` suffit. Pour `list[str]` et `Literal[...]`, `typing.get_origin(annotation)` renvoie `list` ou `typing.Literal`, et `typing.get_args(annotation)` renvoie ce qu'il y a entre crochets. Pour `list[X]`, appelle `json_type` sur `X` : c'est une fonction récursive.

### 4. Lire la docstring

`doc.partition("Args:")` coupe en trois : avant, le séparateur, après. Avant, c'est la description : `" ".join(texte.split())` réduit tous les espaces. Après, chaque ligne `nom: texte` se coupe avec `.partition(":")`.

### 5. La boucle

Repars de ton `agent_loop` de la leçon 14. Ce qui change : les outils viennent du constructeur, et `make_call` devient une méthode qui attrape aussi les exceptions de l'outil.

### 6. Tester pas à pas

Lance le script de vérification **tôt**, dès que `tool_schema` existe : les 5 premières vérifications ne testent qu'elle. Chaque ❌ te montre ce que ton code a renvoyé.

@@ hints
- Commence par `tool_schema` seule, et lance le script : les 5 premières vérifications passent avant même que `Agent` existe.
- `typing.get_type_hints` plutôt que `param.annotation` : il marche même si le fichier commence par `from __future__ import annotations`.
- Attention à l'ordre dans ton dictionnaire de types : il ne pose pas de problème (`bool` est une clé à part), mais un `isinstance(x, int)` en poserait, parce que `True` est aussi un `int` en Python.
- Pour la description, compare ta chaîne à celle de l'énoncé caractère par caractère : un espace en trop suffit à faire échouer la vérification.
- Les appels parallèles : extrais **tous** les `function_call` d'une réponse, puis ajoute un `function_call_output` par appel. Un `break` dans la mauvaise boucle n'en traite qu'un.
- Une erreur d'outil : `try` / `except Exception as e` autour de `func(**args)`, et renvoie `{"error": f"{type(e).__name__}: {e}"}`.
- Le dernier tour : `tool_choice="none" if it == self.max_iterations else "auto"`.

@@ solution
Ma solution, testée avec le script de vérification : les dix vérifications passent.

~~~python
"""Ma boîte à outils d'agent : un schéma généré depuis une fonction Python, et une boucle d'agent."""
import inspect
import json
import typing

JSON_TYPES = {str: "string", int: "integer", float: "number", bool: "boolean"}


def json_type(annotation):
    """Traduit une annotation Python en morceau de schéma JSON."""
    origin = typing.get_origin(annotation)
    if origin is typing.Literal:
        values = list(typing.get_args(annotation))
        return {"type": JSON_TYPES[type(values[0])], "enum": values}
    if origin is list:
        (item,) = typing.get_args(annotation)
        return {"type": "array", "items": json_type(item)}
    return {"type": JSON_TYPES[annotation]}


def parse_docstring(func):
    """Sépare la description de l'outil et celles des paramètres (docstring au format Google)."""
    doc = inspect.getdoc(func) or ""
    summary, _, args_part = doc.partition("Args:")
    params = {}
    for line in args_part.splitlines():
        name, sep, text = line.strip().partition(":")
        if sep and name.isidentifier():
            params[name] = text.strip()
    return " ".join(summary.split()), params


def tool_schema(func):
    hints = typing.get_type_hints(func)
    description, param_docs = parse_docstring(func)
    properties, required = {}, []
    for name, param in inspect.signature(func).parameters.items():
        prop = json_type(hints[name])
        if name in param_docs:
            prop["description"] = param_docs[name]
        properties[name] = prop
        if param.default is inspect.Parameter.empty:
            required.append(name)
    return {
        "type": "function",
        "name": func.__name__,
        "description": description,
        "parameters": {
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": False,
        },
    }


class Agent:

    def __init__(self, client, instructions, tools, model="gpt-5.4-mini", max_iterations=5):
        self.client = client
        self.instructions = instructions
        self.model = model
        self.max_iterations = max_iterations
        self.tools = {func.__name__: func for func in tools}
        self.schemas = [tool_schema(func) for func in tools]

    def call_tool(self, call):
        """Exécute un appel d'outil. Ne lève jamais d'exception : une erreur revient au modèle."""
        try:
            args = json.loads(call.arguments)
        except json.JSONDecodeError as e:
            return call.arguments, {"error": f"Invalid JSON arguments: {e}"}
        func = self.tools.get(call.name)
        if func is None:
            return args, {"error": f"Unknown tool {call.name!r}. Available tools: {sorted(self.tools)}"}
        try:
            return args, func(**args)
        except Exception as e:
            return args, {"error": f"{type(e).__name__}: {e}"}

    def run(self, question):
        messages = [
            {"role": "developer", "content": self.instructions},
            {"role": "user", "content": question},
        ]
        result = {"answer": None, "iterations": 0, "tool_calls": [], "input_tokens": 0, "output_tokens": 0}

        for it in range(1, self.max_iterations + 1):
            last = it == self.max_iterations
            response = self.client.responses.create(
                model=self.model,
                input=messages,
                tools=self.schemas,
                tool_choice="none" if last else "auto",
            )
            result["iterations"] = it
            result["input_tokens"] += response.usage.input_tokens
            result["output_tokens"] += response.usage.output_tokens

            messages.extend(response.output)
            calls = [item for item in response.output if item.type == "function_call"]
            for item in response.output:
                if item.type == "message":
                    result["answer"] = item.content[0].text
            if not calls:
                break
            for call in calls:                       # chaque appel reçoit son propre résultat
                args, output = self.call_tool(call)
                result["tool_calls"].append((call.name, args))
                messages.append({
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": json.dumps(output),
                })
        return result
~~~

Les choix qui comptent :

- `json_type` est **récursive** : `list[list[str]]` marcherait aussi, sans une ligne de plus ;
- `call_tool` ne lève jamais d'exception. Une erreur devient un résultat que le modèle lit au tour suivant, et il peut se corriger : c'est le comportement de tous les frameworks sérieux ;
- tous les `function_call` d'une réponse sont traités **avant** de rappeler le modèle, chacun avec son `call_id` ;
- au dernier tour, `tool_choice="none"` force la réponse. La boucle s'arrête toujours, même si le modèle voudrait chercher encore.

Pour aller plus loin, si tu as le temps : ajoute un budget de tokens (`max_input_tokens`) qui arrête la boucle avant qu'elle ne coûte trop, ou une option `verbose` qui affiche chaque appel d'outil comme le `callback` de ToyAIKit.
