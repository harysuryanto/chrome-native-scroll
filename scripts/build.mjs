import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = new URL('../', import.meta.url);
const dist = fileURLToPath(new URL('./dist/', root));

// Build popup/options HTML and copy public/manifest.json to dist/.
await build({ configFile: fileURLToPath(new URL('./vite.config.ts', root)) });

// MV3 manifest-declared content scripts run as classic scripts.
// Build independent IIFEs so they cannot rely on ES imports or shared chunks.
const entries = {
  background: './src/background/service-worker.ts',
  content: './src/content/content-script.ts',
  'main-world': './src/main-world/index.ts',
};

for (const [name, path] of Object.entries(entries)) {
  await build({
    configFile: false,
    root: fileURLToPath(root),
    publicDir: false,
    build: {
      outDir: dist,
      emptyOutDir: false,
      lib: {
        entry: fileURLToPath(new URL(path, root)),
        name: 'NativeScroll' + name.replace(/(^|-)(\w)/g, (_, _dash, letter) => letter.toUpperCase()),
        formats: ['iife'],
        fileName: () => 'scripts/' + name + '.js',
      },
    },
  });
}

console.log('NativeScroll extension built in dist/');
