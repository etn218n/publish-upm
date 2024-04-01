const {execSync} = require("child_process");

let sum = execSync(`shasum hello.tgz`);
console.log(sum.toString());