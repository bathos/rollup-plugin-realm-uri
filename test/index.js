const { rollup } = require('rollup');
const { promises: fs } = require('fs');
const path = require('path');
const realmURIPlugin = require('..');
const tap = require('tap');
const vm = require('vm');

void async function() {
  for (const filename of await fs.readdir(path.join(__dirname, 'modules'))) {
    await tap.test(filename, async t => {
      const filepath = path.join(__dirname, 'modules', filename);

      try {
        const bundle = await rollup({
          input: filepath,
          plugins: [ realmURIPlugin() ],
        });

        const { output: [ { code } ] } = await bundle.generate({
          format: 'cjs'
        });

        vm.runInNewContext(code, { code, console, t, URL }, filename);
      } catch (err) {
        if (filename.startsWith('error-')) {
          t.pass();
        } else {
          console.log(err);
          t.fail(err);
        }
      }
    });
  }
}();
