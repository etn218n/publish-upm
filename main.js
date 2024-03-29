const utility = require('./utility.js');

if (process.argv.length !== 5) {
    console.log('Usage: node main.js <package-json-file>');
    process.exit(-1);
}

let jsonFile = process.argv[2];
let outputDirectory = process.argv[3];
let registry = process.argv[4];

utility.createPackage(jsonFile, outputDirectory, registry);