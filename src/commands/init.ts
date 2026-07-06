import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ArcanaError } from '../errors.js';
import { DECK_FILENAME, defaultRegistryDir } from '../loader/index.js';
import { parseDeck } from '../schema/deck.js';
import { runBuild, type BuildOptions, type BuildSummary } from './build.js';

export interface InitOptions extends BuildOptions {
  /** Path to a deck.yaml to start from; defaults to the registry's default deck. */
  from?: string;
}

export function runInit(root: string, options: InitOptions): BuildSummary {
  const deckPath = join(root, DECK_FILENAME);
  if (existsSync(deckPath)) {
    throw new ArcanaError(
      `${DECK_FILENAME} already exists in ${root} — edit it and run "arcana build" instead`,
    );
  }
  const source = options.from ?? join(options.registryDir ?? defaultRegistryDir(), 'deck.default.yaml');
  if (!existsSync(source)) {
    throw new ArcanaError(
      options.from
        ? `deck file not found: ${source}`
        : `the registry has no default deck (${source}) — pass one with --from`,
    );
  }
  parseDeck(readFileSync(source, 'utf8'), source); // validate before installing
  copyFileSync(source, deckPath);
  return runBuild(root, options);
}
