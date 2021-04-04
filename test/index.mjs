import { rollup } from 'rollup';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import realmURIPlugin from '../dist/rollup-plugin-realm-uri.mjs';
import tap from 'tap';
import vm from 'vm';

void async function() {
  let dir = new URL('./modules/', import.meta.url);

  for (let name of await fs.readdir(fileURLToPath(dir))) {
    await tap.test(name, async t => {
      try {
        let bundle = await rollup({
          input: fileURLToPath(new URL(`modules/${ name }`, import.meta.url)),
          plugins: [ realmURIPlugin() ],
        });

        let { code } = (await bundle.generate({ format: 'cjs' })).output[0];

        vm.runInNewContext(code, { code, console, t, URL }, name);
      } catch (err) {
        if (name.startsWith('error-')) {
          t.pass();
        } else {
          console.log(err);
          t.fail(err);
        }
      }
    });
  }
}();
