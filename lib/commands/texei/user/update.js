"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
var exec = require('child-process-promise').exec;
// Initialize Messages with the current plugin directory
command_1.core.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = command_1.core.Messages.loadMessages('texei-sfdx-plugin', 'user-update');
class Update extends command_1.SfdxCommand {
    async run() {
        const values = this.flags.values;
        // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
        const userName = this.org.getUsername();
        // TODO: update to use jsforce ?
        // https://jsforce.github.io/document/#update
        const updateUserCommand = `sfdx force:data:record:update -s User -w "UserName=${userName}" -v "${values}"`;
        let result = '';
        try {
            const { stdout } = await exec(updateUserCommand);
            result = stdout;
            // Remove line breaks from string
            result = result.replace(/(\r\n\t|\n|\r\t)/gm, '');
            this.ux.log(result);
        }
        catch (error) {
            result = error.stderr;
            // Remove line breaks from string
            result = result.replace(/(\r\n\t|\n|\r\t)/gm, '');
            // Throw an error, sfdx library will manage the way to display it
            throw new command_1.core.SfdxError(result);
        }
        // Everything went fine, return an object that will be used for --json
        return { org: this.org.getOrgId(), message: result };
    }
}
Update.description = messages.getMessage('commandDescription');
Update.examples = [
    `sfdx texei:user:update --targetusername myOrg@example.com --values "LanguageLocaleKey='fr'" \nSuccessfully updated record: 005D2A90N8A11SVPE2.`,
    `sfdx texei:user:update  --values "UserPermissionsKnowledgeUser=true" --json`,
    `sfdx texei:user:update  --values "LanguageLocaleKey=en_US UserPermissionsMarketingUser=true" --json`
];
//public static args = [{ name: 'file' }];
Update.flagsConfig = {
    values: command_1.flags.string({ char: 'v', description: messages.getMessage('valuesFlagDescription') })
};
// Comment this out if your command does not require an org username
Update.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Update.supportsDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Update.requiresProject = false;
exports.default = Update;
//# sourceMappingURL=update.js.map