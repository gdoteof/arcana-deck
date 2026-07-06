import { describe, expect, it } from 'vitest';
import { BUDGET_LINES, checkBudget, formatOverageReport } from '../../src/compiler/budget.js';

describe('checkBudget', () => {
  it('passes content at or under the budget', () => {
    const content = `${'x\n'.repeat(BUDGET_LINES)}`;
    const report = checkBudget(content);
    expect(report.ok).toBe(true);
    expect(report.lines).toBe(BUDGET_LINES);
  });

  it('fails content over the budget', () => {
    const content = `${'x\n'.repeat(BUDGET_LINES + 1)}`;
    expect(checkBudget(content).ok).toBe(false);
  });

  it('attributes lines to markdown heading sections', () => {
    const content = '<!-- notice -->\n# One\na\nb\n## Two\nc\n';
    const report = checkBudget(content);
    expect(report.sections).toEqual([
      { heading: '(preamble)', lines: 1 },
      { heading: 'One', lines: 3 },
      { heading: 'Two', lines: 2 },
    ]);
    expect(report.lines).toBe(6);
  });

  it('handles content with no headings', () => {
    const report = checkBudget('a\nb\n');
    expect(report.sections).toEqual([{ heading: '(preamble)', lines: 2 }]);
  });
});

describe('formatOverageReport', () => {
  it('names the overage and the per-section weights', () => {
    const report = checkBudget(`# Heavy\n${'x\n'.repeat(BUDGET_LINES + 9)}`);
    const text = formatOverageReport(report);
    expect(text).toContain(`over the ${BUDGET_LINES}-line always-on budget by 10`);
    expect(text).toContain('Heavy');
    expect(text).toContain('trim the deck');
  });
});
