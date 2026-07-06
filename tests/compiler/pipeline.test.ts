import { afterEach, describe, expect, it } from 'vitest';
import { BUDGET_LINES } from '../../src/compiler/budget.js';
import { verifyStamp } from '../../src/compiler/hash.js';
import { compile } from '../../src/compiler/pipeline.js';
import { removeTree } from '../helpers.js';
import { FIXTURE_VERSION, fixtureProject } from '../emitters/fixtures.js';

const cleanups: string[] = [];
afterEach(() => {
  while (cleanups.length > 0) removeTree(cleanups.pop()!);
});

function fixture(deckYaml?: string) {
  const { project, roots } = fixtureProject(deckYaml);
  cleanups.push(...roots);
  return project;
}

describe('compile', () => {
  it('emits CLAUDE.md plus the reference tree, sorted by path', () => {
    const output = compile(fixture(), { version: FIXTURE_VERSION });
    expect(output.files.map((f) => f.path)).toEqual([
      'CLAUDE.md',
      'arcana/cards/hermit.md',
      'arcana/cards/justice.md',
      'arcana/precepts.md',
      'arcana/rites/migration.md',
    ]);
  });

  it('stamps every emitted file verifiably', () => {
    for (const file of compile(fixture(), { version: FIXTURE_VERSION }).files) {
      expect(verifyStamp(file.content), file.path).toBe('ok');
    }
  });

  it('is deterministic: same inputs, byte-identical outputs', () => {
    const a = compile(fixture(), { version: FIXTURE_VERSION });
    const b = compile(fixture(), { version: FIXTURE_VERSION });
    expect(a.files).toEqual(b.files);
  });

  it('reports the core budget', () => {
    const output = compile(fixture(), { version: FIXTURE_VERSION });
    expect(output.budget.ok).toBe(true);
    expect(output.budget.lines).toBeLessThanOrEqual(BUDGET_LINES);
    expect(output.budget.lines).toBeGreaterThan(20);
  });

  it('fails the build with an overage report when the core exceeds the budget', () => {
    const manyBindings = Array.from(
      { length: BUDGET_LINES },
      (_, i) => `    - text: "Rule number ${i} about how to conduct changes in this repository."`,
    ).join('\n');
    const project = fixture(`version: 1\nbindings:\n  conduct:\n${manyBindings}\n`);
    expect(() => compile(project, { version: FIXTURE_VERSION })).toThrow(
      /over the 150-line always-on budget/,
    );
  });
});
