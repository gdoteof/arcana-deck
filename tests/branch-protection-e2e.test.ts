import { execFileSync, spawnSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runBuild } from '../src/commands/build.js';
import { makeTree, removeTree, VALID_PRECEPTS } from './helpers.js';

// A deck with only branch protection — no cards — so the gate exercises the
// branch logic in isolation.
let root: string;
let reg: string;

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function gate(command: string): { status: number | null; stderr: string } {
  const result = spawnSync('node', ['.claude/arcana/bin/gate.mjs'], {
    cwd: root,
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
  });
  return { status: result.status, stderr: result.stderr };
}

beforeAll(() => {
  reg = makeTree({ 'precepts.md': VALID_PRECEPTS });
  root = makeTree({
    'deck.yaml': 'version: 1\nenforcement:\n  protected_branches: [main]\n',
  });
  runBuild(root, { version: '0.0.0-test', registryDir: reg });
  git('init', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('add', '-A');
  git('commit', '-m', 'baseline');
});

afterAll(() => {
  removeTree(root);
  removeTree(reg);
});

describe('branch protection gate', () => {
  it('blocks a commit on the protected branch', () => {
    const result = gate('git commit -m "work"');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('protected branch "main"');
    expect(result.stderr).toContain('git checkout -b');
  });

  it('blocks a merge into the protected branch', () => {
    const result = gate('git merge feature');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('do not merge into the protected branch');
  });

  it('blocks pushing the protected branch (by name or while on it)', () => {
    expect(gate('git push origin main').status).toBe(2);
    expect(gate('git push').status).toBe(2);
    expect(gate('git push origin HEAD:main').status).toBe(2);
  });

  it('allows work once on a feature branch', () => {
    git('checkout', '-b', 'feature');
    expect(gate('git commit -m "work"').status).toBe(0);
    expect(gate('git push origin feature').status).toBe(0);
    expect(gate('git merge other-feature').status).toBe(0);
  });

  it('still blocks pushing main from a feature branch', () => {
    // still on the feature branch from the previous test
    const result = gate('git push origin feature:main');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('do not push directly to a protected branch');
  });

  it('ignores unrelated commands', () => {
    expect(gate('npm test').status).toBe(0);
    expect(gate('git status').status).toBe(0);
  });
});
