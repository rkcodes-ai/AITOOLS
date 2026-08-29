import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../../');

const readDirFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(readDirFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
};

describe('Architectural Dependency Boundaries Tests', () => {
  it('controllers should not directly import external provider SDKs or URLs', () => {
    const controllersDir = path.join(serverDir, 'controllers');
    const files = readDirFiles(controllersDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.strictEqual(
        content.includes('api-inference.huggingface.co'),
        false,
        `File ${file} contains raw Hugging Face URL.`
      );
      assert.strictEqual(
        content.includes('rapidapi.com'),
        false,
        `File ${file} contains raw RapidAPI URL.`
      );
      assert.strictEqual(
        content.includes('@huggingface/inference'),
        false,
        `File ${file} directly imports @huggingface/inference.`
      );
    }
  });

  it('routes should not contain AI business logic or direct provider calls', () => {
    const routesDir = path.join(serverDir, 'routes');
    const files = readDirFiles(routesDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.strictEqual(
        content.includes('axios'),
        false,
        `Route ${file} directly imports axios.`
      );
      assert.strictEqual(
        content.includes('rapidapi.com'),
        false,
        `Route ${file} contains raw provider URL.`
      );
    }
  });

  it('repositories should be the exclusive owners of direct Mongoose queries (no controller model imports)', () => {
    const controllersDir = path.join(serverDir, 'controllers');
    const controllerFiles = readDirFiles(controllersDir);

    for (const file of controllerFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.strictEqual(
        /import\s+.*\s+from\s+['"]\.\.\/models\//.test(content),
        false,
        `Controller ${file} directly imports a Mongoose model instead of using a repository.`
      );
    }
  });
});
