const upm = require('./upm.js');
const fs = require('fs');
const {execSync} = require('child_process');

if (process.argv.length !== 5) {
    console.log('Usage: node main.js <package-json-file>');
    process.exit(-1);
}

let storageDirectory = processStorageDirectory(process.argv[2]);
let registry  = process.argv[3];
let ownerShip = process.argv[4];

if (fs.existsSync('./package.json')) {
    let manifest = require('./package.json');
    let packageDirectory = upm.publish(manifest, registry, storageDirectory);
    execSync(`sudo chown -R ${ownerShip} ${packageDirectory}`);
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