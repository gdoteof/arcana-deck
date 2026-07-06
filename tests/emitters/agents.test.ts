import { afterEach, describe, expect, it } from 'vitest';
import { agentDescription, auditCards, emitAgents } from '../../src/emitters/claude/agents.js';
import { removeTree } from '../helpers.js';
import { FIXTURE_VERSION, findLoreWords, fixtureProject } from './fixtures.js';

const cleanups: string[] = [];
afterEach(() => {
  while (cleanups.length > 0) removeTree(cleanups.pop()!);
});

function fixture(deckYaml?: string) {
  const { project, roots } = fixtureProject(deckYaml);
  cleanups.push(...roots);
  return project;
}

// hermit: pre-commit (review) + globs; justice: pre-pr (audit); devil: pre-pr (audit).
const WITH_DEVIL = 'version: 1\ncards:\n  - id: hermit\n  - id: justice\n  - id: devil\n';

describe('auditCards / emitAgents', () => {
  it('emits an agent only for cards with an audit-mode vigil', () => {
    // Base fixture: only justice is bound at an audit moment.
    expect(emitAgents(fixture(), FIXTURE_VERSION).map((f) => f.path)).toEqual([
      '.claude/agents/justice.md',
    ]);
    // hermit is review-only here, so no agent — same persona, lower intensity.
    expect(auditCards(fixture()).map((c) => c.card.meta.id)).toEqual(['justice']);
  });

  it('emits nothing for a review-only deck', () => {
    const project = fixture(
      'version: 1\ncards:\n  - id: justice\n    vigils:\n      moments:\n        - { at: pre-pr, mode: review }\n',
    );
    expect(emitAgents(project, FIXTURE_VERSION)).toEqual([]);
  });

  it('gives every audit agent Bash, inherit model, and a worktree — from the mode, not the card', () => {
    for (const agent of emitAgents(fixture(WITH_DEVIL), FIXTURE_VERSION)) {
      expect(agent.content, agent.path).toContain('tools: Read, Grep, Glob, Bash');
      expect(agent.content, agent.path).toContain('model: inherit');
      expect(agent.content, agent.path).toContain('isolation: worktree');
    }
  });

  it('frames the audit as break-it with a reproduction contract', () => {
    const devil = emitAgents(fixture(WITH_DEVIL), FIXTURE_VERSION).find((f) =>
      f.path.endsWith('devil.md'),
    )!;
    expect(devil.content).toContain('Your job is to break it before real');
    expect(devil.content).toContain('Every finding must come with a concrete reproduction');
    expect(devil.content).toContain('attempted, held');
    expect(devil.content).toContain('run it only');
    expect(devil.content).toContain('list of breaks');
    // an audit is allowed to run the code, so no "never execute" rule
    expect(devil.content).not.toContain('never execute the code under review');
  });

  it('the same persona audits any domain — justice audits correctness', () => {
    const justice = emitAgents(fixture(), FIXTURE_VERSION)[0]!;
    expect(justice.content).toContain('# Correctness review');
    expect(justice.content).toContain('Verify claims against the code.');
    expect(justice.content).toContain('Your job is to break it');
  });

  it('describes an audit agent as a clean-room breaker for its lens', () => {
    const project = fixture(WITH_DEVIL);
    const devil = project.cards.find((c) => c.card.meta.id === 'devil')!;
    const description = agentDescription(devil);
    expect(description).toContain('Adversarial audit');
    expect(description).toContain('abuse resistance');
    expect(description).toContain('not your reasoning');
    expect(description).toContain('before opening a pull request');
  });

  it('contains no lore vocabulary', () => {
    for (const file of emitAgents(fixture(WITH_DEVIL), FIXTURE_VERSION)) {
      expect(findLoreWords(file.content), file.path).toEqual([]);
    }
  });
});
