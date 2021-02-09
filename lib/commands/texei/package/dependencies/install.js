"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const spawn = require('child-process-promise').spawn;
const packageIdPrefix = '0Ho';
const packageVersionIdPrefix = '04t';
const packageAliasesMap = [];
const defaultWait = 10;
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('texei-sfdx-plugin', 'package-dependencies-install');
class Install extends command_1.SfdxCommand {
    async run() {
        const result = { installedPackages: {} };
        const username = this.org.getUsername();
        const options = core_1.SfdxProjectJson.getDefaultOptions();
        const project = await core_1.SfdxProjectJson.create(options);
        if (this.flags.packages != null) {
            this.ux.log('Filtering by packages: ' + this.flags.packages);
        }
        if (this.flags.namespaces != null) {
            this.ux.log('Filtering by namespaces: ' + this.flags.namespaces);
        }
        const packageAliases = project.get('packageAliases') || {};
        if (typeof packageAliases !== undefined) {
            Object.entries(packageAliases).forEach(([key, value]) => {
                packageAliasesMap[key] = value;
            });
        }
        // Getting Package
        const packagesToInstall = [];
        const packageDirectories = project.get('packageDirectories') || [];
        const packages = new Set();
        if (this.flags.packages) {
            for (let pkg of this.flags.packages.split(',')) {
                packages.add(pkg.trim());
            }
        }
        //see if no filter is true
        const packagesNoFilter = (this.flags.packages == null);
        ;
        this.ux.startSpinner('Resolving dependencies', null, { stdout: true });
        for (let packageDirectory of packageDirectories) {
            packageDirectory = packageDirectory;
            const packageName = (packageDirectory.package && packageDirectory.package.toString()) ? packageDirectory.package.toString() : '';
            // If the package is found, or if there isn't any package filtering
            if (packages.has(packageName) || packagesNoFilter) {
                const dependencies = packageDirectory.dependencies || [];
                // TODO: Move all labels to message
                if (dependencies && dependencies[0] !== undefined) {
                    this.ux.log(`Package dependencies found for package directory ${packageDirectory.path}`);
                    for (const dependency of dependencies) {
                        const packageInfo = {};
                        const dependencyInfo = dependency;
                        const dependentPackage = ((dependencyInfo.packageId != null) ? dependencyInfo.packageId : dependencyInfo.package);
                        const versionNumber = (dependencyInfo.versionNumber);
                        const namespaces = this.flags.namespaces !== undefined ? this.flags.namespaces.split(',') : null;
                        if (dependentPackage == null) {
                            throw Error('Dependent package version unknow error.');
                        }
                        packageInfo.dependentPackage = dependentPackage;
                        packageInfo.versionNumber = versionNumber;
                        const packageVersionId = await this.getPackageVersionId(dependentPackage, versionNumber, namespaces);
                        if (packageVersionId != null) {
                            packageInfo.packageVersionId = packageVersionId;
                            packagesToInstall.push(packageInfo);
                            this.ux.log(`    ${packageInfo.packageVersionId} : ${packageInfo.dependentPackage}${packageInfo.versionNumber === undefined ? '' : ' ' + packageInfo.versionNumber}`);
                        }
                    }
                }
                else {
                    this.ux.log(`No dependencies found for package directory ${packageDirectory.path}`);
                }
                // Removing package from packages flag list --> Used later to log if one of them wasn't found
                if (packages && packages.has(packageName)) {
                    packages.delete(packageName);
                }
            }
        }
        // In case one package wasn't found when filtering by packages
        if (packages && packages.size > 0) {
            this.ux.log(`Following packages were used in the --packages flag but were not found in the packageDirectories:`);
            for (let packageName of packages) {
                this.ux.log(`    ${packageName}`);
            }
        }
        this.ux.stopSpinner('Done.');
        if (packagesToInstall.length > 0) { // Installing Packages
            // Checking previously installed packages
            this.debug('DEBUG looking for already installed packages');
            const conn = this.org.getConnection();
            const installedPackagesQuery = 'Select SubscriberPackageVersionId from InstalledSubscriberPackage';
            const installedPackageIds = (await conn.tooling.query(installedPackagesQuery)).records.map(x => x.SubscriberPackageVersionId);
            // Getting Installation Key(s)
            let installationKeys = this.flags.installationkeys;
            if (installationKeys) {
                installationKeys = installationKeys.trim();
                installationKeys = installationKeys.split(' ');
                // Format is 1: 2: 3: ... need to remove these
                for (let keyIndex = 0; keyIndex < installationKeys.length; keyIndex++) {
                    const key = installationKeys[keyIndex].trim();
                    if (key.startsWith(`${keyIndex + 1}:`)) {
                        installationKeys[keyIndex] = key.substring(2);
                    }
                    else {
                        // Format is not correct, throw an error
                        throw new core_1.SfdxError('Installation Key should have this format: 1:MyPackage1Key 2: 3:MyPackage3Key');
                    }
                }
            }
            this.ux.log('\n');
            let i = 0;
            for (let packageInfo of packagesToInstall) {
                packageInfo = packageInfo;
                if (result.installedPackages.hasOwnProperty(packageInfo.packageVersionId)
                    || installedPackageIds.includes(packageInfo.packageVersionId)) {
                    this.ux.log(`PackageVersionId ${packageInfo.packageVersionId} already installed. Skipping...`);
                    continue;
                }
                // Split arguments to use spawn
                const args = [];
                args.push('force:package:install');
                // USERNAME
                args.push('--targetusername');
                args.push(`${username}`);
                // PACKAGE ID
                args.push('--package');
                args.push(`${packageInfo.packageVersionId}`);
                // INSTALLATION KEY
                if (installationKeys && installationKeys[i]) {
                    args.push('--installationkey');
                    args.push(`${installationKeys[i]}`);
                }
                // SECURITY TYPE
                if (this.flags.securitytype) {
                    args.push('--securitytype');
                    args.push(`${this.flags.securitytype}`);
                }
                // APEX COMPILE
                if (this.flags.apexcompile) {
                    args.push('--apexcompile');
                    args.push(`${this.flags.apexcompile}`);
                }
                // WAIT
                const wait = this.flags.wait != null ? this.flags.wait : defaultWait;
                args.push('--wait');
                args.push(`${wait}`);
                args.push('--publishwait');
                args.push(`${wait}`);
                // NOPROMPT
                if (this.flags.noprompt) {
                    args.push('--noprompt');
                }
                // INSTALL PACKAGE
                // TODO: Fix waiting messages that should not be visibile with --json
                this.ux.log(`Installing package ${packageInfo.packageVersionId} : ${packageInfo.dependentPackage}${packageInfo.versionNumber === undefined ? '' : ' ' + packageInfo.versionNumber}`);
                await spawn('sfdx', args, { stdio: 'inherit' });
                this.ux.log('\n');
                result.installedPackages[packageInfo.packageVersionId] = packageInfo;
                i++;
            }
        }
        return { message: result };
    }
    async getPackageVersionId(name, version, namespaces) {
        let packageId = null;
        // Keeping original name so that it can be used in error message if needed
        let packageName = name;
        // TODO: Some stuff are duplicated here, some code don't need to be executed for every package
        // First look if it's an alias
        if (typeof packageAliasesMap[packageName] !== 'undefined') {
            packageName = packageAliasesMap[packageName];
        }
        if (packageName.startsWith(packageVersionIdPrefix)) {
            // Package2VersionId is set directly
            packageId = packageName;
        }
        else if (packageName.startsWith(packageIdPrefix)) {
            // Get Package version id from package + versionNumber
            const vers = version.split('.');
            let query = 'Select SubscriberPackageVersionId, IsPasswordProtected, IsReleased, Package2.NamespacePrefix ';
            query += 'from Package2Version ';
            query += `where Package2Id='${packageName}' and MajorVersion=${vers[0]} and MinorVersion=${vers[1]} and PatchVersion=${vers[2]} `;
            if (namespaces != null) {
                query += ` and Package2.NamespacePrefix IN ('${namespaces.join('\',\'')}')`;
            }
            // If Build Number isn't set to LATEST, look for the exact Package Version
            if (vers[3] !== 'LATEST') {
                query += `and BuildNumber=${vers[3]} `;
            }
            // If Branch is specified, use it to filter
            if (this.flags.branch) {
                query += `and Branch='${this.flags.branch.trim()}' `;
            }
            query += ' ORDER BY BuildNumber DESC Limit 1';
            // Query DevHub to get the expected Package2Version
            const connDevHub = this.hubOrg.getConnection();
            const resultPackageId = await connDevHub.tooling.query(query);
            if (resultPackageId.size > 0) {
                packageId = resultPackageId.records[0].SubscriberPackageVersionId;
            }
        }
        return packageId;
    }
}
Install.description = messages.getMessage('commandDescription');
Install.examples = [
    '$ texei:package:dependencies:install -u MyScratchOrg -v MyDevHub -k "1:MyPackage1Key 2: 3:MyPackage3Key" -b "DEV"'
];
Install.flagsConfig = {
    installationkeys: command_1.flags.string({ char: 'k', required: false, description: 'installation key for key-protected packages (format is 1:MyPackage1Key 2: 3:MyPackage3Key... to allow some packages without installation key)' }),
    branch: command_1.flags.string({ char: 'b', required: false, description: 'the package version’s branch' }),
    packages: command_1.flags.string({ char: 'p', required: false, description: "comma-separated list of the packages to install related dependencies" }),
    securitytype: command_1.flags.string({ char: 's', required: false, description: "security access type for the installed package (see force:package:install for default value)" }),
    namespaces: command_1.flags.string({ char: 'n', required: false, description: 'filter package installation by namespace' }),
    wait: command_1.flags.number({ char: 'w', required: false, description: 'number of minutes to wait for installation status (also used for publishwait). Default is 10' }),
    noprompt: command_1.flags.boolean({ char: 'r', required: false, description: 'allow Remote Site Settings and Content Security Policy websites to send or receive data without confirmation' }),
    apexcompile: command_1.flags.string({ char: 'a', required: false, description: "compile all Apex in the org and package, or only Apex in the package (see force:package:install for default value)" })
};
// Comment this out if your command does not require an org username
Install.requiresUsername = true;
// Comment this out if your command does not require a hub org username
Install.requiresDevhubUsername = true;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Install.requiresProject = true;
exports.default = Install;
//# sourceMappingURL=install.js.map