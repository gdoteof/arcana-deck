import { describe, expect, it } from 'vitest';
import {
  generatorNotice,
  isStamped,
  sha256,
  stamp,
  stripStamp,
  verifyStamp,
} from '../../src/compiler/hash.js';

describe('stamp / verifyStamp', () => {
  it('stamps content and verifies it', () => {
    const stamped = stamp('# Title\n\nBody.\n');
    expect(stamped).toMatch(/<!-- arcana:hash:sha256 [0-9a-f]{64} -->\n$/);
    expect(verifyStamp(stamped)).toBe('ok');
    expect(isStamped(stamped)).toBe(true);
  });

  it('adds a trailing newline when content lacks one', () => {
    const stamped = stamp('no newline');
    expect(stamped.startsWith('no newline\n')).toBe(true);
    expect(verifyStamp(stamped)).toBe('ok');
  });

  it('is deterministic', () => {
    expect(stamp('same\n')).toBe(stamp('same\n'));
  });

  it('detects tampering anywhere in the body', () => {
    const stamped = stamp('line one\nline two\n');
    const tampered = stamped.replace('line one', 'line 1');
    expect(verifyStamp(tampered)).toBe('mismatch');
  });

  it('reports missing stamps', () => {
    expect(verifyStamp('plain file\n')).toBe('missing');
    expect(isStamped('plain file\n')).toBe(false);
  });

  it('verifies files without a trailing newline after the stamp', () => {
    const stamped = stamp('body\n').trimEnd();
    expect(verifyStamp(stamped)).toBe('ok');
  });

  it('rejects malformed hash lines', () => {
    expect(verifyStamp('body\n<!-- arcana:hash:sha256 nothex -->\n')).toBe('missing');
  });
});

describe('stripStamp', () => {
  it('removes the hash line and generator notices', () => {
    const content = `${generatorNotice('0.1.0')}\n\n# Title\n\nBody.\n`;
    const stripped = stripStamp(stamp(content));
    expect(stripped).toBe('# Title\n\nBody.\n');
  });

  it('leaves unstamped files unchanged', () => {
    expect(stripStamp('# Plain\n')).toBe('# Plain\n');
  });
});

describe('sha256', () => {
  it('matches the known digest of the empty string', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
