"""Vérification du défi du module 1 : ta boîte à outils d'agent, agentkit.py.

Usage, depuis la racine du fork :
    uv run python site/checks/defi-01.py mon-travail/module-01/defi/agentkit.py

Sans chemin, le script cherche agentkit.py dans mon-travail/.
Aucun appel payant : un faux client joue le rôle du modèle, avec des réponses écrites à l'avance.
Le script compare des empreintes : il ne contient pas les résultats attendus.
"""
import glob
import hashlib
import importlib.util
import json
import sys
from types import SimpleNamespace as NS
from typing import Literal

LABELS = [
    "Les types simples deviennent les bons types JSON",
    "Une liste devient un tableau, avec le type de ses éléments",
    "Un Literal devient un enum",
    "Seuls les paramètres sans valeur par défaut sont obligatoires",
    "Les descriptions viennent de la docstring",
    "La boucle cherche, puis s'arrête quand le modèle répond",
    "Chaque appel parallèle reçoit son propre résultat",
    "Les erreurs d'outil reviennent au modèle sans planter",
    "Le dernier tour force une réponse",
    "Les tokens sont additionnés sur tous les tours",
]

EXPECTED = [
    "1b1e8815935facd9",
    "5b776ef1fbc2e1e4",
    "48d3708308351610",
    "1a8bceb5153c9ebb",
    "61531c27576aeb21",
    "7d32d2810c7af6eb",
    "0d078aacbc38ea5c",
    "5683b0aafd2094ca",
    "b8bc122c0e2d5900",
    "b7e533c638e7bcdd",
]


# Les outils de test. Leur code est volontairement très simple : ce qu'on vérifie, c'est ta boîte à outils.

def find(query: str, limit: int, score: float, exact: bool) -> list:
    """Find things."""
    return []


def tag(tags: list[str]) -> list:
    """Tag things."""
    return []


def pick(course: Literal["llm-zoomcamp", "data-engineering-zoomcamp"]) -> str:
    """Pick a course."""
    return course


def lookup(query: str, course: str = "llm-zoomcamp", num_results: int = 5) -> list:
    """Look things up."""
    return []


def search(query: str, course: str = "llm-zoomcamp") -> list:
    """Search the FAQ of a DataTalksClub course.

    Call it before answering a course question.

    Args:
        query: Search keywords in English.
        course: The course slug.
    """
    return [{"question": f"Q about {query}", "course": course}]


def shout(text: str) -> str:
    """Repeat the text in capital letters."""
    return text.upper()


def boom(text: str) -> str:
    """Always fails."""
    raise RuntimeError("kaput")


# Un faux client : il renvoie, appel après appel, les réponses du scénario.

def fc(name, arguments, call_id):
    return NS(type="function_call", name=name, arguments=arguments, call_id=call_id)


def msg(text):
    return NS(type="message", role="assistant", content=[NS(type="output_text", text=text)])


class FakeResponses:
    def __init__(self, script, usages=None):
        self.script = list(script)
        self.usages = list(usages or [])
        self.calls = []

    def create(self, **kwargs):
        self.calls.append({k: (list(v) if k == "input" else v) for k, v in kwargs.items()})
        output = self.script.pop(0) if self.script else [msg("end")]
        if kwargs.get("tool_choice") == "none" or not kwargs.get("tools"):
            output = [msg("forced")]
        usage = self.usages.pop(0) if self.usages else (100, 10)
        text = "".join(item.content[0].text for item in output if item.type == "message")
        return NS(output=output, output_text=text, usage=NS(input_tokens=usage[0], output_tokens=usage[1]))


class FakeClient:
    def __init__(self, script, usages=None):
        self.responses = FakeResponses(script, usages)


def field(item, name):
    return item.get(name) if isinstance(item, dict) else getattr(item, name, None)


def outputs_of(call):
    """Les function_call_output envoyés au modèle lors d'un appel, par call_id."""
    return {field(m, "call_id"): json.loads(field(m, "output"))
            for m in call["input"] if field(m, "type") == "function_call_output"}


# Les vérifications. Chacune renvoie une valeur texte, comparée à une empreinte.

def t_types(ak):
    props = ak.tool_schema(find)["parameters"]["properties"]
    return ",".join(f"{k}:{props[k]['type']}" for k in ["query", "limit", "score", "exact"])


def t_list(ak):
    p = ak.tool_schema(tag)["parameters"]["properties"]["tags"]
    return f"{p['type']}|{p['items']['type']}"


def t_enum(ak):
    p = ak.tool_schema(pick)["parameters"]["properties"]["course"]
    return f"{p['type']}|{','.join(p['enum'])}"


