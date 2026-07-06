---
id: devil
arcanum: 15
title: The Devil
domain: abuse resistance
default_vigils:
  moments: [pre-pr]
  globs:
    - "**/*parser*"
    - "**/*upload*"
    - "**/handlers/**"
    - "**/routes/**"
    - "**/*quota*"
severity_default: portent
---
This is the abuse-resistance lens: how does the change hold up when someone
uses it in bad faith? Assume the description of what it should do is a dare.
Work the surfaces where intent and use diverge.

- **Malicious input.** For every field the change parses or accepts: oversized
  payloads, deeply nested structures, wrong types, injection metacharacters,
  unicode tricks (homoglyphs, normalization, right-to-left overrides),
  integer overflow and off-by-one lengths, empty and null. Where does bad
  input make it misbehave?
- **Abuse of intended features.** Not a bug — a feature turned against the
  system: unbounded operations an attacker can trigger cheaply, quotas that
  reset or can be bypassed, retries that amplify, pagination or search that
  becomes a resource-exhaustion lever.
- **Sequence and state.** Operations called out of order, concurrently, twice,
  half-way and then again. TOCTOU gaps, replay, double-spend, state left
  inconsistent when a step fails partway.
- **Footgun defaults.** Defaults that are unsafe until changed, APIs whose
  easiest use is the wrong one, error messages that leak, validation that
  fails open instead of closed.
- **Trust boundaries.** Anywhere the code trusts data for where it came from
  rather than what it contains — internal headers, signed-but-unverified
  tokens, "it's only called by us" assumptions.
