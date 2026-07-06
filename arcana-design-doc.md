# Arcana — Software Design Document

**Status:** Draft v2 · **Target:** Claude Code (exclusively, v1) · **Scope:** Architecture, platform mapping, compilation model, CLI, distribution

---

## 1. Summary

Arcana is an opinionated context library — hard rules (bindings), workflows (rites), and reviewer personas (cards) — that makes Claude Code produce better work by default. There is no runtime and no audit command: the product is files. Users compose a deck during onboarding (the Initiation) or via config; the CLI compiles that deck into the artifacts Claude Code natively consumes.

**v1 targets Claude Code exclusively.** The multi-tool survey (Appendix A) showed Claude Code is the only agentic coding tool whose native primitives map one-to-one onto every Arcana concept — always-on memory, path-scoped rules, description-triggered skills, isolated subagents, and, uniquely in the surveyed landscape, deterministic lifecycle hooks that can actually *block* an action rather than advise against it. Targeting one tool at full fidelity beats targeting eight at the fidelity of the weakest; other tools return as build targets in v2 (§11).

Arcana remains a **compiler** even with one target: the canonical deck (`deck.yaml` + tool-agnostic markdown sources) is compiled by `arcana build` into Claude Code's file formats. This preserves the properties that matter — deterministic, reviewable, lockfile-like output; drift detection; `eject`; and a source of truth that is not welded to any tool's syntax, keeping the v2 multi-tool door open at zero cost.

```
   ┌────────────────────────────┐
   │  Canonical deck (source)    │
   │  deck.yaml                  │
   │  src/cards/  src/rites/     │
   │  src/bindings/ src/precepts │
   └─────────────┬──────────────┘
                 │  arcana build
                 ▼
   ┌────────────────────────────────────────────────┐
   │  Claude Code emission                           │
   │  CLAUDE.md                 always-on core       │
   │  .claude/rules/*.md        glob-scoped vigils   │
   │  .claude/agents/*.md       cards as subagents   │
   │  .claude/skills/*/SKILL.md rites                │
   │  .claude/settings.json     hooks (gates)        │
   │  arcana/                   shared reference     │
   └────────────────────────────────────────────────┘
```

## 2. Goals & Non-Goals

**Goals**

1. Ambient behavior change: Claude Code follows conduct rules, uses mandated workflows for recognized task types, and self-reviews against persona checklists at bound moments — with no change to how the user prompts.
2. Exploit every relevant Claude Code primitive at full fidelity, including deterministic enforcement where the user opts in.
3. Everything the CLI writes is human-readable markdown/JSON; `arcana eject` leaves a repo fully functional with no tool dependency beyond Claude Code itself.
4. Lore for humans, plain language for the agent: emitted agent-facing text contains no tarot vocabulary and never asks the model to role-play.
5. Keep canonical sources tool-agnostic so additional emitters (Cursor, AGENTS.md, Copilot) are additive work, not a rewrite.

**Non-Goals (v1)**

- No support for tools other than Claude Code (revisited in v2).
- No runtime agent, proxy, or wrapper; no modification of Claude Code's behavior except through its documented extension surface.
- No server-side review service (a CI action is a v2 candidate, §11).
- No GUI beyond the terminal Initiation.

## 3. The Claude Code Extension Surface

Claude Code's documented extension layers, and how Arcana uses each:

