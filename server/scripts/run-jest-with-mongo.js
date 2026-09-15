import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

process.env.MONGOMS_VERSION = '7.0.14';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const jestBin = path.join(projectRoot, 'node_modules', 'jest', 'bin', 'jest.js');

const args = ['--experimental-vm-modules', jestBin];
const extraArgs = process.argv.slice(2);

if (extraArgs.length > 0) {
  args.push(...extraArgs);
}

const result = spawnSync(process.execPath, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
