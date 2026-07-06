# ARCANA
### *An opinionated context library that makes agentic coding tools do better work by default*

> Nothing new to run. You ask for the feature the way you always did. The deck changes what happens next.

---

## The Core Idea

Arcana is not a tool you operate. It is a curated body of context — hard rules, workflows, and reviewer personas — installed into a repo that already uses an agentic coding tool (Claude Code or similar). In effect: a large, opinionated `CLAUDE.md` and its supporting files.

There is no "running an audit." The developer's workflow is unchanged: ask for a feature, get a feature. What changes is the agent's behavior — it follows house rules it cannot break, uses proven workflows for recognizable kinds of work, and passes its own output through skeptical reviewer perspectives at defined moments. The work gets better. Sometimes slower. That's the trade, and it's the point.

## Design Principles

**Ambient, not invoked.** Personas activate because rules bind them to moments and conditions — a diff touching auth, a task that is a migration, a change about to become a PR — never because someone typed a command. (Users *can* still ask for a persona's opinion in plain language, since personas are just files; it's simply not the model.)

**Lore for humans, plain language for agents.** The tarot layer — cards, vigils, wards — is how *people* browse, discuss, and configure the library: file names, onboarding, docs, community. The text the agent actually consumes is plain, rigorous professional instruction ("Before committing changes under `src/auth/`, review the diff as a security auditor against the following checklist…"). The agent is never asked to role-play the vocabulary, announce summonings, or narrate in-character. The magic is for the README; the context is all business.

**Hard rules are the spine.** Everything the deck does is expressed as a rule the agent must follow. Some rules govern conduct, some mandate workflows, some attach reviewers to moments. One mechanism, three uses.

**Everything is files.** The CLI only writes markdown. A team can verify this, or eject and never touch the tool again.

---

## Vocabulary

**The Arcanum** — The complete upstream library: all cards, rites, and rules anyone has contributed.

**Deck** — The subset a project imports. Chosen during the Initiation or declared in config. Different projects, different decks.

**Codex** — The assembled `CLAUDE.md`: the always-in-context core carrying the Bindings and the routing that tells the agent when to load everything else.

**The Initiation** — Onboarding. An interactive walkthrough that composes your Deck: pick your stack, your risk tolerance, your non-negotiables; it writes the Codex. Teams that know what they want skip it and one-shot from a config file (`arcana init --from deck.yaml`).

**Card / Arcana** — A reviewer persona: a perspective, a temperament, and a concrete checklist, written in plain language for the agent. Cards do not act on their own — they act when a Binding puts them on vigil.

**Vigil** — The condition under which a card activates: a moment (pre-commit, pre-PR, post-implementation), a path (`src/auth/**`), a kind of change (schema, dependency bump, public API). A card *keeps vigil* over its territory and stirs only when something crosses into it. This is the load-bearing concept that replaces any notion of "running" a persona.

**Binding** — A hard rule in the Codex. The agent may not break a Binding; it must stop and surface the conflict instead. Three species, one mechanism:
- **Conduct** — plain prohibitions and requirements. *"Never commit secrets. All public APIs are versioned."*
- **Rite bindings** — task-type → workflow. *"Any schema change follows the migration rite."*
- **Vigil bindings** — condition → card. *"Diffs touching `src/auth/**` do not get committed until reviewed against The Hermit."*

**Precept** — A guideline: strong default, overridable with recorded justification. Bindings bind; Precepts advise.

**Rite** — A prescribed workflow for a class of work (cut a release, run a migration, deprecate an API, vendor a dependency). The agent doesn't decide *whether* to use a rite — a Binding decides for it. Organized by the four Minor Arcana suits, purely as human-facing taxonomy:
- **Wands** — build, tooling, CI/CD, automation
- **Swords** — testing, security, debugging
- **Cups** — documentation, DX, API design
- **Pentacles** — performance, infrastructure, data

**Finding** — What a card reports when its vigil catches something. Severity determines the agent's behavior, not just a label:
- **Whisper** — optional note; mentioned in the summary, nothing blocks
- **Omen** — should fix; agent fixes if cheap, otherwise flags prominently
- **Portent** — must fix before the work is presented as done
- **Doom** — full stop; the agent halts and asks the human

**Ward** — An explicit, justified suppression left in the code: `// ward(hermit): token logged in dev builds only, stripped by #ifdef`. Wards are visible, carry reasons, and lapse when the line is next touched.

**Apocrypha** — Community-contributed, non-canonical cards and rites. Hyper-specific personas and house in-jokes ("The Intern," "The Auditor From Compliance"). Imported explicitly, never by default.

---

## The Major Arcana — The 22 Cards

Each card is a reviewer with a domain, a temperament, and a checklist. During the Initiation you choose which cards join your Deck and what vigils to bind them to; sensible defaults are suggested per card.

