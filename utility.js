const {execSync} = require('child_process');
const fs = require('fs');

function checkIfVersionAlreadyPublished(version, jsonFile, registry) {
    let packageJson = require(jsonFile);
    let result = execSync(`npm view ${packageJson.name} versions --registry ${registry}`);
    let publishedVersions = JSON.parse(result.toString().replace(/'/g, '"'));
    return publishedVersions.includes(version);
}

function pack() {
    let result = execSync('npm pack --json');
    let packageJson = JSON.parse(result.toString());
    return packageJson[0];
}

function createPackage(jsonFile, outputDirectory, registry) {
    let json = require(jsonFile);
    let tgz = pack(jsonFile);
    let manifest = createManifest(jsonFile, tgz.filename, tgz.shasum, tgz.integrity, registry);
    outputDirectory += json.name + '/';
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(outputDirectory + 'package.json', JSON.stringify(manifest, null, 2));
    fs.renameSync(tgz.filename, outputDirectory + tgz.filename);
}

function createManifest(jsonFile, tgzFile, shasum, integrity, registry) {
    let json = require(jsonFile);
    return {
        'name': json.name,
        'versions': getFirstVersion(json, tgzFile, shasum, integrity, registry),
        'time': {
            'created': new Date().toISOString(),
            'modified': new Date().toISOString(),
            [json.version]: new Date().toISOString()
        },
        'users': { },
        'dist-tags': {
            "latest": json.version
        },
        '_uplinks': { },
        '_distfiles': { },
        '_attachments': {
            [tgzFile]: {
                "shasum": shasum,
                "version": json.version
            }
        },
        '_id': json.name,
        'readme': getReadmeContent(),
    }
}

function getFirstVersion(json, tgzFile, shasum, integrity, registry) {
    let versions = { };
    versions[json.version] = json;
    versions[json.version]._id = `${json.name}@${json.version}`;
    versions[json.version].readmeFilename = 'README.md';
    versions[json.version]._nodeVersion = getNodeVersion();
    versions[json.version]._npmVersion = getNpmVersion();
    versions[json.version].dist = {
        'integrity': integrity,
        'shasum': shasum,
        'tarball': `${registry}/${json.name}/-/${tgzFile}`
    }
    versions[json.version].contributors = [];
    return versions;
}

function getNodeVersion() {
    let version = execSync('node -v').toString();
    version = version.replace('v', '');
    version = version.replace('\n', '');
    version = version.replace('\r', '');
    return version;
}

function getNpmVersion() {
    let version = execSync('npm -v').toString();
    version = version.replace('\n', '');
    version = version.replace('\r', '');
    return version;
}

function getReadmeContent() {
    return fs.existsSync('./README.md') ? fs.readFileSync('README.md').toString() : 'ERROR: No README data found!';
}

module.exports.isVersionAlreadyPublished = checkIfVersionAlreadyPublished;
module.exports.pack = pack;
module.exports.createPackage = createPackage;
module.exports.createManifest = createManifest;