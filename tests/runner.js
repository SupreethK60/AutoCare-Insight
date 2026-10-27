const { run } = require('node:test');
const { spec } = require('node:test/reporters');
const path = require('node:path');

const files = [
  path.join(__dirname, 'auth.test.js'),
  path.join(__dirname, 'validation.test.js'),
  path.join(__dirname, 'integration.test.js'),
];

run({ files })
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);
