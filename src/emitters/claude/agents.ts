import { generatorNotice } from '../../compiler/hash.js';
import type { Project, ResolvedCard } from '../../loader/index.js';
import { MOMENT_PHRASES, type Moment } from '../../types.js';
import { buildChecklist } from './checklist.js';
import type { EmittedFile } from './reference.js';
import { cardReviewTitle } from './shared.js';

/** Moments at which this card is bound as an adversarial audit. */
export function auditMoments(card: ResolvedCard): Moment[] {
  return card.vigils.moments.filter((m) => m.mode === 'audit').map((m) => m.at);
}

/**
 * Cards that any vigil applies in audit mode. These — and only these — become
 * isolated subagents; a card is not "an audit card", it is a persona bound at
 * an audit moment.
 */
export function auditCards(project: Project): ResolvedCard[] {
  return project.cards.filter((card) => auditMoments(card).length > 0);
}

/** Dispatch-oriented description compiled from the card's audit vigils. */
export function agentDescription(card: ResolvedCard): string {
  const meta = card.card.meta;
  // Emitted only for audit cards, which always have at least one audit moment.
  const cues = auditMoments(card).map((m) => MOMENT_PHRASES[m].toLowerCase());
  return (
    `Adversarial audit: actively tries to break a change set through the lens of ${meta.domain}, ` +
    `and proves any break with a reproduction. Give it only the diff and the task statement — ` +
    `not your reasoning. Use ${cues.join('; ')}.`
  );
}

/**
 * One subagent per card bound at an audit moment. Every audit runs isolated,
 * may execute the code in a throwaway worktree to prove a break, and is framed
 * to attack rather than check. None of this is a property of the persona — a
 * review-mode binding of the same card stays in context and read-only.
 */
export function emitAgents(project: Project, version: string): EmittedFile[] {
  return auditCards(project).map((card) => {
    const meta = card.card.meta;
    const content = [
      '---',
      `name: ${meta.id}`,
      `description: "${agentDescription(card).replace(/"/g, '\\"')}"`,
      'tools: Read, Grep, Glob, Bash',
      'model: inherit',
      'isolation: worktree',
      '---',
      generatorNotice(version),
      '',
      `# ${cardReviewTitle(card)}`,
      '',
      'You are given a change set with no context beyond the stated task — by',
      'design: you owe its author nothing. Your job is to break it before real',
      'users do. Attack it; do not merely read it.',
      '',
      buildChecklist(card, 'audit'),
      '',
      'Structure your reply as a list of breaks (severity, location, reproduction,',
      'impact), then the claims you attacked that held. A clean result means',
      '"attempted these attacks, all held" — with the list, never a bare pass.',
    ].join('\n');
    return { path: `.claude/agents/${meta.id}.md`, content: `${content}\n` };
  });
}
