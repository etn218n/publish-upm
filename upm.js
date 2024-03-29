const {execSync} = require('child_process');
const fs = require('fs');

const PackageStatus = {
    NotExist: 0,
    NotPublished: 1,
    Published: 2,
}

function checkPackageStatus(version, name, registry) {
    try {
        let result = execSync(`npm view ${name} versions --registry ${registry}`);
        let publishedVersions = JSON.parse(result.toString().replace(/'/g, '"'));
        return publishedVersions.includes(version) ? PackageStatus.Published : PackageStatus.NotPublished;
    }
    catch (error) {
        return PackageStatus.NotExist;
    }
}

function pack() {
    let result = execSync('npm pack --json');
    let packageJson = JSON.parse(result.toString());
    return packageJson[0];
}

function publishFirstVersion(registry) {
    execSync(`npm publish --registry ${registry}`);
}

function publish(manifest, registry, storageDirectory) {
    const publishStatus = checkPackageStatus(manifest.version, manifest.name, registry);
    switch (publishStatus) {
        case PackageStatus.Published:
            console.log('Version already published');
            break;
        case PackageStatus.NotPublished:
            let tgz = pack();
            let packageDirectory = `${storageDirectory}/${manifest.name}`;
            let npmManifest = require(`${packageDirectory}/package.json`);
            fs.renameSync(tgz.filename, `${packageDirectory}/${tgz.filename}`);
            let updatedNpmManifest = updateNpmManifest(npmManifest, manifest, tgz.filename, tgz.shasum, tgz.integrity, registry);
            fs.writeFileSync(`${packageDirectory}/package.json`, JSON.stringify(updatedNpmManifest, null, 2));
            break;
        case PackageStatus.NotExist:
            publishFirstVersion(registry);
            break;
    }
}

function updateNpmManifest(npmManifest, manifest, tgzFile, shasum, integrity, registry) {
    return {
        'name': npmManifest.name,
        'versions': updateVersions(npmManifest, manifest, tgzFile, shasum, integrity, registry),
        'time': updateTimeObject(npmManifest),
        'users': npmManifest.users,
        'dist-tags': {
            "latest": manifest.version
        },
        '_uplinks': { },
        '_distfiles': { },
        '_attachments': updateAttachments(npmManifest, manifest, tgzFile, shasum),
        '_id': npmManifest.name,
        'readme': getReadmeContent(),
    };
}

function updateVersions(npmManifest, manifest, tgzFile, shasum, integrity, registry) {
    let versions = { };
    for (let version in npmManifest.versions) {
        versions[version] = npmManifest.versions[version];
    }
    versions[manifest.version] = manifest;
    versions[manifest.version]._id = `${manifest.name}@${manifest.version}`;
    versions[manifest.version].readmeFilename = 'README.md';
    versions[manifest.version]._nodeVersion = getNodeVersion();
    versions[manifest.version]._npmVersion = getNpmVersion();
    versions[manifest.version].dist = {
        'integrity': integrity,
        'shasum': shasum,
        'tarball': `${registry}/${manifest.name}/-/${tgzFile}`
    }
    versions[manifest.version].contributors = [];
    return versions;
}

function updateTimeObject(npmManifest) {
    let time = { 
        'created': npmManifest.time.created,
        'modified': new Date().toISOString(),
    };
    for (let version in npmManifest.versions) {
        time[version] = npmManifest.time[version];
    }
    return time;
}

function updateAttachments(npmManifest, manifest, tgzFile, shasum) {
    let attachments = { };
    for (let attachment in npmManifest._attachments) {
        attachments[attachment] = npmManifest._attachments[attachment];
    }
    attachments[tgzFile] = {
        "shasum": shasum,
        "version": manifest.version
    };
    return attachments;
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

module.exports.isVersionAlreadyPublished = checkPackageStatus;
module.exports.pack = pack;
module.exports.publish = publish;
module.exports.createManifest = createManifest;
