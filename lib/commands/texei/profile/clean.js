"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = require("fs");
const path = require("path");
const util = require('util');
const xml2js = require('xml2js');
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('texei-sfdx-plugin', 'profile-clean');
const defaultProfileFolder = 'force-app/main/default/profiles';
class Clean extends command_1.SfdxCommand {
    async run() {
        let cleanResult = [];
        // TODO: Keep default recordTypeVisibilities & applicationVisibilities like in skinnyprofile:retrieve
        const defaultKeep = ['layoutAssignments', 'loginHours', 'loginIpRanges', 'custom', 'userLicense'];
        const nodesToKeep = this.flags.keep ? this.flags.keep : defaultKeep;
        let profilesToClean = [];
        // Get profiles files path
        if (this.flags.path) {
            // If path was provided as a flag use it/them
            const paths = this.flags.path.split(',');
            for (const currentPath of paths) {
                if (currentPath.endsWith('.profile-meta.xml')) {
                    // Well, this should be a profile
                    // Otherwise you have a weird folder naming convention, you should probably stop this
                    profilesToClean.push(currentPath);
                }
                else {
                    // Flag provided value doesn't end like a Profile source metadata
                    // Expect it's a folder
                    profilesToClean = await this.getProfilesInPath(currentPath);
                }
            }
        }
        else {
            // Else look in the default package directory
            const defaultPackageDirectory = await this.getDefaultPath();
            profilesToClean = await this.getProfilesInPath(defaultPackageDirectory);
        }
        if (profilesToClean.length == 0) {
            this.ux.log('No Profile found :(');
        }
        // Promisify functions
        const readFile = util.promisify(fs.readFile);
        for (const profilePath of profilesToClean) {
            // Generate path
            const filePath = path.join(process.cwd(), profilePath);
            // Read data file
            const data = await readFile(filePath, 'utf8');
            // Parsing file
            // According to xml2js doc it's better to recreate a parser for each file
            // https://www.npmjs.com/package/xml2js#user-content-parsing-multiple-files
            var parser = new xml2js.Parser();
            const parseString = util.promisify(parser.parseString);
            const profileJson = await parseString(data);
            // Removing unwanted nodes
            for (const nodeKey in profileJson.Profile) {
                if (profileJson.Profile.hasOwnProperty(nodeKey)) {
                    if (!nodesToKeep.includes(nodeKey)) {
                        delete profileJson.Profile[nodeKey];
                    }
                }
            }
            // Building back as an xml
            const builder = new xml2js.Builder();
            var xmlFile = builder.buildObject(profileJson);
            // Writing back to file
            await fs.writeFile(filePath, xmlFile, 'utf8', function (err) {
                if (err) {
                    throw new core_1.SfdxError(`Unable to write Profile file at path ${filePath}: ${err}`);
                }
            });
            this.ux.log(`Profile cleaned: ${profilePath}`);
            cleanResult.push(profilePath);
        }
        return { profilesCleaned: cleanResult };
    }
    async getProfilesInPath(pathToRead) {
        let profilesInPath = [];
        const readDirectory = util.promisify(fs.readdir);
        const filesInDir = await readDirectory(pathToRead);
        for (const fileInDir of filesInDir) {
            const dirOrFilePath = path.join(process.cwd(), pathToRead, fileInDir);
            // If it's a Profile file, add it
            if (!fs.lstatSync(dirOrFilePath).isDirectory() && fileInDir.endsWith('.profile-meta.xml')) {
                const profileFoundPath = path.join(pathToRead, fileInDir);
                profilesInPath.push(profileFoundPath);
            }
        }
        return profilesInPath;
    }
    // should probably be in a util class
    async getDefaultPath() {
        // Look for a default package directory
        const options = core_1.SfdxProjectJson.getDefaultOptions();
        const project = await core_1.SfdxProjectJson.create(options);
        const packageDirectories = project.get('packageDirectories') || [];
        let foundPath;
        for (let packageDirectory of packageDirectories) {
            packageDirectory = packageDirectory;
            if (packageDirectory.path && packageDirectory.default) {
                foundPath = path.join(packageDirectory.path, 'main', 'default', 'profiles');
                break;
            }
            // If no default package directory is found, use the vanilla default DX folder 
            if (!foundPath) {
                foundPath = defaultProfileFolder;
            }
        }
        return foundPath;
    }
}
Clean.description = messages.getMessage('commandDescription');
Clean.examples = [
    '$ texei:profile:clean -k layoutAssignments,recordTypeVisibilities',
    '$ texei:profile:clean -p custom-sfdx-source-folder/main/profiles',
    '$ texei:profile:clean -p custom-sfdx-source-folder/main/profiles,source-folder-2/main/profiles/myAdmin.profile-meta.xml'
];
Clean.flagsConfig = {
    keep: command_1.flags.string({ char: 'k', required: false, description: 'comma-separated list of profile node permissions that need to be kept. Default: layoutAssignments,loginHours,loginIpRanges,custom,userLicense' }),
    path: command_1.flags.string({ char: 'p', required: false, description: 'comma-separated list of profiles, or path to profiles folder. Default: default package directory' })
};
// Comment this out if your command does not require an org username
Clean.requiresUsername = false;
// Comment this out if your command does not require a hub org username
Clean.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Clean.requiresProject = false;
exports.default = Clean;
//# sourceMappingURL=clean.js.map