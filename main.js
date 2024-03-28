const {execSync} = require('child_process');

const packageRegistry ='https://duy-npm.com';

if (process.argv.length !== 3) {
    console.log('Usage: node main.js <package-json-file>');
    process.exit(-1);
}

let packageJson = require(process.argv[2]);
let result = execSync(`npm view ${packageJson.name} versions --registry ${packageRegistry}`);

console.log(result.toString());