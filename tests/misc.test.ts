import { describe, expect, it } from 'vitest';
import { capitalize, triggerToCondition } from '../src/emitters/claude/shared.js';
import { cliVersion } from '../src/version.js';

describe('cliVersion', () => {
  it('reads the package version', () => {
    expect(cliVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('capitalize', () => {
  it('uppercases the first letter', () => {
    expect(capitalize('security')).toBe('Security');
  });

  it('passes the empty string through', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('triggerToCondition', () => {
  it('strips the "Use" opener and trailing period', () => {
    expect(triggerToCondition('Use when fixing a bug.')).toBe('When fixing a bug');
    expect(triggerToCondition('Use before opening a pull request.')).toBe(
      'Before opening a pull request',
    );
  });
});