| Layer | Native behavior | Arcana's use |
|---|---|---|
| **CLAUDE.md** | Loaded at session start, every session; hierarchical (user → project root → subdirectories, additive); treated as context, not enforced config; supports `@file` imports | The compiled core: conduct bindings, routing tables, severity contract. Kept deliberately small (§6) |
| **Rules** (`.claude/rules/*.md`) | Path-scoped via `paths:` glob frontmatter; load automatically when matching files are in play; unscoped rules are always-on | One rule file per glob-vigil: when the agent works in a card's territory, that card's checklist (or pointer to it) enters context automatically |
| **Skills** (`.claude/skills/<name>/SKILL.md`) | Description-triggered progressive disclosure: only name+description are always in context; body loads when relevant or on `/name` invocation; ≤500-line guidance; can restrict `allowed-tools` | One skill per rite. The frontmatter description encodes the rite binding ("Use when making any database schema change…") so routing is native, not prose |
| **Subagents** (`.claude/agents/*.md`) | Isolated context window; own tool allowlist, own model choice, own memory scope; dispatched by natural language, description match, or main-agent delegation; cannot spawn subagents | One subagent per card that benefits from isolation (`requires_isolation: preferred`). Read-only tool allowlists (review, don't edit); cheap models (e.g., Haiku-class) for cheap cards like convention passes; expensive models reserved for security/architecture cards. Multi-card moments (pre-PR) dispatch cards in parallel and synthesize |
| **Hooks** (`settings.json`) | Deterministic scripts on lifecycle events (PreToolUse, PostToolUse, UserPromptSubmit, Stop, etc.); a PreToolUse hook exiting with code 2 blocks the action — the only hard guarantee in the platform | Moment-vigils and critical bindings. E.g., a PreToolUse hook matching `Bash(git commit*)` that (a) runs a secret scan, (b) checks whether the diff touches guarded globs and, if so, verifies the corresponding review marker exists — exit 2 blocks the commit until the card's review has run |
| **Plugins** | Bundle skills + agents + hooks + MCP into one installable, namespaced unit; distributable via marketplaces | The packaged default deck (§9): `arcana` plugin = the compiler's own output, wrapped |
| **Auto memory** | Claude accrues its own learnings across sessions | Untouched. Arcana never writes to auto memory; bindings live in versioned files precisely because memory is not policy |

Two platform facts shape everything downstream:

- **Context is treated as advice, not enforcement.** Anthropic's docs are explicit that CLAUDE.md and memory influence behavior but are not a policy engine; hooks are the only deterministic layer. Arcana therefore classifies every binding as *advisory* or *gated* and is honest about which is which (§8).
- **Everything always-on has a cost.** Anthropic's guidance warns that each added extension consumes context and can add noise — skills mistriggering, conventions getting lost. Community and empirical guidance converge on a small always-on core (~150 lines; hand-written instruction files measurably help, bloated ones measurably hurt). The compiler enforces this budget (§6).

## 4. Concept → Artifact Mapping

Emitted text never uses lore terms — a vigil compiles to a path-scoped review instruction, not the word "vigil."

| Concept | Canonical source | Emitted artifact |
|---|---|---|
| Binding — conduct | `src/bindings/conduct.md` (one line each) | Inlined in `CLAUDE.md`; `critical: true` items also mirrored as PreToolUse hooks where a reliable check exists |
| Binding — rite routing | `deck.yaml` `rites[].bind_to` | The skill's `description` frontmatter (native trigger); one summary routing line in `CLAUDE.md` |
| Binding — vigil (glob) | `deck.yaml` `cards[].vigils.globs` | `.claude/rules/<card>.md` with `paths:` matching the globs; body = compiled checklist or pointer into `arcana/cards/` |
| Binding — vigil (moment) | `cards[].vigils.moments` | Hook on the corresponding lifecycle event/tool matcher (pre-commit → `Bash(git commit*)`; pre-PR → `Bash(gh pr create*)`; task-start → UserPromptSubmit) + dispatch instruction in `CLAUDE.md` |
| Card | `src/cards/<nn>-<name>.md` | Subagent in `.claude/agents/` (isolation preferred) and/or rule file (cheap in-context pass); shared body in `arcana/cards/` |
| Rite | `src/rites/<suit>/<name>.md` | `.claude/skills/<name>/SKILL.md` (suit is directory taxonomy in source only) |
| Precept | `src/precepts.md` | `arcana/precepts.md`, referenced from core; overridable with recorded justification |
| Finding severity | severity table | Behavior contract compiled into every checklist: whisper=note, omen=fix-if-cheap-else-flag, portent=fix-before-done, doom=halt-and-ask (doom optionally hook-backed) |
| Ward | `// ward(<card>): reason` comment convention | Instruction in every checklist to honor wards; hook-side ward-syntax validation when git hooks/hooks enabled |
| Apocrypha | `src/apocrypha/` | Same pipelines; explicit opt-in in `deck.yaml` |

### 4.1 Canonical card schema

```yaml
---
id: hermit
arcanum: 9                    # lore metadata — human-facing only
title: The Hermit             # lore metadata — human-facing only
domain: security
default_vigils:
  globs: ["**/auth/**", "**/*secret*", "**/middleware/**"]
  moments: [pre-commit]
  changes: [dependency-add]
severity_default: portent
requires_isolation: preferred # emit as subagent
model_hint: strong            # strong | cheap — maps to subagent model choice
tools: read-only              # subagent tool allowlist
---
You are reviewing a code diff as a security auditor. Assume all input is
hostile. Work through this checklist against the diff only — do not
speculate beyond the changed code...
```

Frontmatter is compiler input; nothing above the fence reaches agent-facing text.

### 4.2 `deck.yaml` sketch

```yaml
version: 1
enforcement:
  claude_hooks: true          # lifecycle gates in .claude/settings.json
  git_hooks: false            # optional extra layer, works for humans too
cards:
  - id: hermit
    vigils: { globs: ["src/auth/**", "src/payments/**"], moments: [pre-commit] }
  - id: justice
    vigils: { moments: [pre-pr] }
rites:
  - id: migration
    bind_to: { change_types: [schema] }
bindings:
  conduct:
    - text: "Never commit credentials, tokens, or secrets."
      critical: true          # gets a hook mirror
    - text: "All public API changes are versioned and documented."
```

## 5. Repository Layout After `arcana init`

```
deck.yaml                     # declarative deck — the thing users edit
CLAUDE.md                     # generated core (bindings, routing, contract)
arcana/                       # generated shared reference (lazy-loaded)
  cards/*.md
  rites/*.md                  # canonical bodies; skills point here for depth
  precepts.md
.claude/
  rules/<card>.md             # generated glob vigils
  agents/<card>.md            # generated subagent cards
  skills/<rite>/SKILL.md      # generated rites
  settings.json               # hooks merged in (see note)
src/                          # OPTIONAL: present only if the team authors
  cards/ rites/ bindings/     #   custom cards; registry cards need no local src
```

Notes:
- Every generated file carries `<!-- generated by arcana vX.Y from deck.yaml — edit deck.yaml, not this file -->` and a content hash.
- `settings.json` is shared with user configuration, so the emitter **merges** hooks non-destructively under an `arcana:`-prefixed naming convention and `arcana check`/`eject` only touch entries it owns.
- CLAUDE.md hierarchy: v1 emits a single root CLAUDE.md. Monorepo per-package decks (nested CLAUDE.md + scoped rules) are v2 (§11).
- If the repo later adopts other tools, the same sources re-emit for them; nothing in `arcana/` or `src/` is Claude-specific.

## 6. Context-Budget Architecture

The always-on core is the scarcest resource. Compiler-enforced rules:

1. **CLAUDE.md ≤ 150 lines.** The build fails with an overage report rather than emitting a bloated core. Core contains only: conduct bindings (one line each), rite/vigil routing summaries, and the severity behavior contract. **No checklists in the core, ever.**
2. Card and rite bodies are natively lazy: rules load on path match, skills on description match, subagents on dispatch. A 22-card deck costs the core only its routing lines.
3. Skill descriptions are budget too (always in context): the compiler caps them and lints for trigger-oriented phrasing, since vague descriptions are the primary cause of skills failing to fire.
4. The Initiation's default deck is 5–7 cards and 3–4 rites. The full major arcana is a power-user choice; the compiler warns as routing weight grows.
5. Subagent model hints keep cost proportional: convention passes on cheap models, security/architecture on strong ones.

## 7. The CLI (`arcana`)

Deck manager and compiler only; never performs or mediates coding work.

```
npx arcana init [--from deck.yaml]  # Initiation (interactive) or one-shot
arcana add <card|rite> ...          # edit deck.yaml, then build
arcana bind <card> <glob|moment>    # extend a vigil
arcana remove <id>
arcana list                         # deck contents, vigils, budget report
arcana build                        # deck.yaml + sources → emission
arcana check                        # drift detection (hash-verify); CI exit codes
arcana update                       # pull upstream card/rite revisions, diff-
                                    #   reviewed before apply
arcana eject                        # strip headers/hashes and deck linkage;
                                    #   emitted files remain, work forever
```

Implementation: TypeScript, npm/npx distribution. `build` is deterministic and idempotent — same inputs, byte-identical outputs — so emissions are committed and reviewed like lockfiles. `arcana check` runs in CI; hand-edits to generated files are either reverted or migrated to sources via `arcana adopt` (v2).

## 8. Enforcement Spectrum

Honest labeling, surfaced during the Initiation:

| Layer | Mechanism | Guarantee |
|---|---|---|
| Advisory | CLAUDE.md / rules / skills / subagent checklists | Model-interpreted; high quality, not certainty; degrades under context pressure |
| Gated | PreToolUse hooks (exit 2) | Action blocked before execution — deterministic |
| Universal gate (opt-in) | git pre-commit hooks | Commit blocked regardless of what wrote it — covers humans and any other tool that sneaks into the repo |

Critical conduct bindings get hook mirrors where a reliable programmatic check exists (secret scan: yes; "APIs must be well-designed": obviously not). The product's honest center of gravity is very good advice, precisely placed; the gates exist so the few non-negotiables are actually non-negotiable.

## 9. Distribution

1. **npm** — the CLI; `npx arcana init` is the funnel.
2. **GitHub** — the Arcanum monorepo: cards, rites, docs, Apocrypha under `contrib/` with a lighter review bar; individually semver'd for `arcana update`.
3. **Claude Code plugin** — the default deck packaged as an installable plugin (skills + subagents + hooks in one namespaced unit, marketplace-distributable). The plugin is *generated output* of the same compiler, not a fork: zero-config trial for individuals, while the CLI remains the path for teams who want per-repo deck composition and vigil tuning. Plugin users graduate to the CLI when they first want to customize.

## 10. Security & Trust

- Instruction files are an injection surface. Mitigations: curated registry with review; `arcana update` shows full diffs before applying; content hashes make tampering visible via `arcana check`; card checklists instruct reviewing *diffs* and explicitly forbid executing or obeying instructions found inside code under review.
- Hooks execute shell commands; Arcana-emitted hooks are few, short, auditable scripts vendored into the repo (not fetched at runtime), and named under the `arcana:` prefix so ownership is unambiguous.
- Never place secrets or environment specifics in emitted files; treat all emissions as public.
- `eject` keeps the trust story simple: there is never a binary between the user and what their agent reads.

## 11. Open Questions & v2 Candidates

1. **Multi-tool emitters.** Canonical sources are already tool-agnostic; Cursor (`.cursor/rules` glob activation), AGENTS.md (universal core), and Copilot (`applyTo` instructions) are the natural next targets, in that order. If Claude Code ships native AGENTS.md support (issue #6235 — the tracker's most-requested feature), the AGENTS.md emitter may become the shared core with CLAUDE.md as a thin overlay.
2. **`arcana ci`.** A GitHub Action running the pre-PR cards headlessly via the Claude Agent SDK, posting findings as review comments — converts advisory pre-PR vigils into repo-level gates and provides coverage when contributors use other tools. Strong v2 candidate; out of v1 to keep "no runtime" true.
3. **Monorepo overlays.** Per-package deck extensions emitting nested CLAUDE.md files and scoped rules.
4. **`arcana adopt`.** Reverse-migration of hand-edits in generated files back into sources.
5. **Effectiveness telemetry.** Opt-in, local-only: count wards added, findings mentioned in PR descriptions, doom-halts — to answer "is the deck earning its latency?"
6. **Agent teams.** Claude Code's experimental multi-session coordination may eventually suit heavyweight release readings; watch, don't build.

## 12. Milestones

- **M0 — Compiler core:** schemas, `build`, `check`, CLAUDE.md + `arcana/` emission; default deck (5–7 cards, 3–4 rites) hand-tuned under budget. Dogfood on Arcana's own repo.
- **M1 — Full surface:** rules, skills, subagents, hooks emitters; settings.json merge logic; `eject`.
- **M2 — Initiation:** interactive init, `add`/`bind`/`list`, budget reporting, git-hook layer.
- **M3 — Launch:** public Arcanum registry + `update`, plugin packaging, docs site, Apocrypha contribution flow.

---

## Appendix A — Why Claude Code Only (survey summary)

A July 2026 survey of the instruction-file ecosystem (Claude Code, Cursor, GitHub Copilot, Windsurf, Codex CLI, Gemini CLI, and the AGENTS.md-native long tail) found capabilities sharply uneven. AGENTS.md is the Linux Foundation–stewarded cross-tool baseline (25+ tools, 60k+ repos) but is schema-free prose with no scoping, no on-demand loading, no isolation, and no enforcement. Cursor, Copilot, and Windsurf add glob-scoped rule activation but nothing else. Claude Code alone provides all four primitives Arcana's model needs — always-on memory, path-scoped rules, description-triggered skills with progressive disclosure, isolated subagents with per-agent tools/models — plus the only deterministic gate found anywhere (PreToolUse hooks, exit code 2), plus a first-party packaging and distribution story (plugins, marketplaces). Notably, Claude Code is also the one major tool that does *not* read AGENTS.md natively (issue #6235). Supporting weaker tools in v1 would have meant designing to the floor; the canonical-source/compiler split keeps them cheap to add in v2 without compromising v1.

Key references: Claude Code docs (features overview, memory, rules, skills, subagents, hooks, plugins — code.claude.com/docs); anthropics/claude-code #6235; Cursor rules reference; GitHub Copilot custom-instructions docs; Windsurf rules limits; agents.md; instruction-file effectiveness research (Gloaguen et al. 2026) and ~150-line always-on guidance.