def t_required(ak):
    params = ak.tool_schema(lookup)["parameters"]
    return f"{','.join(params['required'])}|{params['additionalProperties']}|{params['type']}"


def t_docs(ak):
    s = ak.tool_schema(search)
    props = s["parameters"]["properties"]
    return f"{s['type']}|{s['name']}|{s['description']}|{props['query']['description']}|{props['course']['description']}"


def t_loop(ak):
    client = FakeClient([
        [fc("search", '{"query": "ollama"}', "c1")],
        [msg("Install Ollama [1]")],
    ], usages=[(120, 15), (480, 40)])
    agent = ak.Agent(client, "Be helpful.", [search, shout])
    r = agent.run("How do I run Olama?")
    first = client.responses.calls[0]
    names = sorted(t["name"] for t in first["tools"])
    start = [(field(m, "role"), field(m, "content")) for m in first["input"][:2]]
    sent = outputs_of(client.responses.calls[1])
    calls = [(n, a) for n, a in r["tool_calls"]]
    return (f"{r['iterations']}|{r['answer']}|{calls}|{names}|{start}|{first['model']}|"
            f"{sent.get('c1')}")


def t_parallel(ak):
    client = FakeClient([
        [fc("shout", '{"text": "a"}', "c1"), fc("shout", '{"text": "b"}', "c2")],
        [msg("done")],
    ])
    r = ak.Agent(client, "x", [shout]).run("q")
    sent = outputs_of(client.responses.calls[1])
    return f"{r['iterations']}|{len(r['tool_calls'])}|" + "|".join(f"{k}={sent[k]}" for k in sorted(sent))


def t_errors(ak):
    client = FakeClient([
        [fc("nope", '{"text": "a"}', "c1"), fc("shout", "{bad", "c2"), fc("boom", '{"text": "a"}', "c3")],
        [msg("sorry")],
    ])
    r = ak.Agent(client, "x", [shout, boom]).run("q")
    sent = outputs_of(client.responses.calls[1])
    kinds = ",".join("error" if isinstance(sent.get(k), dict) and "error" in sent[k] else "?" for k in ["c1", "c2", "c3"])
    return f"{r['iterations']}|{r['answer']}|{kinds}"


def t_last(ak):
    client = FakeClient([[fc("shout", '{"text": "a"}', f"c{i}")] for i in range(10)])
    r = ak.Agent(client, "x", [shout], max_iterations=3).run("q")
    return f"{r['iterations']}|{r['answer']}|{len(client.responses.calls)}|{len(r['tool_calls'])}"


def t_tokens(ak):
    client = FakeClient([
        [fc("shout", '{"text": "a"}', "c1")],
        [fc("shout", '{"text": "b"}', "c2")],
        [msg("ok")],
    ], usages=[(100, 7), (250, 9), (400, 30)])
    r = ak.Agent(client, "x", [shout]).run("q")
    return f"{r['input_tokens']}|{r['output_tokens']}"


TESTS = [t_types, t_list, t_enum, t_required, t_docs, t_loop, t_parallel, t_errors, t_last, t_tokens]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def normalize(value):
    return str(value).strip().lower()


def load(path):
    spec = importlib.util.spec_from_file_location("agentkit", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def values_of(ak):
    out = []
    for test in TESTS:
        try:
            out.append((normalize(test(ak)), ""))
        except Exception as e:  # une fonction absente ou qui plante : on l'affiche
            out.append(("", f"{type(e).__name__}: {str(e).splitlines()[0][:200] if str(e) else ''}"))
    return out


def find_file():
    if len(sys.argv) > 1:
        return sys.argv[1]
    found = [p for p in glob.glob("mon-travail/**/agentkit.py", recursive=True) if ".venv" not in p]
    if len(found) != 1:
        sys.exit("❌ Donne le chemin de ton fichier : python site/checks/defi-01.py <chemin>/agentkit.py")
    return found[0]


def check(ak):
    print("Défi du module 1 : vérification de ta boîte à outils d'agent")
    print()
    ok, values = 0, []
    for label, (value, error), expected in zip(LABELS, values_of(ak), EXPECTED):
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            print(f"   Réponse : {error or value or '(rien)'}")
        values.append(value)
    print()
    if ok == len(LABELS):
        code = hashlib.sha256("|".join(values).encode()).hexdigest()[:8]
        print(f"🎉 Tout est vert. Ton code de réussite : {code}")
        print("   Entre-le sur la page du défi pour le valider.")
        return True
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige et relance le script.")
    return False


if __name__ == "__main__":
    path = find_file()
    try:
        module = load(path)
    except FileNotFoundError:
        sys.exit(f"❌ Fichier introuvable : {path}")
    sys.exit(0 if check(module) else 1)
