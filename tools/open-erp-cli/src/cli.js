import { createCommand } from './commands/create.js';
import { generateCommand } from './commands/generate.js';
import { validateCommand } from './commands/validate.js';
import { packageCommand } from './commands/package.js';
import { devCommand, inspectCommand, linkCommand } from './commands/misc.js';

const HELP = `@open-erp/cli - Open-ERP plugin developer CLI

Usage: open-erp <command> [options]

Commands:
  create                 Scaffold a new plugin project (standalone git repo)
  generate entity        Generate entity + migration + repository + service
  generate menu          Register a standalone screen (menu + route)
  generate ui-contribution  Register an embedded UI slot contribution
  validate               Validate plugin.json structure and rules
  package                Build backend/web artifacts + SHA-256 checksums
  link                   Add the plugin repo as a git submodule
  inspect                Print manifest + validation summary
  dev                    Generate docker-compose.dev.yml for local runtime

Examples:
  npx @open-erp/cli create --id open-erp-hrm --name "HRM" --non-interactive
  npx @open-erp/cli generate entity --name Invoice --fields "code:string,total:decimal"
  npx @open-erp/cli generate ui-contribution --slot core.dashboard.widgets --render-mode web-component
  npx @open-erp/cli package --with-web
  npx @open-erp/cli dev --core-url http://localhost:8088
`;

export async function run(argv) {
  const [command, ...rest] = argv;
  if (!command || command === 'help' || command === '--help' || command === '-h' || command === '--version' || command === '-v') {
    if (command === '--version' || command === '-v') {
      console.log('0.1.0');
      return;
    }
    console.log(HELP);
    return;
  }
  const flags = parseFlags(rest);
  switch (command) {
    case 'create':
      return createCommand(flags);
    case 'generate':
      return generateCommand(flags);
    case 'validate':
      return validateCommand(flags);
    case 'package':
      return packageCommand(flags);
    case 'link':
      return linkCommand(flags);
    case 'inspect':
      return inspectCommand(flags);
    case 'dev':
      return devCommand(flags);
    default:
      throw new Error(`Unknown command: ${command}. Run "open-erp help".`);
  }
}

export function parseFlags(args) {
  const flags = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith('--')) {
      const [rawName, inline] = arg.slice(2).split('=');
      const name = camel(rawName);
      if (inline !== undefined) {
        flags[name] = inline;
      } else if (args[index + 1] !== undefined && !args[index + 1].startsWith('--')) {
        flags[name] = args[index + 1];
        index += 1;
      } else {
        flags[name] = true;
      }
    } else {
      flags._.push(arg);
    }
  }
  return flags;
}

function camel(value) {
  return value.replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase());
}
