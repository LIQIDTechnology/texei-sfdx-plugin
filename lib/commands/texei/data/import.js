"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = require("fs");
const path = require("path");
const util = require("util");
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages("texei-sfdx-plugin", "data-import");
let conn;
let recordIdsMap;
class Import extends command_1.SfdxCommand {
    async run() {
        conn = await this.org.getConnection();
        recordIdsMap = new Map();
        // Just add potential SfdxOrgUser that could be used during export
        const scratchOrgUserId = (await conn.query(`Select Id from User where username = '${this.org.getUsername()}'`)).records[0].Id;
        recordIdsMap.set("SfdxOrgUser", scratchOrgUserId);
        // Get files in directory
        const filesPath = path.join(process.cwd(), this.flags.inputdir);
        // Read data file
        const readDir = util.promisify(fs.readdir);
        let dataFiles = (await readDir(filesPath, "utf8")).filter(f => {
            return !isNaN(f.substr(0, f.indexOf('-')));
        }).sort(function (a, b) {
            return a.substr(0, a.indexOf('-')) - b.substr(0, b.indexOf('-'));
        });
        // Read and import data
        for (const dataFile of dataFiles) {
            // If file doesn't start with a number, just don't parse it (could be data-plan.json)
            if (!isNaN(dataFile.substring(0, 1))) {
                const objectName = await this.getObjectNameFromFile(dataFile);
                this.ux.startSpinner(`Importing ${dataFile}`, null, { stdout: true });
                const objectRecords = (await this.readFile(dataFile)).records;
                await this.prepareDataForInsert(objectName, objectRecords);
                await this.upsertData(objectRecords, objectName);
                this.ux.stopSpinner(`Done.`);
            }
        }
        return { message: "Data imported" };
    }
    async prepareDataForInsert(sobjectName, jsonData) {
        // TODO: Move getLookupsForObject here and check record types at the same time
        const lookups = await this.getLookupsForObject(sobjectName);
        let recTypeInfos = new Map();
        // Get Record Types information with newly generated Ids
        recTypeInfos = await this.getRecordTypeMap(sobjectName);
        // If object is PricebookEntry, look for standard price book
        let standardPriceBookId = '';
        if (sobjectName === 'PricebookEntry') {
            standardPriceBookId = (await conn.query('Select Id from Pricebook2 where IsStandard = true')).records[0].Id;
        }
        // Replace data to import with newly generated Record Type Ids
        for (const sobject of jsonData) {
            // Replace all lookups
            for (const lookup of lookups) {
                if (sobject[lookup] && !(sobjectName === 'PricebookEntry' && sobject.Pricebook2Id === 'StandardPriceBook' && lookup === 'Pricebook2Id')) {
                    sobject[lookup] = recordIdsMap.get(sobject[lookup]);
                }
            }
            // Replace Record Types, if any
            if (recTypeInfos.size > 0) {
                sobject.RecordTypeId = recTypeInfos.get(sobject.RecordTypeId);
            }
            // If object is PricebookEntry, use standard price book from target org
            if (sobjectName === 'PricebookEntry' && sobject.Pricebook2Id === 'StandardPriceBook') {
                sobject.Pricebook2Id = standardPriceBookId;
            }
            // If object was already inserted in a previous batch, add Id to update it
            if (recordIdsMap.get(sobject.attributes.referenceId)) {
                sobject.Id = recordIdsMap.get(sobject.attributes.referenceId);
            }
        }
    }
    async upsertData(records, sobjectName) {
        let sobjectsResult = new Array();
        // So far, a whole file will be either inserted or updated
        if (records[0] && records[0].Id) {
            // There is an Id, so it's an update
            this.debug(`DEBUG updating ${sobjectName} records`);
            // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
            sobjectsResult = await conn.sobject(sobjectName).update(records, { allowRecursive: true, allOrNone: this.flags.allornone })
                .catch(err => {
                throw new core_1.SfdxError(`Error importing records: ${err}`);
            });
        }
        else {
            // No Id, insert
            this.debug(`DEBUG inserting ${sobjectName} records`);
            // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
            sobjectsResult = await conn.sobject(sobjectName).insert(records, { allowRecursive: true, allOrNone: this.flags.allornone })
                .catch(err => {
                throw new core_1.SfdxError(`Error importing records: ${err}`);
            });
        }
        // Some errors are part of RecordResult but don't throw an exception
        for (let i = 0; i < sobjectsResult.length; i++) {
            if (!sobjectsResult[i].success) {
                const res = sobjectsResult[i];
                const errors = res.errors[0];
                // TODO: add a flag to allow this to be added to the logs
                if (errors.statusCode !== 'ALL_OR_NONE_OPERATION_ROLLED_BACK') {
                    this.ux.error(`Error importing record ${records[i].attributes.referenceId}: ${errors.statusCode}-${errors.message}${errors.fields.length > 0 ? '(' + errors.fields + ')' : ''}`);
                }
            }
        }
        // Update the map of Refs/Ids
        this.updateMapIdRef(records, sobjectsResult, recordIdsMap);
    }
    async readFile(fileName) {
        // Get product data file path
        let filePath = fileName;
        if (this.flags.inputdir) {
            filePath = path.join(this.flags.inputdir, fileName);
        }
        filePath = path.join(process.cwd(), filePath);
        // Read data file
        const readFile = util.promisify(fs.readFile);
        return JSON.parse(await readFile(filePath, "utf8"));
    }
    // Get a map of DeveloperName/Id for RecordTypes
    async getRecordTypeMap(sobjectName) {
        let recTypesMap = new Map();
        const conn = this.org.getConnection();
        const recTypeResults = (await conn.query(`SELECT Id, DeveloperName FROM RecordType WHERE SobjectType = '${sobjectName}'`)).records;
        for (const recType of recTypeResults) {
            recTypesMap.set(recType.DeveloperName, recType.Id);
        }
        return recTypesMap;
    }
    async updateMapIdRef(inputRecords, inputResults, recordIdsMap) {
        // Update the map of Refs/Ids
        let index = 0;
        for (let input of inputResults) {
            input = input;
            recordIdsMap.set(inputRecords[index].attributes.referenceId, input.id);
            index++;
        }
    }
    async getObjectNameFromFile(filePath) {
        // Check expected file name format
        if (filePath.indexOf("-") === -1 || filePath.indexOf(".json") === -1) {
            throw new core_1.SfdxError(`Invalid file name: ${filePath}`);
        }
        // From 1-MyCustomObject__c.json or 1-MyCustomObject-MyLabel__c.json to MyCustomObject__c
        let fileName = '';
        fileName = filePath.substring(filePath.indexOf("-") + 1).replace(".json", "");
        if (fileName.indexOf("-") > 0) {
            // Format is 1-MyCustomObject-MyLabel__c.json
            fileName = fileName.substring(0, fileName.indexOf("-"));
        }
        return fileName;
    }
    async getLookupsForObject(objectName) {
        let lookups = [];
        const describeResult = await conn.sobject(objectName).describe();
        for (const field of describeResult.fields) {
            // If it's a lookup, also add it to the lookup list, to be replaced later
            // Excluding OwnerId as we are not importing users anyway
            if (field.createable &&
                field.referenceTo &&
                field.referenceTo.length > 0 &&
                field.name != "OwnerId" &&
                field.name != "RecordTypeId") {
                lookups.push(field.name);
            }
        }
        return lookups;
    }
}
Import.description = messages.getMessage("commandDescription");
Import.examples = [
    `$ sfdx texei:data:import --inputdir ./data --targetusername texei-scratch
  Data imported!
  `
];
Import.flagsConfig = {
    inputdir: command_1.flags.string({
        char: "d",
        description: messages.getMessage("inputFlagDescription"),
        required: true
    }),
    allornone: command_1.flags.boolean({
        char: "a",
        description: messages.getMessage("allOrNoneFlagDescription"),
        required: false
    })
};
// Comment this out if your command does not require an org username
Import.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Import.requiresDevhubUsername = false;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Import.requiresProject = false;
exports.default = Import;
//# sourceMappingURL=import.js.map