# arcanum-cli

**An opinionated context library for Claude Code.** You describe a *deck* of
house rules, workflows, and reviewer personas once; `arcanum-cli` compiles it
into the files Claude Code already reads — `CLAUDE.md`, path-scoped rules,
skills, subagents, and lifecycle hooks. There is no runtime and no daemon: the
product is plain, reviewable files. Your prompting doesn't change; what the
agent does by default does.

> **Status:** early, and primarily dogfooded on its own repo. Expect sharp
> edges. The compiler core (M0) and the full Claude Code emission surface (M1)
> are implemented and tested; the interactive onboarding, registry, and plugin
> packaging are not yet built.

## Why

Anthropic's own guidance is that `CLAUDE.md` and memory *influence* the model
but are not a policy engine — only hooks are deterministic. `arcanum-cli` leans
into that honestly: it turns a small, versioned deck into good advice placed
exactly where it fires, plus the few deterministic gates that a reliable check
can back. The tarot layer (cards, rites, vigils) is lore for *humans* browsing
and configuring; the text the agent actually reads is plain professional
instruction — no role-play, no vocabulary games.

## Quick start

```bash
# from the root of a git repo that uses Claude Code
npx arcanum-cli init      # install the default deck and compile it
```

That writes a `deck.yaml`, a compiled `CLAUDE.md`, an `arcana/` reference tree,
and the `.claude/` rules, agents, skills, and hooks. Edit `deck.yaml`, then:

```bash
arcanum-cli build         # recompile deck.yaml + sources into the emission
arcanum-cli check         # verify the emission matches the deck (CI-friendly)
arcanum-cli list          # show the deck: cards, rites, vigils, budget
arcanum-cli eject         # strip generation markers; the files keep working, forever
```

`build` is deterministic and idempotent — same inputs, byte-identical output —
so the generated files are meant to be committed and reviewed like a lockfile.
Every generated file carries a content hash; `check` distinguishes a hand-edit
from a stale build, and exits non-zero for CI.

## What's in a deck

`deck.yaml` is the source of truth. It selects **cards** (reviewer personas),
**rites** (mandated workflows), **conduct bindings** (hard rules), and a few
policies. A trimmed example:

```yaml
version: 1
preamble: src/preamble.md        # optional: your own always-on project notes
enforcement:
  claude_hooks: true
  protected_branches: [main]     # steer work onto branches + PRs (see caveat below)
pull_requests:
  require_audit: true            # state "run the audits before a PR" in CLAUDE.md
  agent_may_merge: false         # may the agent merge a PR it has audited and trusts?
cards:
  - id: hermit                   # security
  - id: justice                  # correctness & tests
  - id: hanged-man               # convergence — steps back from stuck loops
rites:
  - id: migration
bindings:
  conduct:
    - text: "Never commit credentials, tokens, or secrets."
      critical: true
```

The default deck ships seven cards (Hermit/security, Justice/correctness,
Hierophant/convention, Temperance/proportion, Strength/resilience, Devil/abuse
resistance, Hanged Man/convergence) and four rites (migration, bugfix, refactor,
dependency). Add your own under `src/cards/` and `src/rites/`; local sources
override the registry.

### Review vs. audit

A card is only a persona — a lens and a checklist. *How hard* it is applied is a
property of the **vigil**, not the card:

- **review** — a read-only, in-context pass; the agent self-reviews against the
  checklist. Cheap. This is the default for path-scoped and most moment vigils.
- **audit** — the persona is dispatched to an *isolated* subagent that tries to
  break the change and may run it to prove a break. Expensive. The default for
  the pre-PR moment.

So the same Hermit does a light path-scoped security review while you work, and
a full adversarial security audit before a pull request.

## Enforcement, honestly

`arcanum-cli` labels every rule as *advisory* or *gated* and is honest about
which is which:

- **Advisory** — `CLAUDE.md`, rules, skills, and checklists. High-quality
  guidance for a cooperating agent; not a guarantee.
- **Gated** — `PreToolUse` hooks that block a matched command. Deterministic for
  the command they match.

The optional branch/secret **commit gate is best-effort, not a security
boundary.** A `PreToolUse` hook inspects the command text before it runs, so
quoting, git aliases, a separate worktree, or exotic subcommands can slip past
it — this is a fundamental limit of command-text parsing, not a bug to be fixed.
It closes the common cases with a clear message; the *real* enforcement for "no
direct changes to a protected branch" is your host's **server-side branch
protection**. Turn that on if you need a guarantee.

## Requirements

- Node.js ≥ 20
- A repository that uses Claude Code

## License

MIT © gdoteof
