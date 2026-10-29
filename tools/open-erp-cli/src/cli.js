import { createCommand } from './commands/create.js';
import { generateCommand } from './commands/generate.js';
import { runGenerateWizard, runWizard } from './interactive/wizard.js';
import { validateCommand } from './commands/validate.js';
import { packageCommand } from './commands/package.js';
import { devCommand, inspectCommand, linkCommand } from './commands/misc.js';
import { publishCommand } from './commands/publish.js';
import { upgradeCommand } from './commands/upgrade.js';

const HELP = `@open-erp/cli - Open-ERP plugin developer CLI

Usage: open-erp <command> [options]

Commands:
  (no command)           Open the interactive developer wizard
  wizard                 Open the interactive developer wizard
  create                 Scaffold a zero-DB plugin (template 2.0)
  generate entity        Generate POJO + migration + query descriptor + permissions
  generate field         Add a field + migration + Java property
  generate relation      Add a relation (FK self / soft ref core/plugin)
  generate crud          Generate Angular list/drawer + Java DTO/service/resource
  generate menu          Register a standalone screen (menu + route)
  generate ui-contribution  Register an embedded UI slot contribution
  validate               Validate offline + --core-url registry/slot lookups
  upgrade                Check or apply template 2.0 metadata upgrades
  package                Build backend/web artifacts + SHA-256 checksums
  publish                Upload bundle/image to the registry and print a registration payload
  link                   Add the plugin repo as a git submodule
  inspect                Print manifest + validation summary
  dev                    Generate docker-compose.dev.yml for local runtime

Examples:
  npx @open-erp/cli create --id open-erp-hrm --name "HRM" --non-interactive --target plugins/open-erp-hrm
  npx @open-erp/cli generate entity --name Invoice --fields "code:string:required+unique,total:decimal"
  npx @open-erp/cli generate ui-contribution --slot core.dashboard.widgets --render-mode web-component
  npx @open-erp/cli package --with-web
  npx @open-erp/cli publish --source bundle --registry http://localhost:8088 --credential OPENERP_TOKEN
  npx @open-erp/cli dev --core-url http://localhost:8088
`;

export async function run(argv) {
  const [command, ...rest] = argv;
  if (!command) {
    if (process.stdin.isTTY) {
      return runWizard();
    }
    console.log(HELP);
    return;
  }
  if (command === 'help' || command === '--help' || command === '-h' || command === '--version' || command === '-v') {
    if (command === '--version' || command === '-v') {
      console.log('0.2.0');
      return;
    }
    console.log(HELP);
    return;
  }
  const flags = parseFlags(rest);
  switch (command) {
    case 'wizard':
      return runWizard();
    case 'create':
      return createCommand(flags);
    case 'generate':
      if (flags.interactive) {
        return runGenerateWizard(flags._[0]);
      }
      return generateCommand(flags);
    case 'validate':
      return validateCommand(flags);
    case 'upgrade':
      return upgradeCommand(flags);
    case 'package':
      return packageCommand(flags);
    case 'publish':
      return publishCommand(flags);
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
        flags[name] = coerce(inline);
      } else if (args[index + 1] !== undefined && !args[index + 1].startsWith('--')) {
        flags[name] = coerce(args[index + 1]);
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

function coerce(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function camel(value) {
  return value.replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase());
}
