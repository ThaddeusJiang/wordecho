import { build } from 'esbuild';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const player = await build({ entryPoints:['packages/player/player.mjs'], bundle:true, write:false, minify:true, platform:'browser', format:'iife' });
const html = (await readFile('packages/player/page.html','utf8')).replace('/* WORDECHO_PLAYER */', player.outputFiles[0].text);
await mkdir('plugins/openai/dist', { recursive:true });
await writeFile('plugins/openai/dist/player.html', html);
const server = await build({ entryPoints:['plugins/openai/app/server.mjs'], outfile:'plugins/openai/dist/server.cjs', bundle:true, metafile:true, platform:'node', target:'node22', format:'cjs', plugins:[{
  name:'wordecho-html', setup(build) {
    build.onResolve({ filter:/^wordecho:html$/ }, () => ({ path:'html', namespace:'wordecho' }));
    build.onLoad({ filter:/.*/, namespace:'wordecho' }, () => ({ contents:html, loader:'text' }));
  }
}] });
// Retain the licenses and notices of the packages included in the runtime bundle.
const packages = new Map();
for (const input of Object.keys(server.metafile.inputs).filter(path => path.includes('node_modules/'))) {
  let directory = dirname(resolve(input));
  while (directory !== dirname(directory)) {
    let metadata;
    try { metadata = JSON.parse(await readFile(`${directory}/package.json`, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (metadata?.name) {
      const key = `${metadata.name}@${metadata.version}`;
      if (!packages.has(key)) {
        const names = (await readdir(directory)).filter(name => /^(?:licen[sc]e(?:\..*)?|notice(?:\..*)?)$/i.test(name)).sort();
        if (!names.some(name => /^licen[sc]e/i.test(name))) throw new Error(`Missing license for bundled package ${key}`);
        packages.set(key, (await Promise.all(names.map(async name => `${name}\n${await readFile(`${directory}/${name}`, 'utf8')}`))).join('\n\n'));
      }
      break;
    }
    directory = dirname(directory);
  }
}
await writeFile('plugins/openai/dist/LICENSE', await readFile('LICENSE', 'utf8'));
await writeFile('plugins/openai/dist/THIRD_PARTY_LICENSES.txt', [...packages].sort(([a], [b]) => a.localeCompare(b)).map(([name, license]) => `${name}\n${'='.repeat(name.length)}\n${license}`).join('\n\n'));
console.log('Built OpenAI adapter and shared player.');
