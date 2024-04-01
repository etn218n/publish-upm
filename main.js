const upm = require('./upm.js');
const fs = require('fs');

if (process.argv.length !== 4) {
    console.log('Usage: node main.js <package-json-file>');
    process.exit(-1);
}

let storageDirectory = processDirectoryPath(process.argv[2]);
let registry = process.argv[3];

if (fs.existsSync('./package.json')) {
    let manifest = JSON.parse(fs.readFileSync('./package.json'), 'utf8');
    upm.publish(manifest, registry, storageDirectory);
}
else {
    console.log('ERROR: No package.json file found!');
    process.exit(-1);
}

function processDirectoryPath(storageDirectory) {
    if (storageDirectory.endsWith('/'))
        return storageDirectory;
    else
        return `${storageDirectory}/`;
}