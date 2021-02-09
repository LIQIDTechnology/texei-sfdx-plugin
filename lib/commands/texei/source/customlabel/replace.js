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
const defaultCustomLabelsFolder = 'force-app/main/default/labels';
const customLabelsFileName = 'CustomLabels.labels-meta.xml';
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('texei-sfdx-plugin', 'source-customlabel-replace');
class Replace extends command_1.SfdxCommand {
    async run() {
        let updatedCustomLabels = [];
        // Promisify functions
        const readFile = util.promisify(fs.readFile);
        const writeFile = util.promisify(fs.writeFile);
        // Read files in directory
        const pathToFile = this.flags.path ? this.flags.path : defaultCustomLabelsFolder;
        const filePath = path.join(process.cwd(), pathToFile, customLabelsFileName);
        // Read file
        const customLabelFile = await readFile(filePath, 'utf8');
        // Parsing file
        // According to xml2js doc it's better to recreate a parser for each file
        // https://www.npmjs.com/package/xml2js#user-content-parsing-multiple-files
        var parser = new xml2js.Parser();
        const parseString = util.promisify(parser.parseString);
        const customLabelJson = await parseString(customLabelFile);
        let labelUpdated = false;
        const labelIndex = customLabelJson.CustomLabels.labels.findIndex(label => label.fullName == this.flags.label);
        if (labelIndex != -1) {
            customLabelJson.CustomLabels.labels[labelIndex].value = this.flags.value;
            labelUpdated = true;
        }
        else {
            throw new core_1.SfdxError(`Custom Label ${this.flags.label} not found.`);
        }
        // If a label was updated, save the file
        if (labelUpdated) {
            // Building back as an xml
            const builder = new xml2js.Builder();
            var xmlFile = builder.buildObject(customLabelJson);
            // Writing back to file
            await writeFile(filePath, xmlFile, 'utf8');
            updatedCustomLabels.push(this.flags.label);
            this.ux.log(`Custom Label ${this.flags.label} has been replaced with value ${this.flags.value}`);
        }
        return { updatelabels: updatedCustomLabels };
    }
}
Replace.description = messages.getMessage('commandDescription');
Replace.examples = [
    '$ texei:source:customlabel:replace --label GreatSalesforceBlog --value https://blog.texei.com'
];
Replace.flagsConfig = {
    path: command_1.flags.string({ char: 'p', required: false, description: `path to custom label` }),
    label: command_1.flags.string({ char: 'l', required: true, description: `custom label to replace` }),
    value: command_1.flags.string({ char: 'v', required: true, description: `new custom label` }),
};
// Comment this out if your command does not require an org username
Replace.requiresUsername = false;
// Comment this out if your command does not require a hub org username
Replace.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Replace.requiresProject = true;
exports.default = Replace;
//# sourceMappingURL=replace.js.map