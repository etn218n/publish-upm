const {execSync} = require("child_process");

execSync(`tar -cvzf hello.tgz .`);
let sum = execSync(`shasum hello.tgz`);
console.log(sum.toString());