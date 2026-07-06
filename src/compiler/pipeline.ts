import { ArcanaError } from '../errors.js';
import type { Project } from '../loader/index.js';
import { emitCore } from '../emitters/claude/core.js';
import { emitReference, type EmittedFile } from '../emitters/claude/reference.js';
import { checkBudget, formatOverageReport, type BudgetReport } from './budget.js';
import { stamp } from './hash.js';

export interface BuildOutput {
  /** Stamped files, sorted by path. Byte-identical for identical inputs. */
  files: EmittedFile[];
  budget: BudgetReport;
}

export interface CompileOptions {
  version: string;
}

export function compile(project: Project, options: CompileOptions): BuildOutput {
  const gatedConduct = false; // becomes enforcement-dependent once the hooks emitter (M1) lands
  const core = stamp(emitCore(project, { version: options.version, gatedConduct }));

  const budget = checkBudget(core);
  if (!budget.ok) {
    throw new ArcanaError(formatOverageReport(budget));
  }

  const files: EmittedFile[] = [
    { path: 'CLAUDE.md', content: core },
    ...emitReference(project, options.version).map((f) => ({ ...f, content: stamp(f.content) })),
  ];
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { files, budget };
}
