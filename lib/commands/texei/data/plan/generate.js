"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = require("fs");
const path = require("path");
const dataPlanFilename = 'data-plan.json';
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('texei-sfdx-plugin', 'data-plan-generate');
class Generate extends command_1.SfdxCommand {
    async run() {
        let dataPlan = {
            "excludedFields": [],
            "sObjects": []
        };
        // Read objects list from flag, mapping to data plan format
        for (const objectName of this.flags.objects.split(',')) {
            dataPlan.sObjects.push({
                "name": objectName,
                "label": "",
                "filters": "",
                "excludedFields": []
            });
        }
        // Save file
        let filePath = dataPlanFilename;
        if (this.flags.outputdir) {
            filePath = path.join(this.flags.outputdir, dataPlanFilename);
        }
        const saveToPath = path.join(process.cwd(), filePath);
        await fs.writeFile(saveToPath, JSON.stringify(dataPlan, null, 2), 'utf8', function (err) {
            if (err) {
                throw new core_1.SfdxError(`Unable to write file at path ${saveToPath}: ${err}`);
            }
        });
        this.ux.log(`Data plan generated.`);
        return { message: 'Data plan generated' };
    }
}
Generate.description = messages.getMessage('commandDescription');
Generate.examples = [
    `$ sfdx texei:data:plan:generate --objects Account,Contact,MyCustomObject__c --outputdir ./data`
];
Generate.flagsConfig = {
    outputdir: command_1.flags.string({ char: 'd', description: messages.getMessage('outputdirFlagDescription'), required: true }),
    objects: command_1.flags.string({ char: 'o', description: messages.getMessage('objectsFlagDescription'), required: true })
};
// Comment this out if your command does not require an org username
Generate.requiresUsername = false;
// Comment this out if your command does not support a hub org username
Generate.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Generate.requiresProject = false;
exports.default = Generate;
//# sourceMappingURL=generate.js.map