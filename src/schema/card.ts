import { z } from 'zod';
import { ArcanaError, formatZodError } from '../errors.js';
import { parseFrontmatter } from '../frontmatter.js';
import { CHANGE_TYPES, MODES, MOMENTS, SEVERITIES, type Mode, type Moment, type MomentSpec } from '../types.js';

const idPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const momentsList = MOMENTS.join(', ');
const modesList = MODES.join(', ');

/**
 * A moment vigil: a bare moment (default intensity) or `{ at, mode }` to
 * override the intensity. Validated with superRefine so the errors name the
 * exact problem — zod's union errors would only say "invalid input".
 */
export const MomentSpecSchema = z
  .union([z.string(), z.object({ at: z.string().optional(), mode: z.string().optional() }).passthrough()])
  .superRefine((val, ctx) => {
    const bad = (message: string, path?: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, ...(path ? { path: [path] } : {}) });
    if (typeof val === 'string') {
      if (!MOMENTS.includes(val as Moment)) bad(`must be one of: ${momentsList}`);
      return;
    }
    for (const key of Object.keys(val)) {
      if (key !== 'at' && key !== 'mode') bad(`unrecognized key "${key}"`);
    }
    if (val.at === undefined || !MOMENTS.includes(val.at as Moment)) {
      bad(`must be one of: ${momentsList}`, 'at');
    }
    if (val.mode === undefined || !MODES.includes(val.mode as Mode)) {
      bad(`must be one of: ${modesList}`, 'mode');
    }
  })
  .transform((val) => val as MomentSpec);

export const VigilsSchema = z
  .object({
    globs: z.array(z.string().min(1)).default([]),
    moments: z.array(MomentSpecSchema).default([]),
    changes: z
      .array(z.enum(CHANGE_TYPES, { message: `must be one of: ${CHANGE_TYPES.join(', ')}` }))
      .default([]),
  })
  .strict();

/**
 * A card is a persona and nothing more: a lens (domain), a temperament and
 * checklist (body), and where it keeps watch (default_vigils). It carries no
 * privileges — how hard it is applied (review vs audit) is the vigil's mode,
 * not the card's.
 */
export const CardFrontmatterSchema = z
  .object({
    id: z.string().regex(idPattern, 'must be kebab-case (e.g. "hermit", "high-priestess")'),
    arcanum: z.number().int().min(0).max(21).optional(),
    title: z.string().min(1).optional(),
    domain: z.string().min(1),
    default_vigils: VigilsSchema.default({ globs: [], moments: [], changes: [] }),
    severity_default: z.enum(SEVERITIES, {
      message: `must be one of: ${SEVERITIES.join(', ')}`,
    }),
  })
  .strict();

export type CardFrontmatter = z.infer<typeof CardFrontmatterSchema>;

export interface Card {
  meta: CardFrontmatter;
  /** Agent-facing checklist body; lore-free plain language. */
  body: string;
  sourcePath: string;
}

export function parseCard(text: string, filePath: string): Card {
  const { data, body } = parseFrontmatter(text, filePath);
  const result = CardFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new ArcanaError(formatZodError(result.error, `card frontmatter in ${filePath}`));
  }
  if (body.trim().length === 0) {
    throw new ArcanaError(`${filePath}: card body (the checklist) is empty`);
  }
  return { meta: result.data, body: body.trim(), sourcePath: filePath };
}
