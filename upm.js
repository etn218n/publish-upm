const {execSync} = require('child_process');
const fs = require('fs');

const PackageStatus = {
    NotExist: 0,
    NotPublished: 1,
    Published: 2,
}

function checkPackageStatus(version, name, storageDirectory) {
    if (fs.existsSync(`${storageDirectory}${name}`))
        return fs.existsSync(`${storageDirectory}${name}/${name}-${version}.tgz`) ? PackageStatus.Published : PackageStatus.NotPublished;
    else
        return PackageStatus.NotExist;
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
    let publishStatus = checkPackageStatus(manifest.version, manifest.name, storageDirectory);
    let packageDirectory = `${storageDirectory}${manifest.name}`;
    switch (publishStatus) {
        case PackageStatus.Published:
            console.log(`Version ${manifest.version} already published`);
            break;
        case PackageStatus.NotPublished:
            let tgz = createTgzFile(manifest);
            let npmManifest = require(`${packageDirectory}/package.json`);
            fs.renameSync(tgz.filename, `${packageDirectory}/${tgz.filename}`);
            let updatedNpmManifest = updateNpmManifest(npmManifest, manifest, tgz.filename, tgz.shasum, tgz.integrity, registry);
            fs.writeFileSync(`${packageDirectory}/package.json`, JSON.stringify(updatedNpmManifest, null, 2));
            return packageDirectory;
        case PackageStatus.NotExist:
            publishFirstVersion(registry);
            return packageDirectory;
    }
}

function createTgzFile(manifest) {
    let tgz = {
        filename: `${manifest.name}-${manifest.version}.tgz`,
        shasum: '',
        integrity: ''
    };
    execSync(`sudo tar -cvzf ${manifest.name}-${manifest.version}.tgz .`)
    tgz.shasum = execSync(`shasum ${tgz.filename}`).toString().split(' ')[0];
    tgz.integrity = execSync(`openssl dgst -sha512 -binary ${tgz.filename} | openssl base64 -A`).toString();
    return tgz;
}

function updateNpmManifest(npmManifest, manifest, tgzFile, shasum, integrity, registry) {
    return {
        'name': npmManifest.name,
        'versions': updateVersions(npmManifest, manifest, tgzFile, shasum, integrity, registry),
        'time': updateTimeObject(npmManifest, manifest),
        'users': npmManifest.users,
        'dist-tags': {
            "latest": manifest.version
        },
        '_uplinks': { },
        '_distfiles': { },
        '_attachments': updateAttachments(npmManifest, manifest, tgzFile, shasum),
        '_rev': npmManifest._rev,
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

function updateTimeObject(npmManifest, manifest) {
    let modifiedTime = new Date().toISOString();
    let time = { 
        'created': npmManifest.time.created,
        'modified': modifiedTime,
    };
    for (let version in npmManifest.versions) {
        time[version] = npmManifest.time[version];
    }
    time[manifest.version] = modifiedTime;
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

module.exports.pack = pack;
module.exports.publish = publish;