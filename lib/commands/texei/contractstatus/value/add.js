"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const standardValueSetHelper_1 = require("../../../../shared/standardValueSetHelper");
// Initialize Messages with the current plugin directory
command_1.core.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = command_1.core.Messages.loadMessages("texei-sfdx-plugin", "contractstatus-value-add");
class Add extends command_1.SfdxCommand {
    async run() {
        this.ux.startSpinner(`Adding ContractStatus value (${this.flags.label}/${this.flags.apiname})`, null, { stdout: true });
        const svsh = new standardValueSetHelper_1.StandardValueSetHelper(this.org.getConnection(), 'ContractStatus');
        await svsh.addValue(this.flags.label, this.flags.apiname, this.flags.statuscategory);
        await svsh.close();
        this.ux.stopSpinner('Done.');
        return { message: `ContractStatus value added` };
    }
}
Add.description = messages.getMessage("commandDescription");
Add.examples = [
    `sfdx texei:contractstatus:value:add --label 'My New Contract Status Label' --apiname 'My New Contract Status API Name' --targetusername texei`,
];
Add.flagsConfig = {
    label: command_1.flags.string({ char: 'l', description: messages.getMessage('labelFlagDescription'), required: true }),
    apiname: command_1.flags.string({ char: 'a', description: messages.getMessage('apiNameFlagDescription'), required: true }),
    statuscategory: command_1.flags.string({ char: 's', description: messages.getMessage('statusCategoryFlagDescription'), options: ['Draft', 'Activated', 'InApprovalProcess'], default: 'Draft', required: false })
};
// Comment this out if your command does not require an org username
Add.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Add.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Add.requiresProject = false;
exports.default = Add;
//# sourceMappingURL=add.js.map