import fs from 'fs';
import path from 'path';
import os from 'os';

const cacheDir = path.join(os.homedir(), '.cache', 'mongodb-binaries');
process.env.MONGOMS_VERSION = '7.0.14';

if (fs.existsSync(cacheDir)) {
  for (const entry of fs.readdirSync(cacheDir)) {
    const fullPath = path.join(cacheDir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && (entry.endsWith('.lock') || entry.endsWith('.downloading'))) {
      fs.rmSync(fullPath, { force: true });
    }
  }
}

console.log('MongoMemoryServer cache prepared for version 7.0.14');
