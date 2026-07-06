import { generatorNotice } from '../../compiler/hash.js';
import type { Project } from '../../loader/index.js';
import { cardRoutingLines, riteRoutingLine, severityContractLines } from './shared.js';

export interface CoreOptions {
  version: string;
  /** True once hook gates are actually emitted; marks critical conduct as enforced. */
  gatedConduct: boolean;
}

/**
 * The always-on core (§6): conduct bindings, routing summaries, severity
 * contract. No checklists, ever — bodies live under arcana/ and load lazily.
 */
export function emitCore(project: Project, options: CoreOptions): string {
  const parts: string[] = [generatorNotice(options.version), '', '# Working agreement', ''];
  parts.push(
    'This is the always-on core of how to work in this repository. The detailed',
    'checklists and workflows it references live under arcana/ — read them when',
    'a rule below says to, not preemptively.',
  );

  const conduct = project.deck.bindings.conduct;
  if (conduct.length > 0) {
    parts.push('', '## Conduct', '');
    for (const binding of conduct) {
      const gate = binding.critical && options.gatedConduct ? ' (a commit gate enforces this)' : '';
      parts.push(`- ${binding.text}${gate}`);
    }
    parts.push(
      '',
      'These rules are hard. If one conflicts with what you are asked to do, stop',
      'and surface the conflict — do not break the rule.',
    );
  }

  parts.push(
    '',
    '## Working principles',
    '',
    'Before starting a non-trivial task, read arcana/precepts.md and follow it.',
  );

  if (project.rites.length > 0) {
    parts.push('', '## Required workflows', '');
    for (const rite of project.rites) {
      parts.push(riteRoutingLine(rite));
    }
  }

  if (project.cards.length > 0) {
    parts.push('', '## Required reviews', '');
    for (const card of project.cards) {
      parts.push(...cardRoutingLines(card));
    }
    parts.push(
      '',
      'Reviews report findings at four severities; act on them as follows:',
      '',
      ...severityContractLines(),
      '',
      'When several reviews apply to the same change, reconcile their findings and',
      'present one verdict with clear priorities — not a pile of contradictions.',
    );
  }

  return `${parts.join('\n')}\n`;
}
