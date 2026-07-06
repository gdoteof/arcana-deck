/**
 * The always-on core is the scarcest resource (§6): CLAUDE.md must stay at or
 * under BUDGET_LINES total lines, counted on the final emitted content —
 * comments and blank lines included, because they all enter context.
 */
export const BUDGET_LINES = 150;

export interface BudgetSection {
  heading: string;
  lines: number;
}

export interface BudgetReport {
  lines: number;
  limit: number;
  ok: boolean;
  sections: BudgetSection[];
}

export function checkBudget(coreContent: string): BudgetReport {
  const allLines = coreContent.replace(/\n$/, '').split('\n');
  const sections: BudgetSection[] = [];
  let current: BudgetSection = { heading: '(preamble)', lines: 0 };
  for (const line of allLines) {
    if (/^#{1,6} /.test(line)) {
      if (current.lines > 0) sections.push(current);
      current = { heading: line.replace(/^#+ /, ''), lines: 0 };
    }
    current.lines += 1;
  }
  sections.push(current);
  return {
    lines: allLines.length,
    limit: BUDGET_LINES,
    ok: allLines.length <= BUDGET_LINES,
    sections,
  };
}

export function formatOverageReport(report: BudgetReport): string {
  const rows = report.sections.map((s) => `  ${String(s.lines).padStart(4)}  ${s.heading}`);
  return [
    `CLAUDE.md is ${report.lines} lines — over the ${report.limit}-line always-on budget by ${report.lines - report.limit}.`,
    'Everything always-on costs context; trim the deck rather than raising the budget.',
    'Lines per section:',
    ...rows,
    'Fixes: drop cards/rites you are not using, shorten conduct bindings, or move detail into card/rite bodies (they load lazily).',
  ].join('\n');
}