| # | Card | Domain | Typical vigil | The persona |
|---|------|--------|---------------|-------------|
| 0 | **The Fool** | Naive use & onboarding | New public APIs; README/quickstart changes | Knows nothing, assumes nothing. Follows your README literally, calls your API in every wrong order. If The Fool can break it, a user will. |
| I | **The Magician** | Performance | Hot paths; queries; loops over collections | Profiles before opining. Hunts N+1 queries, needless allocations, quadratic loops hiding in helpers. Waste is a moral failing. |
| II | **The High Priestess** | Hidden knowledge | New modules; onboarding of unfamiliar code | Surfaces what is known but unwritten: implicit invariants, tacit coupling, tribal knowledge in one engineer's head. *What does this code assume that it never says?* |
| III | **The Empress** | DX & API ergonomics | Public API changes | Judges whether the API is a joy or a chore, whether errors guide or scold, whether the happy path is actually happy. |
| IV | **The Emperor** | Architecture | New modules; cross-boundary changes | Structure, boundaries, hierarchy. Layering violations, leaky abstractions, dependency arrows pointing the wrong way. |
| V | **The Hierophant** | Convention | Every diff (cheap pass) | Keeper of the style guide and the ecosystem's idiom. You may break tradition — knowingly. |
| VI | **The Lovers** | Dependencies & interfaces | Dependency changes; new integrations | Every coupling is a commitment. Asks whether you chose this dependency or merely fell for it. |
| VII | **The Chariot** | Delivery & CI/CD | Pipeline & build config changes | Momentum. Build times, deploy friction, rollback paths. If shipping is scary, The Chariot wants to know why. |
| VIII | **Strength** | Resilience | Code that calls external services | Grace under failure: retries, timeouts, backpressure, degradation. What happens when the dependency doesn't answer? |
| IX | **The Hermit** | Security | Auth, secrets, input handling, deps | Alone, lantern raised, trusting no one. Injection, authz gaps, secrets, supply chain. Assumes input is hostile because eventually it will be. |
| X | **Wheel of Fortune** | Nondeterminism | Concurrency; tests; anything with time or random | Race conditions, flaky tests, unseeded randomness, clock dependence. What passes *sometimes* fails eventually. |
| XI | **Justice** | Correctness & tests | Pre-PR, always | Does the code do what the spec says? Is coverage real or theatrical? Reads the tests before the code. |
| XII | **The Hanged Man** | Premises | Start of any large task | The designated devil's advocate, consulted *before* work begins: should this exist? Are we solving the wrong problem well? |
| XIII | **Death** | Deprecation & removal | Deletions; deprecations; periodic sweeps | Not cruel — necessary. Dead code, zombie endpoints, migrations never finished. The card codebases fear and need most. |
| XIV | **Temperance** | Proportion | New abstractions; new dependencies | Guards against over- *and* under-engineering: premature abstraction, YAGNI, corners cut that will not stay cut. |
| XV | **The Devil** | Adversarial abuse | Public-facing surfaces; quotas; parsers | Red-teams the system: malicious inputs, abuse cases — and subtler chains: footgun APIs, defaults that tempt users into ruin. |
| XVI | **The Tower** | Catastrophe | Infra changes; single points of failure | The lightning strike. Blast radius, disaster recovery. Doesn't ask *if* the tower falls. Asks what survives. |
| XVII | **The Star** | Observability | New services; error paths | Logging, metrics, tracing, alerting. When the incident comes at 3 a.m., are there stars to steer by? |
| XVIII | **The Moon** | Illusion & confusion | Renames; abstractions; comments | Things that are not what they seem: misleading names, functions that lie about side effects, comments drifted from truth. |
| XIX | **The Sun** | Clarity & docs | Pre-PR on touched files | Illumination. Readability, naming, examples that run. A newcomer should understand this at noon, without a torch. |
| XX | **Judgement** | Synthesis | Whenever multiple cards fire | Weighs the other cards' findings, resolves their quarrels, renders one verdict instead of a pile of complaints. |
| XXI | **The World** | Completeness | Pre-release | The closed circle: i18n, accessibility, cross-platform, "done done." Nothing ships until the circle is complete. |

**The cards quarrel, and that's healthy.** The Magician wants it fast; The Sun wants it readable. The Emperor wants structure; Temperance warns against building too much of it. When one moment wakes several cards, Judgement exists so the agent presents a verdict, not a contradiction.

---

## What the User Actually Experiences

> **Dev:** "Add password reset via email."
>
> The agent plans and implements as it always would — except the Codex is in context. A Conduct binding keeps secrets out of source while it works. The change is email-flow work, so a Rite binding routes token generation through the deck's crypto-hygiene rite rather than whatever the model felt like today. The diff touches `src/auth/`, so before anything is committed, The Hermit's vigil fires: the agent re-reviews its own diff against the card's checklist. It catches a reset token logged at debug level — a Portent — and fixes it before presenting. Justice fires pre-PR and notices the expiry edge case has no test; one is added. The PR description notes both findings and their resolutions, in plain professional language.
>
> The dev typed one sentence. No commands, no ceremony, no tarot in the transcript — just a better pull request, a little later than a worse one would have arrived.

---

## Repo Anatomy

```
CLAUDE.md                  # the Codex: Bindings (all three species) inline,
                           #   plus routing — which files to load when a
                           #   vigil or rite binding fires
.arcana/
  precepts.md              # guidelines — overridable with recorded reasons
  cards/                   # the persona checklists (plain language)
    00-the-fool.md
    09-the-hermit.md
    ...
  rites/                   # workflow definitions, by suit
    wands/release.md
    swords/threat-model.md
    cups/changelog.md
    pentacles/migration.md
  apocrypha/               # your team's unofficial cards
deck.yaml                  # the declarative source of truth the CLI reads
```

The Codex stays small: Bindings must always be in context, but a card's full checklist is loaded only when its vigil fires, so twenty-two personas don't tax the context window of a task that wakes none of them.

## The Deck Manager (the only CLI)

Used at setup and when the Deck changes — never to perform work. Boring verbs on purpose; the lore lives in the library, not the terminal.

```
npx arcana init             # run the Initiation (interactive)
npx arcana init --from deck.yaml    # one-shot from config
arcana add the-hermit       # add a card with its suggested vigils
arcana bind the-hermit "src/payments/**"   # extend a card's vigil
arcana remove the-lovers
arcana list                 # show the Deck: cards, vigils, rites, bindings
arcana update               # pull upstream card/rite improvements
arcana eject                # freeze everything as plain markdown, forever
```

`eject` is the trust story: everything Arcana does is visible markdown, and a team can walk away from the tool without losing the deck.

---

*The cards keep vigil so you don't have to.*
