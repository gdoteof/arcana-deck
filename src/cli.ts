import { Command } from 'commander';
import { cliVersion } from './version.js';

const program = new Command();

program
  .name('arcana')
  .description('Compile a canonical deck into the files Claude Code natively consumes.')
  .version(cliVersion());

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
