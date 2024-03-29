const upm = require('./upm.js');
const fs = require('fs');

if (process.argv.length !== 5) {
    console.log('Usage: node main.js <package-json-file>');
    process.exit(-1);
}

let storageDirectory = processStorageDirectory(process.argv[2]);
let jsonFile = process.argv[3];
let registry = process.argv[4];

if (fs.existsSync(jsonFile)) {
    let manifest = require(jsonFile);
    upm.publish(manifest, registry, storageDirectory);
}
else {
    console.log('ERROR: No package.json file found!');
    process.exit(-1);
}

function processStorageDirectory(storageDirectory) {
    if (storageDirectory.endsWith('/'))
        return storageDirectory;
    else
        return `${storageDirectory}/`;
}